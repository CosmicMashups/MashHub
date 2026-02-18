## ADDED Requirements

### Requirement: Hook-Order Determinism for UI Components
All React function components and custom hooks in the UI layer SHALL comply with the Rules of Hooks. Hooks MUST be called:

- At the top level of the component or custom hook
- Unconditionally (no conditional calls, loops, map callbacks, switches, ternaries, or short-circuit calls)
- Before any early return statements

This requirement applies to all UI components in `src/components/**`, all context components in `src/contexts/**`, and all custom hooks in `src/hooks/**`.

#### Scenario: No hooks after early return
- **WHEN** a component includes early return branches (e.g., closed modal, loading state, missing data)
- **THEN** all hooks SHALL still be executed before the early return, and the component SHALL NOT vary the number/order of hooks between renders

#### Scenario: No conditional hooks behind feature flags or toggles
- **WHEN** a feature toggle or flag is turned on/off (e.g., filtering panels, matching panels, theme switching)
- **THEN** hook execution count/order SHALL remain unchanged, and conditional behavior SHALL be implemented via enabled-parameter hooks or conditional subcomponents

#### Scenario: No hooks inside loops or map callbacks
- **WHEN** rendering lists of sections or items (e.g., project sections with drag-and-drop)
- **THEN** hooks SHALL NOT be called inside list iteration callbacks, and branch-specific hooks SHALL be isolated into dedicated child components

#### Scenario: Deterministic modal transitions
- **WHEN** a user transitions between modal flows (e.g., Song Details → Edit Song)
- **THEN** the application SHALL NOT trigger hook-order errors, and hook execution SHALL be deterministic across rapid state transitions and lazy-loaded modal boundaries

### Requirement: Hook Safety Comment Standard
Complex UI components and custom hooks that use multiple hooks and/or contain significant conditional UI branches SHALL include the following header comment at the top of the file:

`// HOOK SAFETY: All hooks must remain at top-level and unconditionally executed.`
`// Do not add hooks inside conditions or loops.`

#### Scenario: Review-time safety signal
- **WHEN** modifying a complex component or hook
- **THEN** the file SHALL include the Hook Safety header comment to discourage introducing conditional hooks or hook-after-return patterns

