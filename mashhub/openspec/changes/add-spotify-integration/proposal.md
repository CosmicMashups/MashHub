## Why

MashHub currently displays songs with only basic metadata (title, artist, year). Users cannot see album artwork or preview songs, which limits the visual and interactive experience. Integrating Spotify API enables album artwork display, preview playback, and enhanced metadata while maintaining the existing song database structure.

## What Changes

- **NEW**: Spotify API integration service for track search and metadata retrieval
- **NEW**: Persistent mapping cache to store Spotify Track IDs for songs (avoids repeated API calls)
- **NEW**: Album artwork display in song list and detail views (lazy-loaded)
- **NEW**: Preview playback functionality (30-second clips when available)
- **NEW**: Manual override UI for ambiguous Spotify matches
- **NEW**: Batch mapping service to pre-map songs to Spotify tracks
- Authentication: Client Credentials Flow for metadata access (no user login required for artwork/preview)
- Fallback handling: Graceful degradation when tracks are not available on Spotify

## Impact

- Affected specs: spotify-integration (new capability)
- Affected code:
  - `src/services/spotifyService.ts` - New Spotify API client
  - `src/services/spotifyMappingService.ts` - New mapping cache service
  - `src/services/database.ts` - Add spotifyMappings table to Dexie schema
  - `src/types/index.ts` - Add Spotify-related interfaces
  - `src/components/SongList.tsx` - Add album artwork display
  - `src/components/SongModal.tsx` - Add album artwork and preview player
  - `src/hooks/useSongs.ts` - Integrate Spotify data loading
  - New batch mapping script/service for initial population
