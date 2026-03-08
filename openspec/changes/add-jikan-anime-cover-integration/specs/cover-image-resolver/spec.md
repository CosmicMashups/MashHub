## ADDED Requirements

### Requirement: Jikan API Integration for Anime Cover Images
The system SHALL fetch anime cover/poster images from Jikan API when a song's type is "Anime".

#### Scenario: Fetch anime cover for anime song
- **WHEN** the Song Details dialog is opened for a song
- **AND** the song's type field equals "Anime" (case-insensitive)
- **THEN** the system SHALL call Jikan API with the song's origin value as the search query
- **AND** the system SHALL extract the large_image_url from the first result
- **AND** the system SHALL display the image in the album cover area

#### Scenario: Jikan API search query formatting
- **WHEN** fetching anime cover from Jikan API
- **THEN** the system SHALL use the song's origin field as the search query
- **AND** the system SHALL trim whitespace from the origin value
- **AND** the system SHALL properly encode the query parameter in the API URL
- **AND** the system SHALL use case-insensitive search

#### Scenario: Jikan API endpoint and response handling
- **WHEN** fetching anime cover from Jikan API
- **THEN** the system SHALL call `GET https://api.jikan.moe/v4/anime?q={origin}&limit=1`
- **AND** the system SHALL extract `data[0].images.jpg.large_image_url` from the response
- **AND** the system SHALL return null if the data array is empty

### Requirement: Unified Cover Image Resolver
The system SHALL provide a unified function that routes to the appropriate API based on song type.

#### Scenario: Route to Jikan for anime songs
- **WHEN** `resolveCoverImage(song)` is called
- **AND** the song's type equals "Anime" (case-insensitive comparison)
- **THEN** the function SHALL call Jikan API with the song's origin
- **AND** the function SHALL return the anime cover image URL or null

#### Scenario: Route to Spotify for non-anime songs
- **WHEN** `resolveCoverImage(song)` is called
- **AND** the song's type does not equal "Anime"
- **THEN** the function SHALL use existing Spotify API retrieval logic
- **AND** the function SHALL return the Spotify album image URL or null

#### Scenario: Fallback to Spotify for undefined type
- **WHEN** `resolveCoverImage(song)` is called
- **AND** the song's type is undefined or null
- **THEN** the function SHALL fallback to Spotify API retrieval logic
- **AND** the function SHALL return the Spotify album image URL or null

### Requirement: In-Memory Caching for Cover Images
The system SHALL cache cover image URLs in memory to prevent duplicate API calls.

#### Scenario: Cache hit prevents duplicate API call
- **WHEN** a cover image is requested for a song
- **AND** the song's ID exists in the cache
- **THEN** the system SHALL return the cached image URL
- **AND** the system SHALL NOT make a new API call

#### Scenario: Cache miss triggers API call
- **WHEN** a cover image is requested for a song
- **AND** the song's ID does not exist in the cache
- **THEN** the system SHALL make an API call to fetch the image
- **AND** the system SHALL store the result in the cache (keyed by song.id)
- **AND** the system SHALL return the image URL or null

#### Scenario: Cache storage
- **WHEN** a cover image is successfully fetched
- **THEN** the system SHALL store the image URL in memory cache
- **AND** the cache key SHALL be the song's ID
- **AND** the cache SHALL persist for the session duration
- **AND** the cache SHALL NOT persist to IndexedDB

### Requirement: Error Handling for Jikan API
The system SHALL handle Jikan API errors gracefully without disrupting user experience.

#### Scenario: No Jikan results found
- **WHEN** Jikan API returns an empty data array
- **THEN** the system SHALL return null
- **AND** the system SHALL display a neutral placeholder cover
- **AND** the system SHALL NOT display an error toast

#### Scenario: Jikan API rate limit
- **WHEN** Jikan API returns a 429 (rate limit) status code
- **THEN** the system SHALL return null
- **AND** the system SHALL display a neutral placeholder cover
- **AND** the system SHALL NOT display an error toast
- **AND** the system SHALL log the error to console for debugging

#### Scenario: Network failure
- **WHEN** Jikan API call fails due to network error
- **THEN** the system SHALL return null
- **AND** the system SHALL display a neutral placeholder cover
- **AND** the system SHALL NOT display an error toast
- **AND** the system SHALL log the error to console for debugging

### Requirement: Fetch Cancellation
The system SHALL cancel in-flight API calls when the dialog closes.

#### Scenario: Cancel fetch on dialog close
- **WHEN** a cover image fetch is in progress
- **AND** the Song Details dialog is closed
- **THEN** the system SHALL cancel the in-flight API call using AbortController
- **AND** the system SHALL clean up the abort controller
- **AND** no memory leaks SHALL occur

#### Scenario: Fetch only on dialog open
- **WHEN** the Song Details dialog is opened
- **AND** a song is selected
- **THEN** the system SHALL initiate cover image fetch
- **WHEN** the dialog is closed
- **THEN** the system SHALL NOT continue fetching

### Requirement: Spotify Integration Preservation
The system SHALL maintain existing Spotify functionality for non-anime songs.

#### Scenario: Spotify flow for non-anime songs
- **WHEN** a non-anime song's cover image is requested
- **THEN** the system SHALL use existing Spotify API retrieval logic
- **AND** the system SHALL use existing `useSpotifyData` hook or equivalent
- **AND** the system SHALL use existing `spotifyMappingService` cache
- **AND** the system SHALL NOT modify Spotify integration code

#### Scenario: Spotify functionality unchanged
- **WHEN** the system is used with non-anime songs
- **THEN** all existing Spotify functionality SHALL work as before
- **AND** no regression SHALL occur in Spotify features
- **AND** Spotify token handling SHALL remain unchanged

### Requirement: Component Integration
The SongDetailsModal component SHALL use the unified cover resolver.

#### Scenario: Component uses unified resolver
- **WHEN** SongDetailsModal component renders
- **THEN** it SHALL use `useCoverImage` hook or equivalent unified resolver
- **AND** it SHALL pass the cover image URL to AlbumArtwork component
- **AND** it SHALL handle loading states appropriately

#### Scenario: Loading state display
- **WHEN** cover image is being fetched
- **THEN** the system SHALL display a loading placeholder
- **AND** the layout SHALL not shift when the image loads
- **AND** the loading state SHALL be smooth and unobtrusive

#### Scenario: Placeholder display
- **WHEN** no cover image is available (null result)
- **THEN** the system SHALL display a neutral placeholder icon
- **AND** the placeholder SHALL maintain the same aspect ratio
- **AND** the layout SHALL not shift
