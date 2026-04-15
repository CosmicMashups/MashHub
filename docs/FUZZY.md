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
| `DEFAULT_BPM_TOLERANCE` | 10 | ±BPM for harmonic detection (used in `findHarmonicMatches` fallback) |
| `BPM_HARMONIC_RATIO_TOLERANCE_PERCENT` | 4 | Percent window around harmonic ratios (e.g. 96 vs 120 fails; 96 vs 93 passes) |
| `BPM_SCORE_DENOMINATOR` | 22.5 | Linear decay for standard match: `max(0, 1 - bpmDiff / BPM_SCORE_DENOMINATOR)` |

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
| 0 (same pitch, same mode) | 100% | C Major vs C Major |
| 0 (same pitch, different mode) | 85% | C Major vs C Minor |
| 1 | 90% | C Major vs C# Major or B Major |
| 2 | 80% | C Major vs D Major or A# Major |
| 3+ | 70% at 3, then decreasing to 0 at 6 | C Major vs A Major, D# Major |

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
  - **1.0** — exact pitch class and mode match.
  - **KEY_MODE_MISMATCH_SCORE (0.85)** — same pitch class, different mode (major vs minor).
  - **Linear decay to 0.0** — circular semitone distance 0..KEY_MAX_SEMITONE_DISTANCE (6) maps to similarity 1..0 via `1 - (circularDistance / 6)`.
- **`getQuickMatchKeyScore`** (`src/utils/keyNormalization.ts`): two key strings → similarity in [0, 1]. Used for **Quick Match** only. Piecewise curve:
  - **0 semitones** (same pitch class, same mode) → 1.0 (100%)
  - **Same pitch class, different mode** (e.g. C Major vs C Minor) → 0.85
  - **1 semitone** (e.g. C vs C#) → 0.9 (90%)
  - **2 semitones** (e.g. C vs D) → 0.8 (80%)
  - **3+ semitones** → 0.7 at 3, then linear decay to 0 at 6 (tritone)
  - Formula: `d = 0` → 1.0; `d = 1` → 0.9; `d = 2` → 0.8; `d ≥ 3` → `max(0, 0.7 - (d - 3) × (0.7/3))`
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

- IF part-specific keys similar (by semitone distance) THEN add `getQuickMatchKeyScore × QUICK_MATCH_WEIGHT_KEY` (0.45).
  - Uses piecewise curve: 0 semitones → 100%, 1 → 90%, 2 → 80%, 3+ → 70% decreasing to 0.
- IF part-specific BPMs close (by BPM difference) THEN add `getQuickMatchBpmScore × QUICK_MATCH_WEIGHT_BPM` (0.45).
  - Uses piecewise sigmoid-style curve: 0 BPM apart → 100%, 5 → 90%, 10 → 80%, 11+ → 70% decreasing to 0.
- IF artist matches THEN add `QUICK_MATCH_WEIGHT_ARTIST` (0.05).
- IF origin matches THEN add `QUICK_MATCH_WEIGHT_ORIGIN` (0.05).

Weights are defined in `src/constants/index.ts`.

---

## 3. Inference engine

Aggregation is weighted additive (Sugeno-style singleton consequents).

### Section-level inference (`calculatePartSpecificKeyScore`)

- For each section in the target song, find the matching section in the candidate by **normalized part name**.
- Compute key similarity with **`getQuickMatchKeyScore`**. If a section has multiple keys, pairwise similarities are computed and the **maximum** is taken per section.
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
| **Fuzzification** | BPM distance → [0,1] (standard: linear; Quick Match: piecewise sigmoid); key distance → [0,1] (standard: linear; Quick Match: piecewise 0/1/2/3+ semitones); section names → canonical base | `getBpmCompatibilityScore`, `getQuickMatchBpmScore`, `calculateKeyDistance`, `getQuickMatchKeyScore`, `normalizeSectionName` |
| **Rule base** | Weighted IF–THEN over BPM, key, type, year, text, artist, origin, part-specific | `evaluateMatch`, `getQuickMatches`, `src/constants/index.ts` |
| **Inference** | MAX over key pairs per section; MEAN over sections; weighted sum over rules | `calculatePartSpecificKeyScore`, `evaluateMatch`, `getQuickMatches` |
| **Defuzzification** | Sort by `matchScore`; expose `bpmScore`, `keyScore`, `reasons` | `findMatches` / `getQuickMatches` (`.sort()`), `MatchResult` |

The matching layer behaves as a **Sugeno-type fuzzy inference system**: consequents are constants (the weights), aggregation is weighted addition, output is a crisp ranking plus linguistic reasons. The two-level aggregation in `calculatePartSpecificKeyScore` (MAX then MEAN) is a hierarchical fuzzy sub-system for section-level key similarity before it is fed into the top-level song scoring.

---

## Related documentation

- **[FEATURES.md](FEATURES.md)** — Full feature list, search UX, matching criteria, filter system, and data layer (Supabase + IndexedDB fallback).
- **[SUPABASE.md](SUPABASE.md)** — Supabase setup, schema, auth, and dual-backend fallback architecture.
- **[RESEARCH_PAPER_DRAFT.md](RESEARCH_PAPER_DRAFT.md)** — Research-paper-ready sections including AI Model Description and Testing/Evaluation.
- **`src/constants/index.ts`** — Single source of truth for all weights and thresholds.

---

## Research Paper Alignment

This file is the primary technical source for these paper sections:
- **Topic Research and Innovation**: interpretable fuzzy inference for music compatibility and dual-layer fuzzy strategy (Fuse.js search + rule-based matching).
- **AI Model Description**: complete model pipeline (fuzzification, rule base, inference, defuzzification), constants, and scoring curves.
- **Testing and Evaluation**: expected validation targets for score behavior, ranking consistency, and explainability quality.

Suggested evaluation criteria specific to fuzzy logic:
- ranking agreement with expert pairwise judgments (Top-k precision / recall);
- calibration checks for score monotonicity with BPM/key distance;
- ablation tests on weight groups (`MATCH_WEIGHT_*`, `QUICK_MATCH_WEIGHT_*`);
- explanation usefulness review based on `reasons` readability and actionability.
