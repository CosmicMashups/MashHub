## Context

The Song Details dialog (`SongDetailsModal`) currently displays:
- Primary Information section showing Primary Key and Primary BPM
- Metadata section with Type and Year
- Additional Information with Origin and Season
- Song Structure section showing all sections with their keys and BPMs

The Primary Information section is redundant since the Song Structure section already displays all section-level keys and BPMs. The dialog is constrained to `max-w-2xl` (~672px), which limits visual balance and doesn't provide space for album artwork.

There is an existing Spotify integration (`add-spotify-integration` change, 54/66 tasks complete) that provides:
- `spotifyService` for API calls
- `spotifyMappingService` for cached mappings
- `useSpotifyData` hook for fetching Spotify data
- `AlbumArtwork` component for displaying images
- SpotifyMapping interface with `imageUrlLarge`, `imageUrlMedium`, `imageUrlSmall`

## Goals / Non-Goals

### Goals
- Remove redundant Primary Information section from UI
- Widen dialog to 900px-1000px for better visual balance
- Implement two-column layout (album cover left, metadata right)
- Integrate Spotify album artwork display using existing infrastructure
- Fetch album artwork on-demand when dialog opens
- Maintain responsive design (stack columns on small screens)
- Preserve all existing functionality (edit, delete, add to project)

### Non-Goals
- Modifying database schema (primaryBpm/primaryKey fields remain)
- Changing matching or filtering logic
- Implementing new Spotify API features (reuse existing integration)
- Storing Spotify data permanently in IndexedDB (use existing cache)
- Audio playback functionality
- Breaking changes to other components

## Decisions

### Decision 1: Reuse Existing Spotify Infrastructure

**Decision**: Leverage existing Spotify integration services and hooks rather than creating new API calls.

**Rationale**:
- Spotify integration is already 54/66 tasks complete
- `useSpotifyData` hook provides exactly what's needed
- `spotifyMappingService` handles caching automatically
- `AlbumArtwork` component is ready to use
- Avoids duplicate code and maintains consistency

**Alternatives considered**:
- Direct Spotify API calls in component: Rejected - bypasses existing caching and error handling
- New hook for album artwork: Rejected - `useSpotifyData` already provides this functionality

### Decision 2: Two-Column Layout Structure

**Decision**: Left column for album cover (fixed 1:1 aspect ratio), right column for all metadata.

**Layout**:
```
┌─────────────────────────────────────────┐
│  Header: Song Details          [X]      │
├──────────────┬──────────────────────────┤
│              │  Title                    │
│  Album Cover │  Artist                  │
│  (square)    │  Year | Origin | Season  │
│              │  Type                    │
│              │  Song Structure            │
│              │  [Actions]                │
└──────────────┴──────────────────────────┘
```

**Rationale**:
- Album cover as visual anchor on left
- All metadata grouped logically on right
- Clear visual hierarchy
- Responsive: stacks vertically on mobile

**Alternatives considered**:
- Three-column layout: Rejected - too complex, not enough content
- Album cover at top: Rejected - wastes vertical space, less balanced

### Decision 3: On-Demand Spotify Fetching

**Decision**: Fetch Spotify album artwork only when dialog opens, with abort on close.

**Implementation**:
- Use `useSpotifyData` hook which handles loading state
- Fetch triggered by `isOpen && song` dependency
- Abort controller to cancel fetch if dialog closes
- In-memory cache via existing `spotifyMappingService`

**Rationale**:
- Performance: Only fetch when needed
- User experience: No unnecessary API calls
- Cost: Reduces Spotify API usage
- Existing hook handles all edge cases

**Alternatives considered**:
- Pre-fetch all artwork: Rejected - wasteful, slow initial load
- Fetch on song list load: Rejected - unnecessary for songs not viewed

### Decision 4: Dialog Width

**Decision**: Increase from `max-w-2xl` (672px) to `max-w-4xl` (896px) with responsive max-width.

**Rationale**:
- `max-w-4xl` provides ~900px width (close to requested 900-1000px)
- Maintains Tailwind's responsive system
- Two-column layout needs more horizontal space
- Still responsive on smaller screens

**Alternatives considered**:
- Custom width (1000px): Rejected - breaks Tailwind's responsive system
- `max-w-5xl` (1024px): Rejected - too wide, may cause horizontal scroll on some screens

## Risks / Trade-offs

### Risk 1: Spotify API Rate Limiting
**Mitigation**: Existing `spotifyMappingService` caches results in IndexedDB, reducing API calls. On-demand fetching only occurs when dialog opens, not for every song.

### Risk 2: Layout Shift During Image Load
**Mitigation**: `AlbumArtwork` component already handles loading states with placeholder. Use fixed dimensions to prevent layout shift.

### Risk 3: Responsive Layout Breaking
**Mitigation**: Use Tailwind's responsive utilities (`md:flex-row`, `flex-col`) to ensure proper stacking on mobile.

### Risk 4: Performance Impact
**Mitigation**: 
- Fetch only when dialog opens
- Abort fetch if dialog closes early
- Reuse existing cached mappings
- Memoize component to prevent unnecessary re-renders

## Migration Plan

### Phase 1: Layout Refactoring
1. Remove Primary Information section
2. Increase dialog width to `max-w-4xl`
3. Restructure to two-column layout
4. Move metadata to right column

### Phase 2: Spotify Integration
1. Add `useSpotifyData` hook to component
2. Add album cover display in left column
3. Implement loading and error states
4. Add abort controller for fetch cancellation

### Phase 3: Polish
1. Adjust spacing and alignment
2. Test responsive behavior
3. Verify dark mode compatibility
4. Test with songs with/without Spotify mappings

### Rollback Plan
- Keep old layout code in git history
- Can revert individual sections if issues arise
- No database changes, so no migration needed

## Open Questions

- Should album cover size be fixed (e.g., 300x300px) or responsive?
- Should we show loading skeleton for album cover or just placeholder?
- Should we add a "Refresh Spotify Data" button for manual re-fetch?
