## ADDED Requirements

### Requirement: Smart Section Builder Service
The system SHALL provide a service that returns ranked song suggestions for a project section based on project type.

#### Scenario: getSuggestions signature
- **WHEN** smartSectionBuilder.getSuggestions(project, targetSectionName, allSongs, projectType, limit) is called
- **THEN** the function SHALL return an array of SuggestionResult (song, compatibilityScore 0.0–1.0, reasons)
- **AND** the candidate pool SHALL exclude songs already in the target section
- **AND** limit SHALL default to 20

#### Scenario: DJ set ranking
- **WHEN** projectType is 'dj-set'
- **THEN** suggestions SHALL be ranked primarily by BPM compatibility with the last song in the target section (or first if empty)
- **AND** secondary by key score, then intro/outro energy (BPM delta vs neighbors) as tertiary

#### Scenario: Mashup ranking
- **WHEN** projectType is 'mashup'
- **THEN** suggestions SHALL be ranked primarily by key score, then BPM score
- **AND** tertiary preference for vocal/instrumental separation (e.g. opposite type)

#### Scenario: Megamix ranking
- **WHEN** projectType is 'megamix'
- **THEN** suggestions SHALL apply a usage-frequency penalty: songs already in any section of the project SHALL rank lower
- **AND** songs not yet in the project SHALL be preferred (not-yet-used bonus)
- **AND** section variety and balanced BPM pacing SHALL be used as secondary factors

#### Scenario: Compatibility from existing pipeline
- **WHEN** computing compatibility for suggestions for dj-set or mashup
- **THEN** the system SHALL use the same compatibility score function (e.g. calculateCompatibilityScore) against the last song added to the target section, or the first song if the section is empty
- **AND** the system SHALL NOT duplicate scoring logic elsewhere

#### Scenario: Exclude target section songs
- **WHEN** building the suggestion list
- **THEN** any song already present in the targetSectionName section SHALL be excluded from results
