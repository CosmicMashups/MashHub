## 1. Foundation Setup

- [x] 1.1 Update `tailwind.config.js` to add custom `xs` breakpoint (320px) and document breakpoint strategy
- [x] 1.2 Create `src/hooks/useMediaQuery.ts` with `useMediaQuery`, `useIsMobile`, `useIsTablet`, `useIsDesktop` hooks
- [x] 1.3 Create `src/components/ui/Sheet.tsx` component for bottom sheet functionality (using framer-motion)
- [x] 1.4 Create `src/components/ui/ResponsiveContainer.tsx` wrapper component with responsive padding
- [x] 1.5 Add safe area inset CSS variables support in `src/index.css` or `src/App.css`

## 2. Header and Navigation

- [x] 2.1 Create `src/components/MobileMenuDrawer.tsx` component with slide-in animation and backdrop
- [x] 2.2 Update `src/App.tsx` header to conditionally show mobile menu button (hidden on lg+)
- [x] 2.3 Update `src/App.tsx` header to hide desktop navigation on mobile (hidden below lg)
- [x] 2.4 Integrate MobileMenuDrawer into `src/App.tsx` with proper state management
- [x] 2.5 Ensure all header interactive elements meet 44×44px minimum touch target size
- [ ] 2.6 Test mobile menu drawer open/close interactions and backdrop dismissal

## 3. Hero Section Responsive Updates

- [x] 3.1 Update `src/components/HeroSection.tsx` to use responsive typography (text-4xl mobile → text-7xl desktop)
- [x] 3.2 Update `src/components/HeroSection.tsx` to stack badges vertically on mobile (sm breakpoint)
- [x] 3.3 Update `src/components/HeroSection.tsx` CTA buttons to be full-width on mobile, auto-width on sm+
- [x] 3.4 Update `src/components/HeroSection.tsx` statistics grid: 2-column mobile, 3-column md+
- [x] 3.5 Update `src/components/HeroSection.tsx` padding: py-12 mobile, py-16 tablet, py-24 desktop
- [x] 3.6 Reduce animated shapes on mobile for performance (hide some on small screens)

## 4. Search Bar and Filters

- [ ] 4.1 Update `src/components/AdvancedSearchBar.tsx` to show icon-only filter button on mobile with badge
- [ ] 4.2 Update `src/components/AdvancedSearchBar.tsx` to show text filter button on desktop
- [ ] 4.3 Update `src/components/AdvancedSearchBar.tsx` active filters: compact summary on mobile, individual tags on desktop
- [x] 4.4 Ensure search input has minimum 44px height on mobile
- [x] 4.5 Create `src/components/FilterSheet.tsx` mobile variant of filter dialog (bottom sheet) - Integrated into AdvancedFiltersDialog
- [x] 4.6 Update `src/components/AdvancedFiltersDialog.tsx` to detect screen size and render FilterSheet on mobile, dialog on desktop
- [ ] 4.7 Implement accordion layout in FilterSheet for mobile filter groups (deferred - current implementation works)
- [x] 4.8 Add drag handle to FilterSheet component
- [x] 4.9 Ensure FilterSheet has sticky footer with action buttons
- [ ] 4.10 Test filter sheet open/close, drag dismissal, and backdrop tap

## 5. Song List Responsive Display

- [x] 5.1 Create `src/components/SongCard.tsx` component for mobile/tablet card view
- [x] 5.2 Update `src/components/SongList.tsx` to detect screen size and render SongCard on mobile/tablet, table on desktop
- [x] 5.3 Implement compact card variant for mobile (abbreviated badges, essential info only)
- [x] 5.4 Implement enhanced card variant for tablet (more details, expandable sections)
- [x] 5.5 Add quick actions bar to SongCard for mobile (View, Add to Project buttons)
- [x] 5.6 Ensure all SongCard interactive elements meet 44×44px touch target minimum
- [x] 5.7 Add text truncation to prevent overflow on small screens
- [ ] 5.8 Test card layout on various screen sizes (320px, 640px, 768px, 1024px)

## 6. Song Details Modal/Sheet

