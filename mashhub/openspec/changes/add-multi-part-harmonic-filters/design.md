## Context

The refactor-filter-ui-architecture proposal introduced single PART-specific harmonic filtering in the Advanced Filters dialog. Users now need to combine multiple PART-specific filters with AND logic to find songs where different sections satisfy different harmonic conditions. This is essential for complex mashup workflows where, for example, a Verse must be in D Major at 85-95 BPM AND a Chorus must be in F Major at 85-95 BPM.

## Goals / Non-Goals

### Goals
- Support multiple PART-specific harmonic filter blocks
- Enforce AND logic between multiple blocks (all conditions must be satisfied)
- Provide intuitive UI for adding/removing filter blocks
- Maintain performance with multiple PART conditions
- Allow duplicate PART filters (evaluate strictly - both conditions must be satisfied)
- Integrate seamlessly with existing single PART filter from refactor-filter-ui-architecture

### Non-Goals
- OR logic between PART filter blocks (only AND supported)
- Nested logical operators (AND/OR combinations)
- Filter block templates or presets
- Real-time validation of filter combinations
- Filter block reordering (order doesn't affect AND logic)

## Decisions

### Decision 1: Multiple Filter Blocks vs Single Block with Multiple Conditions

**Decision**: Use multiple independent filter blocks, each with its own PART selector and harmonic constraints.

**Rationale**:
- Clearer mental model: each block represents one section's requirements
- Easier to add/remove individual conditions
- More scalable UI (can add many blocks without cluttering single block)
- Matches user's mental model of "Verse needs X AND Chorus needs Y"

**Alternatives considered**:
- Single block with multiple PART rows: Rejected - becomes complex, harder to manage individual conditions
- Nested structure: Rejected - adds unnecessary complexity for AND-only logic

### Decision 2: AND Logic Enforcement

**Decision**: All PART-specific filter blocks are combined with AND logic. A song matches only if ALL blocks' conditions are satisfied.

**Rationale**:
- Simplest and most common use case (find songs where Verse AND Chorus match)
- Clear semantics: all blocks must match
- Avoids complexity of OR logic or operator selection
- Matches the requirement specification

**Alternatives considered**:
- OR logic: Rejected - doesn't match use case (need songs where BOTH sections match)
- User-selectable operators: Rejected - adds complexity, AND is sufficient for current needs
- Mixed AND/OR: Rejected - too complex, can be added later if needed

### Decision 3: Duplicate PART Handling

**Decision**: Allow duplicate PART filters. If multiple blocks target the same PART, both conditions must be satisfied (AND logic still applies).

**Rationale**:
- Flexible - user might want "Verse: 85-95 BPM AND Verse: D Major" (though this could be combined)
- Strict evaluation prevents ambiguity
- Simpler than preventing duplicates (which requires UI state management)
- Edge case that users can avoid if desired

**Alternatives considered**:
- Prevent duplicate PARTs: Rejected - requires state tracking, adds complexity
- Warn on duplicates: Considered but rejected - AND logic is clear, warning unnecessary
- Auto-combine duplicate PARTs: Rejected - loses user intent, might combine incompatible conditions

### Decision 4: Filter Block UI Design

**Decision**: Use card-based design with each block as a distinct card containing PART selector, BPM filter, Key filter, and delete button. Blocks are collapsible if multiple are present.

**Rationale**:
- Clear visual separation between blocks
- Easy to identify and remove individual blocks
- Professional appearance with subtle borders
- Collapsible behavior reduces visual clutter with many blocks

**Alternatives considered**:
- List-based design: Rejected - less clear separation
- Accordion-only: Rejected - all blocks should be visible by default
- Tab-based: Rejected - adds navigation overhead

### Decision 5: Empty Block Handling

**Decision**: Prevent empty harmonic blocks from being applied. A block must have at least a PART selected AND at least one harmonic constraint (BPM or Key) to be evaluated.

**Rationale**:
- Prevents ambiguous filter states
- Clear validation: block is either active (has PART + constraint) or inactive
- Better UX: user knows what filters are actually applied

**Alternatives considered**:
- Allow empty blocks: Rejected - creates ambiguity about filter behavior
- Auto-remove empty blocks: Considered but rejected - might remove user's work-in-progress

### Decision 6: Query Optimization Strategy

**Decision**: For multiple PART filters, use indexed queries per PART condition, then intersect song IDs. Optimize by querying most selective condition first.

**Rationale**:
- IndexedDB compound indexes enable efficient PART+BPM and PART+KEY queries
- Intersection of song IDs is fast (Set operations)
- Short-circuit if any condition yields no results
- Scales better than loading all sections and filtering in memory

**Alternatives considered**:
- Load all sections and filter in memory: Rejected - doesn't scale to 60,000+ sections
- Single complex query: Rejected - IndexedDB doesn't support complex WHERE clauses across multiple conditions easily
- Pre-compute intersections: Rejected - too complex, dynamic queries are sufficient

### Decision 7: Integration with Single PART Filter

**Decision**: Replace single PART-specific filter from refactor-filter-ui-architecture with the multi-block system. The first block effectively replaces the single filter, but now users can add more.

**Rationale**:
- Simpler architecture: one system instead of two
- Backward compatible: single block behaves like original single filter
- More powerful: users can add more blocks as needed
- Cleaner codebase: no duplicate filtering logic

**Alternatives considered**:
- Keep both systems: Rejected - adds complexity, two ways to do same thing
- Migration path: Considered but not needed - multi-block system is superset

## Risks / Trade-offs

### Risk: UI Complexity with Many Blocks
**Mitigation**: Use collapsible cards, clear visual hierarchy, and summary preview. Limit initial display to 3-4 blocks, collapse rest.

### Risk: Performance with Many PART Conditions
**Mitigation**: Use indexed queries, intersect results efficiently, short-circuit on empty results. Test with 5+ PART conditions.

### Risk: User Confusion with AND Logic
**Mitigation**: Clear labeling ("All conditions must match"), visual indicators, summary preview showing combined conditions.

### Trade-off: Duplicate PART Handling
**Decision**: Allow duplicates with strict AND evaluation. Simpler than preventing, and edge case users can avoid.

## Migration Plan

1. **Phase 1: State Model Extension**
   - Extend FilterState to support array of PART filter blocks
   - Update TypeScript interfaces
   - Add validation for block completeness

2. **Phase 2: UI Components**
   - Create PartHarmonicFilterBlock component
   - Add "Add Another Part Filter" button
   - Implement delete functionality
   - Add collapsible behavior

3. **Phase 3: Filtering Logic**
   - Update matchingService for multi-block evaluation
   - Implement AND logic with indexed queries
   - Optimize query order (most selective first)

4. **Phase 4: Integration & Testing**
   - Replace single PART filter with multi-block system
   - Test with various PART combinations
   - Performance testing with multiple blocks

## Open Questions

- Should filter blocks be collapsible by default if more than 3 are present? (Yes - included in design)
- Should there be a maximum number of filter blocks? (No limit - but UI should handle many gracefully)
- Should empty blocks be auto-removed on apply? (No - user might be building them incrementally)
