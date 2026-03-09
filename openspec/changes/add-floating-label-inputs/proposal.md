# Add Floating Label Inputs

## Why

Form inputs currently use a static label-above-input pattern. A Flutter/Material-style floating label improves clarity, reduces vertical space, and aligns with modern UI expectations across login, register, settings, and other forms.

## What Changes

- New reusable input components under `src/components/inputs/`: FloatingInput, FloatingPasswordInput, FloatingTextarea.
- Floating label behavior: label starts inside the field; on focus or when filled, label animates upward and shrinks to sit on the top border.
- Support for states: default, focused, filled, error, disabled, optional success.
- Animations: 200–250ms, ease-out/cubic-bezier; GPU-friendly (transform, opacity).
- Theming via design tokens (light/dark); accessibility (htmlFor, aria-invalid, focus, screen readers).
- Migration: AuthInput and PasswordInput (auth) use the new floating components so all existing forms get the behavior without changing every consumer.

## Impact

- Affected code: `src/components/inputs/*`, `src/components/auth/AuthInput.tsx`, `src/components/auth/PasswordInput.tsx`, `src/styles/auth.css` or new `floating-input.css`, theme tokens in `src/index.css` if new tokens needed.
- No breaking API change for auth components; optional new exports from `src/components/inputs/` for direct use elsewhere.
