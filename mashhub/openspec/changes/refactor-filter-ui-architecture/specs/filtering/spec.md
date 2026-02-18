## MODIFIED Requirements

### Requirement: Filter UI Layout
The system SHALL provide inline filter controls below the search bar for primary harmonic filters (BPM, Key, Year), and SHALL provide an Advanced Filters dialog for less common filters and PART-specific harmonic filtering.

#### Scenario: Inline filter placement
- **WHEN** the user views the main song list interface
- **THEN** the system SHALL display Filter BPM, Filter Key, and Filter Year dropdowns directly below the search bar, horizontally aligned on desktop and wrapped on mobile

#### Scenario: Advanced Filters access
- **WHEN** the user needs to filter by Vocal Status, Type, Origin, Season, Artist, Text Search, PART, or PART-specific harmonic properties
- **THEN** the system SHALL provide an "Advanced Filters" button that opens a dialog containing these filters

#### Scenario: Responsive layout
- **WHEN** the viewport width is less than 768px
- **THEN** the inline filter dropdowns SHALL wrap to multiple rows while maintaining consistent spacing

### Requirement: BPM Filter Dropdown
The system SHALL provide a BPM filter dropdown with two mutually exclusive modes: Target BPM with tolerance, or BPM range (min/max).

#### Scenario: Target BPM mode
- **WHEN** the user selects Target BPM mode and enters a target BPM value and tolerance
- **THEN** the system SHALL disable the BPM range (min/max) inputs, and SHALL filter songs where ANY section has BPM within target ± tolerance

#### Scenario: BPM range mode
- **WHEN** the user enters min and/or max BPM values
- **THEN** the system SHALL disable the Target BPM and tolerance inputs, and SHALL filter songs where ANY section has BPM within the specified range

#### Scenario: Mode exclusivity
- **WHEN** the user has values in Target BPM mode and then enters values in BPM range mode
- **THEN** the system SHALL clear Target BPM mode values and enable range mode inputs

#### Scenario: Clearing filters
- **WHEN** the user clears all values in one mode
- **THEN** the system SHALL re-enable inputs in the other mode

### Requirement: Key Filter Dropdown
The system SHALL provide a Key filter dropdown with two mutually exclusive modes: Target Key with tolerance, or Key range (start/end).

#### Scenario: Target Key mode
- **WHEN** the user selects Target Key mode and enters a target key and tolerance
- **THEN** the system SHALL disable the Key range (start/end) inputs, and SHALL filter songs where ANY section has a key within the tolerance distance of the target key

#### Scenario: Key range mode
- **WHEN** the user selects start and/or end keys for a linked range
- **THEN** the system SHALL disable the Target Key and tolerance inputs, and SHALL filter songs where ANY section has a key within the linked range

#### Scenario: Mode exclusivity
- **WHEN** the user has values in Target Key mode and then enters values in Key range mode
- **THEN** the system SHALL clear Target Key mode values and enable range mode inputs

### Requirement: Year Filter Dropdown
The system SHALL provide a Year filter dropdown with min and max year inputs.

#### Scenario: Year range filtering
- **WHEN** the user enters min and/or max year values
- **THEN** the system SHALL filter songs where the song's year is within the specified range

### Requirement: Global Harmonic Filtering
The system SHALL filter songs based on harmonic properties (BPM, Key) where ANY section matches the criteria.

#### Scenario: Global BPM filter
- **WHEN** filtering by BPM (target+tolerance or range)
- **THEN** the system SHALL return songs where at least one section matches the BPM criteria, regardless of which section matches

#### Scenario: Global Key filter
- **WHEN** filtering by Key (target+tolerance or range)
- **THEN** the system SHALL return songs where at least one section matches the Key criteria, regardless of which section matches

#### Scenario: Combined global filters
- **WHEN** filtering by both BPM and Key
- **THEN** the system SHALL return songs where at least one section matches BOTH the BPM and Key criteria simultaneously

### Requirement: PART-Specific Harmonic Filtering
The system SHALL provide the ability to filter songs where a specific PART has matching harmonic properties, and this capability SHALL exist only in the Advanced Filters dialog.

