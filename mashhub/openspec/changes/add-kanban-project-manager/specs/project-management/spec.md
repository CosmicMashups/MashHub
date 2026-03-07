## ADDED Requirements

### Requirement: Project Type Field
Projects SHALL have a type field that determines display and suggestion behavior.

#### Scenario: Project type on create
- **WHEN** a user creates a new project
- **THEN** the user SHALL be able to select a project type (DJ Set, Mashup, Song Megamix)
- **AND** the default type SHALL be DJ Set if not specified

#### Scenario: Existing projects default type
- **WHEN** existing projects are loaded after a schema migration
- **THEN** each project SHALL have type set to 'dj-set'

#### Scenario: Project type drives view mode
- **WHEN** a project has type 'megamix'
- **THEN** the project manager SHALL render the Megamix timeline view instead of the kanban board
- **AND** when type is 'dj-set' or 'mashup', the kanban board SHALL be rendered

### Requirement: ProjectEntry Notes
ProjectEntry records SHALL support an optional notes field for per-entry annotations.

#### Scenario: Persist entry notes
- **WHEN** the user saves notes for a song in a project section
- **THEN** the system SHALL persist the notes on the ProjectEntry for that project, section, and song
- **AND** the notes SHALL be displayed when the project is reopened

#### Scenario: Notes optional
- **WHEN** an existing ProjectEntry has no notes
- **THEN** the notes field SHALL be treated as empty and SHALL not require a value

### Requirement: Remove Song From Section
The system SHALL support removing a song from a single section without removing it from other sections of the same project.

#### Scenario: Remove from one section
- **WHEN** the user removes a song from a section in the project manager
- **THEN** the system SHALL delete only the ProjectEntry for that project, section, and song
- **AND** the song SHALL remain in other sections of the same project if present

#### Scenario: Reorder filtered by section
- **WHEN** the user reorders songs within a section
- **THEN** the system SHALL update orderIndex only for entries in that project and section
- **AND** the same song in a different section SHALL keep its own orderIndex

### Requirement: Project Options Menu
Each project SHALL have an options menu accessible from the project header.

#### Scenario: Options menu actions
- **WHEN** the user opens the project options menu
- **THEN** the menu SHALL offer "View BPM Flow", "View Key Graph", and "Export Set"
- **AND** selecting View BPM Flow SHALL open the BPM flow graph in a modal
- **AND** selecting View Key Graph SHALL open the key graph in a modal

### Requirement: BPM Flow Graph
The system SHALL provide a BPM flow graph showing BPM progression across project sections.

#### Scenario: BPM graph data
- **WHEN** the BPM flow graph is opened for a project
- **THEN** the graph SHALL use the primaryBpm of the first song in each section, in section order
- **AND** BPM values SHALL be displayed without rounding
- **AND** empty sections MAY be skipped or shown as a gap

#### Scenario: BPM graph display
- **WHEN** the graph is rendered
- **THEN** the X-axis SHALL show section names and the Y-axis SHALL show BPM
- **AND** a tooltip SHALL show section name and BPM on hover

### Requirement: Key Graph
The system SHALL provide a key progression graph using Camelot wheel positions.

#### Scenario: Key graph data
- **WHEN** the key graph is opened for a project
- **THEN** the graph SHALL use the primaryKey of the first song in each section, in section order
- **AND** the Y-axis SHALL represent Camelot wheel position (e.g. 1–12)

#### Scenario: Key graph tooltip
- **WHEN** the user hovers a point on the key graph
- **THEN** the tooltip SHALL display the actual key name (e.g. Am, G)

## MODIFIED Requirements

### Requirement: Project Song Display
Projects SHALL display section information when a ProjectEntry references a specific section. Project sections SHALL be displayed in an auto-wrapping kanban grid when project type is not megamix.

#### Scenario: Section display in project
- **WHEN** a project entry has a non-null sectionId
- **THEN** the project UI SHALL display the section's PART, BPM, and KEY in addition to the song information

#### Scenario: Song display in project
- **WHEN** a project entry has sectionId = null
- **THEN** the project UI SHALL display the song's primaryBpm and primaryKey (computed from sections)

#### Scenario: Kanban grid layout
- **WHEN** the project type is dj-set or mashup
- **THEN** sections SHALL be displayed in a responsive grid that wraps to new rows without horizontal scroll
- **AND** the grid SHALL use breakpoints for 1–5 columns (e.g. 1 col mobile, 5 cols xl)
