## ADDED Requirements

### Requirement: Song Section Data Model
The system SHALL support a normalized data model where songs have one-to-many sections, with each section containing its own BPM, KEY, and PART properties.

#### Scenario: Song with multiple sections
- **WHEN** a song has multiple sections defined
- **THEN** each section SHALL have a unique SECTION_ID, reference the song via SONG_ID, and contain PART, BPM, KEY, and SECTION_ORDER properties

#### Scenario: Section ordering
- **WHEN** sections are created for a song
- **THEN** sections SHALL be ordered by SECTION_ORDER field, which SHALL be a sequential integer starting from 1

#### Scenario: Section referential integrity
- **WHEN** a section is created
- **THEN** the section's SONG_ID SHALL reference an existing song, and the system SHALL prevent creation of orphan sections (sections without a valid song reference)

### Requirement: Computed Song Properties
The system SHALL compute primaryBpm and primaryKey from a song's sections on-demand, using the first section's values as the primary values.

#### Scenario: Primary BPM computation
- **WHEN** a song's primaryBpm is requested
- **THEN** the system SHALL return the BPM value from the section with SECTION_ORDER = 1, or undefined if no sections exist

#### Scenario: Primary key computation
- **WHEN** a song's primaryKey is requested
- **THEN** the system SHALL return the KEY value from the section with SECTION_ORDER = 1, or undefined if no sections exist

#### Scenario: Aggregated BPMs array
- **WHEN** a song's bpms array is requested
- **THEN** the system SHALL return an array of all unique BPM values from all sections, ordered by SECTION_ORDER

#### Scenario: Aggregated keys array
- **WHEN** a song's keys array is requested
- **THEN** the system SHALL return an array of all unique KEY values from all sections, ordered by SECTION_ORDER

## MODIFIED Requirements

### Requirement: Song Data Model
The system SHALL store songs with the following properties: id, title, artist, type, origin, season, year, vocalStatus, and notes. Songs SHALL NOT directly store bpms, keys, part, primaryBpm, or primaryKey as stored fields. These properties SHALL be computed from the song's sections when needed.

#### Scenario: Song creation without sections
- **WHEN** a new song is created without sections
- **THEN** the song SHALL be saved with song-level properties only, and computed properties (bpms, keys, primaryBpm, primaryKey) SHALL return empty arrays or undefined

#### Scenario: Song retrieval with sections
- **WHEN** a song is retrieved from the database
- **THEN** the system SHALL automatically load associated sections and make computed properties available

## REMOVED Requirements

### Requirement: Flat Song BPM/Key Storage
**Reason**: Replaced with normalized section-based model for better data integrity and support for multi-section songs
**Migration**: Existing songs with bpms/keys arrays will be migrated to section records during database migration
