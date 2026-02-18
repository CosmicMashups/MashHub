## Context

MashHub is a reactive, multi-module React 19 + TypeScript application with heavy conditional UI and async transitions (modals, filtering, matching, CSV import, drag-and-drop). Hook-order violations can be introduced unintentionally when:

- Hooks are placed after early returns (`if (...) return ...`)
- Hooks are called inside conditional blocks / loops / map callbacks
- Feature toggles gate hook calls
- Lazy-loaded components and modal sequencing accidentally mount conflicting hook trees during transitions

This change introduces a consistent, enforced architecture that makes hook order deterministic across all render paths.

## Goals / Non-Goals

- Goals:
  - Remove all existing hook-order violations.
  - Establish enforceable conventions so future work cannot regress.
  - Preserve behavior and component APIs.
  - Avoid unnecessary re-renders and keep performance optimizations.
- Non-Goals:
  - Rewriting business logic (matching, filtering semantics).
  - Introducing new external libraries.
  - Converting functional components to class components.

## Decisions

### Decision: “Enabled-parameter” standard for conditional behavior
Custom hooks that are currently only needed when “enabled” SHALL always be called, and accept an `enabled` parameter. Internal effects SHOULD short-circuit when disabled.

- Why: prevents conditional hook call sites and keeps render order deterministic.
- Alternative: conditional render wrappers around the hook call site. Rejected because it’s fragile when the hook is used in multiple branches.

### Decision: Component boundary isolation for branch-heavy UI
When different UI branches need different hook sets, extract branches into subcomponents and render them conditionally:

- Parent remains hook-stable
- Branch-specific hooks live in branch components that mount/unmount as components (not as conditional hook calls)

### Decision: Modal orchestration sequencing
Modal-to-modal transitions SHALL be sequenced so that only one modal component tree that contains hooks is mounted at a time for any given transition (especially when using `React.lazy` + `Suspense`).

### Decision: Enforcement via existing ESLint configuration + automation
The repo already uses ESLint Flat Config and `eslint-plugin-react-hooks`. This change will:

- Keep `react-hooks/rules-of-hooks` at error severity
- Add automation (CI workflow) so hook violations cannot land unobserved

## Risks / Trade-offs

- Risk: Large, cross-cutting refactor could introduce regressions.
  - Mitigation: Phase refactor by module, keep changes mechanical, and add E2E coverage for known crash flows.
- Risk: Over-splitting components could increase prop drilling.
  - Mitigation: Extract only where necessary; prefer local subcomponents; preserve existing APIs.
- Risk: “Enabled-parameter” hooks might create extra effect registrations.
  - Mitigation: Short-circuit inside effects and keep dependency arrays correct; avoid expensive work when disabled.

## Migration Plan

- Phase 1: Add/confirm lint + CI enforcement and add E2E tests that detect console hook-order errors.
- Phase 2: Refactor the known crash flows (modal sequencing and modal components).
- Phase 3: Audit + refactor remaining modules by risk (filters, matching panels, DnD sections, search/results).
- Phase 4: Re-run lint/typecheck/tests and perform rapid UI stress checks.

## Open Questions

- Should we define a concrete “complex component” threshold for the HOOK SAFETY header (e.g., >= 3 hooks), or apply to all modal/dialog components and all custom hooks?
- Should CI run Playwright E2E by default on PRs, or only on a nightly schedule (given runtime cost)?

