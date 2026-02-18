## 1. Theme Token System Foundation
- [x] 1.1 Define semantic color tokens in `tailwind.config.js` (background, surface, text, border, accent, state)
- [x] 1.2 Create light mode color mappings for all tokens
- [x] 1.3 Create dark mode color mappings for all tokens
- [x] 1.4 Ensure all token combinations meet WCAG AA contrast requirements
- [x] 1.5 Create CSS custom properties for runtime theme switching
- [x] 1.6 Create utility classes that consume theme tokens (e.g., `bg-surface`, `text-primary`)

## 2. Cleanup Legacy CSS
- [x] 2.1 Remove hard-coded color values from `:root` in `index.css`
- [x] 2.2 Remove `@media (prefers-color-scheme: light)` rules that conflict with Tailwind
- [x] 2.3 Remove legacy button and link color rules
- [x] 2.4 Ensure no CSS color rules conflict with Tailwind dark mode

## 3. Base Component Refactoring
- [ ] 3.1 Refactor button components to use theme tokens
- [ ] 3.2 Refactor input components to use theme tokens
- [ ] 3.3 Refactor card components to use theme tokens
- [ ] 3.4 Refactor badge/label components to use theme tokens
- [ ] 3.5 Test all base components in both light and dark modes

## 4. Layout Component Refactoring
- [ ] 4.1 Refactor header component (`App.tsx` header section)
- [ ] 4.2 Refactor main layout containers
- [ ] 4.3 Refactor footer components (if any)
- [ ] 4.4 Ensure proper surface elevation hierarchy
- [ ] 4.5 Test layout components in both themes

## 5. Dialog and Modal Refactoring
- [x] 5.1 Refactor `UtilityDialog` component
- [ ] 5.2 Refactor `AdvancedFiltersDialog` component
- [ ] 5.3 Refactor `SongModal` component
- [ ] 5.4 Refactor `SongDetailsModal` component
- [ ] 5.5 Refactor `ImportExportModal` component
- [ ] 5.6 Refactor `EnhancedExportModal` component
- [ ] 5.7 Refactor all other modal/dialog components
- [ ] 5.8 Ensure dialog overlays have proper contrast
- [ ] 5.9 Test all dialogs in both themes

## 6. List and Table Component Refactoring
- [ ] 6.1 Refactor `SongList` component
- [ ] 6.2 Refactor `SearchResults` component
- [ ] 6.3 Refactor `SimpleSongList` component
- [ ] 6.4 Refactor list item hover states
- [ ] 6.5 Refactor table components (if any)
- [ ] 6.6 Move `getKeyColor` logic to theme system
- [ ] 6.7 Test all list components in both themes

## 7. Form and Input Component Refactoring
- [ ] 7.1 Refactor `InlineFilters` component
- [ ] 7.2 Refactor `AdvancedSearchBar` component
- [ ] 7.3 Refactor dropdown components
- [ ] 7.4 Refactor filter panel components
- [ ] 7.5 Ensure input focus states use theme tokens
- [ ] 7.6 Test all form components in both themes

## 8. Project Management Component Refactoring
- [ ] 8.1 Refactor `EnhancedProjectManager` component
- [ ] 8.2 Refactor `ProjectSection` component
- [ ] 8.3 Refactor project-related dialogs
- [ ] 8.4 Test project components in both themes

## 9. Interactive State Standardization
- [ ] 9.1 Standardize hover states across all interactive elements
- [ ] 9.2 Standardize focus states using theme tokens
- [ ] 9.3 Standardize active states using theme tokens
- [ ] 9.4 Standardize disabled states using theme tokens
- [ ] 9.5 Ensure no hard-coded hover darkening logic remains

## 10. Theme Toggle Verification
- [ ] 10.1 Verify theme toggle updates all components immediately
- [ ] 10.2 Verify no flash of incorrect theme on page load
- [ ] 10.3 Verify theme preference persists correctly
- [ ] 10.4 Test theme toggle multiple times to ensure consistency

## 11. Visual Consistency Validation
- [ ] 11.1 Switch between themes multiple times and verify all components adapt
- [ ] 11.2 Verify all dialogs match background hierarchy
- [ ] 11.3 Verify dropdown menus match background hierarchy
- [ ] 11.4 Verify list items have proper hover contrast
- [ ] 11.5 Verify inputs are readable in both themes
- [ ] 11.6 Verify selected filters are clearly distinguishable
- [ ] 11.7 Check for any visual "patchwork" color artifacts
- [ ] 11.8 Verify no components visually clash with backgrounds

## 12. Accessibility Validation
- [ ] 12.1 Run automated contrast checking on all token combinations
- [ ] 12.2 Manual keyboard navigation test in both themes
- [ ] 12.3 Screen reader test in both themes
- [ ] 12.4 Verify focus indicators are visible in both themes

## 13. Code Quality
- [ ] 13.1 Remove all unused color variables
- [ ] 13.2 Remove all duplicate color definitions
- [ ] 13.3 Ensure consistent naming conventions throughout
- [ ] 13.4 Document theme token system
- [ ] 13.5 Add examples of using theme tokens in component code
