## 1. Key Parsing and Pitch Class Utilities
- [x] 1.1 Create `parseKeyToPitchClass(key: string): { pitchClass: number, mode: 'major' | 'minor' | null }` function in `src/utils/keyNormalization.ts`
- [x] 1.2 Handle enharmonic equivalents (Db → C#, Eb → D#, etc.)
- [x] 1.3 Implement case-insensitive parsing
- [x] 1.4 Add mode detection (Major, Minor, or null)
- [x] 1.5 Add error handling for invalid key strings (return null or throw gracefully)
- [ ] 1.6 Write unit tests for `parseKeyToPitchClass()` with various key formats

## 2. Distance Calculation Function
- [x] 2.1 Create `calculateKeyDistance(key1: string, key2: string): number` function in `src/utils/keyNormalization.ts`
- [x] 2.2 Implement circular semitone distance calculation: `min(|a - b|, 12 - |a - b|)`
- [x] 2.3 Normalize distance to [0,1] range: `normalizedDistance = distance / 6`
- [x] 2.4 Calculate similarity score: `sectionScore = 1 - normalizedDistance`
- [x] 2.5 Apply mode penalty (0.15) when pitch class matches but mode differs
- [x] 2.6 Handle exact matches (distance = 0) → score = 1.0
- [ ] 2.7 Write unit tests for `calculateKeyDistance()` with known musical examples

## 3. Section-Level Key Scoring
- [x] 3.1 Create helper function `calculateSectionKeyScore(sectionA: SongSection, sectionB: SongSection): number` (integrated into main function)
- [x] 3.2 Implement part name matching (case-insensitive exact match)
- [x] 3.3 Handle single key per section (direct comparison)
- [x] 3.4 Handle multiple keys per section (pairwise comparison, use MAX similarity)
- [x] 3.5 Handle missing keys (return 0)
- [x] 3.6 Handle invalid keys (return 0, don't throw)
- [ ] 3.7 Write unit tests for section-level scoring with various scenarios

## 4. Full-Song Key Fallback Logic
- [x] 4.1 Detect when candidate song has only "Full Song" key (no section-specific keys)
- [x] 4.2 Implement logic to compare full-song key against each section in target song
- [x] 4.3 Calculate section scores independently for each target section
- [x] 4.4 Average section scores for final score
- [ ] 4.5 Write unit tests for full-song key fallback scenarios

## 5. Main Scoring Function
- [x] 5.1 Create `calculatePartSpecificKeyScore(songA: Song, songB: Song, sectionsA: SongSection[], sectionsB: SongSection[]): number` function in `src/services/matchingService.ts`
- [x] 5.2 Load sections for both songs (if not provided)
- [x] 5.3 For each section in Song A, find matching section in Song B by part name
- [x] 5.4 Calculate section score for each matching part
- [x] 5.5 Handle sections in Song A that don't exist in Song B (score = 0)
- [x] 5.6 Average all section scores from Song A
- [x] 5.7 Ensure final score is between 0 and 1
- [x] 5.8 Add inline comments explaining harmonic math
- [ ] 5.9 Write unit tests for `calculatePartSpecificKeyScore()` with comprehensive scenarios

## 6. Integration with Quick Match
- [x] 6.1 Refactor `getQuickMatches()` method to use `calculatePartSpecificKeyScore()`
- [x] 6.2 Replace boolean compatibility check with distance-based scoring
- [x] 6.3 Update score calculation: `matchScore += partSpecificKeyScore * 0.45`
- [x] 6.4 Update `keyScore` property in MatchResult
- [x] 6.5 Update match reasons to reflect distance-based scoring
- [x] 6.6 Ensure backward compatibility (fallback to old method if no sections)

## 7. Performance Optimization
- [x] 7.1 Implement precomputation of pitch classes for all keys in song library (via parseKeyToPitchClass caching in calculateKeyDistance)
- [x] 7.2 Add caching for parsed key objects (avoid redundant parsing) - handled in parseKeyToPitchClass
- [x] 7.3 Optimize pairwise comparisons (limit to relevant sections only) - implemented in calculatePartSpecificKeyScore
- [ ] 7.4 Add performance tests with large song libraries (1000+ songs)
- [ ] 7.5 Verify Quick Match completes in reasonable time (< 500ms for 1000 songs)

## 8. Edge Case Handling
- [x] 8.1 Handle missing key data (null, undefined, empty string)
- [x] 8.2 Handle invalid key strings gracefully (don't throw, return 0)
- [x] 8.3 Handle songs with no sections (fallback to old method)
- [x] 8.4 Handle sections with no keys (score = 0)
- [x] 8.5 Handle case variations in part names (case-insensitive matching)
- [ ] 8.6 Write edge case unit tests

## 9. Testing
- [ ] 9.1 Write unit tests for `parseKeyToPitchClass()` with all 12 pitch classes
- [ ] 9.2 Write unit tests for `calculateKeyDistance()` with known musical examples:
  - Exact match (D Major vs D Major = 1.0)
  - One semitone (F Major vs F# Major ≈ 0.833)
  - Tritone (C Major vs F# Major = 0.0)
  - Circular distance (B Major vs C Major = 1 semitone)
  - Mode difference (D Major vs D Minor = 0.85)
- [ ] 9.3 Write unit tests for section-level scoring:
  - Same part, same key
  - Same part, different keys
  - Different parts
  - Multiple keys per section
  - Missing sections
- [ ] 9.4 Write unit tests for full-song key fallback
- [ ] 9.5 Write integration tests for `calculatePartSpecificKeyScore()` with real song data
- [ ] 9.6 Write integration tests for `getQuickMatches()` with new scoring
- [ ] 9.7 Verify all tests pass with deterministic results

## 10. Documentation
- [ ] 10.1 Add JSDoc comments to all new functions explaining parameters and return values
- [ ] 10.2 Add inline comments explaining harmonic distance calculations
- [ ] 10.3 Document mode penalty rationale
- [ ] 10.4 Document aggregation strategy
- [ ] 10.5 Update code comments in `getQuickMatches()` to reflect new scoring logic
