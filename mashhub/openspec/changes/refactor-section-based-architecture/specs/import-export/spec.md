## MODIFIED Requirements

### Requirement: CSV Import
The system SHALL import song data from two CSV files: songs.csv and song_sections.csv, validating structure and relationships.

#### Scenario: Two-file CSV import
- **WHEN** importing songs from CSV
- **THEN** the system SHALL accept both songs.csv and song_sections.csv files, SHALL parse and validate both files, and SHALL create records with proper relationships

#### Scenario: Import validation
- **WHEN** importing CSV files
- **THEN** the system SHALL validate that all sections reference existing songs, SHALL reject orphan sections, and SHALL report validation errors to the user

#### Scenario: Import error handling
- **WHEN** CSV import encounters errors
- **THEN** the system SHALL continue processing valid rows, SHALL log errors for invalid rows, and SHALL provide a summary of successful and failed imports

### Requirement: CSV Export
The system SHALL export song data to two CSV files: songs.csv and song_sections.csv, maintaining the normalized structure.

#### Scenario: Two-file CSV export
- **WHEN** exporting songs to CSV
- **THEN** the system SHALL generate songs.csv with song-level properties and song_sections.csv with section-level properties, and SHALL maintain referential integrity via SONG_ID

#### Scenario: Export file naming
- **WHEN** exporting to CSV
- **THEN** the system SHALL name files as "songs.csv" and "song_sections.csv", and SHALL allow user to specify export location

## ADDED Requirements

### Requirement: Combined Export Format
The system SHALL optionally export a combined/flattened CSV format for compatibility with external tools.

#### Scenario: Combined CSV export
- **WHEN** user selects combined export format
- **THEN** the system SHALL generate a single CSV file with one row per section, including all song-level properties repeated for each section

#### Scenario: Combined export structure
- **WHEN** exporting combined format
- **THEN** each row SHALL contain: song properties (ID, TITLE, ARTIST, etc.) plus section properties (PART, BPM, KEY, SECTION_ORDER)

### Requirement: XLSX Export with Sections
The system SHALL export to XLSX format with sections included in the export.

#### Scenario: XLSX export structure
- **WHEN** exporting to XLSX
- **THEN** the export SHALL include a "Songs" sheet with song-level data and a "Sections" sheet with section-level data, and SHALL maintain relationships via SONG_ID

#### Scenario: XLSX section details
- **WHEN** exporting sections to XLSX
- **THEN** the Sections sheet SHALL include: SECTION_ID, SONG_ID, PART, BPM, KEY, SECTION_ORDER, and SHALL be sorted by SONG_ID then SECTION_ORDER

### Requirement: JSON Export Format
The system SHALL export to JSON format with nested section structure.

#### Scenario: JSON export structure
- **WHEN** exporting to JSON
- **THEN** each song object SHALL contain a "sections" array with section objects, and SHALL maintain the normalized structure in JSON format

#### Scenario: JSON export completeness
- **WHEN** exporting to JSON
- **THEN** the export SHALL include all song and section properties, and SHALL preserve data types (numbers, strings, etc.)
