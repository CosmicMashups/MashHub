# Fuzzy Logic and Search Architecture in MashHub

MashHub applies fuzzy logic in **two separate, complementary layers**:

1. **Text Search Layer (Fuse.js)**: Typo-tolerant, multi-field approximate string matching over song metadata (	itle, rtist, 	ype, origin, part).
2. **Harmonic Matching Layer (Custom Fuzzy Inference)**: A multi-component fuzzy inference system for BPM, musical key, and section compatibility.

---

# Fuzzy Logic Implementation in MashHub

MashHub applies fuzzy logic in **two separate layers**:

1. **Text search** â€” **Fuse.js** provides typo-tolerant, multi-field fuzzy search over song metadata (title, artist, type, origin, part). See [Relationship to Fuse.js](#relationship-to-fusejs) below.
2. **Matching layer** â€” Custom logic implements a full **fuzzy inference system** for BPM, key, and section compatibility. No third-party fuzzy library is used; the four classical components (fuzzification, rule base, inference engine, defuzzification) are implemented across `matchingService.ts`, `bpmMatching.ts`, `keyNormalization.ts`, `sectionNormalization.ts`, and `constants/index.ts`.

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
| `DEFAULT_BPM_TOLERANCE` | 10 | Â±BPM for harmonic detection (used in `findHarmonicMatches` fallback) |
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

- **`getBpmCompatibilityScore`** (`src/utils/bpmMatching.ts`): song BPM(s) and target BPM â†’ [0, 1]. Used for **standard match** (`evaluateMatch`).
  - Best-matching BPM is chosen; if distance &gt; `maxDelta`, membership = 0.
  - Otherwise: `max(0, 1 - bestMatch / BPM_SCORE_DENOMINATOR)` with `BPM_SCORE_DENOMINATOR = 22.5`.
  - Trapezoidal-style: 1.0 at zero distance, linear decay to 0.0 near 22.5 BPM, hard cutoff beyond `maxDelta`.
- **`getQuickMatchBpmScore`** (`src/utils/bpmMatching.ts`): section-level BPM pair â†’ [0, 1]. Used for **Quick Match** only. Piecewise sigmoid-style curve:
  - **0 BPM apart** â†’ 1.0 (100%)
  - **5 BPM apart** â†’ 0.9 (90%)
  - **10 BPM apart** â†’ 0.8 (80%)
  - **11+ BPM apart** â†’ 0.7 at 11, then linear decay to 0 by 20 BPM
  - Formula: `diff â‰¤ 10` â†’ `1 - diff Ã— 0.02`; `diff > 10` â†’ `max(0, 0.7 - (diff - 11) Ã— (0.7/9))`
- **`areBpmsHarmonicallyRelated`**: checks if ratio of two BPMs is near standard harmonic ratios (2, 3, 4, 1.5, 0.5, 0.75, 1.33) within a percentage tolerance. Used in `findHarmonicMatches` fallback when sections are unavailable.

### Key membership

- **`calculateKeyDistance`** (`src/utils/keyNormalization.ts`): two key strings â†’ similarity in [0, 1]. Used for **standard match** and other nonâ€“Quick-Match flows.
  - **1.0** â€” exact pitch-class match (mode does not reduce score).
  - **Linear decay to 0.0** â€” circular semitone distance 0..KEY_MAX_SEMITONE_DISTANCE (6) maps to similarity 1..0 via `1 - (circularDistance / 6)`.
- **`getQuickMatchKeyScore`** (`src/utils/keyNormalization.ts`): alias of `calculateKeyDistance` used by Quick Match, so Quick Match key scoring follows the same linear semitone-decay rule.
- **`SEMITONE_DISTANCE_MAP`**: 12Ã—12 lookup of circular semitone distances for fast lookup.

### Section name fuzzification

- **`normalizeSectionName`** (`src/utils/sectionNormalization.ts`): section label â†’ canonical base section.
  - e.g. "Verse A", "Verse B", "Verse 2", "Verse" â†’ "Verse".
  - Crisp label is assigned full membership in the fuzzy set of that base section for matching.

---

## 2. Rule base

Rules are IFâ€“THEN conditions with constant (weight) consequents, implemented in `evaluateMatch` and `getQuickMatches` (`src/services/matchingService.ts`).

### Rule sentences (IFâ€“THEN form)

#### Standard matching (`evaluateMatch`)

1. IF a song BPM is within target BPM tolerance, THEN BPM compatibility SHALL be fuzzified with linear decay and contribute `mu_bpm * 0.45`.
2. IF a song BPM is inside the selected BPM range mode, THEN BPM compatibility SHALL be set to `0.8` and contribute `0.8 * 0.45`.
3. IF a song key satisfies selected keys, key range, or target-key tolerance criteria, THEN key compatibility SHALL be `1.0` and contribute `1.0 * 0.45`.
4. IF a song artist exactly matches the artist criterion (case-insensitive), THEN artist compatibility SHALL be `1.0` and contribute `1.0 * 0.05`.
5. IF a song title contains the search text (case-insensitive), THEN title compatibility SHALL be `1.0` and contribute `1.0 * 0.05`.
6. IF none of the above conditions fire for a component, THEN that component SHALL contribute `0`.
7. IF all active component consequents are computed, THEN the final standard `matchScore` SHALL be the sum of BPM, key, artist, and title weighted consequents only.

#### Quick Match (`getQuickMatches`)

8. IF a candidate song is the same record as the target song, THEN the candidate SHALL be excluded.
9. IF no UI song-type allowlist is set, THEN a candidate SHALL be excluded when its normalized type differs from the target; IF an allowlist is set (Anime, Western, K-Pop, OPM), THEN only candidates whose normalized type is in that list are eligible (cross-type within the list is allowed).
10. IF a target section and candidate section normalize to the same base section, THEN they SHALL be considered pairable for key and BPM fuzzification.
11. IF key pairs are available between all matching normalized sections, THEN each key pair SHALL be fuzzified with linear semitone decay `mu_key_pair = max(0, 1 - d/6)`.
12. IF all key-pair memberships for a target section are available, THEN that target-section key score SHALL be the mean of those memberships.
13. IF all target-section key scores are available, THEN the song-level key compatibility SHALL be their mean and contribute `mu_key_song * 0.45`.
14. IF BPM pairs are available between matching normalized sections, THEN each BPM pair SHALL be fuzzified by the Quick Match piecewise BPM curve.
15. IF all BPM-pair memberships are available, THEN song-level BPM compatibility SHALL be their mean and contribute `mu_bpm_song * 0.45`.
16. IF candidate and target artists are equal (case-insensitive), THEN Quick Match artist compatibility SHALL be `1.0` and contribute `1.0 * 0.05`.
17. IF candidate and target origins are both present and equal (case-insensitive), THEN Quick Match origin compatibility SHALL be `1.0` and contribute `1.0 * 0.05`.
18. IF all Quick Match consequents are computed, THEN final `matchScore_quick` SHALL be the sum of key, BPM, artist, and origin weighted consequents.

#### Harmonic fallback (`findHarmonicMatches`)

19. IF target sections are unavailable, THEN the system SHALL switch to harmonic fallback scoring.
20. IF any BPM pair is harmonically related within ratio tolerance, THEN fallback BPM compatibility SHALL be computed from the best harmonic pair and contribute `0.3 + 0.2 * mu_bpm_fallback`.
21. IF any key pair is compatible within key tolerance, THEN fallback key compatibility SHALL be `1.0` and contribute `0.3`.
22. IF song type equals target type, THEN fallback type compatibility SHALL be `1.0` and contribute `0.1`.
23. IF fallback consequents are computed, THEN final `matchScore_fallback` SHALL be the sum of fallback BPM, key, and type consequents.

#### Search layer (Fuse.js)

24. IF query text is provided, THEN Fuse.js SHALL evaluate multi-field fuzzy similarity using weights (title 0.4, artist 0.3, type 0.15, origin 0.1, part 0.05).
25. IF a candidate score satisfies Fuse threshold and distance constraints, THEN the candidate SHALL be eligible for ranked search results.
26. IF a Fuse score is produced, THEN optional graphing relevance SHALL be represented as `1 - s_fuse`.

### Graph-ready rule equations (implemented)

This section lists the exact rule equations you can graph in Python.

#### Standard matching (`evaluateMatch`)

Fuzzified memberships (all clamped to [0, 1]):

- `mu_bpm`:
  - If target mode: `mu_bpm = max(0, 1 - abs(bestSongBpm - targetBpm) / 22.5)` if within tolerance, else `0`
  - If range mode and any BPM in range: `mu_bpm = 0.8`, else `0`
- `mu_key`:
  - Selected keys / key range / target key-tolerance satisfied -> `1`
  - Otherwise -> `0`
- `mu_artist`:
  - `1` if `song.artist.toLowerCase() === criteria.artist.toLowerCase()`, else `0`
- `mu_title`:
  - `1` if `song.title.toLowerCase().includes(criteria.searchText.toLowerCase())`, else `0`

Defuzzified weighted consequents:

- `z_bpm = mu_bpm * 0.45`
- `z_key = mu_key * 0.45`
- `z_artist = mu_artist * 0.05`
- `z_title = mu_title * 0.05`

Final crisp output:

- `matchScore = z_bpm + z_key + z_artist + z_title`

#### Fuzzy-rule examples (mu and weighted output)

These are direct IFâ€“THEN examples you can plot.

##### Standard matching examples

- IF section BPM difference is `0`, THEN `mu_bpm_pair = 1.0` and `z_bpm_pair = 1.0 * 0.45 = 0.45`.
- IF section BPM difference is `5`, THEN `mu_bpm_pair = 0.9` and `z_bpm_pair = 0.9 * 0.45 = 0.405`.
- IF section BPM difference is `10`, THEN `mu_bpm_pair = 0.8` and `z_bpm_pair = 0.8 * 0.45 = 0.36`.
- IF section BPM difference is `12`, THEN `mu_bpm_pair = 0.7` and `z_bpm_pair = 0.7 * 0.45 = 0.315`.
- IF section BPM difference is `20`, THEN `mu_bpm_pair = 0` and `z_bpm_pair = 0`.

- IF key distance is `0` semitones, THEN `mu_key = 1.00` and `z_key = 1.00 * 0.45 = 0.45`.
- IF key distance is `1` semitone, THEN `mu_key = 0.95` and `z_key = 0.95 * 0.45 = 0.4275`.
- IF key distance is `2` semitones, THEN `mu_key = 0.90` and `z_key = 0.90 * 0.45 = 0.405`.
- IF key distance is `3` semitones, THEN `mu_key = 0.80` and `z_key = 0.80 * 0.45 = 0.36`.
- IF key distance is `6` semitones, THEN `mu_key = 0` and `z_key = 0`.

- IF artist matches exactly, THEN `mu_artist = 1` and `z_artist = 1 * 0.05 = 0.05`; ELSE `0`.
- IF title contains search text, THEN `mu_title = 1` and `z_title = 1 * 0.05 = 0.05`; ELSE `0`.

##### Quick Match BPM examples (`mu_bpm_pair`, then weighted)

- IF section BPM difference is `0`, THEN `mu_bpm_pair = 1.0` and `z_bpm_pair = 1.0 * 0.45 = 0.45`.
- IF section BPM difference is `5`, THEN `mu_bpm_pair = 0.9` and `z_bpm_pair = 0.9 * 0.45 = 0.405`.
- IF section BPM difference is `10`, THEN `mu_bpm_pair = 0.8` and `z_bpm_pair = 0.8 * 0.45 = 0.36`.
- IF section BPM difference is `12`, THEN `mu_bpm_pair = 0.7` and `z_bpm_pair = 0.7 * 0.45 = 0.315`.
- IF section BPM difference is `20`, THEN `mu_bpm_pair = 0` and `z_bpm_pair = 0`.

##### Quick Match key examples (`mu_key_pair`, then weighted)

- IF key distance is `0` semitones, THEN `mu_key = 1.00` and `z_key = 1.00 * 0.45 = 0.45`.
- IF key distance is `1` semitone, THEN `mu_key = 0.95` and `z_key = 0.95 * 0.45 = 0.4275`.
- IF key distance is `2` semitones, THEN `mu_key = 0.90` and `z_key = 0.90 * 0.45 = 0.405`.
- IF key distance is `3` semitones, THEN `mu_key = 0.80` and `z_key = 0.80 * 0.45 = 0.36`.
- IF key distance is `6` semitones, THEN `mu_key = 0` and `z_key = 0`.

#### Quick Match (`getQuickMatches`)

Hard eligibility rule:

- Candidate is considered only if:
  - `candidate.id !== target.id`
  - Default: normalized `candidate.type === target.type`; optional UI allowlist (`allowedSongTypes`) restricts to selected origin types instead

Fuzzified key membership (`calculatePartSpecificKeyScore` + `getQuickMatchKeyScore`):

- Section pairing:
  - For each target section `t`, collect **all** candidate sections `c` where `normalizeSectionName(c.part) === normalizeSectionName(t.part)`
- Key similarity per key pair:
  - Parse keys to pitch classes
  - Circular semitone distance `d in [0,6]`
  - `mu_key_pair = max(0, 1 - d/6)`
- Per-target-section key score:
  - `mu_key_section(t) = mean(mu_key_pair for all key pairs between t and all matching c)`
  - If no valid pairs, `mu_key_section(t) = 0`
- Song-level key membership:
  - `mu_key_song = mean(mu_key_section(t) for all target sections t)`

Fuzzified BPM membership (`getQuickMatchBpmScore`):

- For each normalized section pair `(t, c)`:
  - `diff = abs(c.bpm - t.bpm)`
  - If `diff <= 10`: `mu_bpm_pair = max(0, 1 - 0.02 * diff)`
  - Else: `mu_bpm_pair = max(0, 0.7 - (diff - 11) * (0.7 / 9))`
- Song-level BPM membership:
  - `mu_bpm_song = mean(mu_bpm_pair for all normalized section pairs)`
  - If no valid pairs, `mu_bpm_song = 0`

Binary fuzzy memberships:

- `mu_artist_quick = 1` if same artist (case-insensitive), else `0`
- `mu_origin_quick = 1` if same origin (case-insensitive and both present), else `0`

Defuzzified weighted consequents:

- `z_key_quick = mu_key_song * 0.45`
- `z_bpm_quick = mu_bpm_song * 0.45`
- `z_artist_quick = mu_artist_quick * 0.05`
- `z_origin_quick = mu_origin_quick * 0.05`

Final crisp output:

- `matchScore_quick = z_key_quick + z_bpm_quick + z_artist_quick + z_origin_quick`

#### Harmonic fallback (`findHarmonicMatches`)

Used only when target sections are unavailable.

Fuzzified memberships:

- Harmonic BPM boolean:
  - Ratios checked against `[1, 2, 3, 4, 1.5, 0.5, 0.75, 1.33]`
  - Tolerance percent = `4%`
- If harmonic relation exists for at least one BPM pair:
  - `mu_bpm_fallback = max(0, 1 - abs(songBpm - targetBpm)/22.5)` on the best harmonic pair
- `mu_key_fallback = 1` if any key compatible within tolerance 2 semitones, else `0`
- `mu_type_fallback = 1` if same type, else `0`

Defuzzified consequents:

- `z_bpm_fallback = 0.3 + 0.2 * mu_bpm_fallback` (if harmonic BPM exists, else 0)
- `z_key_fallback = 0.3 * mu_key_fallback`
- `z_type_fallback = 0.1 * mu_type_fallback`

Final crisp output:

- `matchScore_fallback = z_bpm_fallback + z_key_fallback + z_type_fallback`

#### Search layer (Fuse.js) scoring for graphing

Fuse returns a raw score `s_fuse in [0, 1]` (lower is better).

- Effective matching condition controlled by:
  - `threshold = 0.6`
  - `distance = 100`
  - `minMatchCharLength = 2`
- Field influence weights:
  - `title: 0.4`, `artist: 0.3`, `type: 0.15`, `origin: 0.1`, `part: 0.05`
- Optional normalized relevance for plotting:
  - `relevance = 1 - s_fuse` (higher is better)

### Standard matching rules (`evaluateMatch`)

- IF BPM close to target THEN add `bpmCompatibility Ã— MATCH_WEIGHT_BPM` (0.45).
- IF key in selected set (or key range / target+tolerance) THEN add `keyScore Ã— MATCH_WEIGHT_KEY` (0.45).
- IF artist exactly matches criteria artist THEN add `1 Ã— MATCH_WEIGHT_ARTIST` (0.05).
- IF title contains search text THEN add `1 Ã— MATCH_WEIGHT_TITLE` (0.05).

### Quick-match rules (`getQuickMatches`)

- IF candidate song type differs from target song type THEN exclude candidate before scoring.
- IF part-specific keys similar (by semitone distance) THEN add `getQuickMatchKeyScore Ã— QUICK_MATCH_WEIGHT_KEY` (0.45).
  - Uses linear semitone-distance decay from `calculateKeyDistance`.
- IF part-specific BPMs close (by BPM difference) THEN add `getQuickMatchBpmScore Ã— QUICK_MATCH_WEIGHT_BPM` (0.45).
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
- **Average** all target-section scores â†’ single part-specific key score in [0, 1].
- So: MEAN over all key pairs per target section, then MEAN over target sections.

### Song-level inference (`evaluateMatch`, `getQuickMatches`)

- Each rule that fires adds `(membership Ã— weight)` to `matchScore`; others add 0.
- Total = weighted sum of rule outputs.
- In `findHarmonicMatches` fallback, harmonic BPM and key checks add fixed contributions.
- In `getQuickMatches`, section-level BPM uses mean pairwise aggregation across normalized section matches (not max-only).

---

## 4. Defuzzification

The aggregated output is a scalar `matchScore`. Defuzzification is done by **sorting** by descending score:

```ts
return results.sort((a, b) => b.matchScore - a.matchScore);
```

So the crisp output is **ranking**. Each `MatchResult` also exposes `bpmScore`, `keyScore`, and `reasons` (linguistic summary, e.g. "BPM match: 120 within Â±10 of 118", "Part-specific key match: Verse: 85% match"). The system thus defuzzifies to both a numeric ordering and human-readable reasons.

---

## Summary table

| Fuzzy component | Implementation | Key code / location |
|------------------|----------------|----------------------|
| **Fuzzification** | BPM distance â†’ [0,1] (standard: linear; Quick Match: piecewise sigmoid); key distance â†’ [0,1] via linear semitone decay; section names â†’ canonical base | `getBpmCompatibilityScore`, `getQuickMatchBpmScore`, `calculateKeyDistance`, `getQuickMatchKeyScore`, `normalizeSectionName` |
| **Rule base** | Standard match uses BPM/key/artist/title only; Quick Match uses part-specific key+BPM, artist, origin with same-type hard filter | `evaluateMatch`, `getQuickMatches`, `src/constants/index.ts` |
| **Inference** | MEAN over all key pairs per target section; MEAN over target sections; weighted sum over rules | `calculatePartSpecificKeyScore`, `evaluateMatch`, `getQuickMatches` |
| **Defuzzification** | Sort by `matchScore`; expose `bpmScore`, `keyScore`, `reasons` | `findMatches` / `getQuickMatches` (`.sort()`), `MatchResult` |

The matching layer behaves as a **Sugeno-type fuzzy inference system**: consequents are constants (the weights), aggregation is weighted addition, output is a crisp ranking plus linguistic reasons. The two-level aggregation in `calculatePartSpecificKeyScore` (MEAN of pairwise key scores per target section, then MEAN across target sections) is a hierarchical fuzzy sub-system for section-level key similarity before it is fed into the top-level song scoring.

---

## Related documentation

- **[FEATURES.md](FEATURES.md)** â€” Full feature list, search UX, matching criteria, filter system, and data layer (Supabase + IndexedDB fallback).
- **[SUPABASE.md](SUPABASE.md)** â€” Supabase setup, schema, auth, and dual-backend fallback architecture.
- **[RESEARCH_PAPER_DRAFT.md](RESEARCH_PAPER_DRAFT.md)** â€” Research-paper-ready sections including AI Model Description and Testing/Evaluation.
- **`src/constants/index.ts`** â€” Single source of truth for all weights and thresholds.

---

## Code-Verified Notes (May 2026)

These notes supersede older statements if conflicts exist and are based on current implementation:

- **Two fuzzy layers remain distinct**:
  - Text retrieval fuzzy logic: Fuse.js in `searchService.ts`.
  - Harmonic compatibility fuzzy logic: custom matching in `matchingService.ts` + utils.

- **Standard matcher (`findMatches` / `evaluateMatch`) current score aggregation**:
  - `matchScore = bpmScore*0.45 + keyScore*0.45 + artistScore*0.05 + titleScore*0.05`
  - `bpmScore` uses anchor-based membership via `getBpmMembership` (not denominator-only linear decay).
  - `keyScore` in standard flow is currently binary pass/fail with active key filters (not continuous semitone distance in this path).

- **Quick Match (`getQuickMatches`) current behavior**:
  - Excludes same song; default same normalized type, or optional UI song-type filter (dropdown checkboxes in Advanced Filters).
  - Uses section normalization and batch section loading.
  - Key and BPM use dedicated membership curves (`getQuickMatchKeyScore`, `getQuickMatchBpmScore`) and aggregate with:
    - `quickScore = key*0.45 + bpm*0.45 + artistMatch*0.05 + originMatch*0.05`

- **Harmonic fallback (`findHarmonicMatches`)**:
  - Applies harmonic ratio checks with ratio list `[1, 2, 3, 4, 1.5, 0.5, 0.75, 1.33]` and tolerance percent.
  - Keeps discrete additive scoring with BPM/key/type contributions.
  - `BPM_SCORE_DENOMINATOR` remains relevant here.

- **Practical documentation rule**:
  - When describing formulas, always identify the exact function scope (`evaluateMatch`, `getQuickMatches`, or `findHarmonicMatches`) because score semantics differ across paths.

---

# Appendix: Fuse.js Text Search Deep Dive & Beginner Guide

# Fuse.js Fuzzy Search in the Music Library (Beginner Guide)

## Overview

This document explains, in beginner-friendly terms, how fuzzy search is implemented in the Music Library search bar using **Fuse.js**.

In this project, search has two main parts:

1. **UI layer**: [`src/components/AdvancedSearchBar.tsx`](../src/components/AdvancedSearchBar.tsx)
2. **Search engine layer**: [`src/services/searchService.ts`](../src/services/searchService.ts)

The UI collects user input and displays results. The search service does the fuzzy matching and ranking.

---

## What is Fuzzy Search?

Fuzzy search means users do not need exact text matches.

Example:
- User types `anl gea`
- A result like `Angel Beats` can still appear because Fuse.js measures similarity, not just exact equality.

This is useful for:
- typos
- partial words
- different word order

---

## Where Fuse.js is Configured

Fuse.js is configured in [`src/services/searchService.ts`](../src/services/searchService.ts) using weighted fields:

- `title` (0.4)
- `artist` (0.3)
- `type` (0.15)
- `origin` (0.1)
- `part` (0.05)

This means title and artist have the strongest influence on ranking.

### Important options

The service uses these key options:

- `threshold: 0.6` - controls how fuzzy matching can be
- `distance: 100` - character distance tolerance
- `minMatchCharLength: 2` - ignore too-short trivial matches
- `includeScore: true` - return similarity score
- `includeMatches: true` - return match positions
- `ignoreLocation: true` - match can occur anywhere in text
- `findAllMatches: true` - collect all candidate matches
- `useExtendedSearch: true` - allow field-based query syntax

These values come from [`src/constants/index.ts`](../src/constants/index.ts):
- `FUSE_THRESHOLD`
- `FUSE_DISTANCE`
- `FUSE_MIN_MATCH_CHAR_LENGTH`
- `SEARCH_DEBOUNCE_MS`

---

## Why a Module-Level Fuse Instance is Used

Instead of creating a new Fuse object every time a user types, the app keeps one module-level instance:

- `initSearchService(songs)` - initialize once
- `updateSongs(songs)` - replace collection when data changes
- `addSong(song)` - add one song incrementally
- `removeSong(id)` - remove one song incrementally

This improves performance because the index is reused, not rebuilt repeatedly.

---

## End-to-End Search Flow

### 1) User types in the search bar

In [`AdvancedSearchBar.tsx`](../src/components/AdvancedSearchBar.tsx), input is stored in `query`.

### 2) Debounce waits 300ms

`useDebounce(query, 300)` avoids firing a search on every keystroke.

### 3) Query validation

If trimmed query length is less than 2:
- results are cleared
- suggestions are hidden

### 4) Search execution

For valid query length (`>= 2`):
- call `search(debouncedQuery)`
- store/display results
- call `getSuggestions(debouncedQuery)`

### 5) Result rendering

The component shows:
- total result count
- best match title
- match percent based on Fuse score

---

## How Ranking Works

Fuse returns a `score` for each result:

- lower score = better match
- higher score = weaker match

The UI converts score to percent:

- `matchPercent = (1 - score) * 100`

Because field weights are used, a close title match usually ranks above a weak type/origin match.

---

## Fuzzy Computation (Step-by-Step)

This section focuses on the actual computation concept so you can understand what Fuse is "calculating".

### 1) Per-field fuzzy similarity

For each song, Fuse checks each configured field (`title`, `artist`, `type`, `origin`, `part`) against the query.

Conceptually, each field gets a fuzzy similarity value:
- close to **0** -> very good match in that field
- close to **1** -> poor match in that field

This is based on approximate string matching (typos, missing letters, partial sequences).

### 2) Weighted contribution by field importance

Each field score is multiplied by its weight:

- `titleScore * 0.4`
- `artistScore * 0.3`
- `typeScore * 0.15`
- `originScore * 0.1`
- `partScore * 0.05`

Then Fuse combines these into one final score for that song.

You can think of it as:

```text
finalScore ~= weightedCombinationOfFieldScores
```

Lower `finalScore` means a stronger overall match.

### 3) Threshold filtering

The app uses `threshold = 0.6`.

Interpretation:
- if computed score is too weak (above acceptable fuzziness), the item is not included;
- if score is within threshold, it is kept and ranked.

### 4) Sorting

After scoring all songs, Fuse sorts ascending:
- smallest score first (best match)
- largest score later (weaker match)

The UI then shows:

```text
matchPercent = (1 - score) * 100
```

So a score of `0.18` becomes about `82%`.

### 5) Mini worked example

Suppose query is `angl beat` and two songs are candidates:

- Song A: `title = "Angel Beats"`  
- Song B: `title = "Beat Control"`

Expected behavior:
- Song A gets a better title fuzzy score (query resembles both words despite typo).
- Song B may match "beat" but not "angel".
- Because title has high weight (`0.4`), Song A usually ranks higher.

Even if Song B has matching `type` or `origin`, those fields have lower combined weight (`0.25`) than `title + artist` (`0.7`).

### 6) Why `ignoreLocation: true` matters computationally

With `ignoreLocation: true`, Fuse does not heavily penalize where in the string the match appears.

That means:
- `anime` can match `Best Anime OP` and `OP Anime Best`
- score is influenced more by character similarity than strict position

This improves robustness for real music metadata, where word order is inconsistent.

---

## Suggestions Behavior

`getSuggestions(query, limit=5)`:

1. searches using Fuse
2. extracts candidate strings from:
   - title
   - artist
   - type
3. returns unique values using a `Set`

So suggestions are data-driven from top fuzzy results.

---

## Advanced (Extended) Search

`searchExtended(query)` supports field-style syntax:

- `title:Angel artist:Lia`

The helper `parseExtendedQuery()` maps known field names (`title`, `artist`, `type`, `origin`, `part`) into Fuse-compatible extended query format.

---

## Key Takeaways for Novice Developers

- The search bar itself does not do fuzzy math; it delegates to `searchService`.
- Fuse.js options and weights strongly affect relevance and user experience.
- Debouncing and singleton index reuse are critical for smooth performance.
- Fuzzy text search is separate from the app's harmonic BPM/key matching logic.

---

## Quick File Reference

- UI search input and rendering: [`src/components/AdvancedSearchBar.tsx`](../src/components/AdvancedSearchBar.tsx)
- Fuse singleton and search functions: [`src/services/searchService.ts`](../src/services/searchService.ts)
- Search constants: [`src/constants/index.ts`](../src/constants/index.ts)


