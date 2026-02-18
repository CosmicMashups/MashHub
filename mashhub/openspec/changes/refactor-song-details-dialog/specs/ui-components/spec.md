## MODIFIED Requirements

### Requirement: Song Details Dialog Layout
The system SHALL display song details in a widened dialog with a two-column layout, excluding primary key and primary BPM information.

#### Scenario: Dialog width increased
- **WHEN** the Song Details dialog is opened
- **THEN** the dialog SHALL have a maximum width of approximately 900px-1000px (max-w-4xl)
- **AND** the dialog SHALL maintain responsive behavior on smaller screens

#### Scenario: Two-column layout structure
- **WHEN** the Song Details dialog is displayed on desktop screens
- **THEN** the dialog SHALL use a two-column layout
- **AND** the left column SHALL contain the album cover artwork
- **AND** the right column SHALL contain all song metadata (title, artist, year, origin, season, type, song structure)
- **AND** on mobile screens, the columns SHALL stack vertically

#### Scenario: Primary Information section removed
- **WHEN** the Song Details dialog is displayed
- **THEN** the dialog SHALL NOT display a "Primary Information" section
- **AND** the dialog SHALL NOT display Primary Key or Primary BPM values
- **AND** section-based keys and BPMs SHALL still be displayed in the Song Structure section

### Requirement: Album Cover Art Display
The system SHALL display album cover artwork retrieved from Spotify API in the Song Details dialog.

#### Scenario: Album cover displayed when available
- **WHEN** the Song Details dialog is opened
- **AND** the song has a Spotify mapping with album artwork URL
- **THEN** the system SHALL display the album cover in the left column
- **AND** the album cover SHALL have a fixed square aspect ratio (1:1)
- **AND** the image SHALL be retrieved using existing Spotify integration infrastructure

#### Scenario: Placeholder displayed when no artwork
- **WHEN** the Song Details dialog is opened
- **AND** the song has no Spotify mapping or no album artwork URL
- **THEN** the system SHALL display a neutral placeholder icon in the album cover area
- **AND** no error message SHALL be displayed to the user

#### Scenario: Loading state during fetch
- **WHEN** the Song Details dialog is opened
- **AND** Spotify album artwork is being fetched
- **THEN** the system SHALL display a loading placeholder
- **AND** the layout SHALL not shift when the image loads

### Requirement: On-Demand Spotify Fetching
The system SHALL fetch Spotify album artwork only when the dialog is opened, with proper cancellation handling.

#### Scenario: Fetch triggered on dialog open
- **WHEN** the Song Details dialog is opened
- **THEN** the system SHALL initiate Spotify album artwork fetch if not already cached
- **AND** the fetch SHALL use existing `useSpotifyData` hook
- **AND** the fetch SHALL use existing `spotifyMappingService` cache

#### Scenario: Fetch cancelled on dialog close
- **WHEN** the Song Details dialog is closed before Spotify fetch completes
- **THEN** the system SHALL cancel the in-flight fetch using AbortController
- **AND** no memory leaks SHALL occur

#### Scenario: No duplicate fetches
- **WHEN** the Song Details dialog is opened for a song
- **AND** the song's Spotify mapping is already cached
- **THEN** the system SHALL use the cached mapping
- **AND** the system SHALL NOT make a new API call

### Requirement: Responsive Design
The Song Details dialog SHALL adapt to different screen sizes while maintaining usability.

#### Scenario: Desktop layout
- **WHEN** the dialog is displayed on screens wider than 768px
- **THEN** the dialog SHALL display two columns side-by-side
- **AND** the album cover SHALL be in the left column
- **AND** metadata SHALL be in the right column

#### Scenario: Mobile layout
- **WHEN** the dialog is displayed on screens 768px or narrower
- **THEN** the columns SHALL stack vertically
- **AND** the album cover SHALL appear above the metadata
- **AND** the dialog SHALL remain fully functional

### Requirement: Visual Consistency
The Song Details dialog SHALL maintain visual consistency with the rest of the application.

#### Scenario: Dark mode compatibility
- **WHEN** the dialog is displayed in dark mode
- **THEN** all text, backgrounds, and borders SHALL use appropriate dark mode colors
- **AND** the album cover placeholder SHALL match dark mode styling

#### Scenario: Spacing and alignment
- **WHEN** the dialog is displayed
- **THEN** proper spacing SHALL be maintained between columns
- **AND** all elements SHALL be properly aligned
- **AND** no layout shift SHALL occur during image loading
