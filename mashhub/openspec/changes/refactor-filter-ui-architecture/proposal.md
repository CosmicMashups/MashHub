## Why

MashHub's current filter system places all filters inside a modal dialog, making common harmonic filters (BPM, Key, Year) less accessible. With the migration to section-based architecture, users need the ability to filter by harmonic properties at specific PARTs, but this advanced capability should remain in the Advanced Filters dialog. The current UI also lacks clear mutual exclusivity enforcement between filter modes (target+tolerance vs range), leading to ambiguous filter states.

## What Changes

- **BREAKING**: Filter UI layout redesigned to place primary harmonic filters (BPM, Key, Year) inline below the search bar
- **BREAKING**: Filter state model refactored to enforce strict mutual exclusivity between target+tolerance and range modes
- Advanced Filters dialog retained for less common filters (Vocal Status, Type, Origin, Season, Artist, Text Search, PART)
- **NEW**: PART-specific harmonic filtering added to Advanced Filters dialog only
- Filtering logic updated to support global harmonic filters (apply to ANY section) and PART-specific filters (apply to sections matching specific PART)
- Performance optimizations for section-aware filtering using indexed queries

## Impact

- Affected specs: filtering, ui-components
- Affected code:
  - `src/components/FilterPanel.tsx` - Refactored to Advanced Filters dialog
  - `src/components/AdvancedSearchBar.tsx` - Updated to include inline filter dropdowns
  - `src/App.tsx` - Updated layout to place filters below search bar
  - `src/services/matchingService.ts` - Updated filtering logic for PART-specific filters
  - `src/services/database.ts` - Query optimization for PART-based filtering
  - `src/types/index.ts` - Updated filter state interfaces
