## Context

This refactor addresses UX feedback across multiple areas:
1. Visual alignment inconsistencies causing perceived lack of polish
2. Top Matches cards not adapting to screen size
3. Fixed pagination limiting user control
4. BPM matching algorithm being too strict for close values

The changes span UI components, pagination logic, and matching algorithm, requiring coordination but no breaking changes.

## Goals / Non-Goals

**Goals:**
- Consistent center alignment for all interactive elements and headers
- Responsive Top Matches grid that adapts to screen size
- User-configurable pagination with session persistence
- Smoother BPM similarity curve that doesn't penalize close values (≤5 BPM) harshly
- Improved whitespace and visual breathing room
- Color-coded match affinity for quick visual scanning

**Non-Goals:**
- Redesigning layouts or major UI restructuring
- Changing matching algorithm weights (BPM remains 45%)
- Modifying database schema or filtering logic
- Breaking existing pagination or filtering functionality
- Adding new matching features beyond BPM sensitivity refinement

## Decisions

### Decision: BPM Similarity Curve Formula
**What**: Use tolerance window approach: `if distance <= 5: similarity = 1; else: similarity = max(0, 1 - (distance - 5) / 15)`

**Why**: 
- Preserves exact matches (distance 0-5) with full score
- Gradual penalty beyond 5 BPM prevents harsh drops
- Hard cutoff at 15 BPM maintains reasonable matching bounds
- Maintains normalized 0-1 output compatible with existing 45% weight

**Alternatives considered**:
- Exponential decay: Too complex, harder to tune
- Linear with larger tolerance: Doesn't preserve exact match bonus
- Sigmoid curve: Overkill for this use case

### Decision: Pagination Options (10, 20, 30, 50)
**What**: Provide 4 options: 10, 20, 30, 50 items per page

**Why**:
- Covers common use cases (quick scan, detailed view, large datasets)
- Avoids option overload (too many choices)
- 50 is reasonable upper limit for performance

**Alternatives considered**:
- More granular options (15, 25, 35): Too many choices, 25 already exists as default
- Higher limits (100+): Performance concerns, rarely needed

### Decision: Top Matches Grid Layout
**What**: CSS Grid with responsive breakpoints: 2-4 columns on large screens, single column on small

**Why**:
- Grid provides better control than flexbox for card layouts
- Consistent with existing Tailwind breakpoint system
- Maintains readability and touch targets on mobile

**Alternatives considered**:
- Flexbox with wrap: Less predictable column counts
- Fixed columns: Doesn't adapt to screen size

### Decision: Color-Coded Affinity Thresholds
**What**: Green ≥0.85, Yellow/Amber 0.65-0.84, Neutral <0.65

**Why**:
- Clear visual distinction between high/medium/low matches
- WCAG AA compliant color contrast
- Numeric score always visible (not color-only)

**Alternatives considered**:
- More granular bands (5+ colors): Too complex, harder to distinguish
- Binary (good/bad): Loses nuance

## Risks / Trade-offs

**Risk**: BPM curve change may affect existing match rankings
- **Mitigation**: Test with sample datasets, ensure high-scoring matches remain high, only close BPM matches improve

**Risk**: Pagination selector adds UI complexity
- **Mitigation**: Place inline with existing controls, use familiar dropdown pattern, clear labeling

**Risk**: Responsive grid may cause layout shifts
- **Mitigation**: Use CSS Grid with stable breakpoints, test on various screen sizes, ensure smooth transitions

**Risk**: Color-coding may not be accessible for colorblind users
- **Mitigation**: Always show numeric score, use patterns/icons in addition to color, test with accessibility tools

## Migration Plan

1. **Phase 1**: UI Alignment fixes (non-breaking, visual only)
2. **Phase 2**: Top Matches responsiveness and color-coding (non-breaking, visual enhancement)
3. **Phase 3**: Pagination selector (non-breaking, additive feature)
4. **Phase 4**: BPM sensitivity refinement (algorithm change, requires testing)

**Rollback**: All changes are non-breaking except BPM algorithm. If issues arise, can revert BPM changes independently.

## Open Questions

- Should pagination preference persist across browser sessions (localStorage) or only current session?
  - **Decision**: Session-only for now (useState), can add localStorage later if requested

- Should Top Matches grid have a maximum number of visible cards before pagination?
  - **Decision**: Keep existing limit (if any), focus on responsive layout only
