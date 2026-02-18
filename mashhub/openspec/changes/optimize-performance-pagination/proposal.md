## Why

MashHub currently experiences performance issues and UI lag when handling large datasets. All song and project views display all items at once, causing slow rendering, memory issues, and poor user experience with libraries containing thousands of songs. Search, filter, and bulk operations also suffer from performance degradation as dataset size increases. This optimization change addresses these issues by implementing pagination, optimizing database queries, improving search performance, and enhancing UI responsiveness.

## What Changes

- **Pagination Implementation**: Limit all song/project list views to 25 items per page with fast page transitions
- **Database Optimization**: Add missing IndexedDB indexes, implement compound indexing strategies, and lazy-load non-visible records
- **Search & Filter Optimization**: Optimize Fuse.js integration with debouncing, limit search results to 25 per page, and improve multi-field weighted searches
- **UI Performance Optimization**: Implement React.memo for expensive components, introduce virtual scrolling for long lists, optimize animations, and ensure drag-and-drop scales efficiently
- **Bulk Operations Optimization**: Optimize CSV/XLSX import/export with batched database writes and progress feedback
- **UX Improvements**: Smooth theme transitions, lazy-load modals, and persist filter/search/sort state across pagination

## Impact

- Affected specs: ui-components, data-loading, search-filter, database-schema
- Affected code:
  - `src/components/SongList.tsx` - Add pagination and React.memo
  - `src/components/SearchResults.tsx` - Add pagination and limit results
  - `src/components/EnhancedProjectManager.tsx` - Add pagination for project songs
  - `src/services/database.ts` - Add indexes and optimize queries
  - `src/services/searchService.ts` - Add debouncing and result limiting
  - `src/hooks/useSongs.ts` - Implement lazy loading
  - All import/export components - Optimize bulk operations
