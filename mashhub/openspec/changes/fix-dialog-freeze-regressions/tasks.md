## 1. Reproduce and Profile
- [ ] 1.1 Identify which dialogs cause visible freezes (SongModal, AdvancedFiltersDialog, EnhancedProjectManager, Export dialogs, SpotifyMatchDialog, UtilityDialog).
- [ ] 1.2 Reproduce freezes locally with React DevTools and browser performance profiling (CPU timeline, React Profiler).
- [ ] 1.3 Capture concrete scenarios (which dialog, what data size, what user action) and note any tight render/effect loops or long main-thread blocks.

## 2. Dialog Initialization Refactor
- [ ] 2.1 Audit each dialog’s `useEffect`/`useMemo`/`useCallback` dependencies for patterns that can cause re-run storms (derived arrays, joins, inline objects).
- [ ] 2.2 Move heavy initialization work (matching, Dexie queries, image/color extraction) into guarded, asynchronous effects that:
  - [ ] 2.2.1 Only run when the dialog is actually open.
  - [ ] 2.2.2 Use minimal, stable dependencies (IDs, booleans) rather than whole objects.
- [ ] 2.3 Introduce or refine “loading/skeleton” states so dialogs render basic UI immediately while heavier work completes in the background.

## 3. Cancellation and Clean-up
- [ ] 3.1 Ensure every long-running async operation started by a dialog has a clear cancellation path (AbortController, flags).
- [ ] 3.2 Verify that closing a dialog or rapidly switching items (e.g., different songs) cancels outstanding work and does not leak event listeners or observers.

## 4. Regression Tests and Guardrails
- [ ] 4.1 Add targeted tests (unit/integration/E2E) that:
  - [ ] 4.1.1 Open and close each dialog multiple times in quick succession without freezes or unhandled errors.
  - [ ] 4.1.2 Open dialogs while background work (matching, Dexie, image/color extraction) is in-flight.
- [ ] 4.2 Extend existing E2E console-error checks to include timeouts or unhandled promise rejections from dialog flows where feasible.

## 5. Verification
- [ ] 5.1 Re-run `npm run lint`, `npm run typecheck`, and `npm test` and confirm they pass.
- [ ] 5.2 Manually spot-check dialog responsiveness on a representative dataset (search, filter, project management, export, Spotify match).
- [ ] 5.3 Update any relevant docs (e.g., `HOOK_SAFETY_AUDIT.md`) with the chosen async + cancellation patterns for dialog work.

