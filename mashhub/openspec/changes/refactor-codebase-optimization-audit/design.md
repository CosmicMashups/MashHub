## Context

MashHub is a client-only React 19 + TypeScript + Vite app backed by Dexie (IndexedDB). All data access, search, and matching logic runs on the main thread. The codebase has grown organically across ~20 in-progress or recently-completed change proposals, resulting in:

- N+1 Dexie query patterns that are O(n) round-trips per render
- A `SearchService` class that constructs a new `Fuse<Song>` instance on every `updateSongs()` call, discarding the index and rebuilding it O(n log n) from scratch
- `getQuickMatches()` in `MatchingService` fetches sections for every candidate song individually inside a for-loop, producing hundreds of IndexedDB cursor operations per call
- `getProjectWithSections()` in `projectService` fetches each song sequentially via `songService.getById()` in a loop
- No `React.memo()` on any component, causing full re-renders of large song lists on every keypress
- CSV parsing and XLSX export block the main thread (ExcelJS generates full workbooks synchronously)
- No Content Security Policy, no CSV injection prevention, no Dexie quota-error handling
- No `aria-label`, `role="dialog"`, focus trapping, or `aria-live` regions
- `tsconfig.json` runs without `strict`, allowing silent `any` and unchecked array access

## Goals / Non-Goals

**Goals:**
- Eliminate all O(n) per-render DB round-trips using batch Dexie queries
- Preserve the Fuse.js index across mutations (incremental add/remove) instead of rebuilding
- Apply TypeScript `strict` mode and fix all resulting errors
- Add `React.memo` to all pure presentational components
- Virtualize the main song list for thousands-of-entries performance
- Offload CSV parsing and XLSX generation to Web Workers
- Add granular `ErrorBoundary` wrappers, CSP meta tag, and CSV injection sanitization
- Achieve WCAG AA accessibility in all interactive UI regions
- Establish a Vitest + Playwright test baseline with >80% coverage of service layer logic

**Non-Goals:**
- Changing the IndexedDB schema version (no migrations)
- Altering exported CSV/XLSX column format
- Changing Fuse.js threshold or match scoring weights
- Replacing Dexie with a different ORM
- Adding backend/server-side logic
- Changing existing drag-drop behavior or keyboard shortcuts

## Decisions

### Decision: Incremental Fuse.js index management

**What**: Replace `this.fuse = new Fuse(songs, fuseOptions)` in `SearchService.updateSongs()` with `fuse.setCollection()` when a full collection update is needed, and `fuse.add()`/`fuse.remove()` for single-song mutations.

**Why**: Rebuilding the index is O(n log n) where n = song count. For 1000+ songs this blocks the main thread for 20–50ms on every import or song edit. `fuse.setCollection()` replaces the internal collection reference; `fuse.add()`/`fuse.remove()` are O(log n).

**Alternatives considered**: Move Fuse.js to a Web Worker — rejected because the index would need to be serialized on every query, adding IPC overhead and complexity. The index fits in main-thread memory and queries are sub-millisecond for <10,000 songs.

### Decision: Batch Dexie queries using `anyOf`

**What**: Replace all per-song `db.songSections.where('songId').equals(id)` calls inside loops with a single `db.songSections.where('songId').anyOf(ids).toArray()` followed by a `Map<songId, SongSection[]>` grouping.

**Why**: Dexie IndexedDB operations have fixed per-call overhead (~1–5ms per cursor open). Fetching 100 songs with per-song section queries = 100 cursor opens ≈ 100–500ms. One `anyOf` batch query = 1 cursor open ≈ 1–5ms.

**Alternatives considered**: Service worker caching of section data — rejected as unnecessarily complex for a client-only app with a clear invalidation model.

### Decision: Web Workers for CSV/XLSX with Comlink

**What**: Move CSV row parsing (both initial `anime.csv` load and user-imported files) and ExcelJS workbook generation into dedicated Web Workers exposed via Comlink.

**Why**: ExcelJS generates XLSX synchronously; for a 500-song export it blocks the main thread for 300–800ms. CSV parsing of a 10k-row file similarly blocks for 50–200ms. Both operations have no DOM dependency and are pure data transformations.

**Alternatives considered**: Using `setTimeout(0)` chunking — rejected as it doesn't truly parallelize and still competes with animation frames.

### Decision: `React.memo` with shallow-equality comparator defaults

**What**: Wrap all pure presentational leaf components in `React.memo()`. For components receiving object/array props (e.g., `song: Song`, `sections: SongSection[]`), use the default shallow comparator since these objects are typically stable references from Dexie queries.

**Why**: React re-renders every child of a parent that re-renders, even if the child's props haven't changed. The song list renders dozens of cards; without memoization, every search keypress re-renders all of them.

**Alternatives considered**: Move to Zustand or Jotai for fine-grained subscription — rejected as overkill; `React.memo` + `useCallback` + `useMemo` covers the need without replacing the state model.

### Decision: `@tanstack/react-virtual` for the song list

**What**: Replace the current flat `map()` render in `SongList.tsx` with `useVirtualizer` from `@tanstack/react-virtual`, rendering only the visible rows plus an overscan buffer.

