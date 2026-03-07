## ADDED Requirements

### Requirement: Kanban Board Component
The project manager SHALL provide a KanbanBoard component that displays project sections in an auto-wrapping grid.

#### Scenario: Grid layout
- **WHEN** the KanbanBoard is rendered
- **THEN** sections SHALL be laid out in a CSS grid with responsive columns (e.g. 1 at sm, 2 at md, 3 at lg, 4 at xl, 5 at 2xl)
- **AND** rows SHALL auto-wrap with no horizontal scroll

#### Scenario: Drag and drop within section
- **WHEN** the user drags a song within a section
- **THEN** the order SHALL update and the system SHALL call onReorderSongs with the new song order for that section

#### Scenario: Drag and drop across sections
- **WHEN** the user drops a song from one section into another
- **THEN** the system SHALL remove the song from the source section (onRemoveSong) and add it to the target section (onAddSong), then reorder the target section (onReorderSongs)

### Requirement: Kanban Section Card
Each section in the kanban board SHALL be rendered as a KanbanSectionCard with a header, song list, and add control.

#### Scenario: Section card header
- **WHEN** a section card is rendered
- **THEN** the header SHALL show the section name
- **AND** if the section has compatibility warnings (consecutive BPM mismatch, key clash, or duplicate song), a warning icon SHALL be shown
- **AND** the card SHALL have an options menu

#### Scenario: Song display normal mode
- **WHEN** compact mode is false
- **THEN** each song SHALL show title, BPM (raw), key, and a truncated notes preview with expand control
- **AND** an "[+ Add Song]" control SHALL be present

#### Scenario: Song display compact mode
- **WHEN** compact mode is true
- **THEN** each song SHALL be rendered as a single line (e.g. title | BPM | key)
- **AND** the warning icon SHALL still be shown when applicable

### Requirement: Suggestion Drawer
The system SHALL provide a side drawer that suggests compatible songs for a selected section.

#### Scenario: Open suggestion drawer
- **WHEN** the user clicks "Suggest Songs" in the project manager
- **THEN** a drawer SHALL open from the right (e.g. w-80, full height)
- **AND** the drawer SHALL call the smart section builder with the current project, target section, all songs, and project type
- **AND** suggestions SHALL be ranked by compatibility

#### Scenario: Suggestion card content
- **WHEN** the drawer displays a suggestion
- **THEN** each card SHALL show song title, artist, BPM (raw, no rounding), key, and compatibility score as a percentage
- **AND** an "[+ Add]" button SHALL add the song to the target section
- **AND** songs already in the project SHALL be marked "Already Added" with the add button disabled

#### Scenario: Drawer on mobile
- **WHEN** the drawer is open on a small viewport
- **THEN** a backdrop overlay SHALL be shown
- **AND** the drawer SHALL be fixed to the right and full height

### Requirement: Expandable Notes Editor
Song cards in the kanban board SHALL support an inline expandable notes editor.

#### Scenario: Collapsed state
- **WHEN** notes are collapsed
- **THEN** a truncated preview SHALL be shown (e.g. "Notes: Crowd warmup ▸")
- **AND** clicking the row SHALL expand the editor

#### Scenario: Expanded state
- **WHEN** the notes editor is expanded
- **THEN** a textarea SHALL be shown with Save and Cancel buttons
- **AND** Save SHALL call onSave with the new value and collapse the editor
- **AND** Cancel SHALL discard changes and collapse
- **AND** expand/collapse SHALL use Framer Motion AnimatePresence

### Requirement: Compact Mode Toggle
The project manager SHALL support a compact mode that persists across sessions.

#### Scenario: Toggle compact mode
- **WHEN** the user toggles compact mode in the toolbar
- **THEN** the kanban section cards SHALL switch between normal and single-line song layout
- **AND** the preference SHALL be stored in localStorage under key mashhub_compact_mode

#### Scenario: Restore compact mode
- **WHEN** the user opens the project manager
- **THEN** compact mode SHALL be restored from localStorage if previously set

### Requirement: Megamix Timeline
For projects with type 'megamix', the project manager SHALL display a horizontal timeline instead of the kanban grid.

#### Scenario: Timeline layout
- **WHEN** the project type is megamix
- **THEN** the manager SHALL render a single horizontally scrollable row of song blocks
- **AND** each block SHALL show song title (truncated), BPM (raw), and a small compatibility indicator (e.g. dot) against the adjacent block

#### Scenario: Timeline reorder
- **WHEN** the user drags a block in the timeline
- **THEN** the order SHALL update and onReorderSongs SHALL be called for the single section representing the timeline

#### Scenario: Add slot
- **WHEN** the user clicks the "[+]" add slot at the end of the timeline
- **THEN** the song picker modal SHALL open to add a song to the timeline section
