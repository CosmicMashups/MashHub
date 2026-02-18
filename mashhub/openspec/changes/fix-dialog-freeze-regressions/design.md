## Context

MashHub’s dialogs (Song editor, Song details, Advanced Filters, Project Manager, Export, Spotify Match, Utility) orchestrate non-trivial work: Dexie queries, matching engine calls, image and color extraction, and layout-heavy UI. After the hook-order safety refactor, some dialogs appear to “freeze” the UI, suggesting one or more of:

- Heavy synchronous work on mount (e.g., large matching or indexing runs).
- Effects with overly broad or unstable dependencies, causing tight render/effect loops.
- Long-running async operations that aren’t cancelled when dialogs close.

This change focuses on restoring and enforcing responsive dialog behavior without relaxing hook-order guarantees.

## Goals / Non-Goals

- **Goals**
  - Ensure all dialogs open and close without freezing the UI.
  - Bound dialog time-to-interact and avoid blocking the main thread with heavy sync work.
  - Introduce simple patterns for cancellation and debouncing of dialog-related async work.
- **Non-Goals**
  - Redesigning dialog UIs or changing user-visible behavior beyond responsiveness.
  - Rewriting the matching engine or Dexie data model.
  - Changing the previously approved hook-order safety guarantees.

## Decisions

### Decision: Asynchronous dialog initialization

Dialog initialization that requires heavy work (e.g., matching queries, bulk Dexie reads, color extraction) SHALL:

- Run in `useEffect` with **minimal, stable dependencies**.
- Be chunked or deferred (e.g., via `requestIdleCallback`, `setTimeout`, or paging) when operating on large datasets.
- Avoid blocking the first paint of the dialog; basic UI skeletons should render immediately.

### Decision: Cancellation on close

Async work kicked off by dialogs (Dexie queries, network calls, image/color extraction) SHALL be cancellable:

- Use `AbortController` or equivalent cancellation flags.
- Effects must clean up on unmount or when `isOpen` flips to `false`, preventing runaway work after a dialog closes.

### Decision: Guarded effect dependencies

Effects in dialog components and their hooks SHALL:

- Depend on **primitive identities** (IDs, booleans, narrow slices of state) rather than entire objects/arrays when possible.
- Avoid constructing new dependency values inline (e.g., `array.map(...).join(',')`) in the dependency list.
- Use memoization or derived state when necessary to keep dependency sets stable and prevent accidental re-run storms.

## Risks / Trade-offs

- Slightly more complex effect and cancellation logic inside dialog-related hooks.
- Possible need to introduce lightweight “skeleton” states to avoid flashes of uninitialized content.

## Migration Plan

1. Identify and profile the worst offending dialogs using browser devtools (Performance/Profiler, React DevTools).
2. Apply the asynchronous initialization + cancellation patterns to the identified dialogs and their key hooks.
3. Add regression tests (unit/integration/E2E) that open/close dialogs rapidly and assert no long blocks or errors.
4. Re-run lint, typecheck, and tests; adjust as needed.

## Open Questions

- Should we define explicit numeric SLAs for “time-to-interact” per dialog (e.g., 200ms on target hardware), or keep requirements qualitative?
- Do we need an in-app dev-only “performance overlay” or logging for dialog open/close durations, or is E2E + manual profiling sufficient?

