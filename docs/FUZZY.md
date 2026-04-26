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
| **Config** | `FUSE_THRESHOLD`, `FUSE_DISTANCE`, `FUSE_MIN_MATCH_CHAR_LENGTH` in `src/constants/index.ts` | `MATCH_WEIGHT_*`, `QUICK_MATCH_WEIGHT_*`, `BPM_SCORE_DENOMINATOR`, `BPM_HARMONIC_RATIO_TOLERANCE_PERCENT`, `KEY_*` in same file |

The search service uses a **module-level Fuse singleton**: `initSearchService(songs)` builds the index; `updateSongs(songs)`, `addSong(song)`, `removeSong(id)` update it incrementally (no full rebuild). Search weights: title 0.4, artist 0.3, type 0.15, origin 0.1, part 0.05. The matching layer does not use Fuse; it operates on already-loaded songs and sections from `songService` (Supabase or IndexedDB via the dual-backend fallback).

---

## Constants Reference

All tunable values live in `src/constants/index.ts`.

### Match scoring weights (standard match: `evaluateMatch`)

| Constant | Value | Role |
|----------|--------|------|
| `MATCH_WEIGHT_BPM` | 0.45 | BPM compatibility contribution |
| `MATCH_WEIGHT_KEY` | 0.45 | Key compatibility contribution |
| `MATCH_WEIGHT_ARTIST` | 0.05 | Exact artist match bonus |
| `MATCH_WEIGHT_TITLE` | 0.05 | Title-contains-search-text bonus |

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
| `DEFAULT_BPM_TOLERANCE` | 10 | ±BPM for harmonic detection (used in `findHarmonicMatches` fallback) |
| `BPM_HARMONIC_RATIO_TOLERANCE_PERCENT` | 4 | Percent window around harmonic ratios (e.g. 96 vs 120 fails; 96 vs 93 passes) |
| `BPM_SCORE_DENOMINATOR` | 22.5 | Linear decay for standard match: `max(0, 1 - bpmDiff / BPM_SCORE_DENOMINATOR)` |

### Key matching

| Constant | Value | Role |
|----------|--------|------|
| `DEFAULT_KEY_TOLERANCE` | 2 | Semitones for harmonic key match |
| `KEY_MAX_SEMITONE_DISTANCE` | 6 | Tritone; linear decay from 1 to 0 over 0..6 semitones |

### Fuse.js (search only)

| Constant | Value | Role |
|----------|--------|------|
| `FUSE_THRESHOLD` | 0.6 | 0 = exact, 1 = match anything |
| `FUSE_DISTANCE` | 100 | Max character distance for match |
| `FUSE_MIN_MATCH_CHAR_LENGTH` | 2 | Min characters that must match |
| `SEARCH_DEBOUNCE_MS` | 300 | Debounce before running Fuse search |

---

## Quick Match scoring curves (sigmoid-style)

Quick Match uses dedicated piecewise curves so that **10 BPM apart** and **2 keys apart** remain acceptable (80%), while larger distances drop compatibility.

### BPM curve (`getQuickMatchBpmScore`)

| BPM difference | Score | Example |
|-----------------|-------|---------|
| 0 | 100% | 95 vs 95 |
| 5 | 90% | 95 vs 90 or 95 vs 100 |
| 10 | 80% | 95 vs 85 or 95 vs 105 |
| 11+ | 70% at 11, then decreasing to 0 by 20 | 95 vs 86, 95 vs 106 |

### Key curve (`getQuickMatchKeyScore`)

| Semitone distance | Score | Example (from C Major) |
|-------------------|-------|-------------------------|
| 0 | 100% | C Major vs C Major / C Minor |
| 1 | 83.3% | C Major vs C# Major / B Major |
| 2 | 66.7% | C Major vs D Major / A# Major |
| 3 | 50% | C Major vs D# Major / A Major |
| 6 | 0% | C Major vs F# Major |

---

## 1. Fuzzification

Fuzzification converts crisp inputs into membership degrees in [0, 1].

### BPM membership

- **`getBpmCompatibilityScore`** (`src/utils/bpmMatching.ts`): song BPM(s) and target BPM → [0, 1]. Used for **standard match** (`evaluateMatch`).
  - Best-matching BPM is chosen; if distance &gt; `maxDelta`, membership = 0.
  - Otherwise: `max(0, 1 - bestMatch / BPM_SCORE_DENOMINATOR)` with `BPM_SCORE_DENOMINATOR = 22.5`.
  - Trapezoidal-style: 1.0 at zero distance, linear decay to 0.0 near 22.5 BPM, hard cutoff beyond `maxDelta`.
- **`getQuickMatchBpmScore`** (`src/utils/bpmMatching.ts`): section-level BPM pair → [0, 1]. Used for **Quick Match** only. Piecewise sigmoid-style curve:
  - **0 BPM apart** → 1.0 (100%)
  - **5 BPM apart** → 0.9 (90%)
  - **10 BPM apart** → 0.8 (80%)
  - **11+ BPM apart** → 0.7 at 11, then linear decay to 0 by 20 BPM
  - Formula: `diff ≤ 10` → `1 - diff × 0.02`; `diff > 10` → `max(0, 0.7 - (diff - 11) × (0.7/9))`
- **`areBpmsHarmonicallyRelated`**: checks if ratio of two BPMs is near standard harmonic ratios (2, 3, 4, 1.5, 0.5, 0.75, 1.33) within a percentage tolerance. Used in `findHarmonicMatches` fallback when sections are unavailable.

### Key membership

