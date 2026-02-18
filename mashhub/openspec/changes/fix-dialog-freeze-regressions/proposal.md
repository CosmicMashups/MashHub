## Why

After the hook-order safety refactor, some MashHub dialog boxes (e.g. Advanced Filters, Song modal, Export dialogs) can cause the UI to feel frozen or unresponsive after opening. These freezes are likely due to heavy synchronous work (match computations, Dexie queries, image/color extraction) or effect dependency regressions triggered when dialogs mount, and they undermine trust in the app during critical workflows.

## What Changes

- **MODIFIED**: Dialog initialization and heavy work patterns so that opening any dialog (Song, Filters, Project Manager, Export, Spotify Match, Utility) does not block the main thread or create apparent freezes.
- **ADDED**: Explicit responsiveness requirements for dialog open/close flows (time-to-interact bounds, non-blocking async work, cancellation of long-running operations when dialogs close).
- **ADDED**: Lightweight observability and testing hooks so regressions (e.g., infinite effects or blocking loops) around dialogs can be detected quickly.

## Impact

- Affected specs:
  - `ui-components`
  - `performance`
- Affected code (expected hotspots):
  - `src/components/SongModal.tsx`
  - `src/components/SongDetailsModal.tsx`
  - `src/components/AdvancedFiltersDialog.tsx`
  - `src/components/EnhancedProjectManager.tsx`
  - `src/components/EnhancedExportModal.tsx`
  - `src/components/ImportExportModal.tsx`
  - `src/components/SpotifyMatchDialog.tsx`
  - `src/components/UtilityDialog.tsx`
  - Supporting hooks/services invoked during dialog initialization (matching service, Dexie-backed hooks, image/color hooks)