**Why**: At 1000+ songs, rendering all DOM nodes causes layout thrashing. Virtualizing to ~20 visible rows reduces the DOM size by 98%.

**Alternatives considered**: `react-window` — lighter but lacks dynamic row height support needed for variable-height song cards.

### Decision: Granular `ErrorBoundary` per UI section

**What**: Wrap `<SongList>`, `<EnhancedProjectManager>`, `<AdvancedFiltersDialog>`, and `<SearchResults>` each in their own `<ErrorBoundary>`.

**Why**: A crash in one section should not unmount the entire app. The current single root-level boundary (if any) causes full-app failure on any render error.

### Decision: Content Security Policy via `<meta>` tag

**What**: Add a strict CSP `<meta http-equiv="Content-Security-Policy">` to `index.html` with `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src blob:`.

**Why**: Prevents XSS injection via any future dynamically-inserted content or malicious CSV data. `worker-src blob:` is required because Comlink workers are instantiated from blob URLs.

## Risks / Trade-offs

- **Fuse.js incremental updates** → If `fuse.remove()` is called with an ID that doesn't exist in the collection, Fuse silently does nothing — no error. Mitigation: wrap in a guard that checks `fuse.getIndex().docs` before removal.
- **Web Workers on iOS Safari** → Comlink workers with blob: URLs are supported on iOS 15+ Safari. Mitigation: add a feature-detect fallback that runs the same operation synchronously on main thread if `Worker` is not available.
- **`@tanstack/react-virtual` with DnD** → `@dnd-kit` uses absolute positioning for dragged items; the virtualizer uses transform-based positioning for rows. These must not conflict. Mitigation: disable virtualization during an active drag gesture (track `isDragging` from `useDndMonitor`).
- **TypeScript strict mode** → Enabling `noUncheckedIndexedAccess` will surface array access warnings across the codebase. Mitigation: fix all surfaced errors before merging; never suppress with `// @ts-ignore`.
- **CSP `unsafe-inline` for styles** → Tailwind generates inline styles for some utility classes. `unsafe-inline` is required for styles; this is an acceptable trade-off for a client-only app with no external style injection vector.

## Migration Plan

1. Phase 1 (TypeScript strictness) is purely additive — no runtime behavior changes.
2. Phase 2 (React performance) changes component identity (wrapped in `memo`) but does not change props, output, or behavior.
3. Phase 3 (Service layer) changes internal Dexie query patterns but not the public service API surface.
4. Phase 4 (Build) changes chunk boundaries but not app behavior.
5. Phase 5 (Error, Security, A11y, Testing) are additive.

Each phase can be merged independently. Recommended order: 1 → 3 → 2 → 4 → 5.

## Open Questions

All three questions have been resolved by the project owner:

| Question | Decision | Rationale |
|---|---|---|
| `SearchService` class vs. module singleton | **Convert to module-level singleton** | Eliminates lifecycle management at call sites; simplifies hook usage. Test isolation handled by exporting a `resetSearchService()` helper that re-initializes the singleton with a fresh empty `Fuse` instance. |
| CSV Web Worker scope | **Handle both `anime.csv` seed load AND user imports** | The seed file is a large static asset; offloading its initial parse prevents any startup jank. The same worker code path is reused for user-imported files, reducing duplication. |
| Service layer cache strategy | **Simple `Map`-with-TTL** | No new dependency required; ~50 lines in `src/utils/cache.ts`. Keys are `songId` or `'all-sections'`; TTL is 60 seconds; cache is invalidated explicitly on any write. `react-query`/SWR would add 40KB+ to the bundle with no additional benefit for a client-only, IndexedDB-backed app. |

### Singleton Refactor Detail

```typescript
// src/services/searchService.ts (new shape)
let fuseInstance: Fuse<Song> | null = null;

export function initSearchService(songs: Song[]): void { ... }
export function search(query: string, limit?: number): FuseResult<Song>[] { ... }
export function addSong(song: Song): void { ... }
export function removeSong(id: string): void { ... }
export function updateSongs(songs: Song[]): void { ... } // calls fuse.setCollection()
// Test-only helper:
export function _resetForTesting(): void { fuseInstance = null; }
```

### CSV Worker Scope Detail

The worker (`src/workers/csvParser.worker.ts`) exposes two entry points via Comlink:
- `parseAnimeCSV(url: string): Promise<ParseResult>` — fetches and parses the bundled `anime.csv` asset
- `parseUserCSV(file: File): Promise<ParseResult>` — parses a user-selected file

Both return the same `ParseResult` shape: `{ songs: Song[]; sections: SongSection[]; errors: ParseError[] }`.

### Cache Detail

```typescript
// src/utils/cache.ts
interface CacheEntry<T> { value: T; expiresAt: number; }
const store = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 60_000;

export function cacheGet<T>(key: string): T | undefined { ... }
export function cacheSet<T>(key: string, value: T): void { ... }
export function cacheInvalidate(key: string): void { ... }
export function cacheInvalidatePrefix(prefix: string): void { ... }
```

Cache keys follow the pattern: `sections:${songId}` for per-song sections, `sections:all` for the full sections batch, `parts:unique` for the unique-parts list.
