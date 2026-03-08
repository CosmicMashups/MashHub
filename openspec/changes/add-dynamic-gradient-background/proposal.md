## Why

The Song Details dialog currently uses a static background color. Extracting dominant colors from the cover artwork (Jikan/Spotify) and using them as a gradient background would create a more immersive, visually cohesive experience that connects the dialog to the song's visual identity.

## What Changes

- **NEW**: Create `useImageColors` hook to extract dominant colors from cover images
- **NEW**: Add color extraction utility using Canvas API or library (colorthief/node-vibrant)
- **NEW**: Apply dynamic gradient background to Song Details dialog based on extracted colors
- **MODIFIED**: Update SongDetailsModal to use dynamic gradient instead of static background
- **NEW**: Add fallback to default theme colors if color extraction fails
- **NEW**: Cache extracted colors to avoid re-computation

## Impact

- Affected specs: ui-components (modified)
- Affected code:
  - `src/hooks/useImageColors.ts` - New hook for color extraction
  - `src/utils/imageColorExtractor.ts` - New utility for color extraction
  - `src/components/SongDetailsModal.tsx` - Apply dynamic gradient background
  - No breaking changes to existing functionality
