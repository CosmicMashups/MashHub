## Why

The current UI components display multiple keys and BPMs inconsistently across different views. List views show primary values with "+X more" indicators, while the details modal shows unstructured arrays. This creates cognitive load and fails to communicate the section-based musical structure (PART → BPM → KEY relationships). A redesign is needed to maintain clean, scannable list views while providing structured section-level detail in the modal.

## What Changes

- **List views remain minimal**: Display only primaryBpm and primaryKey with visual enhancements (badges, color coding)
- **Song Details Modal redesigned**: Show structured section mapping (SECTION_ORDER | PART | BPM | KEY) in a clear, ordered layout
- **Lazy-loading sections**: Fetch sections only when modal opens, not during list rendering
- **New SectionStructure component**: Dedicated component for displaying section data with proper structure
- **Performance optimizations**: Prevent N+1 queries, use indexed lookups, scale to 10,000+ songs
- **Accessibility improvements**: Keyboard navigation, ARIA labels, focus trapping, screen reader support

## Impact

- Affected specs: ui-components
- Affected code:
  - `src/components/SongList.tsx` - Visual enhancements for primary values
  - `src/components/SongDetailsModal.tsx` - Complete redesign with section structure
  - `src/components/SectionStructure.tsx` - New component (to be created)
  - `src/hooks/useSections.ts` - New hook for lazy-loading sections (to be created)
  - All other list view components (SearchResults, SimpleSongList, etc.) - Keep minimal display
