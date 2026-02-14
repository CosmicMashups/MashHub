## Context

MashHub uses a normalized section-based architecture where songs have multiple sections with different BPM, KEY, and PART values. The current filter system places all filters in a modal dialog, making common operations cumbersome. Users frequently filter by BPM, Key, and Year, but these require opening the Advanced Filters dialog. Additionally, with section-level data, users need the ability to filter songs where a specific PART has specific harmonic properties.

## Goals / Non-Goals

### Goals
- Move primary harmonic filters (BPM, Key, Year) inline below search bar for quick access
- Enforce strict mutual exclusivity between filter modes (target+tolerance vs range)
- Add PART-specific harmonic filtering in Advanced Filters only
- Maintain performance for 10,000+ songs and 60,000+ sections
- Ensure deterministic filter state transitions
- Support both global (ANY section) and PART-specific filtering

### Non-Goals
- Moving all filters inline (Advanced Filters dialog remains for less common filters)
- PART-specific filtering in inline filters (only in Advanced Filters)
- Real-time filter application (filters apply on explicit action)
- Filter presets or saved filter configurations

## Decisions

### Decision 1: Inline Filter Layout

**Decision**: Place BPM, Key, and Year filters as structured dropdowns directly below the search bar, horizontally aligned on desktop and wrapped on mobile.

**Rationale**:
- BPM, Key, and Year are the most frequently used filters
- Inline placement reduces friction for common operations
- Dropdown structure keeps UI compact while providing full filter functionality
- Horizontal layout on desktop matches search bar alignment

**Alternatives considered**:
- All filters inline: Rejected - too cluttered, Advanced Filters still needed for less common options
- Tabs or accordion: Rejected - adds complexity, dropdowns are more discoverable
- Separate filter bar: Rejected - breaks visual flow with search bar

### Decision 2: Mutual Exclusivity Enforcement

**Decision**: Enforce strict mutual exclusivity between target+tolerance and range modes for BPM and Key filters. When one mode has values, disable inputs in the other mode.

**Rationale**:
- Prevents ambiguous filter states (e.g., both target BPM and BPM range active)
- Clear user intent: either precise matching (target+tolerance) or broad matching (range)
- Deterministic state transitions ensure predictable filtering behavior

**Alternatives considered**:
- Allow both modes: Rejected - creates ambiguity about which filter applies
- Auto-clear on mode switch: Considered but rejected - may lose user input unintentionally
- Warning messages: Rejected - prevention is better than correction

### Decision 3: PART-Specific Filtering Location

**Decision**: Place PART-specific harmonic filtering exclusively in the Advanced Filters dialog, not in inline filters.

**Rationale**:
- PART-specific filtering is an advanced use case, not a common operation
- Keeps inline filters simple and focused on global harmonic properties
- Advanced Filters dialog already contains PART filter, so grouping is logical
- Prevents inline filter UI from becoming too complex

**Alternatives considered**:
- PART-specific filters inline: Rejected - adds complexity to primary UI, less common use case
- Separate PART filter dialog: Rejected - unnecessary fragmentation

### Decision 4: Filter State Model

**Decision**: Use structured TypeScript interfaces with explicit mode tracking (`"target" | "range" | null`) and clear separation between global and PART-specific filters.

**Rationale**:
- Type safety prevents invalid filter states
- Explicit mode tracking enables deterministic UI state management
- Clear separation between global and PART-specific filters prevents confusion
- Supports future filter state persistence if needed

**Alternatives considered**:
- Flat filter object: Rejected - doesn't enforce mutual exclusivity at type level
- Separate filter objects per mode: Rejected - adds complexity, harder to reset

### Decision 5: Filtering Algorithm Strategy

**Decision**: Use indexed queries on songSections table with compound indexes for PART+BPM and PART+KEY. Global filters query ANY section, PART-specific filters query sections matching the specified PART.

**Rationale**:
- IndexedDB compound indexes enable efficient PART+BPM and PART+KEY queries
- Single query per filter type avoids N+1 patterns
- Short-circuit evaluation when match found improves performance
- Scales to large libraries without loading all sections into memory

**Alternatives considered**:
- Load all sections into memory: Rejected - doesn't scale to 60,000+ sections
- Pre-compute song-level aggregates: Rejected - loses PART-specific filtering precision
- Separate filtering service: Considered but rejected - current service structure sufficient

## Risks / Trade-offs

### Risk: UI Complexity
**Mitigation**: Keep inline filters simple with clear visual hierarchy. Use dropdowns to hide complexity until needed. Maintain Advanced Filters dialog for advanced use cases.

### Risk: Performance with Large Libraries
**Mitigation**: Use indexed queries, short-circuit evaluation, and avoid nested loops. Test with 10,000+ songs and 60,000+ sections. Consider result memoization if needed.

### Risk: Filter State Confusion
**Mitigation**: Enforce mutual exclusivity at UI and type level. Clear visual indicators for active filters. Reset functionality clearly labeled.

### Trade-off: Inline vs Modal Filters
**Decision**: Inline for common (BPM, Key, Year), modal for advanced. This balances accessibility with UI cleanliness.

## Migration Plan

1. **Phase 1: State Model Refactor**
   - Update TypeScript interfaces for new filter state model
   - Add mutual exclusivity enforcement logic
   - Update MatchCriteria interface

2. **Phase 2: UI Component Refactor**
   - Create inline filter dropdown components
   - Refactor FilterPanel to Advanced Filters dialog
   - Update App.tsx layout

3. **Phase 3: Filtering Logic Update**
   - Update matchingService for PART-specific filtering
   - Optimize database queries for PART-based filtering
   - Add global vs PART-specific filter evaluation

4. **Phase 4: Testing & Validation**
   - Test mutual exclusivity enforcement
   - Performance testing with large libraries
   - UI/UX validation

## Open Questions

- Should filter state persist across sessions? (Deferred - not in scope)
- Should inline filters show active filter badges? (Yes - included in requirements)
- Should PART dropdown be populated from all unique PART values or only from songs in current view? (All unique PART values from database)
