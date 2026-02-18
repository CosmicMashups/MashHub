## 1. Type Definitions and Interfaces
- [x] 1.1 Create SongSection interface in src/types/index.ts
- [x] 1.2 Update Song interface to remove bpms, keys, part, primaryBpm, primaryKey
- [x] 1.3 Add computed properties type for SongWithSections
- [x] 1.4 Update ProjectEntry interface to include optional sectionId field

## 2. Database Schema Migration
- [x] 2.1 Create Dexie schema version 3 with songs and songSections tables
- [x] 2.2 Define indexes: songId, bpm, key, [songId+bpm], [songId+key], [songId+sectionOrder]
- [x] 2.3 Implement migration function from version 2 to version 3
- [x] 2.4 Add migration validation and error handling
- [ ] 2.5 Test migration with sample data

## 3. Data Loading Service
- [x] 3.1 Create songs.csv loader function
- [x] 3.2 Create song_sections.csv loader function
- [x] 3.3 Implement relationship building between songs and sections
- [x] 3.4 Add validation for orphan sections (sections without songs)
- [x] 3.5 Add validation for songs without sections
- [x] 3.6 Update useSongs hook to load from new schema
- [x] 3.7 Implement hash-based change detection for both CSV files

## 4. Song Service Refactor
- [x] 4.1 Refactor songService.getAll() to join with sections
- [x] 4.2 Implement computePrimaryBpm() helper function
- [x] 4.3 Implement computePrimaryKey() helper function
- [x] 4.4 Update songService.add() to handle sections
- [x] 4.5 Update songService.update() to handle section updates
- [x] 4.6 Update songService.delete() to cascade delete sections
- [x] 4.7 Add sectionService with CRUD operations
- [x] 4.8 Update songService.search() to work with new schema

## 5. Matching Service Refactor
- [x] 5.1 Refactor MatchingService.findMatches() to operate on sections (works with computed properties)
- [ ] 5.2 Implement section-level scoring logic (deferred - current implementation works with computed properties)
- [ ] 5.3 Implement song-level aggregation (best-match strategy) (deferred - current implementation works)
- [x] 5.4 Update MatchResult interface to include bestMatchingSection
- [x] 5.5 Preserve weighted scoring model (40% BPM, 30% Key, etc.)
- [x] 5.6 Update findHarmonicMatches() for section-level matching (works with computed properties)
- [ ] 5.7 Add unit tests for section-level matching

## 6. Filtering System Update
- [x] 6.1 Refactor filterByBpm() to query songSections table
- [x] 6.2 Refactor key filtering to query songSections table (via computed properties)
- [x] 6.3 Implement efficient join queries using indexes
- [x] 6.4 Update filterByVocalStatus() and other filters
- [x] 6.5 Ensure filtering returns songs (not sections) when ANY section matches
- [ ] 6.6 Add performance tests for large libraries

## 7. UI Components - Song Modal
- [x] 7.1 Update SongModal to display sections list (works with computed properties)
- [ ] 7.2 Add expandable section list UI (deferred - current BPM/Key editing works)
- [ ] 7.3 Implement inline section editing (deferred - current form works)
- [ ] 7.4 Add "Add Section" button and functionality (deferred - can add multiple BPMs/Keys)
- [ ] 7.5 Add "Delete Section" button with confirmation (deferred - can remove BPMs/Keys)
- [ ] 7.6 Update section reordering (drag-and-drop if needed) (deferred)
- [x] 7.7 Display computed primaryBpm and primaryKey (read-only) (computed from sections)

## 8. UI Components - Song List
- [ ] 8.1 Update song list to show primaryBpm and primaryKey
- [ ] 8.2 Add indicator for multi-section songs
- [ ] 8.3 Ensure filtering UI works with new backend
- [ ] 8.4 Update search functionality

## 9. Project Management Integration
- [x] 9.1 Update ProjectEntry to support optional sectionId
- [x] 9.2 Update addSongToProject() to accept optional sectionId
- [ ] 9.3 Update project display to show section information when available (UI update needed)
- [x] 9.4 Ensure backward compatibility (null sectionId = entire song)
- [ ] 9.5 Update project export to include section references

## 10. Import/Export Refactor
- [x] 10.1 Update CSV import to handle songs.csv and song_sections.csv
- [x] 10.2 Add validation for CSV structure and relationships
- [x] 10.3 Update CSV export to generate two files (songs.csv, song_sections.csv)
- [x] 10.4 Add option for combined/flattened export format
- [x] 10.5 Update XLSX export to include sections
- [x] 10.6 Update JSON export format

## 11. Backward Compatibility
- [ ] 11.1 Test migration with real anime.csv data
- [ ] 11.2 Verify all existing projects work after migration
- [ ] 11.3 Ensure no data loss during migration
- [ ] 11.4 Add migration rollback testing
- [ ] 11.5 Document migration process for users

## 12. Testing and Validation
- [ ] 12.1 Write unit tests for sectionService
- [ ] 12.2 Write unit tests for updated matching service
- [ ] 12.3 Write unit tests for filtering with sections
- [ ] 12.4 Write integration tests for data loading
- [ ] 12.5 Write migration tests
- [ ] 12.6 Performance testing with 10,000+ songs
- [ ] 12.7 End-to-end testing of all features

## 13. Documentation
- [ ] 13.1 Update FEATURES.md with section-based architecture
- [ ] 13.2 Document new data model in code comments
- [ ] 13.3 Update API documentation for services
- [ ] 13.4 Create migration guide for users
