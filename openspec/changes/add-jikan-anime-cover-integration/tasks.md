## 1. Create Jikan API Service
- [x] 1.1 Create `src/services/jikanService.ts` file
- [x] 1.2 Define TypeScript interfaces for Jikan API response
- [x] 1.3 Implement `fetchAnimeCover(origin: string)` function
- [x] 1.4 Add proper URI encoding for search query
- [x] 1.5 Implement error handling for rate limits (429 status)
- [x] 1.6 Implement error handling for network failures
- [x] 1.7 Implement error handling for no results (empty data array)
- [x] 1.8 Extract `large_image_url` from response
- [x] 1.9 Add JSDoc comments explaining function behavior
- [x] 1.10 Test with sample anime titles

## 2. Create Cover Image Resolver Utility
- [x] 2.1 Create `src/utils/coverImageResolver.ts` file
- [x] 2.2 Implement `resolveCoverImage(song: Song)` async function
- [x] 2.3 Add conditional logic: check if `song.type === "Anime"` (case-insensitive)
- [x] 2.4 Route to Jikan API if anime type
- [x] 2.5 Route to Spotify API if non-anime type
- [x] 2.6 Handle undefined type (fallback to Spotify)
- [x] 2.7 Return image URL string or null
- [x] 2.8 Add inline comments explaining decision logic
- [x] 2.9 Add TypeScript return type annotations
- [x] 2.10 Test resolver with both anime and non-anime songs

## 3. Create Cover Image Hook
- [x] 3.1 Create `src/hooks/useCoverImage.ts` file
- [x] 3.2 Implement in-memory cache using Map<string, string | null>
- [x] 3.3 Add state for coverImageUrl (string | null)
- [x] 3.4 Add state for coverLoading (boolean)
- [x] 3.5 Implement useEffect to fetch on song change
- [x] 3.6 Check cache before making API call
- [x] 3.7 Implement AbortController for fetch cancellation
- [x] 3.8 Clean up abort controller on unmount or song change
- [x] 3.9 Handle loading states
- [x] 3.10 Handle error states (fail silently, return null)
- [x] 3.11 Store result in cache after successful fetch
- [x] 3.12 Return { coverImageUrl, coverLoading } from hook

## 4. Refactor SongDetailsModal Component
- [x] 4.1 Import `useCoverImage` hook
- [x] 4.2 Replace `useSpotifyData` hook call with `useCoverImage`
- [x] 4.3 Update image URL extraction logic
- [x] 4.4 Remove direct Spotify mapping access
- [x] 4.5 Ensure AlbumArtwork component receives correct imageUrl prop
- [x] 4.6 Test that existing Spotify flow still works for non-anime songs
- [x] 4.7 Test that Jikan flow works for anime songs
- [x] 4.8 Verify loading states display correctly
- [x] 4.9 Verify placeholder displays when no image available

## 5. Edge Case Handling
- [x] 5.1 Test with anime song that has extra spaces in origin
- [x] 5.2 Test with anime song that has season/year in origin
- [x] 5.3 Test with anime song that has no Jikan results
- [x] 5.4 Test with anime song when Jikan API is rate limited
- [x] 5.5 Test with anime song when network fails
- [x] 5.6 Test with non-anime song (should use Spotify)
- [x] 5.7 Test with song that has undefined type (should use Spotify)
- [x] 5.8 Test with song that has empty origin (should handle gracefully)
- [x] 5.9 Verify no error toasts are displayed
- [x] 5.10 Verify placeholder is shown when appropriate

## 6. Caching Implementation
- [x] 6.1 Verify cache prevents duplicate API calls for same song
- [x] 6.2 Test cache persists across dialog open/close cycles
- [x] 6.3 Test cache is cleared on page refresh (expected behavior)
- [x] 6.4 Verify cache key is song.id
- [x] 6.5 Test with multiple songs to ensure cache isolation

## 7. Performance Optimization
- [x] 7.1 Verify no unnecessary re-renders
- [x] 7.2 Verify fetch is aborted when dialog closes early
- [x] 7.3 Verify no memory leaks from AbortController
- [x] 7.4 Test performance with multiple rapid dialog opens/closes
- [x] 7.5 Verify cache lookup is O(1) operation

## 8. Code Quality
- [x] 8.1 Add TypeScript types for all functions and variables
- [x] 8.2 Add JSDoc comments for public functions
- [x] 8.3 Add inline comments for complex logic
- [x] 8.4 Remove unused imports
- [x] 8.5 Run linter and fix any issues
- [x] 8.6 Verify no console errors or warnings (except expected API errors)

## 9. Integration Testing
- [x] 9.1 Test with anime song that has valid Jikan result
- [x] 9.2 Test with anime song that has no Jikan result
- [x] 9.3 Test with non-anime song (Spotify flow)
- [x] 9.4 Test opening/closing dialog multiple times
- [x] 9.5 Test switching between different songs
- [x] 9.6 Verify dialog layout remains unchanged
- [x] 9.7 Verify no layout shift during image load
- [x] 9.8 Test responsive behavior (mobile/desktop)

## 10. Documentation
- [x] 10.1 Document Jikan API integration in code comments
- [x] 10.2 Document cover resolver decision logic
- [x] 10.3 Document caching strategy
- [x] 10.4 Document error handling approach
- [x] 10.5 Update any relevant README or architecture docs if needed
