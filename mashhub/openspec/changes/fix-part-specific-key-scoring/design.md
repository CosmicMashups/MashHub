## Context

The Quick Match feature in Advanced Filters uses weighted scoring to find harmonically compatible songs. The Part-Specific Key Matching component (45% weight) currently uses a boolean compatibility check that doesn't reflect true harmonic distance. This proposal redesigns the scoring to be mathematically correct and musically accurate.

## Goals / Non-Goals

**Goals:**
- Implement distance-based harmonic scoring for part-specific keys
- Ensure 100% match only for exact key matches (same part, same key)
- Calculate similarity scores based on circular semitone distance
- Support multiple keys per section with pairwise comparison
- Handle Major/Minor mode distinctions
- Average scores across all sections for final aggregation
- Maintain performance with precomputation and caching

**Non-Goals:**
- Changing weight distribution (45% keys, 45% BPM, 5% artist, 5% origin)
- Modifying BPM matching logic
- UI changes or user-facing feature additions
- Database schema changes

## Decisions

### Decision 1: Distance Calculation Method

**Decision**: Use circular semitone distance with normalization to [0,1] range.

**Rationale:**
- Circular distance accounts for enharmonic equivalence (C# = Db)
- Semitone distance is the standard musical interval measurement
- Normalization to [0,1] allows direct score integration with existing weighted system
- Max distance of 6 semitones (tritone) provides natural normalization divisor

**Alternatives considered:**
- Linear distance: Rejected - doesn't account for circular nature of chromatic scale
- Key signature distance: Rejected - more complex, less precise for harmonic matching
- Circle of fifths distance: Rejected - less accurate for direct harmonic similarity

### Decision 2: 100% Match Definition

**Decision**: 100% match requires exact part name match AND exact key match (case-insensitive).

**Rationale:**
- Clear, unambiguous definition
- Matches user expectations (exact match = perfect score)
- Prevents false positives from compatible but different keys

**Alternatives considered:**
- Within-tolerance match = 100%: Rejected - doesn't distinguish exact vs compatible matches
- Gradual scoring for all matches: Rejected - loses clarity of perfect matches

### Decision 3: Multiple Keys Per Section

**Decision**: Compute pairwise similarity between all keys in section A and section B, use MAX similarity.

**Rationale:**
- Handles modulations within a section
- MAX ensures best possible match is used (optimistic matching)
- Prevents penalizing songs with multiple keys when one matches well

**Alternatives considered:**
- Average similarity: Rejected - penalizes songs with multiple keys unnecessarily
- First match only: Rejected - misses better matches in multi-key sections

### Decision 4: Full-Song Key Fallback

**Decision**: When Song B has only "Full Song" key, compare against each section in Song A independently, then average.

**Rationale:**
- Handles legacy data where songs don't have section-level keys
- Provides reasonable scoring even when section data is incomplete
- Averaging ensures all sections contribute equally

**Alternatives considered:**
- Skip songs with only full-song keys: Rejected - too restrictive, loses matches
- Use best section match only: Rejected - doesn't reflect full song compatibility

### Decision 5: Mode Penalty

**Decision**: Apply 0.15 penalty when pitch class matches but mode differs (Major vs Minor).

**Rationale:**
- Major and Minor are fundamentally different harmonic contexts
- 0.15 penalty (15%) reflects significant but not complete difference
- Allows D Major vs D Minor to score 0.85 (good but not perfect)

**Alternatives considered:**
- No mode distinction: Rejected - loses important harmonic information
- Larger penalty (0.3+): Rejected - too harsh, D Major and D Minor are related
- Separate scoring entirely: Rejected - adds complexity without clear benefit

### Decision 6: Aggregation Strategy

**Decision**: Average section scores across ALL sections in Song A.

**Rationale:**
- Ensures all sections contribute to final score
- Prevents single-section songs from being unfairly advantaged
- Mathematically sound (average of averages)

**Alternatives considered:**
- Best section only: Rejected - doesn't reflect overall song compatibility
- Weighted average by section order: Rejected - no clear use case, adds complexity
- Sum of scores: Rejected - would exceed 1.0, breaks normalization

### Decision 7: Performance Optimization

**Decision**: Precompute pitch class values, cache parsed key objects, avoid O(n²) comparisons.

**Rationale:**
- Quick Match may be called frequently during user interaction
- Precomputation amortizes parsing cost
- Caching prevents redundant calculations

**Alternatives considered:**
- Lazy computation: Rejected - may cause performance issues with large libraries
- No optimization: Rejected - could be slow with 1000+ songs

## Risks / Trade-offs

**Risk**: Complex mathematical logic may introduce bugs
- **Mitigation**: Comprehensive unit tests with known musical examples, inline comments explaining math

**Risk**: Performance degradation with large libraries
- **Mitigation**: Precomputation, caching, efficient algorithms, performance tests

**Risk**: Edge cases (invalid keys, missing data) may cause errors
- **Mitigation**: Defensive programming, try-catch blocks, graceful degradation (score = 0)

**Trade-off**: Mathematical accuracy vs performance
- **Decision**: Optimize for accuracy with performance safeguards (caching, precomputation)

**Trade-off**: Simplicity vs completeness
- **Decision**: Implement full specification (multiple keys, full-song fallback) for correctness

## Implementation Strategy

1. Create helper functions in `keyNormalization.ts`:
   - `parseKeyToPitchClass(key: string): { pitchClass: number, mode: 'major' | 'minor' | null }`
   - `calculateKeyDistance(key1: string, key2: string): number` (returns normalized distance 0-1)

2. Create main scoring function in `matchingService.ts`:
   - `calculatePartSpecificKeyScore(songA: Song, songB: Song, sectionsA: SongSection[], sectionsB: SongSection[]): number`

3. Refactor `getQuickMatches()` to use new scoring function

4. Add comprehensive unit tests with musical examples

## Open Questions

- Should we support other modes (Dorian, Mixolydian, etc.)? **Answer**: No, focus on Major/Minor for MVP
- How to handle songs with no sections? **Answer**: Fallback to old method (already implemented)
- Should mode penalty be configurable? **Answer**: No, hardcode 0.15 for consistency