- **`calculateKeyDistance`** (`src/utils/keyNormalization.ts`): two key strings → similarity in [0, 1]. Used for **standard match** and other non–Quick-Match flows.
  - **1.0** — exact pitch-class match (mode does not reduce score).
  - **Linear decay to 0.0** — circular semitone distance 0..KEY_MAX_SEMITONE_DISTANCE (6) maps to similarity 1..0 via `1 - (circularDistance / 6)`.
- **`getQuickMatchKeyScore`** (`src/utils/keyNormalization.ts`): alias of `calculateKeyDistance` used by Quick Match, so Quick Match key scoring follows the same linear semitone-decay rule.
- **`SEMITONE_DISTANCE_MAP`**: 12×12 lookup of circular semitone distances for fast lookup.

### Section name fuzzification

- **`normalizeSectionName`** (`src/utils/sectionNormalization.ts`): section label → canonical base section.
  - e.g. "Verse A", "Verse B", "Verse 2", "Verse" → "Verse".
  - Crisp label is assigned full membership in the fuzzy set of that base section for matching.

---

## 2. Rule base

Rules are IF–THEN conditions with constant (weight) consequents, implemented in `evaluateMatch` and `getQuickMatches` (`src/services/matchingService.ts`).

### Standard matching rules (`evaluateMatch`)

- IF BPM close to target THEN add `bpmCompatibility × MATCH_WEIGHT_BPM` (0.45).
- IF key in selected set (or key range / target+tolerance) THEN add `keyScore × MATCH_WEIGHT_KEY` (0.45).
- IF artist exactly matches criteria artist THEN add `1 × MATCH_WEIGHT_ARTIST` (0.05).
- IF title contains search text THEN add `1 × MATCH_WEIGHT_TITLE` (0.05).

### Quick-match rules (`getQuickMatches`)

- IF candidate song type differs from target song type THEN exclude candidate before scoring.
- IF part-specific keys similar (by semitone distance) THEN add `getQuickMatchKeyScore × QUICK_MATCH_WEIGHT_KEY` (0.45).
  - Uses linear semitone-distance decay from `calculateKeyDistance`.
- IF part-specific BPMs close (by BPM difference) THEN add `getQuickMatchBpmScore × QUICK_MATCH_WEIGHT_BPM` (0.45).
  - Uses piecewise sigmoid-style curve; all normalized section pair scores are averaged.
- IF artist matches THEN add `QUICK_MATCH_WEIGHT_ARTIST` (0.05).
- IF origin matches THEN add `QUICK_MATCH_WEIGHT_ORIGIN` (0.05).

Weights are defined in `src/constants/index.ts`.

---

## 3. Inference engine

Aggregation is weighted additive (Sugeno-style singleton consequents).

### Section-level inference (`calculatePartSpecificKeyScore`)

- For each section in the target song, find **all** matching candidate sections by **normalized part name**.
- Compute key similarity with `getQuickMatchKeyScore` for **all key pairs** across all matching sections.
- Compute per-target-section score as the **mean** of all pairwise similarities (or 0 if none).
- **Average** all target-section scores → single part-specific key score in [0, 1].
- So: MEAN over all key pairs per target section, then MEAN over target sections.

### Song-level inference (`evaluateMatch`, `getQuickMatches`)

- Each rule that fires adds `(membership × weight)` to `matchScore`; others add 0.
- Total = weighted sum of rule outputs.
- In `findHarmonicMatches` fallback, harmonic BPM and key checks add fixed contributions.
- In `getQuickMatches`, section-level BPM uses mean pairwise aggregation across normalized section matches (not max-only).

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
| **Fuzzification** | BPM distance → [0,1] (standard: linear; Quick Match: piecewise sigmoid); key distance → [0,1] via linear semitone decay; section names → canonical base | `getBpmCompatibilityScore`, `getQuickMatchBpmScore`, `calculateKeyDistance`, `getQuickMatchKeyScore`, `normalizeSectionName` |
| **Rule base** | Standard match uses BPM/key/artist/title only; Quick Match uses part-specific key+BPM, artist, origin with same-type hard filter | `evaluateMatch`, `getQuickMatches`, `src/constants/index.ts` |
| **Inference** | MEAN over all key pairs per target section; MEAN over target sections; weighted sum over rules | `calculatePartSpecificKeyScore`, `evaluateMatch`, `getQuickMatches` |
| **Defuzzification** | Sort by `matchScore`; expose `bpmScore`, `keyScore`, `reasons` | `findMatches` / `getQuickMatches` (`.sort()`), `MatchResult` |

The matching layer behaves as a **Sugeno-type fuzzy inference system**: consequents are constants (the weights), aggregation is weighted addition, output is a crisp ranking plus linguistic reasons. The two-level aggregation in `calculatePartSpecificKeyScore` (MEAN of pairwise key scores per target section, then MEAN across target sections) is a hierarchical fuzzy sub-system for section-level key similarity before it is fed into the top-level song scoring.

---

## Related documentation

- **[FEATURES.md](FEATURES.md)** — Full feature list, search UX, matching criteria, filter system, and data layer (Supabase + IndexedDB fallback).
- **[SUPABASE.md](SUPABASE.md)** — Supabase setup, schema, auth, and dual-backend fallback architecture.
- **[RESEARCH_PAPER_DRAFT.md](RESEARCH_PAPER_DRAFT.md)** — Research-paper-ready sections including AI Model Description and Testing/Evaluation.
- **`src/constants/index.ts`** — Single source of truth for all weights and thresholds.