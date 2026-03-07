# Fuzzy Logic Implementation in MashFlow

The system does not use a named fuzzy logic library, but it implements all four classical components of a fuzzy logic system across `matchingService.ts`, `bpmMatching.ts`, `keyNormalization.ts`, `sectionNormalization.ts`, and `constants/index.ts`. Below is a full account of how each component is realized.

---

## 1. Fuzzification

Fuzzification is the process of converting crisp input values into fuzzy membership degrees in the range [0, 1]. The system performs this conversion in three distinct dimensions.

### BPM Membership Function

The function `getBpmCompatibilityScore` in `src/utils/bpmMatching.ts` converts a crisp BPM distance into a continuous membership value using a linear decay:

- Input: song BPM(s) and target BPM; output: a value in [0, 1].
- The best-matching BPM is chosen; if its distance exceeds `maxDelta`, membership is 0.
- Otherwise membership is `max(0, 1 - (bestMatch / 22.5))`.

This is a trapezoidal-style membership function: 1.0 at zero distance, linear decay to 0.0 as distance approaches 22.5 BPM, and hard cutoff beyond `maxDelta`. The denominator 22.5 (15 × 1.5) makes the function less sensitive.

The function `areBpmsHarmonicallyRelated` provides a second tier of fuzzification: it checks whether the ratio of two BPMs is close to standard harmonic ratios (2, 3, 4, 1.5, 0.5, 0.75, 1.33) within a tolerance. That tolerance defines the width of the membership around each ratio.

In `getQuickMatches`, the crisp BPM difference for matching sections is turned into a membership with:

```ts
const compatibilityScore = Math.max(0, 1 - bpmDiff / 22.5);
```

### Key Membership Function

The function `calculateKeyDistance` in `src/utils/keyNormalization.ts` converts crisp semitone distance on the chromatic circle into a membership degree:

- **1.0** — exact pitch class and mode match.
- **0.85** — same pitch class, different mode (major vs. minor); a fixed 0.15 penalty is applied.
- **Linear decay to 0.0** — as circular semitone distance goes from 0 to 6 (tritone), similarity goes from 1 to 0 via `1 - (circularDistance / 6)`.

The pre-computed `SEMITONE_DISTANCE_MAP` is a 12×12 lookup table storing circular semitone distances (min of |i−j| and 12−|i−j|) for fast lookup.

### Section Name Fuzzification

`normalizeSectionName` in `src/utils/sectionNormalization.ts` fuzzifies the discrete dimension of section labels. Variants such as "Verse A", "Verse B", "Verse 2", and "Verse" all map to the canonical base "Verse". So the crisp input "Verse A" is assigned membership in the fuzzy set "Verse" for matching purposes.

---

## 2. Rule Base

The rule base is the set of linguistic IF–THEN rules. Here they are encoded as weighted scoring conditions in `evaluateMatch` and `getQuickMatches`.

### Standard Matching Rules (`evaluateMatch`)

- **Rule 1:** IF bpm is close to target THEN add `bpmCompatibility × MATCH_WEIGHT_BPM` (0.40).
- **Rule 2:** IF key is in selected set (or in key range / target+tolerance) THEN add `keyScore × MATCH_WEIGHT_KEY` (0.30).
- **Rule 3:** IF type matches THEN add `MATCH_WEIGHT_TYPE` (0.10).
- **Rule 4:** IF year is in range THEN add `MATCH_WEIGHT_YEAR` (0.05).
- **Rule 5:** IF title contains search text THEN add `MATCH_WEIGHT_TEXT` (0.05).

### Quick Matching Rules (`getQuickMatches`)

- **Rule 1:** IF part-specific keys are harmonically similar THEN add `partSpecificKeyScore × QUICK_MATCH_WEIGHT_KEY` (0.45).
- **Rule 2:** IF part-specific BPMs are harmonically related THEN add `partSpecificBpmScore × QUICK_MATCH_WEIGHT_BPM` (0.45).
- **Rule 3:** IF artist matches THEN add `QUICK_MATCH_WEIGHT_ARTIST` (0.05).
- **Rule 4:** IF origin matches THEN add `QUICK_MATCH_WEIGHT_ORIGIN` (0.05).

Weights are defined in `src/constants/index.ts` and represent the relative importance of each dimension.

---

## 3. Inference Engine

The inference engine applies the rules to the fuzzified inputs and aggregates the result. The implementation uses a weighted additive aggregation (Sugeno-style singleton consequents).

### Section-Level Inference (`calculatePartSpecificKeyScore`)

For each section in the target song, the engine finds the matching section in the candidate (by normalized part name) and computes key similarity via `calculateKeyDistance`. When a section has multiple keys, pairwise similarities are computed and the **maximum** is taken. All section scores are then **averaged** to produce a single part-specific key score in [0, 1]. So: MAX over key pairs within a section, then MEAN over sections.

### Song-Level Inference (`evaluateMatch`, `getQuickMatches`)

Each rule that fires contributes `(membership × weight)` to a running `matchScore`. Rules that do not fire contribute 0. The total is the weighted sum of all rule outputs. In `findHarmonicMatches`, discrete rules add fixed amounts (0.5 for harmonic BPM, 0.3 for compatible key, 0.1 for same type) when their conditions hold.

---

## 4. Defuzzification

Defuzzification turns the aggregated fuzzy output into a crisp decision. Here the crisp output is the **ranking** of matches.

The `matchScore` is already a scalar (weighted sum). Defuzzification is performed by **sorting** the result list by descending `matchScore`:

```ts
return results.sort((a, b) => b.matchScore - a.matchScore);
```

The song with the highest aggregate score is first; the ordering is the crisp decision. Each `MatchResult` also exposes `bpmScore`, `keyScore`, and `reasons`. The `reasons` array is a linguistic summary of why the score was assigned (e.g., "BPM match: 120 within ±10 of 118", "Part-specific key match: Verse: 85% match"). So the system defuzzifies both to a numeric ranking and to human-readable explanations.

---

## Summary Table

| Fuzzy Component   | Implementation                                                                 | Key Code / Location |
|-------------------|----------------------------------------------------------------------------------|----------------------|
| **Fuzzification** | BPM distance → [0,1] via linear decay; semitone distance → [0,1]; section names → canonical labels | `getBpmCompatibilityScore`, `calculateKeyDistance`, `normalizeSectionName` |
| **Rule Base**     | Weighted IF–THEN rules over BPM, key, type, year, text, artist, origin, part-specific | `evaluateMatch`, `getQuickMatches`, `constants/index.ts` |
| **Inference**     | MAX over key pairs per section; MEAN over sections; weighted sum over rules     | `calculatePartSpecificKeyScore`, `evaluateMatch`, `getQuickMatches` |
| **Defuzzification** | Sort by `matchScore`; expose component scores and `reasons`                      | `findMatches` / `getQuickMatches` (`.sort()`), `MatchResult.reasons` |

The system behaves as a **Sugeno-type fuzzy inference system**: rule consequents are constants (the weights), aggregation is weighted addition, and the output is a crisp ranking plus linguistic reasons. The two-level aggregation in `calculatePartSpecificKeyScore` (MAX then MEAN) acts as a hierarchical fuzzy sub-system for section-level key similarity before it is fed into the top-level song scoring.
