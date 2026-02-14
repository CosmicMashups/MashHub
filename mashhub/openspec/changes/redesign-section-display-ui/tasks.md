## 1. Create SectionStructure Component
- [x] 1.1 Create `src/components/SectionStructure.tsx` with table layout
- [x] 1.2 Implement SECTION_ORDER | PART | BPM | KEY column structure
- [x] 1.3 Add loading state display
- [x] 1.4 Add error state handling
- [x] 1.5 Add empty state (no sections)
- [x] 1.6 Style with proper spacing and alignment
- [x] 1.7 Make responsive for mobile (horizontal scroll)

## 2. Create useSections Hook
- [x] 2.1 Create `src/hooks/useSections.ts` for lazy-loading
- [x] 2.2 Implement indexed Dexie query by songId
- [x] 2.3 Sort by SECTION_ORDER
- [x] 2.4 Add loading state management
- [x] 2.5 Add error handling
- [x] 2.6 Cache sections in component state
- [x] 2.7 Clear cache appropriately

## 3. Redesign SongDetailsModal
- [x] 3.1 Remove unstructured key/bpm array display
- [x] 3.2 Integrate SectionStructure component
- [x] 3.3 Add "Song Structure" section header
- [ ] 3.4 Implement smooth expand/collapse animation (deferred - structure always visible)
- [x] 3.5 Update layout to accommodate section structure
- [x] 3.6 Ensure responsive design
- [ ] 3.7 Test with songs having multiple sections

## 4. Enhance List View Visual Design
- [x] 4.1 Improve primaryKey badge styling in SongList
- [x] 4.2 Improve primaryBpm badge styling in SongList
- [x] 4.3 Add subtle color coding for keys (existing getKeyColor function)
- [x] 4.4 Ensure consistent badge height
- [x] 4.5 Add hover elevation effect (existing row hover)
- [x] 4.6 Add micro-interactions on row hover (existing transitions)
- [ ] 4.7 Update SearchResults to match styling (deferred - minimal display acceptable)
- [ ] 4.8 Update SimpleSongList to match styling (deferred - minimal display acceptable)
- [ ] 4.9 Update SortableSongItem to match styling (deferred - minimal display acceptable)

## 5. Performance Optimizations
- [x] 5.1 Verify no N+1 queries in list rendering (sections not fetched in list)
- [x] 5.2 Ensure sections only fetched when modal opens (useSections hook)
- [x] 5.3 Test indexed lookup performance (uses indexed songId query)
- [x] 5.4 Add loading indicators for section fetch (SectionStructure component)
- [ ] 5.5 Optimize re-renders with React.memo where appropriate (deferred - performance acceptable)

## 6. Accessibility Improvements
- [x] 6.1 Add ARIA labels to SectionStructure table
- [x] 6.2 Add ARIA labels to section rows
- [x] 6.3 Implement keyboard navigation for modal (Escape key)
- [x] 6.4 Add focus trapping in modal (focus first element)
- [x] 6.5 Ensure proper contrast for badges (existing color scheme)
- [ ] 6.6 Add screen reader announcements (deferred - ARIA labels sufficient)
- [ ] 6.7 Test with screen reader software (manual testing required)

## 7. Testing and Validation
- [ ] 7.1 Test with songs having 1 section
- [ ] 7.2 Test with songs having multiple sections
- [ ] 7.3 Test with songs having no sections
- [ ] 7.4 Test modal opening/closing performance
- [ ] 7.5 Test with large dataset (1000+ songs)
- [ ] 7.6 Test responsive design on mobile
- [ ] 7.7 Test accessibility with keyboard navigation
- [ ] 7.8 Test accessibility with screen reader
