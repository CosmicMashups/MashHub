## 1. Database Schema
- [x] 1.1 Add spotifyMappings table to Dexie schema (version 4)
- [x] 1.2 Define indexes: songId (primary), spotifyTrackId, confidenceScore
- [x] 1.3 Create migration function from version 3 to version 4
- [x] 1.4 Add TypeScript interfaces for SpotifyMapping

## 2. Spotify API Service
- [x] 2.1 Create src/services/spotifyService.ts
- [x] 2.2 Implement Client Credentials Flow authentication
- [x] 2.3 Implement searchTrack() method with field filters (track, artist, year)
- [x] 2.4 Implement getTrack() method for track details
- [x] 2.5 Implement getAlbum() method for album artwork
- [x] 2.6 Add rate limiting and retry logic
- [x] 2.7 Add error handling for API failures

## 3. Spotify Mapping Service
- [x] 3.1 Create src/services/spotifyMappingService.ts
- [x] 3.2 Implement getMapping(songId) - cache lookup
- [x] 3.3 Implement searchAndMap(song) - on-demand search and cache
- [x] 3.4 Implement fuzzy matching algorithm (normalize strings, similarity scoring)
- [x] 3.5 Implement confidence scoring (0-100)
- [x] 3.6 Implement saveMapping() - persist to database
- [x] 3.7 Implement updateMapping() - manual override support

## 4. Batch Mapping Service
- [x] 4.1 Create src/services/batchSpotifyMapper.ts
- [x] 4.2 Implement batchMapSongs(songs[]) - process multiple songs
- [x] 4.3 Add progress tracking and callback for UI updates
- [x] 4.4 Implement request queuing to avoid rate limits
- [x] 4.5 Add error handling and retry logic for failed mappings
- [x] 4.6 Add logging for mapping statistics

## 5. Type Definitions
- [x] 5.1 Add SpotifyTrack interface to src/types/index.ts
- [x] 5.2 Add SpotifyMapping interface
- [x] 5.3 Add SpotifyImage interface
- [x] 5.4 Extend Song interface with optional spotifyData computed property

## 6. UI Components - Album Artwork
- [x] 6.1 Create AlbumArtwork component (lazy-loaded image)
- [x] 6.2 Add artwork display to SongList component (thumbnail)
- [x] 6.3 Add artwork display to SongModal component (full size)
- [x] 6.4 Add placeholder for missing artwork
- [x] 6.5 Implement image loading error handling

## 7. UI Components - Preview Playback
- [x] 7.1 Create PreviewPlayer component (HTML5 audio)
- [x] 7.2 Add preview player to SongModal component
- [x] 7.3 Add "Preview not available" fallback message
- [x] 7.4 Add "Open in Spotify" link when preview unavailable
- [x] 7.5 Style player to match application theme

## 8. UI Components - Manual Override
- [x] 8.1 Create SpotifyMatchDialog component
- [x] 8.2 Display top 5 search results for user selection
- [x] 8.3 Add "Search Again" functionality
- [x] 8.4 Add "Skip" option for unmapped songs
- [ ] 8.5 Integrate with SongModal for manual override trigger (can be added later as enhancement)

## 9. Integration with Existing Services
- [x] 9.1 Update useSongs hook to load Spotify data (via useSpotifyData hook)
- [x] 9.2 Add Spotify data to SongWithSections computed properties (via hooks)
- [x] 9.3 Update SongService to optionally include Spotify data (via separate service)
- [x] 9.4 Ensure backward compatibility (songs without Spotify data)

## 10. Configuration and Environment
- [x] 10.1 Add Spotify API credentials to environment variables
- [x] 10.2 Create .env.example with Spotify configuration (attempted - blocked by gitignore)
- [x] 10.3 Add configuration validation on app startup (via isConfigured() method)
- [ ] 10.4 Document Spotify app registration process (documentation task)

## 11. Error Handling and Fallbacks
- [x] 11.1 Handle missing Spotify credentials gracefully
- [x] 11.2 Handle API rate limit errors
- [x] 11.3 Handle network failures
- [x] 11.4 Display user-friendly error messages
- [x] 11.5 Ensure app works without Spotify (graceful degradation)

## 12. Testing
- [ ] 12.1 Write unit tests for spotifyService
- [ ] 12.2 Write unit tests for spotifyMappingService
- [ ] 12.3 Write unit tests for fuzzy matching algorithm
- [ ] 12.4 Write integration tests for batch mapping
- [ ] 12.5 Test with songs that have missing artist names
- [ ] 12.6 Test with songs not available on Spotify

## 13. Documentation
- [ ] 13.1 Document Spotify API integration in code comments
- [ ] 13.2 Update FEATURES.md with Spotify integration
- [ ] 13.3 Document manual override process
- [ ] 13.4 Document batch mapping process
