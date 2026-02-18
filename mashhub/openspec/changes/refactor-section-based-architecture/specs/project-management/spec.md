## MODIFIED Requirements

### Requirement: Project Entry Section Reference
ProjectEntry SHALL support an optional sectionId field that references a specific section of a song. When sectionId is null, the entry SHALL represent the entire song (backward compatible behavior).

#### Scenario: Song-level project entry
- **WHEN** a song is added to a project without specifying a section
- **THEN** the ProjectEntry SHALL be created with sectionId = null, and SHALL represent the entire song

#### Scenario: Section-level project entry
- **WHEN** a specific section is added to a project
- **THEN** the ProjectEntry SHALL be created with sectionId referencing the section, and SHALL represent only that section

#### Scenario: Backward compatibility
- **WHEN** existing projects are loaded after migration
- **THEN** all ProjectEntry records SHALL have sectionId = null, and SHALL continue to work as before (representing entire songs)

### Requirement: Project Song Display
Projects SHALL display section information when a ProjectEntry references a specific section.

#### Scenario: Section display in project
- **WHEN** a project entry has a non-null sectionId
- **THEN** the project UI SHALL display the section's PART, BPM, and KEY in addition to the song information

#### Scenario: Song display in project
- **WHEN** a project entry has sectionId = null
- **THEN** the project UI SHALL display the song's primaryBpm and primaryKey (computed from sections)

## ADDED Requirements

### Requirement: Section-Specific Project Operations
The system SHALL support adding specific sections to projects and managing section references.

#### Scenario: Add section to project
- **WHEN** adding a section to a project
- **THEN** the system SHALL create a ProjectEntry with the section's sectionId, and SHALL validate that the sectionId exists

#### Scenario: Remove section from project
- **WHEN** removing a section reference from a project
- **THEN** the system SHALL delete the ProjectEntry, and SHALL NOT affect the song or section data

#### Scenario: Section deletion cascade
- **WHEN** a section is deleted from a song
- **THEN** the system SHALL update all ProjectEntry records referencing that section to have sectionId = null (falling back to entire song), and SHALL notify the user of the change

### Requirement: Project Export with Sections
Project export SHALL include section information when available.

#### Scenario: Export project with sections
- **WHEN** exporting a project that contains section references
- **THEN** the export SHALL include section details (PART, BPM, KEY) for entries with sectionId, and SHALL include primary values for entries without sectionId
