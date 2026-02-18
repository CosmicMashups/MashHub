## ADDED Requirements

### Requirement: Spotify Track Mapping
The system SHALL map songs in the database to Spotify tracks using title, artist, and year fields.

#### Scenario: Successful automatic mapping
- **WHEN** a song has title, artist, and year data
- **AND** a matching Spotify track is found via search API
- **THEN** the system SHALL store the Spotify Track ID in the mapping cache
- **AND** the system SHALL assign a confidence score (0-100) based on match quality

#### Scenario: Manual override for ambiguous match
- **WHEN** multiple Spotify tracks match a song
- **AND** confidence score is below threshold (70%)
- **THEN** the system SHALL allow user to manually select the correct track
- **AND** the system SHALL store the user selection with manual override flag

#### Scenario: Unmapped song handling
- **WHEN** a song cannot be matched to any Spotify track
- **THEN** the system SHALL flag the song as unmapped
- **AND** the system SHALL allow user to manually provide Spotify track URL
- **AND** the system SHALL display "Not available on Spotify" message

### Requirement: Album Artwork Display
The system SHALL display album artwork for songs that have been mapped to Spotify tracks.

#### Scenario: Display artwork in song list
- **WHEN** a song has a Spotify mapping with album artwork URL
- **THEN** the system SHALL display a thumbnail image (300x300px) in the song list
- **AND** the image SHALL be lazy-loaded to improve performance
- **AND** the system SHALL display a placeholder icon if artwork is unavailable

#### Scenario: Display artwork in song detail
- **WHEN** user opens song detail modal
- **AND** the song has a Spotify mapping with album artwork URL
- **THEN** the system SHALL display full-size artwork (640x640px)
- **AND** the system SHALL display placeholder if artwork is unavailable

#### Scenario: Image loading error
- **WHEN** album artwork image fails to load
- **THEN** the system SHALL display placeholder icon
- **AND** the system SHALL not break the UI layout

### Requirement: Preview Playback
The system SHALL provide preview playback (30-second clips) for songs with available preview URLs.

#### Scenario: Play preview when available
- **WHEN** a song has a Spotify mapping with preview_url
- **AND** user clicks preview button
- **THEN** the system SHALL play 30-second audio clip using HTML5 audio element
- **AND** the system SHALL display playback controls (play, pause, volume)

#### Scenario: Preview not available
- **WHEN** a song has a Spotify mapping but no preview_url
- **THEN** the system SHALL display "Preview not available" message
- **AND** the system SHALL provide "Open in Spotify" link to full track page

#### Scenario: No Spotify mapping
- **WHEN** a song has no Spotify mapping
- **THEN** the system SHALL not display preview player
- **AND** the system SHALL display "Not available on Spotify" message

### Requirement: Batch Mapping Service
The system SHALL provide a batch mapping service to pre-map multiple songs to Spotify tracks.

#### Scenario: Batch map all songs
- **WHEN** user triggers batch mapping
- **THEN** the system SHALL process all unmapped songs
- **AND** the system SHALL display progress indicator
- **AND** the system SHALL queue requests to avoid rate limiting
- **AND** the system SHALL store successful mappings in cache

#### Scenario: Batch mapping with errors
- **WHEN** batch mapping encounters API errors or rate limits
- **THEN** the system SHALL continue processing remaining songs
- **AND** the system SHALL log errors for review
- **AND** the system SHALL display summary of successful/failed mappings

### Requirement: Fuzzy Matching Algorithm
The system SHALL use fuzzy matching to improve track matching accuracy.

#### Scenario: Normalize search query
- **WHEN** searching for a Spotify track
- **THEN** the system SHALL normalize title and artist (lowercase, remove special chars)
- **AND** the system SHALL strip whitespace
- **AND** the system SHALL handle common variations (feat., featuring, etc.)

#### Scenario: Calculate similarity score
- **WHEN** multiple Spotify tracks match search query
- **THEN** the system SHALL calculate string similarity score (Levenshtein/Jaro-Winkler)
- **AND** the system SHALL combine with Spotify relevance score
- **AND** the system SHALL select track with highest combined score

### Requirement: Cache Management
The system SHALL cache Spotify mappings to avoid repeated API calls.

#### Scenario: Cache hit
- **WHEN** user requests Spotify data for a song
- **AND** mapping exists in cache
- **THEN** the system SHALL return cached data immediately
- **AND** the system SHALL not make API call

#### Scenario: Cache miss
- **WHEN** user requests Spotify data for a song
- **AND** no mapping exists in cache
- **THEN** the system SHALL perform on-demand search
- **AND** the system SHALL store result in cache for future use

#### Scenario: Manual override updates cache
- **WHEN** user manually selects Spotify track
- **THEN** the system SHALL update cache with user selection
- **AND** the system SHALL mark mapping as manual override

### Requirement: Graceful Degradation
The system SHALL function normally when Spotify API is unavailable or credentials are missing.

#### Scenario: Missing credentials
- **WHEN** Spotify API credentials are not configured
- **THEN** the system SHALL disable Spotify features
- **AND** the system SHALL display songs without artwork/preview
- **AND** the system SHALL not break existing functionality

#### Scenario: API failure
- **WHEN** Spotify API request fails (network, rate limit, etc.)
- **THEN** the system SHALL display error message to user
- **AND** the system SHALL allow user to retry
- **AND** the system SHALL not crash the application

### Requirement: Attribution
The system SHALL display Spotify attribution when showing Spotify data.

#### Scenario: Display attribution
- **WHEN** displaying album artwork or preview player
- **THEN** the system SHALL display "Powered by Spotify" or "Data provided by Spotify"
- **AND** the system SHALL link to Spotify track page when available
