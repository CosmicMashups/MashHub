## ADDED Requirements

### Requirement: Two-File CSV Loading
The system SHALL load song data from two separate CSV files: songs.csv and song_sections.csv, and SHALL build the relationship between them.

#### Scenario: Songs CSV loading
- **WHEN** songs.csv is loaded
- **THEN** the system SHALL parse each row and create song records with properties: ID, TITLE, ARTIST, TYPE, ORIGIN, SEASON, YEAR, NOTES

#### Scenario: Sections CSV loading
- **WHEN** song_sections.csv is loaded
- **THEN** the system SHALL parse each row and create section records with properties: SECTION_ID, SONG_ID, PART, BPM, KEY, SECTION_ORDER

#### Scenario: Relationship building
- **WHEN** both CSV files are loaded
- **THEN** the system SHALL match sections to songs using SONG_ID, and SHALL validate that all sections reference existing songs

#### Scenario: Orphan section detection
- **WHEN** song_sections.csv contains a section with SONG_ID that doesn't exist in songs.csv
- **THEN** the system SHALL reject the orphan section, log an error, and SHALL continue loading valid sections

#### Scenario: Song without sections
- **WHEN** songs.csv contains a song with no corresponding sections in song_sections.csv
- **THEN** the system SHALL create the song record, and SHALL allow the song to exist without sections (computed properties will be empty)

### Requirement: CSV Change Detection
The system SHALL detect changes to both songs.csv and song_sections.csv files and SHALL automatically refresh the database when changes are detected.

#### Scenario: Songs CSV change detection
- **WHEN** songs.csv file hash changes
- **THEN** the system SHALL detect the change and SHALL trigger a reload of song data

#### Scenario: Sections CSV change detection
- **WHEN** song_sections.csv file hash changes
- **THEN** the system SHALL detect the change and SHALL trigger a reload of section data

#### Scenario: Both files changed
- **WHEN** both CSV files have changed
- **THEN** the system SHALL reload both files and SHALL rebuild all relationships

## MODIFIED Requirements

### Requirement: Initial Data Loading
The system SHALL load initial song data from CSV files when the database is empty, and SHALL support loading from both songs.csv and song_sections.csv files.

#### Scenario: Empty database initialization
- **WHEN** the database is empty on application load
- **THEN** the system SHALL automatically load songs.csv and song_sections.csv, create all records, and SHALL build the relationships between songs and sections

#### Scenario: CSV file missing
- **WHEN** songs.csv or song_sections.csv is missing
- **THEN** the system SHALL log an error, SHALL NOT crash, and SHALL allow the application to function with existing database data

#### Scenario: CSV parsing errors
- **WHEN** a CSV file contains malformed data
- **THEN** the system SHALL skip the invalid row, log an error, and SHALL continue processing valid rows

## ADDED Requirements

### Requirement: Data Validation on Load
The system SHALL validate loaded CSV data for structural integrity and referential integrity.

#### Scenario: Section order validation
- **WHEN** sections are loaded for a song
- **THEN** the system SHALL validate that SECTION_ORDER values are sequential starting from 1, and SHALL reject sections with invalid ordering

#### Scenario: BPM value validation
- **WHEN** a section's BPM is loaded
- **THEN** the system SHALL validate that BPM is a positive number, and SHALL reject sections with invalid BPM values

#### Scenario: Key value validation
- **WHEN** a section's KEY is loaded
- **THEN** the system SHALL validate that KEY is a non-empty string, and SHALL reject sections with empty or invalid KEY values
