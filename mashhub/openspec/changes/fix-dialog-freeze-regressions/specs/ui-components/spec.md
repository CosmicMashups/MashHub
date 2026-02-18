## ADDED Requirements

### Requirement: Dialog Responsiveness and Non-Freezing Behavior
MashHub dialogs (Song editor, Song details, Advanced Filters, Project Manager, Export dialogs, Spotify Match, Utility) SHALL remain responsive during open, use, and close operations and SHALL NOT freeze the UI.

#### Scenario: Opening dialogs remains responsive
- **WHEN** a user opens any dialog (SongModal, SongDetailsModal, AdvancedFiltersDialog, EnhancedProjectManager, Import/Export, SpotifyMatchDialog, UtilityDialog)
- **THEN** the dialog content SHALL become interactive within a short, perceptible time (e.g., within a few hundred milliseconds on target hardware)
- **AND** the rest of the UI SHALL remain responsive to input (e.g., the browser tab does not hang)

#### Scenario: Heavy initialization work does not block UI
- **WHEN** a dialog needs to perform heavy work on open (matching computations, Dexie queries, image/color extraction)
- **THEN** the dialog SHALL render basic layout/skeleton content first
- **AND** heavy work SHALL run asynchronously without blocking the main thread

#### Scenario: Rapid open/close does not cause freezes
- **WHEN** a user rapidly opens and closes the same dialog multiple times
- **THEN** the application SHALL NOT enter a frozen state
- **AND** dialog content SHALL mount/unmount cleanly without infinite render/effect loops

#### Scenario: Dialogs remain navigable after background work
- **WHEN** a dialog completes its background initialization work (e.g., loading matches, sections, or colors)
- **THEN** the dialog SHALL remain fully interactive (scrolling, clicking, closing) without visible jank or long stalls

