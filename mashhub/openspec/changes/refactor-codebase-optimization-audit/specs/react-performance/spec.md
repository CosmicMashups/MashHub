## ADDED Requirements

### Requirement: Presentational Component Memoization
All pure presentational components that receive stable props SHALL be wrapped in `React.memo()` to prevent unnecessary re-renders when parent state changes do not affect their props.

#### Scenario: Song card does not re-render on unrelated state change
- **WHEN** the search input text changes but the list of displayed songs does not change
- **THEN** `SongCard` components do not re-render (verified via React DevTools Profiler showing 0 renders for stable cards)

#### Scenario: Filter tag does not re-render when unrelated filter changes
- **WHEN** a BPM filter value changes but the key filter tags are unaffected
- **THEN** key `FilterTag` components show 0 renders in the React DevTools Profiler flamegraph

### Requirement: Hook Dependency Array Correctness
Every `useEffect`, `useMemo`, and `useCallback` in the codebase SHALL have a complete and minimal dependency array — no missing dependencies that would cause stale closures, and no overly-broad dependencies that cause unnecessary re-runs.

#### Scenario: Search effect runs exactly on query change
- **WHEN** a `useEffect` triggers a Fuse.js search
- **THEN** the effect dependency array includes only the debounced query value and the `SearchService` instance reference, not an entire song array or inline object

#### Scenario: Effects with subscriptions clean up on unmount
- **WHEN** a component that opens a Dexie `liveQuery` subscription unmounts
- **THEN** the `useEffect` returns a cleanup function that unsubscribes, preventing memory leaks

### Requirement: Virtualized Song List
The main song list SHALL use row virtualization to render only the rows currently visible in the viewport plus an overscan buffer, regardless of total song count.

#### Scenario: Large library renders without layout thrashing
- **WHEN** the song library contains 2,000 songs and the user scrolls the list
- **THEN** at most 30 song card DOM nodes exist in the document at any time (visible rows + overscan)

#### Scenario: Virtualized list is disabled during drag
- **WHEN** a user begins dragging a song card to reorder it
- **THEN** the virtualizer is suspended so all drag targets remain mounted in the DOM

### Requirement: Code-Split Heavy Modals
Modal components (`ImportExportModal`, `EnhancedExportModal`, `AdvancedFiltersDialog`, `EnhancedProjectManager`) SHALL NOT be included in the initial JavaScript bundle.

#### Scenario: Initial bundle excludes modal code
- **WHEN** the app loads and no modal has been opened
- **THEN** the network panel shows the modal chunk has not been downloaded

#### Scenario: Modal chunk loads on first open
- **WHEN** the user opens the import modal for the first time
- **THEN** the modal chunk is fetched from the network (or cache) and a loading skeleton is shown while it loads

### Requirement: Debounced Search Input
The search input SHALL debounce user keystrokes by at least 300ms before triggering a Fuse.js search query.

#### Scenario: Rapid typing does not trigger multiple searches
- **WHEN** a user types 5 characters in rapid succession within 200ms
- **THEN** only one Fuse.js search is executed (not 5), after the 300ms debounce window elapses

#### Scenario: Search triggers immediately after debounce
- **WHEN** the user stops typing for 300ms
- **THEN** the search executes within 50ms after the debounce window ends
