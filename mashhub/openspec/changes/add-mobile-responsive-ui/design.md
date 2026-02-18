## Context

MashHub is a React web application using TypeScript and Tailwind CSS. The application currently has basic responsive breakpoints (sm, md, lg) but lacks comprehensive mobile optimization. Components use desktop-first layouts with limited mobile adaptations. The application features complex filtering, drag-and-drop project management, data tables, and modal dialogs that need mobile-friendly alternatives.

Current state:
- Basic mobile menu exists but is minimal
- Some components use responsive classes but inconsistently
- Tables are difficult to use on mobile
- Modals are not optimized for mobile screens
- Drag-and-drop doesn't work on touch devices
- Filter dialogs are too complex for small screens

## Goals / Non-Goals

### Goals
- Transform MashHub into a fully responsive, mobile-first application
- Provide optimal UX across all device sizes (320px to 2560px+)
- Maintain 100% feature parity across all devices
- Ensure all interactive elements meet 44×44px minimum touch target size
- Implement mobile-appropriate interaction patterns (bottom sheets, card layouts)
- Optimize performance for mobile devices (lazy loading, virtual scrolling)
- Support safe area insets for notched devices
- Zero breaking changes - all improvements are additive

### Non-Goals
- Creating a separate mobile app (React Native)
- Removing desktop functionality
- Changing data models or API contracts
- Implementing native mobile features (camera, GPS, etc.)
- Supporting very old browsers (<2% usage)
- Creating separate mobile-specific routes

## Decisions

### Decision 1: Mobile-First Breakpoint Strategy

**Decision**: Use standard Tailwind breakpoints with custom xs breakpoint: xs (320px), sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px).

**Rationale**:
- Aligns with industry-standard responsive design practices
- Tailwind's default breakpoints cover most use cases
- Custom xs breakpoint ensures support for small phones
- Consistent with existing codebase patterns

**Alternatives considered**:
- Custom breakpoint system: Rejected - adds complexity without clear benefit
- Fewer breakpoints: Rejected - insufficient granularity for optimal UX

### Decision 2: Bottom Sheet Pattern for Mobile Modals

**Decision**: Use bottom sheet components (slide-up from bottom) for all modals and dialogs on mobile devices (≤768px), while maintaining centered dialogs on desktop.

**Rationale**:
- Bottom sheets are the mobile standard for modal content
- Easier thumb reach on mobile devices
- Better use of vertical space
- Drag handle provides intuitive dismissal
- Aligns with iOS and Android design patterns

**Alternatives considered**:
- Full-screen modals: Rejected - too disruptive, loses context
- Side drawers: Rejected - better for navigation, not content
- Keep centered dialogs: Rejected - poor UX on mobile, hard to reach

### Decision 3: Card-Based Layout for Mobile Song Lists

**Decision**: Display songs as cards on mobile/tablet (≤1023px) and table view on desktop (≥1024px).

**Rationale**:
- Tables are difficult to use on small screens (horizontal scroll, cramped columns)
- Cards provide better information hierarchy on mobile
- Touch-friendly interaction targets
- Better visual separation between items
- Can show more context per item

**Alternatives considered**:
- Responsive table with hidden columns: Rejected - still cramped, poor UX
- List view: Rejected - less visual, harder to scan
- Grid view: Rejected - too much space per item, inefficient

### Decision 4: Button-Based Reordering for Mobile

**Decision**: Replace drag-and-drop with up/down arrow buttons in an "edit mode" for mobile devices.

**Rationale**:
- Drag-and-drop is unreliable on touch devices
- Button-based reordering is more predictable
- Clear visual feedback (disabled states at boundaries)
- Familiar pattern from mobile apps
- Maintains desktop drag-and-drop functionality

**Alternatives considered**:
- Long-press drag: Rejected - inconsistent across devices, accessibility issues
- Swipe gestures: Rejected - conflicts with native scroll, discoverability issues
- Remove reordering on mobile: Rejected - breaks feature parity

### Decision 5: Accordion Layout for Mobile Filters

**Decision**: Use accordion/collapsible sections for filter groups on mobile, fully expanded on desktop.

**Rationale**:
- Reduces cognitive load on small screens
- Progressive disclosure of complexity
- Better use of limited vertical space
- Users can focus on one filter group at a time
- Badge indicators show active filter counts

**Alternatives considered**:
- Fully expanded on mobile: Rejected - overwhelming, poor UX
- Tabs: Rejected - horizontal scrolling issues, less space efficient
- Separate pages: Rejected - too many navigation steps

### Decision 6: Performance Optimizations

**Decision**: Implement lazy loading for heavy components and virtual scrolling for lists with 100+ items.

**Rationale**:
- Mobile devices have limited resources
- Large song lists can cause performance issues
- Virtual scrolling maintains smooth scrolling
- Lazy loading reduces initial bundle size
- Improves perceived performance

**Alternatives considered**:
- Pagination only: Rejected - less efficient, more network requests
- No optimizations: Rejected - poor performance on low-end devices
- Infinite scroll: Rejected - harder to navigate, accessibility concerns

## Risks / Trade-offs

### Risk 1: Increased Bundle Size
**Mitigation**: Use code splitting and lazy loading. Only load mobile-specific components when needed.

### Risk 2: Testing Complexity
**Mitigation**: Use responsive design testing tools, test on real devices, implement visual regression testing.

### Risk 3: Maintenance Overhead
**Mitigation**: Create reusable responsive utilities and components. Document patterns clearly.

### Risk 4: Performance on Low-End Devices
**Mitigation**: Implement performance optimizations (virtual scrolling, debouncing, lazy loading). Test on mid-range devices.

### Trade-off: Desktop vs Mobile Code Paths
**Acceptance**: Some components will have mobile and desktop variants. This is acceptable for optimal UX on each platform.

## Migration Plan

### Phase 1: Foundation (Week 1)
1. Update Tailwind config with breakpoints
2. Create responsive utilities (useMediaQuery hooks)
3. Create Sheet component for bottom sheets
4. Update header with mobile menu drawer

### Phase 2: Core Components (Week 2)
1. Make Hero section responsive
2. Update search bar for mobile
3. Create mobile filter sheet
4. Implement responsive song list (cards/table)

### Phase 3: Advanced Features (Week 3)
1. Mobile song details sheet
2. Responsive project manager
3. Mobile reordering alternative
4. Update all modals to use sheets on mobile

### Phase 4: Polish & Optimization (Week 4)
1. Performance optimizations
2. Safe area support
3. Touch target verification
4. Cross-device testing

### Rollback Plan
- All changes are additive and backward compatible
- Feature flags can disable mobile optimizations if needed
- Desktop experience remains unchanged

## Open Questions

- Should we support landscape orientation optimizations? (Defer to future iteration)
- Do we need tablet-specific layouts? (Use md breakpoint for now)
- Should we implement swipe gestures for navigation? (Defer - evaluate after initial release)
