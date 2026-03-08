## Context

MashHub currently uses Tailwind CSS with class-based dark mode switching. Components directly reference Tailwind color classes (e.g., `bg-gray-800`, `text-gray-600`) throughout the codebase, leading to:

- Inconsistent color usage across similar UI elements
- Hard-coded color values that don't adapt to theme changes
- Visual inconsistencies where components clash with backgrounds
- Maintenance burden when updating colors requires changes across many files
- Accessibility concerns with insufficient contrast in some dark mode combinations
- Legacy CSS rules in `index.css` that conflict with Tailwind's dark mode

The theme toggle works at a technical level (switches `dark` class on document root), but components don't consistently use dark mode variants, and there's no centralized color system to ensure visual harmony.

## Goals / Non-Goals

### Goals
- Centralize all color definitions in a single theme configuration
- Eliminate hard-coded color values from component code
- Ensure visual consistency across light and dark modes
- Establish clear elevation/surface hierarchy
- Standardize text contrast levels
- Maintain WCAG AA accessibility standards
- Improve maintainability and scalability of color system
- Ensure theme changes apply immediately without component reload

### Non-Goals
- Redesigning layouts or component structure
- Changing business logic or functionality
- Adding new theme options beyond light/dark
- Modifying Tailwind CSS configuration structure (extending, not replacing)
- Performance optimizations unrelated to theme system

## Decisions

### Decision 1: Theme Token Architecture

**Decision**: Extend Tailwind's theme configuration with semantic color tokens that map to both light and dark modes, using CSS custom properties for runtime theme switching.

**Rationale**:
- Tailwind already provides excellent dark mode support via class-based switching
- Extending Tailwind's theme keeps us within the existing toolchain
- CSS custom properties enable runtime theme switching without rebuilds
- Semantic naming (e.g., `surface`, `textPrimary`) improves maintainability
- Single source of truth for all colors

**Alternatives considered**:
- Separate theme object in JavaScript: Rejected - requires runtime JavaScript for color application, adds complexity
- CSS-only approach without Tailwind: Rejected - would require rewriting all components, loses Tailwind's utility benefits
- Third-party theme library: Rejected - adds dependency, may conflict with Tailwind

### Decision 2: Color Token Structure

**Decision**: Organize tokens by semantic purpose (background, surface, text, border, accent, state) with explicit light/dark variants.

**Structure**:
```
theme = {
  background: { primary, secondary }
  surface: { base, elevated, hover, selected }
  text: { primary, secondary, muted, disabled }
  border: { default, subtle, strong }
  accent: { primary, secondary, success, danger, warning }
  state: { hover, focus, active, disabled }
}
```

**Rationale**:
- Semantic naming makes component code more readable
- Clear hierarchy prevents color misuse
- Explicit light/dark variants ensure proper contrast
- Grouped by purpose simplifies maintenance

**Alternatives considered**:
- Flat color list: Rejected - harder to understand relationships and hierarchy
- Component-specific tokens: Rejected - creates duplication, harder to maintain consistency

### Decision 3: Component Refactoring Strategy

**Decision**: Replace direct Tailwind color classes with semantic utility classes that map to theme tokens, using a systematic component-by-component approach.

**Approach**:
1. Create theme token system first
2. Create utility classes that consume tokens
3. Refactor components in dependency order (base → complex)
4. Remove legacy CSS color rules
5. Validate visual consistency

**Rationale**:
- Incremental approach reduces risk
- Dependency order ensures base components are ready before complex ones
- Utility classes maintain Tailwind's developer experience
- Systematic approach ensures nothing is missed

**Alternatives considered**:
- Big-bang refactor: Rejected - too risky, hard to validate incrementally
- Component-by-component without utilities: Rejected - would require inline styles or complex className logic

### Decision 4: Elevation and Surface Hierarchy

**Decision**: Define explicit surface levels with appropriate contrast for both light and dark modes, using shadows for light mode and subtle background variations for dark mode.

**Levels**:
- Base: Main background
- Surface: Cards, panels (slight elevation)
- Elevated: Dialogs, overlays (significant elevation)
- Hover: Interactive element hover state
- Selected: Active/selected state

**Rationale**:
- Clear hierarchy improves visual organization
- Different elevation strategies for light/dark account for perceptual differences
- Prevents components from visually clashing

**Alternatives considered**:
- Same elevation strategy for both modes: Rejected - dark backgrounds need different contrast approach
- No explicit hierarchy: Rejected - leads to visual inconsistencies

## Risks / Trade-offs

### Risk 1: Breaking Visual Consistency During Migration
**Mitigation**: Refactor in dependency order, test each component after refactoring, maintain visual regression testing checklist

### Risk 2: Performance Impact of CSS Custom Properties
**Mitigation**: CSS custom properties are well-optimized in modern browsers, minimal performance impact expected. If issues arise, can fall back to Tailwind's class-based approach with theme extension.

### Risk 3: Developer Confusion with New Token System
**Mitigation**: Document token system clearly, provide examples, create utility classes that match familiar Tailwind patterns

### Risk 4: Accessibility Regression
**Mitigation**: Validate contrast ratios for all token combinations, use automated accessibility testing tools, manual testing with screen readers

## Migration Plan

### Phase 1: Foundation
1. Create theme token definitions in `tailwind.config.js`
2. Create CSS custom properties for runtime theme switching
3. Create utility classes that consume tokens
4. Remove legacy CSS color rules from `index.css`

### Phase 2: Component Refactoring
1. Refactor base components (buttons, inputs, cards)
2. Refactor layout components (header, footer, containers)
3. Refactor complex components (dialogs, dropdowns, lists)
4. Refactor component-specific color logic (e.g., `getKeyColor`)

### Phase 3: Validation
1. Visual consistency check across all components
2. Accessibility validation (contrast, keyboard navigation)
3. Theme toggle functionality verification
4. Performance check (no regression)

### Rollback Plan
- Keep old color classes in git history
- Can revert individual components if issues arise
- Theme token system is additive, doesn't break existing classes

## Open Questions

- Should we create a theme preview/development tool to visualize all tokens?
- Do we need to support custom theme variations beyond light/dark in the future?
- Should we generate TypeScript types for theme tokens to catch errors at compile time?
