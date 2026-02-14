## 1. State Model Refactor
- [ ] 1.1 Define new HarmonicMode interface (target | range | null)
- [ ] 1.2 Define new FilterState interface with structured BPM, Key, Year, and Advanced sections
- [ ] 1.3 Update MatchCriteria interface to support PART-specific filtering
- [ ] 1.4 Add mutual exclusivity enforcement helper functions
- [ ] 1.5 Add filter state reset/clear utilities

## 2. Inline Filter Components
- [ ] 2.1 Create BPMFilterDropdown component with target+tolerance and range modes
- [ ] 2.2 Implement mutual exclusivity logic in BPMFilterDropdown
- [ ] 2.3 Create KeyFilterDropdown component with target+tolerance and range modes
- [ ] 2.4 Implement mutual exclusivity logic in KeyFilterDropdown
- [ ] 2.5 Create YearFilterDropdown component (min/max range)
- [ ] 2.6 Create FilterDropdownContainer component for layout and spacing
- [ ] 2.7 Add active filter badge display below search bar
- [ ] 2.8 Implement responsive layout (horizontal desktop, wrapped mobile)

## 3. Advanced Filters Dialog Refactor
- [ ] 3.1 Remove BPM, Key, Year filters from FilterPanel (move to inline)
- [ ] 3.2 Retain Vocal Status, Type, Origin, Season, Artist, Text Search filters
- [ ] 3.3 Add PART filter dropdown (populated from unique PART values)
- [ ] 3.4 Add PART-Specific Harmonic Filtering section
- [ ] 3.5 Implement PART-specific BPM filter (target+tolerance or range)
- [ ] 3.6 Implement PART-specific Key filter (target+tolerance or range)
- [ ] 3.7 Add visual separation between general filters and PART-specific filters
- [ ] 3.8 Update FilterPanel component name/documentation to reflect "Advanced Filters"

## 4. Layout Integration
- [ ] 4.1 Update App.tsx to place inline filters below AdvancedSearchBar
- [ ] 4.2 Add Advanced Filters button next to inline filters
- [ ] 4.3 Update mobile responsive layout for filter placement
- [ ] 4.4 Ensure visual alignment with search bar
- [ ] 4.5 Add consistent spacing system

## 5. Filtering Logic Update
- [ ] 5.1 Update MatchingService.findMatches() to handle new FilterState structure
- [ ] 5.2 Implement global harmonic filter evaluation (ANY section matches)
- [ ] 5.3 Implement PART-specific harmonic filter evaluation (sections matching PART)
- [ ] 5.4 Add database query optimization for PART+BPM filtering
- [ ] 5.5 Add database query optimization for PART+KEY filtering
- [ ] 5.6 Ensure short-circuit evaluation when match found
- [ ] 5.7 Update filter combination logic (global AND PART-specific)

## 6. Database Query Optimization
- [ ] 6.1 Verify compound indexes exist for [songId+bpm], [songId+key]
- [ ] 6.2 Add compound index for [songId+part+bpm] if needed
- [ ] 6.3 Add compound index for [songId+part+key] if needed
- [ ] 6.4 Implement efficient PART-specific query using indexes
- [ ] 6.5 Add query performance tests for large libraries (10,000+ songs)

## 7. State Management
- [ ] 7.1 Update App.tsx filter state to use new FilterState interface
- [ ] 7.2 Implement filter state synchronization between inline filters and Advanced Filters
- [ ] 7.3 Add filter state persistence in component state
- [ ] 7.4 Implement clear all filters functionality
- [ ] 7.5 Add filter state validation on apply

## 8. UI/UX Polish
- [ ] 8.1 Add disabled state styling for mutually exclusive inputs
- [ ] 8.2 Add clear/reset button per filter dropdown
- [ ] 8.3 Add active filter badges with remove functionality
- [ ] 8.4 Implement keyboard navigation for dropdowns
- [ ] 8.5 Add ARIA roles and labels for accessibility
- [ ] 8.6 Add focus management for filter interactions
- [ ] 8.7 Test mobile touch interactions

## 9. Testing
- [ ] 9.1 Unit tests for mutual exclusivity enforcement
- [ ] 9.2 Unit tests for filter state transitions
- [ ] 9.3 Integration tests for global harmonic filtering
- [ ] 9.4 Integration tests for PART-specific filtering
- [ ] 9.5 Performance tests with large libraries
- [ ] 9.6 UI component tests for filter dropdowns
- [ ] 9.7 Accessibility tests (keyboard navigation, screen readers)

## 10. Documentation
- [ ] 10.1 Update component documentation for new filter structure
- [ ] 10.2 Document filter state model in code comments
- [ ] 10.3 Update user-facing documentation if applicable
- [ ] 10.4 Document performance considerations
