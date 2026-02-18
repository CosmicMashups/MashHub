## Hook Safety Audit Checklist (MashHub)

This repo is strict about hook-order determinism. Use this checklist when modifying any UI component or custom hook.

### Core Rules of Hooks (Structural)
- Hooks are **top-level only** (no hooks inside conditions, loops, maps, switches, or nested functions).
- Hooks appear **before any early return** (e.g. `if (!isOpen) return null;` must come after hooks).
- Feature flags/toggles **must not change** the number/order of hooks.
- “Enabled” behavior is implemented via **enabled-parameter hooks** (call the hook always; branch *inside* effects).

### High-Risk Patterns to Search For
- Early returns before hooks:
  - `if (...) return null;` / `if (...) return;` / `return <.../>;` before any `use*`
- Conditional hooks:
  - `if (enabled) useX();`
  - `enabled && useX();`
  - `cond ? useX() : ...`
- Hooks in loops/maps:
  - `items.map(() => useX())`
- Branch-heavy components that mix:
  - lazy-loaded modals + `Suspense`
  - mobile/desktop branches
  - async transitions that mount/unmount quickly

### “Complex Component” HOOK SAFETY Header Standard
Add at the top of any complex component/custom hook:

```ts
// HOOK SAFETY: All hooks must remain at top-level and unconditionally executed.
// Do not add hooks inside conditions or loops.
```

### Local Validation (Required)
- `npm run lint`
- `npm run typecheck`
- `npm test`

### Top 10 High-Risk Files / Areas (as of 2026-02)
1. `src/App.tsx` (modal orchestration + async transitions)
2. `src/components/SongModal.tsx` (dense hooks + mobile/desktop branches)
3. `src/components/SongDetailsModal.tsx` (modal + image hooks + mobile/desktop)
4. `src/components/AdvancedFiltersDialog.tsx` (large branchy dialog + memoized handlers)
5. `src/components/SpotifyMatchDialog.tsx` (effect-driven auto search + state)
6. `src/components/EnhancedProjectManager.tsx` (DnD + modal flow + derived state)
7. `src/contexts/DragDropContext.tsx` (DnD event handlers + overlays)
8. `src/hooks/useCoverImage.ts` (async effects + cancellation)
9. `src/hooks/useCoverImagesForSongs.ts` (async effects + caching)
10. `src/hooks/useSpotifyData.ts` (async effects + mapping cache)

