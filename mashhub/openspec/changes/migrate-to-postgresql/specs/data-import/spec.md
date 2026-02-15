## ADDED Requirements

### Requirement: CSV Import Service
The system SHALL provide a CSV parsing service that reads and parses songs.csv and song_sections.csv files into structured data.

#### Scenario: Parse songs CSV file
- **WHEN** `parseSongsCSV()` is called with a valid songs.csv file path
- **THEN** the CSV file is read and parsed
- **AND** each row is converted to a ParsedSong object
- **AND** ID values are zero-padded to 5 digits
- **AND** YEAR values are converted to integers or null
- **AND** empty or missing fields are set to null

#### Scenario: Parse song sections CSV file
- **WHEN** `parseSongSectionsCSV()` is called with a valid song_sections.csv file path
- **THEN** the CSV file is read and parsed
- **AND** each row is converted to a ParsedSongSection object
- **AND** SONG_ID values are zero-padded to 5 digits
- **AND** BPM values are converted to floats or null
- **AND** SECTION_ORDER values are converted to integers
- **AND** empty or missing fields are set to null

#### Scenario: Handle malformed CSV data
- **WHEN** a CSV file contains malformed data or invalid formats
- **THEN** parsing errors are caught and logged
- **AND** specific row numbers with errors are identified
- **AND** the import process fails gracefully with error details

### Requirement: Section Validation
The system SHALL validate that all song sections reference existing songs before import.

#### Scenario: Validate section references
- **WHEN** `validateSections()` is called with parsed songs and sections
- **THEN** sections with valid songId references are marked as valid
- **AND** sections with invalid songId references are identified as orphans
- **AND** a summary of valid and orphan sections is returned

#### Scenario: Orphan sections detected
- **WHEN** sections reference non-existent songs
- **THEN** orphan sections are identified and logged
- **AND** orphan section IDs are reported for manual review
- **AND** only valid sections are imported to the database

### Requirement: CSV Import CLI Script
The system SHALL provide a command-line script to import CSV data into the PostgreSQL database.

#### Scenario: Import script executes successfully
- **WHEN** `npm run import:csv` is executed
- **THEN** songs.csv and song_sections.csv files are located in the data/ directory
- **AND** both CSV files are parsed
- **AND** sections are validated against songs
- **AND** data is imported into the database using bulk insert operations
- **AND** import progress is logged to console
- **AND** import summary statistics are displayed

#### Scenario: Import handles existing data
- **WHEN** the import script is run and data already exists
- **THEN** existing data is cleared (optional, with confirmation)
- **OR** duplicate entries are skipped using `skipDuplicates: true`
- **AND** new data is imported without errors

#### Scenario: Import provides summary statistics
- **WHEN** CSV import completes successfully
- **THEN** total songs imported is displayed
- **AND** total sections imported is displayed
- **AND** average sections per song is calculated and displayed
- **AND** any orphan sections are reported

#### Scenario: Import error handling
- **WHEN** an error occurs during CSV import
- **THEN** the error is caught and logged with details
- **AND** the database connection is properly closed
- **AND** the process exits with error code 1
- **AND** no partial data remains in the database (transaction rollback)

### Requirement: CSV Import API Endpoint
The system SHALL provide an API endpoint for importing CSV data via HTTP requests.

#### Scenario: Import via API endpoint
- **WHEN** a POST request is made to `/api/import/csv` with CSV file(s)
- **THEN** the CSV file(s) are received and validated
- **AND** the files are parsed using the CSV service
- **AND** data is imported into the database
- **AND** import results and statistics are returned in the response
- **AND** HTTP status 200 is returned on success

#### Scenario: API import error handling
- **WHEN** CSV import fails via API
- **THEN** HTTP status 500 is returned
- **AND** error details are included in the response
- **AND** no partial data is imported

### Requirement: Bulk Database Operations
The system SHALL use efficient bulk insert operations for CSV import to handle large datasets.

#### Scenario: Bulk insert songs
- **WHEN** multiple songs are imported
- **THEN** `prisma.song.createMany()` is used for bulk insertion
- **AND** all songs are inserted in a single database operation
- **AND** duplicate IDs are handled according to skipDuplicates setting

#### Scenario: Bulk insert sections
- **WHEN** multiple sections are imported
- **THEN** `prisma.songSection.createMany()` is used for bulk insertion
- **AND** all valid sections are inserted in a single database operation
- **AND** foreign key constraints are validated before insertion

### Requirement: Data Transformation
The system SHALL transform CSV data to match the database schema format during import.

#### Scenario: ID padding transformation
- **WHEN** song IDs from CSV are not 5 digits
- **THEN** IDs are zero-padded to 5 digits (e.g., "1" becomes "00001")
- **AND** the transformation is applied consistently to songs and sections

#### Scenario: Type conversion
- **WHEN** CSV data contains string representations of numbers
- **THEN** YEAR values are converted to integers
- **AND** BPM values are converted to floats
- **AND** SECTION_ORDER values are converted to integers
- **AND** invalid conversions result in null values

#### Scenario: Null handling
- **WHEN** CSV fields are empty or missing
- **THEN** corresponding database fields are set to null
- **AND** required fields are validated before insertion
