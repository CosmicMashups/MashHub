## Phase 1 — TypeScript Strictness

- [ ] 1.1 Enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `forceConsistentCasingInFileNames` in `tsconfig.json`
- [ ] 1.2 Run `tsc --noEmit` and capture all newly-surfaced errors
- [ ] 1.3 Replace every `any` in `src/services/database.ts` with explicit types or generics
- [ ] 1.4 Replace every `any` in `src/services/matchingService.ts`, `searchService.ts`, `exportService.ts`, `fileService.ts`
- [ ] 1.5 Replace every `any` in all `src/components/*.tsx` files
- [ ] 1.6 Add explicit Dexie table generics: `Table<Song, string>`, `Table<SongSection, string>`, `Table<Project, string>`, `Table<ProjectEntry, string>`, `Table<SpotifyMapping, string>` in `database.ts`
- [ ] 1.7 Create `/src/constants/index.ts` with all magic numbers: Fuse threshold, BPM weights, tolerance defaults, section base names, loading timeout
- [ ] 1.8 Add `MatchCriteria`, `MatchResult`, `SearchResult` to `/src/types/index.ts`; mark array fields `readonly` on data flowing out of services
- [ ] 1.9 Fix all `noImplicitReturns` errors in switch/if chains in `matchingService.ts` and `filterService`
- [ ] 1.10 Validate: run `tsc --noEmit` with zero errors

## Phase 2 — Service Layer Optimization

- [ ] 2.1 Create `SectionRepository` in `src/services/sectionRepository.ts` with `getForSongs(ids: string[]): Promise<Map<string, SongSection[]>>` using `anyOf` batch query
- [ ] 2.2 Refactor `songService.getAll()` to use `SectionRepository.getForSongs()` instead of `Promise.all(songs.map(enrichSongWithSections))` (eliminates N+1)
- [ ] 2.3 Refactor `songService.getPaginated()` to use batch section fetching
- [ ] 2.4 Refactor `MatchingService.getQuickMatches()` to batch-load all candidate sections once before the scoring loop
- [ ] 2.5 Refactor `projectService.getProjectWithSections()` to batch-load songs with `db.songs.where('id').anyOf(songIds).toArray()` instead of per-entry `getById()` calls
- [ ] 2.6 Wrap `songService.clearAll()` in `db.transaction('rw', [db.songs, db.songSections], ...)` for atomicity
- [ ] 2.7 Wrap `songService.delete()` in `db.transaction('rw', [db.songs, db.songSections], ...)` for atomicity
- [ ] 2.8 Wrap `projectService.delete()` in `db.transaction('rw', [db.projects, db.projectEntries], ...)` for atomicity
- [ ] 2.9 Add `cleanOrphanedSections()` to `sectionService`: deletes `songSections` rows whose `songId` has no match in `songs`; call it in a non-blocking `setTimeout` on app init
- [ ] 2.10 Convert `SearchService` from a class to a **module-level singleton** in `src/services/searchService.ts`:
  - Replace class with exported functions: `initSearchService`, `search`, `addSong`, `removeSong`, `updateSongs`
  - Export `_resetForTesting()` helper that sets `fuseInstance = null` for Vitest test isolation
  - Update all call sites (hooks, `App.tsx`, `useSongs.ts`) to use the flat function imports
- [ ] 2.11 Replace `SearchService.updateSongs()` body to call `fuse.setCollection(songs)` (full collection replace on import) rather than constructing a `new Fuse` instance
- [ ] 2.12 Implement `addSong(song: Song)` using `fuseInstance.add(song)` and `removeSong(id: string)` using `fuseInstance.remove(doc => doc.id === id)` for single-song incremental updates
- [ ] 2.13 Remove all `console.log` statements from `searchService.ts` (production noise at lines 28, 30, 42, 44)
- [ ] 2.14 Create `src/utils/cache.ts` — simple `Map`-with-60s-TTL cache with `cacheGet`, `cacheSet`, `cacheInvalidate`, `cacheInvalidatePrefix`; use cache keys `sections:${songId}`, `sections:all`, `parts:unique`
- [ ] 2.15 Integrate `cache.ts` into `SectionRepository`: populate `sections:${songId}` on batch-load; call `cacheInvalidatePrefix('sections:')` on any section write or song delete
- [ ] 2.16 Create `src/workers/csvParser.worker.ts` with Comlink exposure of two functions:
  - `parseAnimeCSV(url: string): Promise<ParseResult>` — fetches and parses the bundled `anime.csv` seed file
  - `parseUserCSV(file: File): Promise<ParseResult>` — parses a user-selected import file
  - Both return `{ songs: Song[]; sections: SongSection[]; errors: ParseError[] }`
