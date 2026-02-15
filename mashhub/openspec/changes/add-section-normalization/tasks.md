## 1. Section Normalization Utility
- [x] 1.1 Create `src/utils/sectionNormalization.ts` file
- [x] 1.2 Define `BaseSection` type: `"Intro" | "Verse" | "Prechorus" | "Chorus" | "Bridge" | "Other"`
- [x] 1.3 Create section grouping constant map with all section variations:
  - Intro group: ["Intro", "Intro 1", "Intro 2", "Intro Drop", "Intro Drop 1", "Intro Drop 2"]
  - Verse group: ["Verse", "Verse A", "Verse B", "Verse C", "Verse 2"]
  - Prechorus group: ["Prechorus", "Prechorus A", "Prechorus B", "Prechorus C"]
  - Chorus group: ["Chorus", "Chorus A", "Chorus B", "Chorus 2", "Last Chorus", "Last Postchorus", "Postchorus"]
  - Bridge group: ["Bridge"]
- [x] 1.4 Implement `normalizeSectionName(section: string): BaseSection` function
- [x] 1.5 Add case-insensitive matching logic
- [x] 1.6 Add whitespace trimming
- [x] 1.7 Implement "Other" fallback for unmatched sections
- [x] 1.8 Add JSDoc comments explaining grouping logic
- [ ] 1.9 Write unit tests for all section group mappings
- [ ] 1.10 Write unit tests for edge cases (case variations, whitespace, unknown sections)

## 2. Performance Optimization
- [x] 2.1 Implement in-memory cache for normalized section names (Map<string, BaseSection>)
- [x] 2.2 Add cache lookup before normalization computation
- [x] 2.3 Add cache population during normalization
- [x] 2.4 Consider precomputation strategy for frequently accessed sections
- [ ] 2.5 Write performance tests with large section lists (1000+ sections)
- [ ] 2.6 Verify normalization completes in < 1ms per call (cached)

## 3. Update Matching Service
- [x] 3.1 Import `normalizeSectionName` in `src/services/matchingService.ts`
- [x] 3.2 Update `sectionMatchesPartFilter()` to compare normalized section names:
  - Replace `section.part !== block.part` with normalized comparison
  - Normalize both `section.part` and `block.part` before comparison
- [x] 3.3 Update `calculatePartSpecificKeyScore()` to use normalized section names:
  - Replace `cs.part.toLowerCase().trim() === targetSection.part.toLowerCase().trim()` with normalized comparison
  - Normalize both section names before finding matching section
- [x] 3.4 Update BPM matching logic in `getQuickMatches()` to use normalized section names:
  - Replace `cs.part === targetSection.part` with normalized comparison
- [x] 3.5 Ensure original section names are preserved in match reasons and results
- [x] 3.6 Add comments explaining normalization usage
- [ ] 3.7 Write unit tests for normalized section matching scenarios

## 4. Update Filter Logic
- [x] 4.1 Review `src/utils/filterState.ts` for any section name comparisons
- [x] 4.2 Update filter matching logic to use normalized section names (if needed) - No changes needed, handled in matching service
- [x] 4.3 Ensure filter state preserves original section names for UI display - Already preserved
- [ ] 4.4 Write unit tests for filter matching with normalized sections

## 5. Integration Testing
- [ ] 5.1 Test Advanced Filters with base section names (e.g., "Verse")
- [ ] 5.2 Test Advanced Filters with sub-variations (e.g., "Verse A", "Intro Drop")
- [ ] 5.3 Test Quick Match with normalized section matching:
  - Song A: "Verse" vs Song B: "Verse A"
  - Song A: "Intro 1" vs Song B: "Intro Drop"
  - Song A: "Chorus" vs Song B: "Last Chorus"
- [ ] 5.4 Test that original section names are displayed in UI (not normalized names)
- [ ] 5.5 Test backward compatibility: existing filters and matches continue to work
- [ ] 5.6 Test edge cases:
  - Case variations ("VERSE" vs "verse")
  - Whitespace variations ("  Verse  " vs "Verse")
  - Unknown sections ("Instrumental" normalizes to "Other")
  - Multiple sub-variations in same song

## 6. Documentation
- [ ] 6.1 Add JSDoc comments to `normalizeSectionName()` explaining:
  - Purpose and behavior
  - Section grouping logic
  - Return value meaning
  - Examples of normalization
- [ ] 6.2 Document section grouping constant map with comments explaining each group
- [ ] 6.3 Add inline comments in matching service explaining normalization usage
- [ ] 6.4 Update code comments to reflect normalized section matching
- [ ] 6.5 Document that normalization is internal only (UI displays original names)

## 7. Edge Case Handling
- [ ] 7.1 Handle null/undefined section names (return "Other")
- [ ] 7.2 Handle empty string section names (return "Other")
- [ ] 7.3 Handle section names with only whitespace (trim and normalize)
- [ ] 7.4 Handle very long section names (normalize safely)
- [ ] 7.5 Handle special characters in section names (normalize safely)
- [ ] 7.6 Write unit tests for all edge cases

## 8. Validation
- [ ] 8.1 Verify all section group mappings work correctly
- [ ] 8.2 Verify case-insensitive matching works for all groups
- [ ] 8.3 Verify whitespace trimming works correctly
- [ ] 8.4 Verify "Other" fallback works for unknown sections
- [ ] 8.5 Verify performance is acceptable (caching works)
- [ ] 8.6 Verify no UI changes (original names displayed)
- [ ] 8.7 Verify backward compatibility maintained
- [ ] 8.8 Run full test suite to ensure no regressions
