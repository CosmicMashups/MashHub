## ADDED Requirements

### Requirement: Song Sections Table
The system SHALL maintain a songSections table in IndexedDB with the following structure:
- SECTION_ID: unique identifier (primary key)
- SONG_ID: foreign key referencing songs table
- PART: string identifier for the section part
- BPM: number value for the section BPM
- KEY: string value for the section musical key
- SECTION_ORDER: number indicating section sequence (1-based)

#### Scenario: Section table creation
- **WHEN** the database schema is initialized
- **THEN** the songSections table SHALL be created with indexes on SONG_ID, BPM, KEY, [SONG_ID+BPM], [SONG_ID+KEY], and [SONG_ID+SECTION_ORDER]

#### Scenario: Section foreign key constraint
- **WHEN** a section is inserted with a SONG_ID
- **THEN** the system SHALL validate that the SONG_ID exists in the songs table, and SHALL reject inserts with invalid SONG_ID values

### Requirement: Database Migration from Version 2 to Version 3
The system SHALL automatically migrate existing version 2 databases to version 3, transforming flat song records into normalized song and section records.

#### Scenario: Migration execution
- **WHEN** a version 2 database is detected on application load
- **THEN** the system SHALL automatically execute migration logic to transform songs into the new schema, creating one section per original song record, and SHALL preserve all song-level data

#### Scenario: Migration data integrity
- **WHEN** migration completes
- **THEN** all songs from version 2 SHALL have corresponding records in version 3 songs table, and each song SHALL have at least one section record with SECTION_ORDER = 1

#### Scenario: Migration rollback prevention
- **WHEN** migration to version 3 completes successfully
- **THEN** the system SHALL NOT allow rollback to version 2, and SHALL mark the database as migrated

## MODIFIED Requirements

### Requirement: Songs Table Schema
The songs table SHALL store only song-level properties: id (primary key), title, artist, type, origin, season, year, vocalStatus, and notes. The table SHALL NOT store bpms, keys, part, primaryBpm, or primaryKey as indexed fields.

#### Scenario: Songs table indexes
- **WHEN** the songs table is created
- **THEN** indexes SHALL be created on: id, title, artist, type, year, vocalStatus, origin, season, and compound indexes [artist+type] and [year+season]

#### Scenario: Songs table query performance
- **WHEN** querying songs by indexed fields
- **THEN** queries SHALL use IndexedDB indexes for optimal performance, and SHALL NOT require full table scans

## ADDED Requirements

### Requirement: Section Query Optimization
The system SHALL use compound indexes on songSections table to optimize common query patterns.

#### Scenario: BPM filtering with index
- **WHEN** filtering songs by BPM range
- **THEN** the query SHALL use the [SONG_ID+BPM] compound index to efficiently find matching sections, then join to songs table

#### Scenario: Key filtering with index
- **WHEN** filtering songs by KEY
- **THEN** the query SHALL use the [SONG_ID+KEY] compound index to efficiently find matching sections, then join to songs table

#### Scenario: Section ordering query
- **WHEN** retrieving sections for a song ordered by SECTION_ORDER
- **THEN** the query SHALL use the [SONG_ID+SECTION_ORDER] compound index for optimal performance