- [ ] 2.17 Update `src/data/animeDataLoader.ts` to use `parseAnimeCSV` via the Comlink worker instead of synchronous CSV parsing; show a loading spinner during the initial seed parse
- [ ] 2.18 Update `ImportExportModal` / `fileService.ts` to delegate CSV parsing to `parseUserCSV` via the worker; surface `errors` array to the new import error summary modal (Phase 5)
- [ ] 2.19 Pre-compute semitone distance lookup map (12×12 = 144 pairs) in `keyNormalization.ts` and use it in `calculateKeyDistance`
- [ ] 2.20 Validate: run the app and verify song list loads in <500ms for 1000 songs (measure with DevTools Performance tab)

## Phase 3 — React Performance

- [ ] 3.1 Wrap `SongCard` in `React.memo()`
- [ ] 3.2 Wrap `SongList` list-item render in `React.memo()`
- [ ] 3.3 Wrap `SearchSuggestions` and `SearchSuggestionItem` in `React.memo()`
- [ ] 3.4 Wrap `FilterTag` in `React.memo()`
- [ ] 3.5 Audit `App.tsx` for state held too high; move filter dialog open/close state into `AdvancedFiltersDialog` own state
- [ ] 3.6 Audit all `useEffect` dependency arrays in `src/hooks/` — fix missing dependencies and add cleanup returns
- [ ] 3.7 Add `useCallback` wrappers to all event-handler props passed into `SongCard`, `SongList`, `ProjectSection`
- [ ] 3.8 Install `@tanstack/react-virtual`; implement `useVirtualizer` in `SongList.tsx` for the main song list
- [ ] 3.9 Ensure virtualized list preserves: search highlight, filter interactions, drag-handle activation, song details modal trigger
- [ ] 3.10 Disable virtualizer during active DnD (`useDndMonitor` `isDragging` guard)
- [ ] 3.11 Wrap `ImportExportModal`, `EnhancedExportModal`, `AdvancedFiltersDialog`, `EnhancedProjectManager` with `React.lazy()` and `<Suspense fallback={<SkeletonLoader />}>`
- [ ] 3.12 Add a `useDebounce` hook in `src/hooks/useDebounce.ts` if not present; confirm search input uses ≥300ms debounce
- [ ] 3.13 Remove inline object/array/function props from JSX in `App.tsx` and `SongList.tsx`; move to `useMemo`/`useCallback`
- [ ] 3.14 Validate: search input re-render count ≤1 per 300ms debounce window (measure with React DevTools Profiler)

## Phase 4 — Build Optimization

- [ ] 4.1 Add `manualChunks` to `vite.config.ts` splitting: `vendor-react`, `vendor-dexie`, `vendor-fuse`, `vendor-exceljs`, `vendor-dnd`, `vendor-motion`, `vendor-lucide`
- [ ] 4.2 Enable `build.cssCodeSplit: true`, `build.minify: 'esbuild'`, `build.sourcemap: false` (production)
- [ ] 4.3 Add `optimizeDeps.include: ['dexie']` to `vite.config.ts`
- [ ] 4.4 Install and configure `vite-plugin-compression` for `.gz` + `.br` output
- [ ] 4.5 Install and configure `vite-plugin-pwa`: `StaleWhileRevalidate` for CSV assets, `CacheFirst` for static assets; generate `manifest.webmanifest`
- [ ] 4.6 Run `npx vite-bundle-visualizer` and record top-5 chunk sizes in `PERFORMANCE_BASELINE.md`
- [ ] 4.7 Validate: `npm run build` succeeds with zero errors; bundle report shows no chunk >500KB (uncompressed)

## Phase 5 — Error Resilience

- [ ] 5.1 Add `<ErrorBoundary>` wrappers (with distinct `fallback` UI) around `<SongList>`, `<EnhancedProjectManager>`, `<AdvancedFiltersDialog>`, `<SearchResults>` in `App.tsx`
- [ ] 5.2 Catch `QuotaExceededError` in all Dexie write operations; display storage-warning toast with "Clear database" recovery action
- [ ] 5.3 Catch Dexie `VersionError` / `InvalidStateError` on `db.open()`; display a "Reload to upgrade database" modal
- [ ] 5.4 Accumulate per-row CSV validation errors during import; display "Imported N songs, K rows skipped — View errors" summary modal with a downloadable error log
- [ ] 5.5 Validate: force a `QuotaExceededError` in DevTools (Storage > simulate quota) and confirm the warning toast appears

