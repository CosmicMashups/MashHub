## Why

The Song Details dialog currently only retrieves album artwork from Spotify API, which works well for general music but provides limited or no results for anime songs. Anime songs have their origin information (anime title) that can be used to fetch cover/poster images from Jikan API (MyAnimeList API). This enhancement will improve the visual experience for anime songs while maintaining Spotify functionality for non-anime songs.

## What Changes

- **ADDED**: Jikan API integration for fetching anime cover images
- **ADDED**: Unified cover image resolver function (`resolveCoverImage`)
- **ADDED**: Conditional logic to route to Jikan API when `song.type === "Anime"`, otherwise use Spotify
- **ADDED**: In-memory cache for cover image URLs (keyed by song.id)
- **ADDED**: Jikan API service/helper functions
- **MODIFIED**: `SongDetailsModal` component to use unified cover resolver
- **MODIFIED**: Cover image fetching logic to support both Jikan and Spotify sources
- **ENHANCEMENT**: Graceful fallback handling for API failures

## Impact

- Affected specs: cover-image-resolver
- Affected code:
  - `src/components/SongDetailsModal.tsx` - Refactor to use unified cover resolver
  - `src/services/jikanService.ts` - New service for Jikan API calls
  - `src/utils/coverImageResolver.ts` - New utility for unified cover resolution
  - `src/hooks/useCoverImage.ts` - New hook for cover image fetching with caching
  - No changes to Spotify integration (remains functional)
  - No changes to database schema
  - No changes to filtering or matching logic
