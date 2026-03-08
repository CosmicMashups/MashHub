## Context

The current application layout includes a Library Overview section that displays basic statistics (total songs count) in a simple card format. This section provides minimal value as the same information is available in the Utility Dialog. The application lacks a compelling visual introduction that communicates MashHub's core value proposition and capabilities.

The application is a React web application using TypeScript and Tailwind CSS. The layout structure is:
- Header (sticky, top of page)
- Main content area containing:
  - Search Section (AdvancedSearchBar, InlineFilters)
  - Library Overview (to be removed)
  - Song List

## Goals / Non-Goals

### Goals
- Create a premium, high-impact Hero Section that immediately communicates MashHub's value
- Replace the visual and informational role of the removed Library Overview
- Improve perceived product quality and first impressions
- Maintain all existing functionality (no breaking changes)
- Ensure responsive design across all screen sizes
- Use web-appropriate technologies (React, Tailwind CSS, CSS animations)

### Non-Goals
- Modifying the header component
- Modifying the search bar component
- Breaking pagination or filtering logic
- Implementing React Native components (this is a web application)
- Adding heavy bitmap assets or complex animations
- Changing database schema or API endpoints

## Decisions

### Decision 1: Web-Based Implementation (Not React Native)

**Decision**: Implement Hero Section using React web components with Tailwind CSS, not React Native.

**Rationale**:
- The codebase is a React web application (uses Tailwind CSS, web-specific patterns)
- User mentioned "React Native" but the codebase clearly uses web technologies
- Tailwind CSS provides excellent utility classes for gradients, glassmorphism, and responsive design
- CSS animations are performant and appropriate for web

**Alternatives considered**:
- React Native implementation: Rejected - codebase is web-based, not mobile app

### Decision 2: Component Placement

**Decision**: Position Hero Section between Header and Search Bar in the main content area.

**Layout Structure**:
```
Header (sticky)
↓
Hero Section (new)
↓
Search Section (AdvancedSearchBar, InlineFilters)
↓
Song List
```

**Rationale**:
- Provides immediate visual impact when page loads
- Natural flow: Header → Hero (introduction) → Search (action) → Results
- Maintains existing search and filter functionality
- No disruption to existing layout hierarchy

**Alternatives considered**:
- Above Header: Rejected - Header should remain at top for navigation
- Below Search Bar: Rejected - Hero should introduce the app before user actions

### Decision 3: Two-Column Responsive Layout

**Decision**: Desktop: Left column (content), Right column (decorative visual). Mobile: Stacked vertically.

**Rationale**:
- Balanced visual composition on desktop
- Content-first approach (left column has primary information)
- Responsive stacking ensures mobile usability
- Decorative visual adds visual interest without overwhelming content

**Alternatives considered**:
- Single column: Rejected - Less visually interesting, doesn't utilize wider screens
- Three columns: Rejected - Too complex, not enough content

### Decision 4: Statistics Integration

**Decision**: Display Total Songs, Total Projects, and Supported Years in a statistics strip within the Hero Section.

**Rationale**:
- Replaces the informational role of Library Overview
- Provides immediate context about the library
- Supports Years adds unique value not shown elsewhere
- Compact format doesn't overwhelm the hero content

**Alternatives considered**:
- Remove statistics entirely: Rejected - Users expect to see library metrics
- Separate statistics section: Rejected - Redundant with Hero Section purpose

### Decision 5: Animation Approach

**Decision**: Use CSS animations (fade-in + translateY) with Tailwind's animation utilities, avoiding heavy JavaScript animations.

**Rationale**:
- CSS animations are performant and GPU-accelerated
- Tailwind provides built-in animation utilities
- No need for additional animation libraries
- Maintains 60fps smoothness
- Simple entrance animation is sufficient (no complex loops needed)

**Alternatives considered**:
- Framer Motion: Rejected - Unnecessary complexity for simple entrance animation
- React Spring: Rejected - Overkill for fade-in animation
- No animation: Rejected - Entrance animation improves perceived quality

### Decision 6: Color System Integration

**Decision**: Use existing theme system (theme tokens) with music-tech palette accents.

**Rationale**:
- Maintains consistency with existing design system
- Leverages theme tokens for dark/light mode support
- Music-tech palette (indigo, purple, cyan) aligns with application branding
- Ensures accessibility through existing contrast system

**Alternatives considered**:
- Completely new color system: Rejected - Breaks design consistency
- Hard-coded colors: Rejected - Doesn't support theme switching

## Risks / Trade-offs

### Risk 1: Layout Shift During Load
**Mitigation**: Use fixed heights or aspect ratios for Hero Section container. Implement skeleton loading if needed.

### Risk 2: Performance Impact from Animations
**Mitigation**: Use CSS animations (GPU-accelerated), avoid heavy JavaScript, test on lower-end devices.

### Risk 3: Responsive Layout Breaking
**Mitigation**: Use Tailwind's responsive utilities, test on multiple screen sizes, use flexbox/grid appropriately.

### Risk 4: Statistics Calculation Performance
**Mitigation**: Calculate Supported Years efficiently (use Set for unique years), memoize calculations if needed.

### Risk 5: Visual Clash with Existing Design
**Mitigation**: Use existing theme tokens, maintain consistent spacing system, test dark/light mode compatibility.

## Migration Plan

### Phase 1: Remove Library Overview
1. Remove Library Overview markup from `src/App.tsx`
2. Remove any unused state or computed values
3. Test layout for gaps or spacing issues
4. Verify no broken functionality

### Phase 2: Create Hero Section Component
1. Create `src/components/HeroSection.tsx`
2. Implement basic structure and layout
3. Add content (title, slogan, description)
4. Add feature badges
5. Add CTA buttons
6. Add statistics strip

### Phase 3: Visual Design
1. Implement gradient backgrounds
2. Add glassmorphism effects
3. Add decorative elements
4. Implement animations
5. Test dark/light mode

### Phase 4: Integration
1. Import and place Hero Section in `src/App.tsx`
2. Pass required props
3. Test layout flow
4. Verify responsive behavior
5. Test all functionality

### Phase 5: Polish and Optimization
1. Performance optimization
2. Accessibility improvements
3. Code cleanup
4. Final testing

### Rollback Plan
- Keep Library Overview code in git history
- Can revert individual sections if issues arise
- No database changes, so no migration needed

## Open Questions

- Should CTA buttons navigate to specific sections or trigger actions?
- Should statistics update in real-time or only on mount?
- Should decorative visual be abstract shapes or music-themed (waveform, notes)?
- Should Hero Section be dismissible/collapsible for returning users?
