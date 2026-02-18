## ADDED Requirements

### Requirement: Batch Section Queries to Eliminate N+1 Patterns
All service functions that fetch sections for multiple songs SHALL use a single `anyOf` batch query rather than issuing one query per song.

#### Scenario: getAll uses one section query
- **WHEN** `songService.getAll()` is called with 500 songs in the database
- **THEN** exactly one `db.songSections` query is issued (not 500), retrievable via IndexedDB DevTools trace showing one `objectStore.openCursor` call with an `anyOf` key range

#### Scenario: getQuickMatches uses batch section loading
- **WHEN** `MatchingService.getQuickMatches()` is called with 200 candidate songs
- **THEN** all 200 candidate songs' sections are loaded in one batch query before the scoring loop begins

#### Scenario: getProjectWithSections uses batch song loading
- **WHEN** `projectService.getProjectWithSections()` is called for a project with 50 entries
- **THEN** all 50 songs are loaded in one `db.songs.where('id').anyOf(songIds)` query instead of 50 individual `getById` calls

### Requirement: SearchService Module Singleton with Incremental Fuse.js Index
`SearchService` SHALL be implemented as a module-level singleton (not a class) with exported functions. The Fuse.js index SHALL be created once and updated incrementally: `setCollection()` for full collection replacement on import, `add()` for individual song additions, and `remove()` for individual deletions.

#### Scenario: Singleton is initialized once per session
- **WHEN** `initSearchService(songs)` is called for the first time
- **THEN** a single `Fuse<Song>` instance is created and stored in the module scope; subsequent calls to `search()` use the same instance without constructing a new one

#### Scenario: Index survives single song addition without rebuild
- **WHEN** a new song is added to the database and `addSong(song)` is called
- **THEN** the Fuse index contains the new song, and no new `Fuse` constructor call occurs (verified by no O(n) re-indexing)

#### Scenario: Index is updated via setCollection on full import
- **WHEN** a CSV import replaces all songs and `updateSongs(songs)` is called
- **THEN** `fuseInstance.setCollection(songs)` is called exactly once instead of constructing a new `Fuse` instance

#### Scenario: No console.log in production search path
- **WHEN** a search query is executed in a production build
- **THEN** no `console.log` output appears in the browser console from `searchService.ts`

#### Scenario: Test isolation via reset helper
- **WHEN** `_resetForTesting()` is called in a Vitest test's `beforeEach`
- **THEN** the module-level `fuseInstance` is set to `null`, ensuring the next `initSearchService()` call creates a fresh instance with no cross-test contamination

### Requirement: Simple Map-with-TTL Service Layer Cache
A lightweight in-memory cache (`src/utils/cache.ts`) with a 60-second TTL SHALL be used to avoid redundant Dexie queries for frequently-read, rarely-mutated data (section lists, unique parts). The cache SHALL be explicitly invalidated on any write operation.

#### Scenario: Repeated section reads hit cache
- **WHEN** `SectionRepository.getForSongs(ids)` is called twice within 60 seconds with the same IDs and no writes occur between calls
- **THEN** the second call returns the cached result without issuing a Dexie query

#### Scenario: Cache is invalidated on section write
- **WHEN** a section is added, updated, or deleted
- **THEN** `cacheInvalidatePrefix('sections:')` is called, and the next `getForSongs()` call re-fetches from Dexie

#### Scenario: Cache entries expire after TTL
- **WHEN** a cached section entry is read more than 60 seconds after it was set
- **THEN** `cacheGet()` returns `undefined` and the caller re-fetches from Dexie

### Requirement: CSV Web Worker Handles Both Seed and User Import Parsing
The `src/workers/csvParser.worker.ts` Comlink worker SHALL handle both the initial `anime.csv` seed file parse (via URL) and user-imported CSV files (via `File` object), returning a consistent `ParseResult` shape for both. The main thread SHALL remain unblocked during all CSV parsing.

#### Scenario: anime.csv seed parses off main thread
- **WHEN** the application initializes and the anime.csv seed file needs to be loaded
- **THEN** `parseAnimeCSV(url)` is called on the worker; the main thread remains responsive and shows a loading indicator while parsing proceeds

#### Scenario: User import parses off main thread
- **WHEN** a user selects a CSV file to import
- **THEN** `parseUserCSV(file)` is called on the worker; the UI does not freeze during parsing of large files

#### Scenario: ParseResult errors surface for display
- **WHEN** the worker finishes parsing a CSV with malformed rows
- **THEN** the returned `ParseResult.errors` array contains one entry per skipped row with the row number and reason, usable by the import error summary modal

### Requirement: Transactional Multi-Table Writes
All service operations that write to multiple Dexie tables SHALL be wrapped in a `db.transaction('rw', [...tables], ...)` call to guarantee atomicity.

#### Scenario: Song deletion is atomic
- **WHEN** `songService.delete(id)` is called and the browser tab is closed mid-operation
- **THEN** either both the `songs` row and its `songSections` rows are deleted, or neither is, with no orphaned section records

#### Scenario: Import clear is atomic
- **WHEN** `songService.clearAll()` is called
- **THEN** both `songs` and `songSections` tables are cleared within a single transaction

### Requirement: Orphaned Section Cleanup
The system SHALL provide a `cleanOrphanedSections()` function that deletes `songSections` rows whose `songId` does not reference any existing `songs` row, without blocking the UI.

#### Scenario: Orphans created by partial failure are removed
- **WHEN** `cleanOrphanedSections()` is called and there are 3 orphaned section rows in the database
- **THEN** all 3 rows are deleted and the function resolves without throwing

#### Scenario: Cleanup runs non-blocking on startup
- **WHEN** the application initializes
- **THEN** `cleanOrphanedSections()` is scheduled via `setTimeout(fn, 0)` so it runs after the initial render

### Requirement: Pre-Computed Key Distance Lookup
The circular semitone distance between any two musical keys SHALL be pre-computed into a frozen lookup map at module initialization, not recalculated on every scoring call.

#### Scenario: Key distance lookup is O(1)
- **WHEN** `calculateKeyDistance('C Major', 'G Major')` is called
- **THEN** the result is retrieved from a pre-initialized `Map<string, Map<string, number>>` with no `Math` operations at call time

#### Scenario: Lookup covers all 144 pairs
- **WHEN** the key distance lookup map is initialized
- **THEN** it contains entries for all combinations of the 12 supported key names × 12 key names = 144 pairs
