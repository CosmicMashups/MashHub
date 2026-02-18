## Why

The current UI has alignment inconsistencies, fixed pagination limits, and a BPM matching algorithm that penalizes close BPM values too harshly. User feedback indicates:
- Buttons and text are not consistently centered, creating visual clutter
- Top Matches cards do not adapt well to different screen sizes
- Pagination is fixed at 25 items per page with no user control
- BPM differences of 5-10 BPM are penalized too heavily, making matches like 90 BPM vs 95 BPM score unfairly low

This refactor improves visual polish, responsiveness, usability, and matching fairness without breaking existing architecture.

## What Changes

- **UI Alignment**: Center-align all action buttons, section titles, table headers, empty states, and "Find Matches" button. Ensure consistent flexbox alignment strategy across components.
- **Top Matches Responsiveness**: Implement responsive grid layout (2-4 cards per row on large screens, single column on small screens). Shorten match explanation text to compact format ("BPM + Key + Section Match"). Add color-coded affinity indicators (Green ≥0.85, Yellow/Amber 0.65-0.84, Neutral <0.65).
- **Whitespace Refinement**: Increase vertical padding between sections (24px-40px rhythm), cards, and filter panels. Use consistent spacing scale throughout.
- **Customizable Pagination**: Add results-per-page selector (10, 20, 30, 50 options) in top-right of results section, inline with pagination controls. Persist selection during session, reset to page 1 on change.
- **BPM Sensitivity Refinement**: Modify BPM similarity function to use tolerance window (≤5 BPM = minimal penalty, gradual reduction beyond 5 BPM, hard cutoff after 15 BPM). Formula: `if distance <= 5: similarity = 1; else: similarity = max(0, 1 - (distance - 5) / 15)`.

## Impact

- **Affected specs**: `ui-components` (alignment, responsiveness, pagination), `matching-service` (BPM similarity algorithm)
- **Affected code**:
  - `src/components/AdvancedFiltersDialog.tsx` - Top Matches display, "Find Matches" button alignment
  - `src/components/FilterPanel.tsx` - Top Matches display (if still used)
  - `src/components/Pagination.tsx` - Add items-per-page selector
  - `src/components/SongList.tsx` - Pagination integration, alignment fixes
  - `src/components/SearchResults.tsx` - Pagination integration, alignment fixes
  - `src/services/matchingService.ts` - BPM similarity calculation in `getQuickMatches`
  - `src/utils/bpmMatching.ts` - BPM compatibility score function (if used by matching service)
  - Various components with buttons, headers, empty states - alignment fixes
