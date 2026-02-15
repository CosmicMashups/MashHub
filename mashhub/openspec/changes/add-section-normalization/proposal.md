## Why

The current section matching logic uses exact string comparison, which prevents musically logical matches between related section names. For example, "Verse A" and "Verse" are treated as completely different sections, even though they represent the same musical structure. This causes:

- Filtering by "Verse" misses songs with "Verse A", "Verse B", "Verse C"
- Matching logic fails to recognize that "Intro 1" and "Intro Drop" are both intro sections
- Users must manually select every variation of a section name to find all relevant songs
- Part-Specific Key Scoring misses valid matches between "Verse" and "Verse A"

A hierarchical normalization system is required to group related section names into logical base sections, enabling musically accurate filtering and matching while preserving the original section names for display.

## What Changes

- **NEW**: Section normalization layer with `normalizeSectionName()` function
- **NEW**: BaseSection type definition ("Intro" | "Verse" | "Prechorus" | "Chorus" | "Bridge" | "Other")
- **NEW**: Section grouping constant map defining hierarchical relationships
- **MODIFIED**: Advanced Filtering (Part-Specific Key Filter) to use normalized section names
- **MODIFIED**: Matching engine (Part-Specific Key Scoring) to use normalized section names
- **MODIFIED**: `sectionMatchesPartFilter()` to compare normalized names
- **NEW**: Performance optimizations (caching, precomputation)
- **PRESERVED**: UI display continues to show original section names (no UI changes)

## Impact

- Affected specs: filtering, matching-service
- Affected code:
  - `src/utils/sectionNormalization.ts` - NEW: Normalization utilities
  - `src/services/matchingService.ts` - Updated section comparison logic
  - `src/utils/filterState.ts` - Updated filter matching logic (if needed)
- No database schema changes
- No UI changes (display remains unchanged)
- Backward compatible (existing filters and matches continue to work, with improved matching)
