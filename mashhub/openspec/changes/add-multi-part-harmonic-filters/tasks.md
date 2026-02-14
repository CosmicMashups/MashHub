## 1. State Model Extension
- [ ] 1.1 Extend FilterState interface to support array of PART filter blocks
- [ ] 1.2 Define PartHarmonicFilterBlock interface (part, bpm, key with mode tracking)
- [ ] 1.3 Update MatchCriteria to include partSpecificFilters array
- [ ] 1.4 Add validation helper for filter block completeness (PART + at least one constraint)
- [ ] 1.5 Add helper functions for filter block manipulation (add, remove, update)

## 2. PartHarmonicFilterBlock Component
- [ ] 2.1 Create PartHarmonicFilterBlock component with card-based design
- [ ] 2.2 Add PART selector dropdown (Verse, Chorus, Bridge, Intro, Outro, Pre-Chorus, Custom)
- [ ] 2.3 Implement BPM filter section (target+tolerance OR range, mutually exclusive)
- [ ] 2.4 Implement Key filter section (target+tolerance OR range, mutually exclusive)
- [ ] 2.5 Add delete button with confirmation
- [ ] 2.6 Add visual validation feedback for incomplete blocks
- [ ] 2.7 Implement collapsible behavior for blocks
- [ ] 2.8 Add ARIA labels and keyboard navigation

## 3. Advanced Filters Dialog Updates
- [ ] 3.1 Replace single PART-specific filter section with multi-block system
- [ ] 3.2 Add "Add Part-Specific Harmonic Filter" button
- [ ] 3.3 Implement block list rendering with proper spacing
- [ ] 3.4 Add summary preview section showing all active PART filters
- [ ] 3.5 Update filter panel layout to accommodate multiple blocks
- [ ] 3.6 Ensure blocks are visually distinct (borders, spacing, headers)

## 4. Filter Block Management
- [ ] 4.1 Implement add filter block functionality
- [ ] 4.2 Implement remove filter block functionality
- [ ] 4.3 Add validation to prevent applying empty blocks
- [ ] 4.4 Implement block state updates (PART, BPM, Key changes)
- [ ] 4.5 Add visual indicators for active vs incomplete blocks

## 5. Filtering Logic - Multi-Block AND Evaluation
- [ ] 5.1 Update MatchingService.findMatches() to handle partSpecificFilters array
- [ ] 5.2 Implement AND logic evaluation: all blocks must match
- [ ] 5.3 Add query optimization: query most selective condition first
- [ ] 5.4 Implement song ID intersection for multiple PART conditions
- [ ] 5.5 Add short-circuit logic: if any condition yields no results, return empty
- [ ] 5.6 Handle duplicate PART filters (both conditions must match)

## 6. Database Query Optimization
- [ ] 6.1 Verify compound indexes exist for [songId+part+bpm] and [songId+part+key]
- [ ] 6.2 Implement efficient PART+BPM query using indexes
- [ ] 6.3 Implement efficient PART+KEY query using indexes
- [ ] 6.4 Optimize query order: determine most selective condition
- [ ] 6.5 Implement result intersection using Set operations
- [ ] 6.6 Add query performance tests with multiple PART conditions

## 7. Edge Case Handling
- [ ] 7.1 Handle songs missing specified PART (exclude from results)
- [ ] 7.2 Handle duplicate PART filters (evaluate both with AND)
- [ ] 7.3 Validate filter blocks before applying (PART + at least one constraint)
- [ ] 7.4 Handle empty filter block array (no PART-specific filtering)
- [ ] 7.5 Ensure compatibility with global harmonic filters (inline BPM/Key)

## 8. UI/UX Polish
- [ ] 8.1 Add subtle card borders and spacing
- [ ] 8.2 Implement collapsible behavior (collapse if >3 blocks, show summary)
- [ ] 8.3 Add clear part label header for each block
- [ ] 8.4 Style delete button (top-right, clear icon)
- [ ] 8.5 Add visual validation feedback (incomplete blocks highlighted)
- [ ] 8.6 Implement summary preview at bottom of Advanced Filters
- [ ] 8.7 Add loading states during filter evaluation
- [ ] 8.8 Ensure responsive design for filter blocks

## 9. Integration with Existing Filters
- [ ] 9.1 Ensure multi-block PART filters work with global BPM/Key filters (inline)
- [ ] 9.2 Ensure multi-block PART filters work with other Advanced Filters
- [ ] 9.3 Test filter combination: global + multiple PART-specific
- [ ] 9.4 Update filter state synchronization
- [ ] 9.5 Ensure filter reset clears all PART filter blocks

## 10. Testing
- [ ] 10.1 Unit tests for filter block validation
- [ ] 10.2 Unit tests for AND logic evaluation
- [ ] 10.3 Integration tests for multiple PART filter blocks
- [ ] 10.4 Integration tests for duplicate PART handling
- [ ] 10.5 Performance tests with 5+ PART filter blocks
- [ ] 10.6 UI component tests for filter block interactions
- [ ] 10.7 Edge case tests (missing PART, empty blocks, etc.)
- [ ] 10.8 Accessibility tests (keyboard navigation, screen readers)

## 11. Documentation
- [ ] 11.1 Document multi-block filter architecture
- [ ] 11.2 Document AND logic semantics
- [ ] 11.3 Update component documentation
- [ ] 11.4 Document query optimization strategy
- [ ] 11.5 Add code comments for complex filtering logic
