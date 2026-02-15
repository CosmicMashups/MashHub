## Context

The Song Details dialog currently uses `useSpotifyData` hook to fetch album artwork from Spotify API. This works well for general music tracks but provides limited results for anime songs. Anime songs have an `origin` field that contains the anime title, which can be used to search Jikan API (MyAnimeList API) for anime poster/cover images.

The application already has:
- Spotify integration with `spotifyService` and `spotifyMappingService`
- `useSpotifyData` hook for fetching Spotify data
- `AlbumArtwork` component for displaying images
- IndexedDB caching for Spotify mappings

## Goals / Non-Goals

### Goals
- Add Jikan API integration for anime cover images
- Create unified cover resolver that routes to appropriate API based on song type
- Maintain existing Spotify functionality for non-anime songs
- Implement in-memory caching to prevent duplicate API calls
- Handle edge cases gracefully (no results, rate limits, network errors)
- Ensure no breaking changes to existing functionality

### Non-Goals
- Removing Spotify integration
- Persisting Jikan data to IndexedDB (in-memory cache only)
- Modifying database schema
- Changing filtering or matching logic
- Adding authentication for Jikan API (not required)

## Decisions

### Decision 1: Unified Cover Resolver Function

**Decision**: Create a single `resolveCoverImage` function that determines which API to use based on song type.

**Rationale**:
- Single source of truth for cover image logic
- Clean separation of concerns
- Easy to extend with additional sources in the future
- Maintains existing Spotify flow for non-anime songs

**Alternatives considered**:
- Separate hooks for Jikan and Spotify: Rejected - adds complexity, harder to maintain
- Conditional logic in component: Rejected - violates separation of concerns

### Decision 2: In-Memory Caching Only

**Decision**: Use in-memory Map for caching cover image URLs, not IndexedDB.

**Rationale**:
- Jikan API is free and has no authentication, so caching is less critical than Spotify
- In-memory cache is simpler and faster for this use case
- Avoids IndexedDB complexity for temporary data
- Cache persists for session duration, which is sufficient

**Alternatives considered**:
- IndexedDB persistence: Rejected - unnecessary complexity for free API
- No caching: Rejected - would cause duplicate API calls on re-renders

### Decision 3: Jikan API Endpoint

**Decision**: Use `GET https://api.jikan.moe/v4/anime?q={origin}&limit=1` and extract `data[0].images.jpg.large_image_url`.

**Rationale**:
- Jikan v4 is the current stable API version
- Search endpoint is appropriate for finding anime by title
- `limit=1` ensures we get the most relevant result
- `large_image_url` provides good quality for display

**Alternatives considered**:
- Using anime ID instead of search: Rejected - would require additional lookup
- Using multiple results: Rejected - first result is sufficient, adds complexity

### Decision 4: Conditional Routing Logic

**Decision**: Route to Jikan if `song.type === "Anime"` (case-insensitive), otherwise use Spotify.

**Rationale**:
- Simple and clear condition
- Case-insensitive matching handles variations
- Fallback to Spotify if type is undefined or not "Anime"

**Alternatives considered**:
- Additional conditions (e.g., check origin field): Rejected - type field is sufficient
- User preference: Rejected - adds unnecessary complexity

### Decision 5: Error Handling Strategy

**Decision**: Fail silently with placeholder, no error toasts.

**Rationale**:
- Consistent with existing Spotify behavior
- Better UX - doesn't interrupt user flow
- Errors are logged to console for debugging

**Alternatives considered**:
- Show error toast: Rejected - interrupts user experience
- Retry logic: Rejected - adds complexity, rate limits may persist

### Decision 6: Hook-Based Implementation

**Decision**: Create `useCoverImage` hook that encapsulates fetching and caching logic.

**Rationale**:
- Follows React patterns
- Reusable across components if needed
- Handles lifecycle (fetch on mount, cleanup on unmount)
- Can use AbortController for cancellation

**Alternatives considered**:
- Direct function calls in component: Rejected - harder to manage state and lifecycle
- Service-only approach: Rejected - doesn't handle React lifecycle

## Risks / Trade-offs

### Risk 1: Jikan API Rate Limiting
**Mitigation**: 
- In-memory cache prevents duplicate calls
- Fail silently with placeholder
- Rate limit errors are handled gracefully

### Risk 2: Search Result Accuracy
**Mitigation**: 
- Use full origin string (may include season/year)
- Trim whitespace but preserve content
- Accept first result (limit=1) - user can verify visually

### Risk 3: Network Latency
**Mitigation**: 
- Show loading state during fetch
- Cache results to avoid refetching
- Abort fetch if dialog closes early

### Risk 4: Breaking Existing Spotify Flow
**Mitigation**: 
- Keep all Spotify code intact
- Only add new conditional logic
- Test thoroughly with both anime and non-anime songs

## Migration Plan

### Phase 1: Create Jikan Service
1. Create `src/services/jikanService.ts`
2. Implement `fetchAnimeCover` function
3. Add error handling and type definitions
4. Test with sample anime titles

### Phase 2: Create Cover Resolver
1. Create `src/utils/coverImageResolver.ts`
2. Implement `resolveCoverImage` function
3. Add conditional routing logic
4. Integrate with existing Spotify flow

### Phase 3: Create Hook
1. Create `src/hooks/useCoverImage.ts`
2. Implement fetching logic with caching
3. Add loading and error states
4. Implement AbortController for cleanup

### Phase 4: Refactor SongDetailsModal
1. Replace `useSpotifyData` with `useCoverImage`
2. Update image URL extraction logic
3. Test with anime and non-anime songs
4. Verify no regression in existing functionality

### Phase 5: Testing and Polish
1. Test edge cases (no results, rate limits, network errors)
2. Test with various anime titles
3. Verify caching works correctly
4. Test dialog open/close behavior

### Rollback Plan
- Keep all Spotify code unchanged
- New code is additive, can be removed if needed
- No database changes, so no migration needed

## Open Questions

- Should we add retry logic for rate limit errors?
- Should we implement confidence scoring for search results?
- Should we allow manual override of cover image source?
