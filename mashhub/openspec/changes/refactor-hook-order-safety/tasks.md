## 1. Audit and Guardrails
- [x] 1.1 Run `npm run lint` and capture baseline hook-related failures (if any)
- [x] 1.2 Run `npm run typecheck` to capture baseline typing failures (if any)
- [x] 1.3 Add an audit checklist (repo note) for hook-safety patterns to review during refactor (conditions, loops, early returns, feature flags, switches, nested functions)
- [x] 1.4 Identify and list the top 10 “highest risk” components/hooks (modals, filtering, matching, DnD) based on hook density + branching

## 2. Enforce Hook Safety Standards (Mechanical Refactor)
- [x] 2.1 Refactor all components with hooks after early returns so all hooks appear before any conditional return
- [x] 2.2 Refactor all conditional hook patterns to “enabled-parameter” patterns inside hooks
- [x] 2.3 Refactor hooks inside loops/maps by extracting dedicated subcomponents (or refactor data flow so hooks are top-level in a stable child)
- [x] 2.4 Refactor switch/ternary patterns that gate hook execution into stable components or enabled-parameter hooks
- [x] 2.5 Add the HOOK SAFETY header comment to complex components and custom hooks touched during this change

## 3. Modal Orchestration Hardening
- [x] 3.1 Confirm “Details → Edit Song” transition sequences unmount/mount deterministically (no overlapping modal trees)
- [x] 3.2 Ensure modal lazy-loading boundaries cannot cause transient multi-mount hook-order hazards
- [x] 3.3 Add stress test paths: rapidly open/close modals, toggle theme while modal open, and switch selected song rapidly

## 4. Quality Gates (Permanent Regression Prevention)
- [x] 4.1 Add a GitHub Actions workflow to run `npm ci`, `npm run lint`, `npm run typecheck`, and `npm run test` on PRs
- [x] 4.2 Add/expand E2E tests to cover:
  - [x] 4.2.1 Click “Edit Song” from Actions column opens Edit modal successfully
  - [x] 4.2.2 Open Song Details then click “Edit Song” opens Edit modal successfully
  - [x] 4.2.3 Fail the test on any console error containing hook-order messages
- [x] 4.3 Document the required local validation steps in `README.md` (lint/typecheck/test + smoke flows)

## 5. Verification
- [x] 5.1 Verify no runtime “Rendered more hooks…” errors across:
  - modal toggling
  - filter changes
  - project section reordering
  - CSV reloads
  - theme switching
  - rapid UI state transitions
- [x] 5.2 Ensure all changes preserve existing component APIs and behavior

