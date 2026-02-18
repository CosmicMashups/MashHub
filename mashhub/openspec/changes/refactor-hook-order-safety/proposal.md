## Why

MashHub has hit production-breaking React hook-order violations (e.g. “Rendered more hooks than during the previous render.”) during rapid UI transitions (notably modal-to-modal flows such as Song Details → Edit Song). In a complex UI with lazy-loaded modals, feature branches, and async transitions, even a single conditional hook or hook-after-early-return can crash the component tree and force React to remount via error boundaries.

The goal of this change is to eliminate current hook-order violations and establish structural guardrails so future work cannot reintroduce them.

## What Changes

- **ADDED**: A Hook Safety architecture standard for all React components and custom hooks:
  - Hooks remain top-level and unconditionally executed
  - No hooks inside conditions, loops, maps, switches, or nested functions
  - No hooks after any early return
  - No feature-flag / toggle branches that change hook execution count
- **MODIFIED**: Modal orchestration patterns so transitions (e.g., Details → Edit) do not create transient hook-order hazards during lazy-loading and async state changes.
- **ADDED**: Quality gates to “permanently prevent” regressions:
  - ESLint `react-hooks/rules-of-hooks` must be enforced as errors
  - Add automated checks (CI) to run lint + typecheck + tests on PRs
- **ADDED**: Targeted E2E coverage for the previously failing flows (Edit Song from Actions column and from Song Details) and for rapid transitions that historically trigger hook-order errors.

## Impact

- Affected specs:
  - `ui-components`
  - `quality-gates`
- Affected code (expected hotspots; exact list driven by audit + refactor tasks):
  - `src/components/**` (modals, filtering UI, matching panels, list views)
  - `src/hooks/**` (custom hooks with “enabled” semantics or async guards)
  - `src/contexts/**` (drag-and-drop orchestration, section rendering boundaries)
  - `src/App.tsx` (modal orchestration)
  - `.github/workflows/**` (new CI workflow)

