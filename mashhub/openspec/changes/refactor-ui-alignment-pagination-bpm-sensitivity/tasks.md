## 1. UI Alignment Fixes

- [x] 1.1 Audit all action buttons across components and ensure center alignment
- [x] 1.2 Center-align section titles in all components
- [x] 1.3 Fix table header alignment to match body column alignment exactly
- [x] 1.4 Center-align empty state messages
- [x] 1.5 Fix "Find Matches" button alignment in AdvancedFiltersDialog and FilterPanel
- [x] 1.6 Create shared utility class for center alignment (if needed)
- [x] 1.7 Remove inline style inconsistencies causing layout shifts
- [x] 1.8 Verify no padding differences cause misalignment

## 2. Top Matches Responsiveness

- [x] 2.1 Implement responsive CSS Grid layout for Top Matches cards
- [x] 2.2 Configure breakpoints: 2-4 columns on large screens, single column on small
- [x] 2.3 Test grid layout on various screen sizes
- [x] 2.4 Refactor match explanation text to compact format ("BPM + Key + Section Match")
- [x] 2.5 Remove redundant phrasing from match explanations
- [x] 2.6 Implement color-coded affinity logic (Green ≥0.85, Yellow/Amber 0.65-0.84, Neutral <0.65)
- [x] 2.7 Apply color coding to match score and explanation label
- [x] 2.8 Ensure numeric score is always visible (not color-only)
- [x] 2.9 Verify WCAG AA color contrast compliance
- [x] 2.10 Update AdvancedFiltersDialog Top Matches display
- [x] 2.11 Update FilterPanel Top Matches display (if still used)

## 3. Whitespace and Padding Refinement

- [x] 3.1 Increase vertical padding between major sections (24px-40px rhythm)
- [x] 3.2 Increase padding within cards
- [x] 3.3 Increase spacing between cards
- [x] 3.4 Increase spacing between filter panel and results
- [x] 3.5 Increase spacing between headers and content blocks
- [x] 3.6 Verify spacing is consistent across components
- [x] 3.7 Ensure no excessive empty space on small screens
- [x] 3.8 Ensure width is not unnecessarily increased

## 4. Customizable Pagination

- [x] 4.1 Add items-per-page selector component (10, 20, 30, 50 options)
- [x] 4.2 Place selector in top-right of results section, inline with pagination controls
- [x] 4.3 Implement state management for selected page size
- [x] 4.4 Reset to page 1 when page size changes
- [x] 4.5 Persist selection during session (useState, not localStorage)
- [x] 4.6 Integrate selector with existing Pagination component
- [x] 4.7 Update SongList to use customizable pagination
- [x] 4.8 Update SearchResults to use customizable pagination
- [x] 4.9 Ensure filtered results are sliced efficiently
- [x] 4.10 Verify no unnecessary re-computation of matching on page size change

## 5. BPM Sensitivity Refinement

- [x] 5.1 Review current BPM similarity calculation in matchingService.ts
- [x] 5.2 Implement new tolerance window formula: `if distance <= 5: similarity = 1; else: similarity = max(0, 1 - (distance - 5) / 15)`
- [x] 5.3 Update getQuickMatches BPM scoring logic
- [x] 5.4 Update getBpmCompatibilityScore in bpmMatching.ts (if used)
- [x] 5.5 Verify normalized output (0-1 range)
- [x] 5.6 Verify 45% weight distribution remains unchanged
- [x] 5.7 Verify harmonic BPM relationships still supported
- [x] 5.8 Test with sample datasets (90 vs 95 BPM should score higher)
- [x] 5.9 Add inline comments explaining algorithm adjustment
- [x] 5.10 Ensure no regression in existing match quality

## 6. Performance and Quality

- [x] 6.1 Memoize expensive computations (Top Matches grid, pagination calculations)
- [x] 6.2 Avoid unnecessary re-renders in responsive components
- [x] 6.3 Ensure Top Matches grid does not trigger layout thrashing
- [x] 6.4 Keep animations subtle (if any)
- [x] 6.5 Run linter and fix any errors
- [x] 6.6 Test on multiple screen sizes and browsers
- [x] 6.7 Verify accessibility (keyboard navigation, screen readers, color contrast)

## 7. Validation

- [x] 7.1 Verify all alignment fixes are applied consistently
- [x] 7.2 Test responsive Top Matches grid on mobile, tablet, desktop
- [x] 7.3 Test pagination selector with all options (10, 20, 30, 50)
- [x] 7.4 Verify BPM similarity improvements with test cases
- [x] 7.5 Confirm no breaking changes to filtering logic
- [x] 7.6 Confirm no breaking changes to matching algorithm weights
- [x] 7.7 Confirm no regression in section normalization
- [x] 7.8 Run openspec validate to ensure spec compliance
