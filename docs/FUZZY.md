# Fuzzy Logic Implementation in MashHub

MashHub applies fuzzy logic in **two separate layers**:

1. **Text search** — **Fuse.js** provides typo-tolerant, multi-field fuzzy search over song metadata (title, artist, type, origin, part). See [Relationship to Fuse.js](#relationship-to-fusejs) below.
2. **Matching layer** — Custom logic implements a full **fuzzy inference system** for BPM, key, and section compatibility. No third-party fuzzy library is used; the four classical components (fuzzification, rule base, inference engine, defuzzification) are implemented across `matchingService.ts`, `bpmMatching.ts`, `keyNormalization.ts`, `sectionNormalization.ts`, and `constants/index.ts`.

This document describes the **matching-layer** fuzzy logic in detail. For feature overview and search UX, see [FEATURES.md](FEATURES.md).

---

## Relationship to Fuse.js

| Aspect | Fuse.js (search) | Matching layer (this doc) |
|--------|-------------------|----------------------------|
| **Purpose** | Find songs by text query (typos, partial match) | Score/rank songs by BPM, key, section compatibility |
| **Input** | Query string | Target BPM/key, filters, or a reference song |
| **Output** | List of songs with match indices/scores | List of songs sorted by `matchScore` + `reasons` |
| **Location** | `src/services/searchService.ts` | `src/services/matchingService.ts` + utils |
| **Config** | `FUSE_THRESHOLD`, `FUSE_DISTANCE`, `FUSE_MIN_MATCH_CHAR_LENGTH` in `src/constants/index.ts` | `MATCH_WEIGHT_*`, `QUICK_MATCH_WEIGHT_*`, `BPM_SCORE_DENOMINATOR`, `KEY_*` in same file |

The search service uses a **module-level Fuse singleton**: `initSearchService(songs)` builds the index; `updateSongs(songs)`, `addSong(song)`, `removeSong(id)` update it incrementally (no full rebuild). Search weights: title 0.4, artist 0.3, type 0.15, origin 0.1, part 0.05. The matching layer does not use Fuse; it operates on already-loaded songs and sections from `songService` (Supabase or IndexedDB via the dual-backend fallback).

---

## Constants Reference

All tunable values live in `src/constants/index.ts`.

### Match scoring weights (standard match: `evaluateMatch`)

| Constant | Value | Role |
|----------|--------|------|
| `MATCH_WEIGHT_BPM` | 0.40 | BPM compatibility contribution |
| `MATCH_WEIGHT_KEY` | 0.30 | Key compatibility contribution |
| `MATCH_WEIGHT_TYPE` | 0.10 | Type match bonus |
| `MATCH_WEIGHT_YEAR` | 0.05 | Year-in-range bonus |
| `MATCH_WEIGHT_TEXT` | 0.05 | Title-contains-search-text bonus |

### Quick-match weights (`getQuickMatches`)

| Constant | Value | Role |
|----------|--------|------|
| `QUICK_MATCH_WEIGHT_KEY` | 0.45 | Part-specific key similarity |
| `QUICK_MATCH_WEIGHT_BPM` | 0.45 | Part-specific BPM compatibility |
| `QUICK_MATCH_WEIGHT_ARTIST` | 0.05 | Same artist |
| `QUICK_MATCH_WEIGHT_ORIGIN` | 0.05 | Same origin |

### BPM matching

| Constant | Value | Role |
|----------|--------|------|
| `DEFAULT_BPM_TOLERANCE` | 10 | ±BPM for harmonic detection |
| `BPM_SCORE_DENOMINATOR` | 22.5 | Linear decay: `max(0, 1 - bpmDiff / BPM_SCORE_DENOMINATOR)` (15×1.5 for reduced sensitivity) |

### Key matching

| Constant | Value | Role |
|----------|--------|------|
| `DEFAULT_KEY_TOLERANCE` | 2 | Semitones for harmonic key match |
| `KEY_MODE_MISMATCH_SCORE` | 0.85 | Same pitch class, different mode (major/minor) |
| `KEY_MAX_SEMITONE_DISTANCE` | 6 | Tritone; linear decay from 1 to 0 over 0..6 semitones |

### Fuse.js (search only)

| Constant | Value | Role |
|----------|--------|------|
| `FUSE_THRESHOLD` | 0.6 | 0 = exact, 1 = match anything |
| `FUSE_DISTANCE` | 100 | Max character distance for match |
| `FUSE_MIN_MATCH_CHAR_LENGTH` | 2 | Min characters that must match |
| `SEARCH_DEBOUNCE_MS` | 300 | Debounce before running Fuse search |

---

## 1. Fuzzification

Fuzzification converts crisp inputs into membership degrees in [0, 1].

### BPM membership

- **`getBpmCompatibilityScore`** (`src/utils/bpmMatching.ts`): song BPM(s) and target BPM → [0, 1].
  - Best-matching BPM is chosen; if distance &gt; `maxDelta`, membership = 0.
  - Otherwise: `max(0, 1 - bestMatch / BPM_SCORE_DENOMINATOR)` with `BPM_SCORE_DENOMINATOR = 22.5`.
  - Trapezoidal-style: 1.0 at zero distance, linear decay to 0.0 near 22.5 BPM, hard cutoff beyond `maxDelta`.
- **`areBpmsHarmonicallyRelated`**: checks if ratio of two BPMs is near standard harmonic ratios (2, 3, 4, 1.5, 0.5, 0.75, 1.33) within tolerance; that tolerance defines the width of the membership around each ratio.
- In **`getQuickMatches`** (`src/services/matchingService.ts`), section-level BPM difference is turned into membership with:
  ```ts
  const compatibilityScore = Math.max(0, 1 - bpmDiff / BPM_SCORE_DENOMINATOR);
  ```

### Key membership

- **`calculateKeyDistance`** (`src/utils/keyNormalization.ts`): two key strings → similarity in [0, 1].
  - **1.0** — exact pitch class and mode match.
  - **KEY_MODE_MISMATCH_SCORE (0.85)** — same pitch class, different mode (major vs minor).
  - **Linear decay to 0.0** — circular semitone distance 0..KEY_MAX_SEMITONE_DISTANCE (6) maps to similarity 1..0 via `1 - (circularDistance / 6)`.
- **`SEMITONE_DISTANCE_MAP`**: 12×12 lookup of circular semitone distances for fast lookup.

### Section name fuzzification

- **`normalizeSectionName`** (`src/utils/sectionNormalization.ts`): section label → canonical base section.
  - e.g. "Verse A", "Verse B", "Verse 2", "Verse" → "Verse".
  - Crisp label is assigned full membership in the fuzzy set of that base section for matching.

---

## 2. Rule base

Rules are IF–THEN conditions with constant (weight) consequents, implemented in `evaluateMatch` and `getQuickMatches` (`src/services/matchingService.ts`).

### Standard matching rules (`evaluateMatch`)

- IF BPM close to target THEN add `bpmCompatibility × MATCH_WEIGHT_BPM` (0.40).
- IF key in selected set (or key range / target+tolerance) THEN add `keyScore × MATCH_WEIGHT_KEY` (0.30).
- IF type matches THEN add `MATCH_WEIGHT_TYPE` (0.10).
- IF year in range THEN add `MATCH_WEIGHT_YEAR` (0.05).
- IF title contains search text THEN add `MATCH_WEIGHT_TEXT` (0.05).

### Quick-match rules (`getQuickMatches`)

- IF part-specific keys harmonically similar THEN add `partSpecificKeyScore × QUICK_MATCH_WEIGHT_KEY` (0.45).
- IF part-specific BPMs harmonically related THEN add `partSpecificBpmScore × QUICK_MATCH_WEIGHT_BPM` (0.45).
- IF artist matches THEN add `QUICK_MATCH_WEIGHT_ARTIST` (0.05).
- IF origin matches THEN add `QUICK_MATCH_WEIGHT_ORIGIN` (0.05).

Weights are defined in `src/constants/index.ts`.

---

## 3. Inference engine

Aggregation is weighted additive (Sugeno-style singleton consequents).

### Section-level inference (`calculatePartSpecificKeyScore`)

- For each section in the target song, find the matching section in the candidate by **normalized part name**.
- Compute key similarity with `calculateKeyDistance`. If a section has multiple keys, pairwise similarities are computed and the **maximum** is taken per section.
- **Average** all section scores → single part-specific key score in [0, 1].
- So: MAX over key pairs within a section, then MEAN over sections.

### Song-level inference (`evaluateMatch`, `getQuickMatches`)

- Each rule that fires adds `(membership × weight)` to `matchScore`; others add 0.
- Total = weighted sum of rule outputs.
- In `findHarmonicMatches`, discrete rules add fixed amounts (0.5 harmonic BPM, 0.3 compatible key, 0.1 same type) when conditions hold.

---

## 4. Defuzzification

The aggregated output is a scalar `matchScore`. Defuzzification is done by **sorting** by descending score:

```ts
return results.sort((a, b) => b.matchScore - a.matchScore);
```

So the crisp output is **ranking**. Each `MatchResult` also exposes `bpmScore`, `keyScore`, and `reasons` (linguistic summary, e.g. "BPM match: 120 within ±10 of 118", "Part-specific key match: Verse: 85% match"). The system thus defuzzifies to both a numeric ordering and human-readable reasons.

---

## Summary table

| Fuzzy component | Implementation | Key code / location |
|------------------|----------------|----------------------|
| **Fuzzification** | BPM distance → [0,1] linear decay; semitone distance → [0,1]; section names → canonical base | `getBpmCompatibilityScore`, `calculateKeyDistance`, `normalizeSectionName` |
| **Rule base** | Weighted IF–THEN over BPM, key, type, year, text, artist, origin, part-specific | `evaluateMatch`, `getQuickMatches`, `src/constants/index.ts` |
| **Inference** | MAX over key pairs per section; MEAN over sections; weighted sum over rules | `calculatePartSpecificKeyScore`, `evaluateMatch`, `getQuickMatches` |
| **Defuzzification** | Sort by `matchScore`; expose `bpmScore`, `keyScore`, `reasons` | `findMatches` / `getQuickMatches` (`.sort()`), `MatchResult` |

The matching layer behaves as a **Sugeno-type fuzzy inference system**: consequents are constants (the weights), aggregation is weighted addition, output is a crisp ranking plus linguistic reasons. The two-level aggregation in `calculatePartSpecificKeyScore` (MAX then MEAN) is a hierarchical fuzzy sub-system for section-level key similarity before it is fed into the top-level song scoring.

---

## Related documentation

- **[FEATURES.md](FEATURES.md)** — Full feature list, search UX, matching criteria, and filter system.
- **`src/constants/index.ts`** — Single source of truth for all weights and thresholds.
