## ADDED Requirements

### Requirement: Granular Error Boundaries Per UI Section
Each major UI section (`SongList`, `EnhancedProjectManager`, `AdvancedFiltersDialog`, `SearchResults`) SHALL be independently wrapped in an `<ErrorBoundary>` component so that a render error in one section does not unmount the entire application.

#### Scenario: Project manager crash does not affect song list
- **WHEN** the `EnhancedProjectManager` component throws a render error
- **THEN** only the project manager section displays the error fallback UI; the song list, search bar, and filter panel remain fully functional

#### Scenario: Error boundary displays recovery UI
- **WHEN** any section-level error boundary catches an error
- **THEN** the fallback UI displays a human-readable error message and a "Reload section" or "Dismiss" button

### Requirement: Storage Quota Error Handling
All Dexie write operations SHALL catch `QuotaExceededError` and surface a user-actionable warning modal rather than silently failing or throwing an unhandled promise rejection.

#### Scenario: Quota exceeded during import
- **WHEN** a large CSV import causes IndexedDB to exceed the available storage quota
- **THEN** the import halts, a warning modal appears with message "Storage full — clear old data to continue", and a "Clear database" button is available

#### Scenario: Quota exceeded during project save
- **WHEN** adding a song to a project fails due to quota
- **THEN** a toast notification appears with the storage warning; the project state is unchanged (operation rolled back)

### Requirement: Database Version Mismatch Handling
On `db.open()`, the system SHALL catch Dexie `VersionError` and `InvalidStateError` exceptions and display a modal prompting the user to reload to apply the database upgrade.

#### Scenario: Version mismatch on open
- **WHEN** the Dexie database opens and detects a version mismatch (e.g., another tab has a newer version)
- **THEN** a non-dismissible modal appears with text "A database upgrade is required. Please reload the page." and a "Reload" button

### Requirement: CSV Import Error Summary
During CSV file import, all per-row validation errors SHALL be accumulated and displayed in a summary modal after import completes, rather than silently skipping rows.

#### Scenario: Malformed rows are reported
- **WHEN** a CSV file contains 5 rows with missing required fields and 100 valid rows
- **THEN** after import, a summary modal displays "Imported 100 songs. 5 rows were skipped." with a list of the specific row numbers and error reasons

#### Scenario: Error log is downloadable
- **WHEN** the import error summary modal is shown with skipped rows
- **THEN** a "Download error log" button is available that triggers a `.txt` or `.csv` file download containing all error details
