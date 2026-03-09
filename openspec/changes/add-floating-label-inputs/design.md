# Design: Floating Label Inputs

## Context

Flutter TextField and Material Design use a floating label: label sits inside the field when empty; on focus or when the field has value, the label moves up and shrinks to sit on the border. We need a reusable, production-quality implementation that works across all form inputs and respects the existing theme system.

## Goals / Non-Goals

- Goals: Single source of truth for floating label behavior; theme tokens; a11y; minimal API change for existing auth forms.
- Non-Goals: Notched border (optional later); no new auth flows or validation logic.

## Decisions

- **Container/label/input structure**: Wrapper `position: relative`; label `position: absolute` with `left` matching input padding; input has extra `padding-top` so typed text does not overlap the floated label. Label “floats” by changing `transform: translateY()` and `scale()` (and optionally font-size) so the label moves up and shrinks.
- **Animation**: 200–250ms duration, `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard). Animate only `transform` and `opacity` for performance.
- **Floated state**: “Floated” when input has focus or `value` is non-empty. Same logic for FloatingInput, FloatingPasswordInput, FloatingTextarea.
- **Auth compatibility**: AuthInput and PasswordInput become thin wrappers around FloatingInput and FloatingPasswordInput so all current usages (Login, Register, AccountSettings) get floating labels without changing imports.

## Risks / Trade-offs

- Placeholder: With floating label, placeholder is redundant when label is present; we hide or ignore placeholder when label is used to avoid clutter.
- Optional success state: Implement as optional prop (e.g. `success?: boolean`) and style border/label when true.

## Migration Plan

1. Add `src/components/inputs/` with FloatingInput, FloatingPasswordInput, FloatingTextarea and shared CSS.
2. Replace implementation of AuthInput/PasswordInput to delegate to FloatingInput/FloatingPasswordInput.
3. Smoke-test Login, Register, AccountSettings; fix any missing imports (e.g. AccountSettingsPage).
