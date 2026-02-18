## Why

MashHub has grown to encompass section-based song architecture, Spotify integration, multi-part harmonic filtering, and a Jikan cover system — but the codebase carries compounding technical debt: N+1 database queries on every render, a Fuse.js index rebuilt from scratch on every song mutation, no TypeScript strict mode, no Web Workers for blocking CSV/XLSX operations, missing component memoization, no granular error boundaries, absent Content Security Policy, and zero accessibility guarantees. These gaps cause measurable UI jank, silent data corruption risks, and increasing maintenance cost as new capabilities are layered on.

## What Changes

- **TypeScript strictness**: Enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `noImplicitOverride` in `tsconfig.json`; eliminate all `any` types; centralize domain types in `/src/types/index.ts`.
- **React performance**: Wrap pure presentational components (`SongCard`, `SongListItem`, `MatchResultCard`, `ProjectSectionRow`, `FilterTag`, `SearchSuggestionItem`) in `React.memo`; audit every `useEffect`/`useMemo`/`useCallback` dependency array; implement `@tanstack/react-virtual` for the main song list; code-split heavy modals with `React.lazy` + `Suspense`.
- **Service layer optimization**: Eliminate N+1 patterns in `getQuickMatches`, `getProjectWithSections`, and `songService.getAll` by using `anyOf` batch queries; manage the Fuse.js instance in a stable `useRef` with incremental `add`/`remove` updates instead of full reconstruction; extract `SectionRepository` with bulk-fetch and Map-keyed cache; wrap multi-table writes in `db.transaction`.
- **Build optimization**: Add `manualChunks` to `vite.config.ts` for vendor splitting; enable `vite-plugin-compression` for gzip/Brotli; add `vite-plugin-pwa` for service worker and offline support.
- **Error resilience**: Add granular `<ErrorBoundary>` wrappers per major UI section; catch `QuotaExceededError` and version-mismatch Dexie errors; implement `cleanOrphanedSections()` background maintenance; accumulate per-row CSV import errors and surface a summary modal.
- **Security hardening**: Add `Content-Security-Policy` meta tag to `index.html`; sanitize CSV export cells starting with `=`, `+`, `-`, `@`; run Dexie schema integrity check on `open()`.
- **Accessibility**: Add `aria-label` / `role` / `aria-modal` / `aria-live` coverage to all interactive elements; ensure modals trap focus; keyboard-navigate search suggestions with arrow keys + Escape.
- **Testing coverage**: Write Vitest unit tests for `SearchService`, `MatchingService`, `sectionNormalization`, and CSV parsing; add Dexie CRUD integration tests; add Playwright E2E tests for import, search, drag-reorder, XLSX export, and theme persistence.
- **Constants extraction**: Extract all magic numbers (Fuse threshold, BPM weights, tolerance defaults) to `/src/constants/index.ts`.
- **Dead code elimination**: Remove unused components, imports, and utility functions surfaced by `ts-prune` / ESLint `no-unused-vars`.

## Impact

- Affected capabilities: typescript-strictness, react-performance, service-layer-optimization, build-optimization, error-resilience, security-hardening, accessibility, testing-coverage
- Affected code:
  - `src/services/database.ts` — N+1 elimination, transactions
  - `src/services/searchService.ts` — Fuse.js lifecycle
  - `src/services/matchingService.ts` — pre-computed key distances, section cache
  - `src/services/exportService.ts` — CSV injection prevention, Web Worker offload
  - `src/services/fileService.ts` — Web Worker CSV parsing
  - `tsconfig.json` — strictness flags
  - `vite.config.ts` — chunk splitting, compression, PWA
  - `index.html` — CSP meta tag
  - `src/components/*` — memoization, error boundaries, ARIA
  - `src/App.tsx` — state colocation, lazy modal imports

## Non-Breaking Guarantees

- IndexedDB schema version is NOT changed; no new migrations are introduced.
- Exported CSV/XLSX column names and order are preserved.
- Fuse.js threshold (0.6) is preserved.
- Match scoring weights (BPM 0.4, Key 0.3/0.45) are preserved.
- All existing keyboard shortcuts and drag-drop behavior are preserved.
- User-visible UI behavior and project data integrity are unchanged.

## Relationship to Active Changes

This proposal intentionally avoids scope overlap with:
- `optimize-performance-pagination` (pagination logic, page size)
- `refactor-filter-ui-architecture` (filter panel layout/state)
- `refactor-section-based-architecture` (DB schema, section model)
- `refactor-theme-system` (theme token system)
- `add-multi-part-harmonic-filters` (filter block UI)
- `fix-part-specific-key-scoring` (scoring algorithm correctness)
- `fix-dialog-freeze-regressions` (dialog render blocking)

It complements all of them by hardening the shared infrastructure they depend on.
