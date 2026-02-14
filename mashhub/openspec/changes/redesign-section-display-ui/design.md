## Context

MashHub displays songs with section-based musical structure. Each song has multiple sections with PART, BPM, KEY, and SECTION_ORDER. The current UI inconsistently displays this information:
- List views show primary values with "+X more" indicators
- Details modal shows unstructured arrays of keys and BPMs
- Sections are not clearly mapped to their musical properties

Users need:
- Fast scanning in list views (primary values only)
- Detailed structure exploration in modal (full section mapping)
- Performance at scale (10,000+ songs, 60,000+ sections)

## Goals / Non-Goals

### Goals
- Clean, scannable list views with only primaryBpm/primaryKey
- Structured section display in modal showing PART → BPM → KEY relationships
- Lazy-load sections only when modal opens
- Scale to 10,000+ songs without performance degradation
- Maintain visual consistency and accessibility

### Non-Goals
- Inline section expansion in list views
- Pre-loading all sections for list rendering
- Complex section editing in modal (deferred to SongModal)
- Section-level filtering in list view (song-level only)

## Decisions

### Decision 1: List View Display Strategy

**Decision**: Display only primaryBpm and primaryKey with visual enhancements (badges, color coding)

**Rationale**:
- List views are for scanning and filtering, not detailed analysis
- Dense harmonic breakdowns harm readability
- DJs need rapid identification of usable songs
- Detail exploration belongs in drill-down interfaces (modal)
- Reduces cognitive load and improves performance

**Visual Enhancements**:
- Compact harmonic badges for primaryKey and primaryBpm
- Subtle color coding for keys (harmonic palette)
- Aligned BPM and Key for rapid comparison
- Consistent badge height and spacing
- Subtle hover elevation and micro-interactions

### Decision 2: Modal Section Display Layout

**Decision**: Use structured table layout with SECTION_ORDER | PART | BPM | KEY columns

**Rationale**:
- Table layout preserves order and structure clearly
- Easy to scan and compare sections
- Maintains visual hierarchy
- Responsive with horizontal scroll on mobile
- Prevents misinterpretation of harmonic states

**Alternatives considered**:
- Vertical timeline: Rejected - takes too much vertical space
- Section cards: Rejected - harder to compare across sections
- Expandable accordion: Considered but rejected - adds unnecessary interaction

### Decision 3: Data Fetching Strategy

**Decision**: Lazy-load sections only when modal opens, using indexed Dexie query

**Rationale**:
- Prevents N+1 queries during list rendering
- Reduces initial load time
- Sections are only needed when user drills down
- Indexed lookup by songId is fast (O(log n))
- Modal opening is explicit user intent to see details

**Implementation**:
- Create `useSections(songId)` hook that fetches on demand
- Use `db.songSections.where('songId').equals(songId).sortBy('sectionOrder')`
- Cache sections in component state while modal is open
- Clear cache when modal closes

### Decision 4: Component Architecture

**Decision**: Create separate SectionStructure component with clear separation of concerns

**Rationale**:
- Separation of concerns: list vs detail vs structure
- Reusable component for section display
- Easier to test and maintain
- Modal receives songId, SectionStructure fetches independently
- List remains decoupled from section logic

**Component Hierarchy**:
```
SongList (displays primary values only)
  └─ SongListItem (minimal display)

SongDetailsModal (receives songId)
  └─ SectionStructure (fetches and displays sections)
      └─ SectionRow (individual section display)
```

### Decision 5: Performance Scaling Strategy

**Decision**: Virtualization on list view only, modal-level fetching with indexed lookups

**Rationale**:
- List view renders 10,000+ songs → needs virtualization
- Modal shows one song's sections → no virtualization needed
- Indexed lookup by songId is O(log n) → fast even with 60,000+ sections
- Sections fetched on-demand → no unnecessary data loading
- Cached in component state → no re-fetching during modal session

## Risks / Trade-offs

### Risk 1: Modal Opening Delay
**Mitigation**: 
- Show loading state in modal while fetching
- Indexed query is fast (<50ms for typical song)
- Consider optimistic rendering with skeleton

### Risk 2: Section Structure Complexity
**Mitigation**:
- Clear visual hierarchy in table layout
- Consistent spacing and alignment
- Responsive design for mobile

### Risk 3: Accessibility for Complex Structure
**Mitigation**:
- Proper ARIA labels for table structure
- Screen reader announcements for section changes
- Keyboard navigation support
- High contrast for badges

## Migration Plan

### Phase 1: Create SectionStructure Component
- Create new component with table layout
- Implement lazy-loading hook
- Add loading and error states

### Phase 2: Redesign SongDetailsModal
- Integrate SectionStructure component
- Remove unstructured array display
- Add smooth animations

### Phase 3: Enhance List Views
- Improve visual design of primary values
- Add color coding for keys
- Enhance badges and spacing

### Phase 4: Accessibility & Performance
- Add ARIA labels
- Implement keyboard navigation
- Test with screen readers
- Performance testing with large datasets

## Open Questions

- Should section structure be collapsible? (Decision: No, always visible when modal opens)
- Should we highlight matching sections from search? (Decision: Deferred - can add later)
- Should sections be sortable? (Decision: No, preserve SECTION_ORDER)
