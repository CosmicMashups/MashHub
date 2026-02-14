## Why

The current theme implementation has scattered hard-coded color values across components, inconsistent dark mode styling, and lacks a centralized design token system. This creates visual inconsistencies, maintenance challenges, and makes it difficult to ensure proper contrast and accessibility. Components often visually clash with their backgrounds or fail to adapt properly when theme state changes.

## What Changes

- **BREAKING**: Remove all hard-coded color values from components (backgrounds, text, borders, hover states)
- **NEW**: Create centralized theme token system with semantic color names
- **NEW**: Implement theme-driven CSS variables or Tailwind theme extension
- **MODIFIED**: Refactor all components to consume theme tokens instead of direct color classes
- **MODIFIED**: Standardize elevation and surface hierarchy for both light and dark modes
- **MODIFIED**: Normalize text contrast hierarchy (primary, secondary, muted, disabled)
- **MODIFIED**: Standardize interactive states (hover, focus, active, disabled) using theme tokens
- **CLEANUP**: Remove legacy CSS color rules that conflict with Tailwind
- **CLEANUP**: Eliminate duplicate or dead color variables
- **ENHANCEMENT**: Ensure theme toggle updates all components immediately without reload

## Impact

- Affected specs: theme-system (new capability)
- Affected code:
  - `tailwind.config.js` - Theme token definitions
  - `src/index.css` - Remove legacy color rules, add theme variables
  - `src/hooks/useTheme.ts` - Ensure proper theme state management
  - All component files in `src/components/` - Refactor to use theme tokens
  - `src/App.tsx` - Header and main layout color refactor
  - Component-specific color logic (e.g., `getKeyColor` in SongList) - Move to theme system
