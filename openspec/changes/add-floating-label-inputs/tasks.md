# Tasks: Add Floating Label Inputs

## 1. OpenSpec and scope

- [x] 1.1 Confirm scope from proposal (floating label, states, theme tokens, a11y, migration via auth components)

## 2. Reusable floating input components

- [x] 2.1 Create `src/components/inputs/FloatingInput.tsx` (label, value, onChange, type, error, disabled, required, placeholder, icon, helperText)
- [x] 2.2 Create `src/components/inputs/FloatingPasswordInput.tsx` (same props + visibility toggle, optional strength)
- [x] 2.3 Create `src/components/inputs/FloatingTextarea.tsx` (floating label for textarea)
- [x] 2.4 Create `src/components/inputs/index.ts` and export components

## 3. Styling and animation

- [x] 3.1 Add floating-input CSS: label position/transform, 200–250ms transition, cubic-bezier(0.4,0,0.2,1), theme tokens for border/label/error
- [x] 3.2 Support states: default, focused, filled, error, disabled, optional success
- [x] 3.3 Ensure GPU-friendly properties (transform, opacity); padding so text does not overlap label

## 4. Accessibility and theming

- [x] 4.1 Label associated with input (htmlFor/id); aria-invalid when error; error message readable by screen readers
- [x] 4.2 Use design tokens for colors (light/dark); no hard-coded hex for state colors

## 5. Integration

- [x] 5.1 Refactor AuthInput to use FloatingInput (preserve existing props API)
- [x] 5.2 Refactor PasswordInput to use FloatingPasswordInput (preserve existing props API)
- [x] 5.3 Verify Login, Register, AccountSettings pages work with floating labels
- [x] 5.4 Fix AccountSettingsPage missing imports (useAuthContext, useTheme, Footer) if any

## 6. Completion

- [x] 6.1 Update this checklist so each task is marked done
