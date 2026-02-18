## Context

MashHub is experiencing performance degradation as the dataset grows. With libraries containing 1,000+ songs, the application becomes slow and unresponsive. All list views render all items at once, causing:
- Slow initial load times
- High memory usage
- UI lag during scrolling
- Poor search/filter performance
- Slow bulk operations

This change implements comprehensive performance optimizations focusing on pagination, database indexing, search optimization, and UI improvements.

## Goals / Non-Goals

### Goals
- Limit all list views to 25 items per page with smooth pagination
- Eliminate UI lag and improve responsiveness
- Optimize database queries with proper indexing
- Improve search and filter performance with debouncing
- Optimize bulk operations with batched writes
- Maintain full functionality while improving performance

### Non-Goals
- Changing the data model or schema structure
- Adding new features unrelated to performance
- Breaking existing functionality
- Requiring new major dependencies (prefer lightweight solutions)

## Decisions

### Decision 1: Pagination Page Size
**Decision**: 25 items per page for all list views

**Rationale**:
- 25 items provides good balance between performance and usability
- Small enough to render quickly, large enough to be useful
- Consistent across all views for predictable UX
- Standard page size used in many applications

**Alternatives considered**:
- 50 items: Rejected - too many DOM nodes, slower rendering
- 10 items: Rejected - too many page transitions, poor UX
- User-configurable: Considered but rejected - adds complexity, 25 is optimal

### Decision 2: Pagination Component Architecture
**Decision**: Create reusable Pagination component with props for current page, total items, items per page, and onChange handler

**Rationale**:
- DRY principle - single component for all pagination needs
- Consistent UI/UX across all list views
- Easy to maintain and update
- Supports future enhancements (items per page selector, etc.)

**Implementation**:
```typescript
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}
```

### Decision 3: Database Indexing Strategy
**Decision**: Add compound indexes for common query patterns: [title+artist], [artist+type], [songId+bpm], [songId+key]

**Rationale**:
- Compound indexes optimize multi-field queries
- Reduces query time from O(n) to O(log n)
- Essential for filtering and searching performance
- IndexedDB supports compound indexes efficiently

**Indexes to add**:
- `[title+artist]` - For title+artist searches
- `[artist+type]` - For artist+type filtering
- `[songId+bpm]` - Already exists, verify usage
- `[songId+key]` - Already exists, verify usage
- `[year+season]` - Already exists, verify usage

### Decision 4: Search Debouncing Strategy
**Decision**: 300ms debounce delay for all real-time search inputs

**Rationale**:
- 300ms is optimal balance between responsiveness and performance
- Prevents excessive Fuse.js searches while typing
- Reduces database queries and UI updates
- Standard debounce delay used in many applications

**Alternatives considered**:
- 100ms: Rejected - too frequent, still causes lag
- 500ms: Considered but rejected - feels sluggish
- No debounce: Rejected - causes performance issues

### Decision 5: Virtual Scrolling Strategy
**Decision**: Implement virtual scrolling for SongList using react-window (lightweight, no major dependency concerns)

**Rationale**:
- Only renders visible items, dramatically improves performance
- Reduces DOM nodes from thousands to ~25-50
- Smooth scrolling even with 10,000+ items
- react-window is lightweight and well-maintained

**Alternatives considered**:
- react-virtualized: Rejected - larger bundle size
- Custom implementation: Rejected - reinventing the wheel
- No virtual scrolling: Rejected - doesn't solve the problem

### Decision 6: Bulk Operation Batching Strategy
**Decision**: Batch database writes in chunks of 100 items with progress feedback

**Rationale**:
- Prevents blocking main thread
- Provides user feedback during long operations
- Allows browser to remain responsive
- 100 items is optimal batch size for IndexedDB

**Implementation**:
- Use `requestIdleCallback` or `setTimeout` between batches
- Update progress bar after each batch
- Allow cancellation if needed

### Decision 7: State Persistence Strategy
**Decision**: Persist filter, search, and sort state across pagination, reset pagination to page 1 when filters/search change

**Rationale**:
- Better UX - users don't lose their filter/search context
- Prevents confusion when pagination resets unexpectedly
- Standard behavior in most applications
- Reset to page 1 ensures results are consistent with new filters

## Risks / Trade-offs

### Risk 1: Pagination Adds Complexity
**Mitigation**: Use reusable Pagination component, keep implementation simple, thorough testing

### Risk 2: Virtual Scrolling Compatibility
**Mitigation**: Test with drag-and-drop, ensure @dnd-kit works with react-window, fallback to regular pagination if issues

### Risk 3: Database Migration Issues
**Mitigation**: Proper versioning, test migrations thoroughly, provide rollback strategy

### Risk 4: Performance Regression
**Mitigation**: Benchmark before/after, monitor performance metrics, test with large datasets

### Trade-off: Pagination vs Infinite Scroll
**Decision**: Pagination chosen over infinite scroll for better control, predictable performance, and easier state management

## Migration Plan

1. **Phase 1: Database Optimization**
   - Add new indexes in database version migration
   - Test query performance improvements
   - Verify no breaking changes

2. **Phase 2: Pagination Implementation**
   - Create Pagination component
   - Add pagination to SongList
   - Add pagination to SearchResults
   - Add pagination to project views

3. **Phase 3: Search & Filter Optimization**
   - Add debouncing to search inputs
   - Limit search results
   - Optimize Fuse.js usage

4. **Phase 4: UI Performance**
   - Implement React.memo
   - Add virtual scrolling
   - Optimize animations

5. **Phase 5: Bulk Operations**
   - Optimize import/export
   - Add progress feedback
   - Test with large datasets

6. **Phase 6: Testing & Validation**
   - Comprehensive testing
   - Performance benchmarking
   - User acceptance testing

## Open Questions

- Should pagination page size be user-configurable? (Decision: No, 25 is optimal)
- Should we implement infinite scroll as alternative? (Decision: No, pagination is better)
- Should we cache paginated results? (Decision: No, keep it simple, database is fast enough)
