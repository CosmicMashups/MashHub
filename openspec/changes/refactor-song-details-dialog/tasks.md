## 1. Remove Primary Information Section
- [x] 1.1 Remove "Primary Information" section header and container
- [x] 1.2 Remove Primary Key display element
- [x] 1.3 Remove Primary BPM display element
- [x] 1.4 Verify no references to primaryKey or primaryBpm in dialog UI remain
- [x] 1.5 Test that section-based data still displays correctly in Song Structure section

## 2. Dialog Width and Layout Refactoring
- [x] 2.1 Change dialog max-width from `max-w-2xl` to `max-w-4xl`
- [x] 2.2 Create two-column container structure (left: album cover, right: metadata)
- [x] 2.3 Implement responsive stacking (`flex-col` on mobile, `md:flex-row` on desktop)
- [x] 2.4 Adjust padding and spacing for wider layout
- [x] 2.5 Test dialog width on various screen sizes

## 3. Album Cover Column (Left)
- [x] 3.1 Create left column container for album cover
- [x] 3.2 Set fixed square aspect ratio (1:1) for album cover area
- [x] 3.3 Add placeholder component for when no image is available
- [x] 3.4 Ensure proper spacing and alignment
- [x] 3.5 Test responsive behavior (stacking on mobile)

## 4. Metadata Column (Right)
- [x] 4.1 Move song header (title, artist) to right column
- [x] 4.2 Reorganize metadata section (Type, Year, Origin, Season)
- [x] 4.3 Ensure Song Structure section remains in right column
- [x] 4.4 Maintain action buttons at bottom of right column
- [x] 4.5 Verify all metadata displays correctly

## 5. Spotify Integration
- [x] 5.1 Import `useSpotifyData` hook from `src/hooks/useSpotifyData.ts`
- [x] 5.2 Add hook call with song dependency
- [x] 5.3 Extract album image URL from Spotify mapping (use `imageUrlLarge` or `imageUrlMedium`)
- [x] 5.4 Add `AlbumArtwork` component to left column
- [x] 5.5 Pass appropriate size prop to `AlbumArtwork` component

## 6. On-Demand Fetching Implementation
- [x] 6.1 Ensure fetch only occurs when `isOpen && song` is true
- [x] 6.2 Implement AbortController for fetch cancellation
- [x] 6.3 Clean up abort controller on dialog close
- [x] 6.4 Verify no duplicate fetches for same song
- [x] 6.5 Test fetch cancellation when dialog closes quickly

## 7. Loading and Error States
- [x] 7.1 Handle loading state from `useSpotifyData` hook
- [x] 7.2 Display placeholder during loading
- [x] 7.3 Handle error state gracefully (show placeholder, no error toast)
- [x] 7.4 Test with songs that have no Spotify mapping
- [x] 7.5 Test with network errors

## 8. Performance Optimization
- [x] 8.1 Memoize component with React.memo if needed
- [x] 8.2 Verify no unnecessary re-renders
- [x] 8.3 Ensure Spotify mapping cache is used (via existing service)
- [x] 8.4 Test performance with multiple dialog opens/closes
- [x] 8.5 Verify abort controller prevents memory leaks

## 9. Visual Polish
- [x] 9.1 Adjust spacing between columns
- [x] 9.2 Ensure proper alignment of album cover
- [x] 9.3 Verify text hierarchy in right column
- [x] 9.4 Test dark mode compatibility
- [x] 9.5 Ensure no layout shift during image load

## 10. Responsive Design
- [x] 10.1 Test layout on mobile (< 768px) - should stack vertically
- [x] 10.2 Test layout on tablet (768px - 1024px) - should show two columns
- [x] 10.3 Test layout on desktop (> 1024px) - should show two columns
- [x] 10.4 Verify album cover maintains aspect ratio on all sizes
- [x] 10.5 Test dialog max-width doesn't cause horizontal scroll

## 11. Integration Testing
- [x] 11.1 Test with song that has Spotify mapping
- [x] 11.2 Test with song that has no Spotify mapping
- [x] 11.3 Test with song that has Spotify mapping but image fails to load
- [x] 11.4 Test opening/closing dialog multiple times
- [x] 11.5 Verify all action buttons still work (Edit, Delete, Add to Project)

## 12. Code Quality
- [x] 12.1 Remove unused imports
- [x] 12.2 Add comments explaining Spotify integration points
- [x] 12.3 Ensure TypeScript types are correct
- [x] 12.4 Verify no console errors or warnings
- [x] 12.5 Run linter and fix any issues
