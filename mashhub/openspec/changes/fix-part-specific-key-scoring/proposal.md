## Why

The current Part-Specific Key Matching logic in Quick Match uses a simple boolean compatibility check that doesn't accurately reflect harmonic distance. This results in:
- All compatible keys receiving the same score (1.0), regardless of how close or far they are musically
- No distinction between exact matches (D Major vs D Major) and distant matches (D Major vs F# Major)
- Missing support for multiple keys per section
- No handling of Major/Minor mode differences
- Incomplete aggregation across all sections (only uses first match found)

A mathematically correct, distance-based scoring system is required to provide accurate harmonic similarity scores that reflect true musical relationships between song sections.

## What Changes

- **MODIFIED**: Part-Specific Key Matching algorithm to use distance-based harmonic scoring
- **NEW**: `calculatePartSpecificKeyScore()` function with mathematical distance calculations
- **NEW**: `parseKeyToPitchClass()` helper function with mode detection
- **NEW**: Support for multiple keys per section (pairwise similarity with MAX selection)
- **NEW**: Full-song key fallback logic (compare against all sections)
- **NEW**: Mode-aware scoring (Major vs Minor penalty of 0.15)
- **MODIFIED**: Aggregation strategy to average scores across ALL sections (not just first match)
- **NEW**: Edge case handling for missing keys, invalid strings, enharmonic equivalents
- **NEW**: Performance optimizations (precomputed pitch classes, cached parsing)

## Impact

- Affected specs: matching-service
- Affected code:
  - `src/services/matchingService.ts` - Part-Specific Key scoring logic in `getQuickMatches()`
  - `src/utils/keyNormalization.ts` - New helper functions for pitch class parsing and mode detection
- Weight distribution remains unchanged: Part-Specific Keys (45%), Part-Specific BPMs (45%), Artist (5%), Origin (5%)
- BPM matching logic remains unchanged
