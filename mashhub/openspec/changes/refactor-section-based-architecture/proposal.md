## Why

MashHub currently uses a flat song data model where each song record contains BPM, KEY, and PART as single values or arrays. This limits the system's ability to represent songs with multiple distinct sections that have different musical properties. The migration to a normalized section-based architecture (songs.csv + song_sections.csv) enables proper representation of multi-section songs, improves data integrity, and provides a foundation for advanced features like section-level matching, harmonic transition analysis, and AI-based section similarity scoring.

## What Changes

- **BREAKING**: Database schema migration from single `songs` table to normalized `songs` and `songSections` tables
- **BREAKING**: Song data model refactored to support one-to-many sections relationship
- Data loading logic redesigned to load and relate songs.csv and song_sections.csv
- Matching service refactored to operate at section-level with song-level aggregation
- Filtering system updated to filter songs based on section properties (BPM, KEY)
- Project management enhanced to optionally reference specific sections
- Import/Export logic updated to handle two-file CSV structure
- TypeScript interfaces updated to reflect new relational model
- Backward compatibility migration strategy for existing IndexedDB data

## Impact

- Affected specs: data-model, data-loading, matching-service, filtering, database-schema, project-management, import-export
- Affected code:
  - `src/types/index.ts` - Type definitions
  - `src/services/database.ts` - Dexie schema and services
  - `src/data/animeDataLoader.ts` - CSV loading logic
  - `src/services/matchingService.ts` - Matching algorithms
  - `src/hooks/useSongs.ts` - Song data hooks
  - `src/components/SongModal.tsx` - Song editing UI
  - `src/services/fileService.ts` - Import/export logic
  - All filtering and search components
  - Project management components
