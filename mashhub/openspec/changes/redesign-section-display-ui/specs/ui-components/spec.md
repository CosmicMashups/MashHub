## MODIFIED Requirements

### Requirement: Song List Display
The system SHALL display songs in list views with only primaryBpm and primaryKey values, using visual enhancements such as compact badges, color coding, and consistent spacing. The list view SHALL NOT display all sections inline or show expandable section previews.

#### Scenario: List view primary values
- **WHEN** songs are displayed in a list view
- **THEN** the system SHALL show only primaryBpm and primaryKey for each song, displayed as compact badges with consistent styling

#### Scenario: Visual enhancements
- **WHEN** primaryKey and primaryBpm are displayed
- **THEN** the system SHALL use harmonic color coding for keys, aligned BPM and Key values for rapid comparison, and subtle hover effects for better interactivity

#### Scenario: No inline sections
- **WHEN** a song has multiple sections
- **THEN** the list view SHALL NOT display all sections, and SHALL NOT show expandable section previews within the list

### Requirement: Song Details Modal Section Display
The system SHALL display the complete section structure in the Song Details Modal using a structured table layout that clearly shows SECTION_ORDER | PART | BPM | KEY relationships. The display SHALL preserve section order and prevent misinterpretation of harmonic states.

#### Scenario: Structured section display
- **WHEN** the Song Details Modal is opened for a song
- **THEN** the system SHALL display all sections in a structured table with columns: SECTION_ORDER, PART, BPM, and KEY, preserving the order defined by SECTION_ORDER

#### Scenario: Section structure clarity
- **WHEN** sections are displayed in the modal
- **THEN** each section SHALL clearly show the relationship between PART, BPM, and KEY, and SHALL NOT display keys and BPMs as unstructured arrays

#### Scenario: Section loading
- **WHEN** the modal opens
- **THEN** the system SHALL fetch sections from the database and display a loading state while fetching, and SHALL only fetch sections for the currently displayed song

## ADDED Requirements

### Requirement: SectionStructure Component
The system SHALL provide a dedicated SectionStructure component that displays section data in a structured, ordered table format.

#### Scenario: Component rendering
- **WHEN** SectionStructure component receives a songId
- **THEN** the component SHALL fetch sections for that song, sort them by SECTION_ORDER, and display them in a table with columns for SECTION_ORDER, PART, BPM, and KEY

#### Scenario: Loading state
- **WHEN** sections are being fetched
- **THEN** the component SHALL display a loading indicator

#### Scenario: Empty state
- **WHEN** a song has no sections
- **THEN** the component SHALL display an appropriate empty state message

#### Scenario: Error state
- **WHEN** section fetching fails
- **THEN** the component SHALL display an error message

### Requirement: Lazy-Loading Sections
The system SHALL fetch sections from the database only when explicitly needed (e.g., when modal opens), and SHALL NOT preload sections for all songs during list rendering.

#### Scenario: Modal section loading
- **WHEN** the Song Details Modal opens
- **THEN** the system SHALL fetch sections for that song using an indexed query by songId, and SHALL NOT fetch sections for other songs

#### Scenario: List rendering performance
- **WHEN** songs are rendered in a list view
- **THEN** the system SHALL NOT fetch sections for any songs, and SHALL only use primaryBpm and primaryKey which are computed properties

#### Scenario: Indexed query performance
- **WHEN** sections are fetched for a song
- **THEN** the query SHALL use the indexed songId field for optimal performance, and SHALL sort results by SECTION_ORDER

### Requirement: Accessibility for Section Display
The system SHALL provide keyboard navigation, ARIA labels, focus trapping, and screen reader support for the section structure display.

#### Scenario: Keyboard navigation
- **WHEN** the Song Details Modal is open
- **THEN** users SHALL be able to navigate the section structure using keyboard, and focus SHALL be trapped within the modal

#### Scenario: ARIA labels
- **WHEN** sections are displayed
- **THEN** the table SHALL have proper ARIA labels describing the structure, and each row SHALL have labels indicating section order, part, BPM, and key

#### Scenario: Screen reader support
- **WHEN** a screen reader accesses the section structure
- **THEN** the structure SHALL be announced clearly with section order, part, BPM, and key for each section

## MODIFIED Requirements

### Requirement: List View Performance
The system SHALL maintain list view performance for large libraries (10,000+ songs) by avoiding section fetching during list rendering and using only computed primary values.

#### Scenario: Large library rendering
- **WHEN** rendering a list of 10,000+ songs
- **THEN** the system SHALL NOT fetch sections for any songs, and SHALL render using only song-level data and computed primaryBpm/primaryKey values

#### Scenario: Modal performance
- **WHEN** opening the modal for a song with multiple sections
- **THEN** the section fetch SHALL complete in under 100ms using indexed lookup, and SHALL not block the UI
