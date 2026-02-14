## Context

MashHub currently stores songs in a denormalized format where each song record contains:
- `bpms: number[]` - Array of BPM values
- `keys: string[]` - Array of musical keys
- `part: string` - Single part identifier
- `primaryBpm?: number` - Derived primary BPM
- `primaryKey?: string` - Derived primary key

The system is migrating to a normalized structure:
- `songs.csv`: ID, TITLE, ARTIST, TYPE, ORIGIN, SEASON, YEAR, NOTES
- `song_sections.csv`: SECTION_ID, SONG_ID, PART, BPM, KEY, SECTION_ORDER

This change affects every layer of the application: database, services, UI, and data flow.

## Goals / Non-Goals

### Goals
- Support one-to-many relationship between songs and sections
- Maintain backward compatibility during migration
- Preserve all existing features (matching, filtering, search, projects)
- Optimize for performance with large libraries (10,000+ songs)
- Enable future features (section timestamps, modulation detection, AI scoring)
- Keep section-level data normalized in database

### Non-Goals
- Real-time audio analysis or waveform processing
- Automatic section detection from audio files
- Multi-user collaboration features
- Cloud synchronization
- Implementing AI features (only architecting for them)

## Decisions

### Decision 1: Compute primaryBpm/primaryKey On-Demand vs Cached

**Decision**: Compute on-demand with optional caching layer

**Rationale**:
- Primary values are derived from sections, which may change
- Caching adds complexity and potential staleness
- On-demand computation is fast for typical use cases (<100 sections per song)
- Can add caching later if performance data shows need

**Alternatives considered**:
- Always compute on load: Rejected - unnecessary computation for songs not being matched
- Always cache: Rejected - adds migration complexity and potential data inconsistency
- Hybrid with invalidation: Considered but deferred - premature optimization

### Decision 2: Section-Level Matching Aggregation Strategy

**Decision**: Score each section independently, then aggregate to song-level using best-match strategy

**Rationale**:
- Preserves section-level detail for future UI features
- Best-match aggregation (max score) is intuitive and performant
- Allows exposing section breakdown in UI later
- Maintains compatibility with existing song-level matching API

**Alternatives considered**:
- Average all sections: Rejected - dilutes strong matches
- Weighted average by section order: Considered but deferred - no clear use case yet
- Return all matching sections: Deferred - can add as optional parameter later

### Decision 3: Filtering Performance Strategy

**Decision**: Use indexed queries on songSections table with join to songs

**Rationale**:
- IndexedDB supports efficient indexed queries on foreign keys
- Join pattern avoids loading all songs into memory
- Compound indexes on [songId+bpm] and [songId+key] optimize common filters
- Scales to large libraries without N+1 queries

**Alternatives considered**:
- Load all sections into memory: Rejected - doesn't scale
- Pre-compute song-level aggregates: Rejected - loses section-level filtering precision
- Separate filtering service: Considered but rejected - adds unnecessary abstraction

### Decision 4: Project Entry Section Reference

**Decision**: Extend ProjectEntry to optionally reference sectionId, defaulting to null (song-level)

**Rationale**:
- Maintains backward compatibility with existing projects
- Enables future section-specific project organization
- Null sectionId means "entire song" (current behavior)
- Non-breaking change for existing project data

**Alternatives considered**:
- Always require sectionId: Rejected - breaking change, unnecessary complexity
- Separate ProjectSectionEntry table: Rejected - over-engineering for optional feature
- No section support: Rejected - misses opportunity for future features

### Decision 5: Migration Strategy

**Decision**: Version-based migration with automatic data transformation

**Rationale**:
- Dexie supports version migrations natively
- Automatic transformation ensures no data loss
- Can handle edge cases (orphaned sections, missing songs)
- Single migration path simplifies testing

**Migration steps**:
1. Detect version 2 database
2. Load all songs from version 2
3. Transform each song: create song record + section records
4. Bulk insert into version 3 tables
5. Verify referential integrity
6. Clear old songs table

**Alternatives considered**:
- Manual migration script: Rejected - user friction
- Dual-write during transition: Rejected - unnecessary complexity
- Fresh start (clear data): Rejected - data loss unacceptable

### Decision 6: UI Editing Model

**Decision**: Song-level editing modal with expandable section list, inline section editing

**Rationale**:
- Maintains familiar UX pattern
- Inline editing reduces modal complexity
- Expandable sections keep UI clean for single-section songs
- Clear visual hierarchy: song → sections

**Alternatives considered**:
- Nested modals: Rejected - poor UX, modal fatigue
- Separate section management page: Rejected - unnecessary navigation
- Always-expanded sections: Rejected - cluttered for simple songs

## Risks / Trade-offs

### Risk 1: Performance Degradation with Large Libraries
**Mitigation**: 
- Use indexed queries with compound indexes
- Implement query result caching for common filters
- Lazy-load sections only when needed
- Monitor performance with 10,000+ song libraries

### Risk 2: Migration Data Loss
**Mitigation**:
- Comprehensive migration testing with real data
- Backup/export before migration
- Validation checks after migration
- Rollback plan (revert to version 2 schema)

### Risk 3: Breaking Changes in Matching Results
**Mitigation**:
- Extensive test suite for matching service
- Side-by-side comparison during development
- Document any intentional behavior changes
- User communication about improved accuracy

### Risk 4: Complex Filtering Logic
**Mitigation**:
- Clear separation of concerns (filtering service)
- Comprehensive unit tests
- Performance profiling
- Documentation of filter behavior

## Migration Plan

### Phase 1: Schema and Types
- Create new TypeScript interfaces
- Define Dexie schema version 3
- Implement migration logic

### Phase 2: Data Loading
- Update CSV loaders for two-file format
- Implement relationship building
- Add validation for orphan sections

### Phase 3: Service Layer
- Refactor songService to handle sections
- Update matching service
- Update filtering logic

### Phase 4: UI Updates
- Update SongModal for section editing
- Update song list display
- Update project management UI

### Phase 5: Import/Export
- Update CSV import for two files
- Update export formats
- Add validation

### Phase 6: Testing and Migration
- Comprehensive testing
- Migration testing with real data
- Performance testing
- User acceptance testing

### Rollback Plan
- Keep version 2 schema code in git history
- Migration can be reversed by reverting to version 2
- Export data before migration for safety

## Open Questions

- Should section deletion cascade to projects? (Decision: Yes, with user notification)
- How to handle sections with identical BPM/KEY? (Decision: Allow duplicates, use SECTION_ORDER for disambiguation)
- Should primaryBpm/primaryKey be user-editable? (Decision: No, always computed from sections)
- Export format for sections: separate sheet or combined? (Decision: Combined with section columns, separate sheet option for advanced users)