#### Scenario: PART-specific BPM filter
- **WHEN** the user selects a PART in Advanced Filters and specifies BPM criteria (target+tolerance or range)
- **THEN** the system SHALL return songs where at least one section with the specified PART matches the BPM criteria

#### Scenario: PART-specific Key filter
- **WHEN** the user selects a PART in Advanced Filters and specifies Key criteria (target+tolerance or range)
- **THEN** the system SHALL return songs where at least one section with the specified PART matches the Key criteria

#### Scenario: PART-specific combined filter
- **WHEN** the user selects a PART and specifies both BPM and Key criteria
- **THEN** the system SHALL return songs where at least one section with the specified PART matches BOTH BPM and Key criteria simultaneously

#### Scenario: PART filter location
- **WHEN** the user wants to filter by PART-specific harmonic properties
- **THEN** the system SHALL require the user to open the Advanced Filters dialog, and SHALL NOT provide PART-specific filtering in inline filters

#### Scenario: PART dropdown population
- **WHEN** the Advanced Filters dialog is opened
- **THEN** the PART dropdown SHALL be populated with all unique PART values from the songSections table

### Requirement: Filter State Management
The system SHALL maintain deterministic filter state with clear mutual exclusivity enforcement and reset behavior.

#### Scenario: Filter state structure
- **WHEN** filters are applied
- **THEN** the system SHALL maintain filter state in a structured format with explicit mode tracking (target | range | null) for BPM and Key filters

#### Scenario: State transitions
- **WHEN** switching between filter modes
- **THEN** the system SHALL transition state deterministically, clearing conflicting values and enabling/disabling inputs appropriately

#### Scenario: Filter reset
- **WHEN** the user clears all filters
- **THEN** the system SHALL reset all filter values to their default state (empty/null), and SHALL re-enable all inputs

### Requirement: Filter Performance
The system SHALL maintain filter performance for large libraries (10,000+ songs, 60,000+ sections) using indexed queries and efficient evaluation.

#### Scenario: Global filter performance
- **WHEN** filtering by BPM or Key on a library with 10,000+ songs
- **THEN** the system SHALL use indexed queries on the songSections table with compound indexes [songId+bpm] and [songId+key], and SHALL complete filtering in under 100ms

#### Scenario: PART-specific filter performance
- **WHEN** filtering by PART-specific BPM or Key on a large library
- **THEN** the system SHALL use indexed queries with compound indexes [songId+part+bpm] and [songId+part+key] if available, and SHALL avoid scanning all sections for every song

#### Scenario: Efficient evaluation
- **WHEN** evaluating filter criteria
- **THEN** the system SHALL short-circuit evaluation when a match is found (for ANY section matching), and SHALL NOT perform nested loops over all sections for every song

#### Scenario: No N+1 queries
- **WHEN** filtering songs by section properties
- **THEN** the system SHALL use a single indexed query with join, and SHALL NOT perform separate queries for each song

## ADDED Requirements

### Requirement: Active Filter Display
The system SHALL display active filter badges below the search bar showing which filters are currently applied.

#### Scenario: Active filter badges
- **WHEN** filters are applied (BPM, Key, Year, or Advanced Filters)
- **THEN** the system SHALL display badges below the search bar showing active filter names and values, with remove buttons to clear individual filters

#### Scenario: Badge removal
- **WHEN** the user clicks the remove button on an active filter badge
- **THEN** the system SHALL clear that specific filter and update the song list accordingly

### Requirement: Filter Accessibility
The system SHALL provide keyboard navigation, ARIA roles, and clear focus management for all filter controls.

#### Scenario: Keyboard navigation
- **WHEN** the user navigates using keyboard (Tab, Enter, Escape)
- **THEN** the system SHALL allow full interaction with all filter dropdowns and inputs without requiring mouse

#### Scenario: Screen reader support
- **WHEN** a screen reader is active
- **THEN** the system SHALL announce filter labels, values, and disabled states appropriately using ARIA attributes

#### Scenario: Focus management
- **WHEN** a filter dropdown is opened or closed
- **THEN** the system SHALL manage focus appropriately, returning focus to the trigger button when closed