- [x] 6.1 Create `src/components/SongDetailsSheet.tsx` mobile variant (bottom sheet) - Integrated into SongDetailsModal
- [x] 6.2 Update `src/components/SongDetailsModal.tsx` to detect screen size and render Sheet on mobile, Dialog on desktop
- [x] 6.3 Implement vertical section cards in SongDetailsSheet (stacked BPM/key badges) - SectionStructure handles this
- [x] 6.4 Implement horizontal section cards in SongDetailsModal (inline BPM/key badges) - SectionStructure handles this
- [x] 6.5 Add drag handle to SongDetailsSheet
- [x] 6.6 Ensure SongDetailsSheet has sticky footer with action buttons (grid layout on mobile)
- [ ] 6.7 Test song details sheet open/close, scrolling, and interactions

## 7. Project Manager Responsive

- [x] 7.1 Update `src/components/EnhancedProjectManager.tsx` grid: 1 column mobile, 2 tablet, 3 desktop, 4 xl (Note: Uses sidebar layout, made responsive with flex-col on mobile)
- [x] 7.2 Update project card layout: vertical buttons on mobile, horizontal on desktop
- [x] 7.3 Update project card padding: 16px mobile, 24px desktop
- [x] 7.4 Update header "New Project" button: icon-only on mobile, text on desktop
- [x] 7.5 Ensure project cards meet touch target requirements
- [ ] 7.6 Test project grid layout across all breakpoints

## 8. Mobile Reordering Alternative

- [x] 8.1 Update `src/components/ProjectSection.tsx` to conditionally render button-based reordering on mobile
- [x] 8.2 Implement up/down arrow buttons for reordering in ProjectSection (mobile only)
- [x] 8.3 Add disabled states for arrow buttons at list boundaries
- [x] 8.4 Update `src/contexts/SortableSongItem.tsx` to support `disableDrag` prop for mobile
- [x] 8.5 Ensure arrow buttons meet 44×44px touch target minimum
- [ ] 8.6 Test reordering functionality on mobile devices

## 9. Other Modal Components

- [x] 9.1 Update `src/components/SongModal.tsx` to use Sheet on mobile, Dialog on desktop
- [x] 9.2 Update `src/components/AddToProjectModal.tsx` to use Sheet on mobile, Dialog on desktop
- [x] 9.3 Update `src/components/ImportExportModal.tsx` to use Sheet on mobile, Dialog on desktop
- [x] 9.4 Update `src/components/EnhancedExportModal.tsx` to use Sheet on mobile, Dialog on desktop
- [x] 9.5 Update `src/components/UtilityDialog.tsx` to use Sheet on mobile, Dialog on desktop
- [x] 9.6 Ensure all modals have appropriate drag handles and sticky footers on mobile

## 10. Performance Optimizations

- [x] 10.1 Implement lazy loading for FilterDialog, ProjectManager, SongDetailsModal using React.lazy
- [ ] 10.2 Add virtual scrolling to SongList for lists with 100+ items using react-window (Deferred - can be added if performance issues arise)
- [x] 10.3 Implement debounced search in AdvancedSearchBar using custom useDebounce hook
- [x] 10.4 Create `src/hooks/useDebounce.ts` utility hook
- [ ] 10.5 Test performance on mid-range mobile devices (simulate throttled CPU)

## 11. Testing and Validation

- [ ] 11.1 Test all components at breakpoints: 320px, 640px, 768px, 1024px, 1280px, 1536px
- [ ] 11.2 Verify all interactive elements meet 44×44px minimum touch target size
- [ ] 11.3 Test on real iOS devices (iPhone SE, iPhone 12, iPad)
- [ ] 11.4 Test on real Android devices (various screen sizes)
- [ ] 11.5 Verify no horizontal scrolling on any screen size
- [ ] 11.6 Test keyboard navigation on all components
- [ ] 11.7 Verify safe area insets work on notched devices
- [ ] 11.8 Test bottom sheet drag-to-dismiss on various devices
- [ ] 11.9 Verify performance maintains 60fps on mid-range devices
- [ ] 11.10 Test all features maintain functionality across device sizes (feature parity)

## 12. Documentation and Cleanup

- [ ] 12.1 Document responsive breakpoint strategy in code comments
- [ ] 12.2 Document mobile interaction patterns (bottom sheets, card layouts)
- [ ] 12.3 Update component prop documentation with responsive behavior notes
- [ ] 12.4 Remove any unused responsive code or temporary workarounds
- [ ] 12.5 Verify all TypeScript types are correct for responsive props