## Phase 6 — Security Hardening

- [ ] 6.1 Add `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src blob:;">` to `index.html`
- [ ] 6.2 In `exportService.ts`, sanitize all CSV cell values starting with `=`, `+`, `-`, `@` by prepending a tab character
- [ ] 6.3 Add a Dexie `ready()` handler that verifies all expected tables (`songs`, `songSections`, `projects`, `projectEntries`, `spotifyMappings`) exist; log a warning if any are missing
- [ ] 6.4 Validate: export a CSV with a cell starting with `=SUM(...)` and confirm it is sanitized when opened in Excel/LibreOffice

## Phase 7 — Accessibility

- [ ] 7.1 Add `aria-label` to all icon-only buttons (theme toggle, close modal, drag handle, delete song)
- [ ] 7.2 Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` to all modal components (`SongDetailsModal`, `ImportExportModal`, `EnhancedExportModal`, `AdvancedFiltersDialog`, `AddToProjectModal`)
- [ ] 7.3 Implement focus trapping in all modals (on open: move focus to first interactive element; on close: restore focus to trigger element)
- [ ] 7.4 Add `role="list"` to song list containers and `role="listitem"` to each song card
- [ ] 7.5 Add `aria-live="polite"` region to announce search result count changes ("N songs found")
- [ ] 7.6 Implement arrow-key navigation + `Escape` dismissal for `SearchSuggestions` dropdown
- [ ] 7.7 Wrap filter checkboxes and radio groups in `<fieldset>` + `<legend>` in `FilterPanel` and `AdvancedFiltersDialog`
- [ ] 7.8 Audit text/background color contrast in Tailwind config for light and dark modes; fix any combination failing WCAG AA (4.5:1 normal text, 3:1 large text)
- [ ] 7.9 Validate: run `axe-core` accessibility scan on the rendered app; zero critical violations

## Phase 8 — Testing Coverage

- [ ] 8.1 Write Vitest unit tests for `SearchService`: fuzzy match with typos, empty query, single character, long strings, result limit
- [ ] 8.2 Write Vitest unit tests for `MatchingService.findMatches()`: BPM range filter, key filter, year filter, text search, part-specific filters
- [ ] 8.3 Write Vitest unit tests for `MatchingService.getQuickMatches()`: harmonic BPM detection, part-specific key scoring, no-sections fallback
- [ ] 8.4 Write Vitest unit tests for `normalizeSectionName()`: all known part variants → canonical base name
- [ ] 8.5 Write Vitest unit tests for CSV/XLSX import round-trip: parse → validate → export produces identical column values
- [ ] 8.6 Write Dexie integration test: create song → add sections → update song → delete song → verify sections cleaned up
- [ ] 8.7 Write Dexie integration test: import CSV → verify song count, section count, and first-song data
- [ ] 8.8 Write Playwright E2E: import `songs.csv` + `song_sections.csv` and verify UI song count matches
- [ ] 8.9 Write Playwright E2E: search with deliberate typo; verify target song appears in results
- [ ] 8.10 Write Playwright E2E: add song to project, drag to reorder, reload, verify persisted order
- [ ] 8.11 Write Playwright E2E: export project to XLSX; verify file download without browser error
- [ ] 8.12 Write Playwright E2E: toggle dark/light theme; reload page; verify theme persists
- [ ] 8.13 Validate: `npx vitest run` passes all unit + integration tests; `npx playwright test` passes all E2E tests

## Phase 9 — Code Quality & Dead Code

- [ ] 9.1 Configure ESLint with `react-hooks/exhaustive-deps: error`, `@typescript-eslint/no-explicit-any: error`, `no-console: warn`, `import/no-circular: error`
- [ ] 9.2 Run `npx ts-prune` or ESLint `no-unused-vars` and remove all unreferenced exports
- [ ] 9.3 Ensure each feature folder (`components`, `services`, `hooks`, `utils`) has an `index.ts` barrel re-exporting its public API
- [ ] 9.4 Remove all legacy CSV format code if the system has fully migrated to two-file format; or gate it behind a `LEGACY_CSV` feature flag constant
- [ ] 9.5 Validate: `npx eslint src --max-warnings 0` passes with zero errors
