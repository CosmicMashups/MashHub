## ADDED Requirements

### Requirement: Content Security Policy Meta Tag
The `index.html` document SHALL include a `Content-Security-Policy` meta tag that restricts script sources to `'self'`, allows inline styles (required by Tailwind), and permits Web Worker instantiation from blob URLs.

#### Scenario: CSP is present in the document
- **WHEN** the rendered page source is inspected
- **THEN** a `<meta http-equiv="Content-Security-Policy">` tag exists with at minimum: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src blob:`

#### Scenario: External script injection is blocked
- **WHEN** a dynamically created `<script src="https://evil.example.com/payload.js">` is inserted into the DOM
- **THEN** the browser's CSP enforcement blocks execution and logs a CSP violation in the console

### Requirement: CSV Export Formula Injection Prevention
All values written to CSV export cells SHALL be sanitized before output. Any cell value beginning with `=`, `+`, `-`, or `@` SHALL be prefixed with a tab character (`\t`) to prevent spreadsheet application formula injection.

#### Scenario: Formula prefix is neutralized in export
- **WHEN** a song title is `=HYPERLINK("http://evil.example.com")` and the library is exported to CSV
- **THEN** the exported CSV cell contains `\t=HYPERLINK(...)` (tab-prefixed) and opens as a plain text string in Excel/LibreOffice

#### Scenario: Normal titles are not modified
- **WHEN** a song title is `Angel Beats! OP` and the library is exported to CSV
- **THEN** the exported CSV cell contains exactly `Angel Beats! OP` with no tab prefix

### Requirement: Dexie Schema Integrity Check on Open
On every database open, the system SHALL verify that all expected tables exist and log a structured warning if any are missing or unexpected tables are present.

#### Scenario: All tables present — no warning
- **WHEN** the database opens with `songs`, `songSections`, `projects`, `projectEntries`, and `spotifyMappings` tables present
- **THEN** no schema warning is logged to the console

#### Scenario: Missing table triggers warning
- **WHEN** the database opens and the `spotifyMappings` table is unexpectedly absent (e.g., due to a failed migration in an old browser)
- **THEN** a `console.warn` with message "Schema integrity: missing table spotifyMappings" is logged and the app continues to function for non-Spotify features
