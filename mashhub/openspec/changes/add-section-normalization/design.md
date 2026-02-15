## Context

MashHub's section-based architecture allows songs to have multiple sections with different musical properties (BPM, Key). Currently, section matching uses exact string comparison, which prevents logical grouping of related section names. This proposal introduces hierarchical section normalization to enable musically accurate filtering and matching.

## Goals / Non-Goals

**Goals:**
- Group related section names into logical base sections (Intro, Verse, Prechorus, Chorus, Bridge)
- Enable filtering by base section to match all sub-variations
- Enable matching logic to recognize related sections as compatible
- Maintain original section names in UI and database
- Optimize performance with caching and precomputation
- Preserve backward compatibility

**Non-Goals:**
- Changing database schema or stored section names
- Modifying UI to display normalized names
- Supporting custom user-defined section groups
- Changing section data model or structure
- Breaking existing filters or matches

## Decisions

### Decision 1: Normalization Strategy

**Decision**: Use prefix-based matching with explicit group definitions.

**Rationale:**
- Clear, maintainable mapping of section names to base sections
- Handles variations like "Intro 1", "Intro Drop", "Verse A"
- Easy to extend with new section groups
- Deterministic and predictable behavior

**Alternatives considered:**
- Regex-based matching: Rejected - harder to maintain, less explicit
- Machine learning classification: Rejected - over-engineering, requires training data
- User-defined groups: Rejected - adds complexity, not in scope

### Decision 2: Base Section Types

**Decision**: Define five base sections: Intro, Verse, Prechorus, Chorus, Bridge, plus "Other" for unmatched sections.

**Rationale:**
- Covers standard song structure sections
- "Other" provides safe fallback for unknown sections
- Type-safe implementation with TypeScript union type
- Extensible if new base sections are needed

**Alternatives considered:**
- More granular base sections (e.g., "Intro Drop" as separate): Rejected - too specific, defeats grouping purpose
- Fewer base sections: Rejected - loses important distinctions (Prechorus vs Chorus)

### Decision 3: Matching Logic

**Decision**: Compare normalized section names, not original names.

**Rationale:**
- Enables logical matching (Verse A matches Verse)
- Preserves original names for display
- Pure function approach (no side effects)
- Consistent behavior across filtering and matching

**Alternatives considered:**
- Fuzzy string matching: Rejected - unpredictable, performance concerns
- Levenshtein distance: Rejected - overkill, explicit groups are clearer
- Keep exact matching: Rejected - doesn't solve the problem

### Decision 4: Performance Optimization

**Decision**: Implement in-memory caching with precomputation during data load.

**Rationale:**
- Normalization is called frequently in filter/matching loops
- Caching prevents repeated regex/string operations
- Precomputation amortizes cost across all sections
- Memory overhead is minimal (one string per section)

**Alternatives considered:**
- No caching: Rejected - performance degradation in large libraries
- Database-level normalization: Rejected - requires schema changes, breaks requirement
- Lazy computation: Rejected - still causes performance issues in loops

### Decision 5: UI Display Preservation

**Decision**: Always display original section names in UI, never normalized names.

**Rationale:**
- Users expect to see exact section names they entered
- Normalization is internal implementation detail
- Maintains data integrity and user trust
- No confusion about what section names mean

**Alternatives considered:**
- Display normalized names: Rejected - breaks user expectations, loses detail
- Show both: Rejected - adds UI complexity, not needed

### Decision 6: Implementation Location

**Decision**: Create new utility module `src/utils/sectionNormalization.ts` with pure functions.

**Rationale:**
- Separation of concerns (normalization logic isolated)
- Reusable across filtering and matching
- Easy to test independently
- No dependencies on UI or database code

**Alternatives considered:**
- Inline in matching service: Rejected - not reusable, harder to test
- In database service: Rejected - violates separation of concerns
- In types file: Rejected - types should not contain logic

## Risks / Trade-offs

**Risk**: Normalization may incorrectly group unrelated sections
- **Mitigation**: Explicit group definitions, "Other" fallback, comprehensive testing

**Risk**: Performance degradation with large libraries
- **Mitigation**: Caching, precomputation, efficient algorithms

**Risk**: Breaking existing filters or matches
- **Mitigation**: Normalization is additive (improves matching), backward compatible

**Trade-off**: Explicit groups vs flexible matching
- **Decision**: Explicit groups for clarity and maintainability

**Trade-off**: Performance vs simplicity
- **Decision**: Optimize for performance with caching while keeping logic simple

## Implementation Strategy

1. Create `src/utils/sectionNormalization.ts`:
   - Define `BaseSection` type
   - Define section grouping constant map
   - Implement `normalizeSectionName()` function
   - Add caching mechanism

2. Update `matchingService.ts`:
   - Replace exact string comparisons with normalized comparisons
   - Update `sectionMatchesPartFilter()` to use normalization
   - Update `calculatePartSpecificKeyScore()` to use normalization

3. Update filter logic (if needed):
   - Ensure filter matching uses normalized names

4. Add comprehensive tests:
   - Test all section group mappings
   - Test edge cases (case variations, whitespace, unknown sections)
   - Test performance with large datasets

## Open Questions

- Should "Outro" normalize to a base section? **Answer**: Not in initial implementation, can be added later if needed
- How to handle sections with numbers (e.g., "Verse 2" vs "Verse A")? **Answer**: Both normalize to "Verse" - numbers and letters are treated as sub-variations
- Should normalization be configurable? **Answer**: No, hardcoded groups for consistency and performance
