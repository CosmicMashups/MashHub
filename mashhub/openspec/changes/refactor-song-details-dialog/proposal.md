## Why

The Song Details dialog currently displays Primary Key and Primary BPM information that duplicates section-based data already shown in the Song Structure section. The dialog layout is narrow (max-w-2xl, ~672px) and lacks visual balance. Additionally, album artwork from Spotify is not displayed in the details dialog, missing an opportunity to enhance the visual experience with dynamically retrieved album covers.

## What Changes

- **REMOVED**: Primary Information section (Primary Key and Primary BPM display) from Song Details dialog
- **MODIFIED**: Dialog width increased from max-w-2xl (~672px) to max-w-4xl (~900px-1000px)
- **MODIFIED**: Layout restructured to two-column format (album cover left, metadata right)
- **NEW**: Album cover art display using existing Spotify integration infrastructure
- **NEW**: On-demand Spotify album artwork fetching when dialog opens
- **MODIFIED**: Responsive layout that stacks columns on small screens
- **ENHANCEMENT**: Improved visual hierarchy and spacing

## Impact

- Affected specs: ui-components
- Affected code:
  - `src/components/SongDetailsModal.tsx` - Complete layout refactor
  - `src/hooks/useSpotifyData.ts` - Reuse existing hook for album artwork
  - `src/components/AlbumArtwork.tsx` - Reuse existing component
  - No changes to database schema, matching logic, or filtering logic
  - No changes to Spotify service infrastructure (reuses existing integration)
