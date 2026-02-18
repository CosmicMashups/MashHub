## ADDED Requirements

### Requirement: SearchService Unit Test Coverage
`SearchService` SHALL have Vitest unit tests covering: fuzzy match with deliberate typos, exact match, empty query, single-character query, very long query string, and result limit enforcement.

#### Scenario: Fuzzy match with typo returns target song
- **WHEN** `searchService.search("angel beatz")` is called with a song titled "Angel Beats! OP" in the index
- **THEN** "Angel Beats! OP" appears in the results (Fuse.js threshold 0.6 permits single-character transpositions)

#### Scenario: Empty query returns no results
- **WHEN** `searchService.search("")` is called
- **THEN** the result array is empty

#### Scenario: Result limit is respected
- **WHEN** `searchService.search("a", 5)` is called with 100 songs in the index containing the letter "a"
- **THEN** exactly 5 results are returned

### Requirement: MatchingService Unit Test Coverage
`MatchingService.findMatches()` and `MatchingService.getQuickMatches()` SHALL have Vitest unit tests covering BPM range filtering, key filtering, year range filtering, text search filtering, part-specific filters, harmonic BPM detection, and no-sections fallback.

#### Scenario: BPM range filter excludes out-of-range songs
- **WHEN** `findMatches(songs, { bpmRange: [120, 130] })` is called
- **THEN** all returned songs have at least one section BPM between 120 and 130 inclusive

#### Scenario: No-sections fallback triggers harmonic matching
- **WHEN** `getQuickMatches(songs, targetSong)` is called and `targetSong` has no sections
- **THEN** the function falls back to `findHarmonicMatches` and returns results based on `bpms` and `keys` arrays

### Requirement: Section Normalization Unit Test Coverage
`normalizeSectionName()` SHALL have Vitest unit tests verifying that all known part name variants map to their canonical base name.

#### Scenario: Verse variants normalize to Verse
- **WHEN** `normalizeSectionName("Verse A")`, `normalizeSectionName("Verse 1")`, and `normalizeSectionName("verse")` are called
- **THEN** all three return `"Verse"`

#### Scenario: Unknown part names return the input unchanged
- **WHEN** `normalizeSectionName("CustomSection")` is called
- **THEN** the return value is `"CustomSection"` (not empty string or undefined)

### Requirement: Dexie CRUD Integration Test Coverage
The database service layer SHALL have integration tests using a real in-memory Dexie instance verifying: create song → add sections → update song → delete song → confirm section cleanup.

#### Scenario: Delete song cascades to sections
- **WHEN** a song is added with 3 sections, then `songService.delete(song.id)` is called
- **THEN** `db.songSections.where('songId').equals(song.id).count()` returns 0

#### Scenario: Import round-trip preserves section count
- **WHEN** songs and sections are imported via `songService.bulkAdd()` and `sectionService.bulkAdd()`
- **THEN** `songService.getAll()` returns the correct song count and each song's `sections` array has the correct length

### Requirement: Playwright E2E Test Coverage
The application SHALL have Playwright end-to-end tests covering: CSV import, fuzzy search, project reorder, XLSX export, and theme persistence.

#### Scenario: CSV import shows correct song count
- **WHEN** the user imports `songs.csv` and `song_sections.csv` via the import modal
- **THEN** the song list displays the expected number of songs (matching the CSV row count)

#### Scenario: Fuzzy search with typo returns result
- **WHEN** the user types a misspelled song title in the search input and waits 400ms
- **THEN** the target song card appears in the visible results

#### Scenario: Theme persists after page reload
- **WHEN** the user toggles to dark mode and reloads the page
- **THEN** the app loads in dark mode without a flash of light theme
