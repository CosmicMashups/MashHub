## MODIFIED Requirements

### Requirement: Part-Specific Harmonic Filtering
The system SHALL filter songs using normalized section names, where related section variations (e.g., "Verse A", "Verse B", "Verse") are treated as the same base section for filtering purposes.

#### Scenario: Filter by base section matches all variations
- **WHEN** the user filters by Part = "Verse" in Advanced Filters
- **THEN** the system SHALL return songs containing sections with names "Verse", "Verse A", "Verse B", "Verse C", or "Verse 2", as all normalize to base section "Verse"

#### Scenario: Filter by sub-variation matches base section
- **WHEN** the user filters by Part = "Intro 1" in Advanced Filters
- **THEN** the system SHALL return songs containing sections with names "Intro", "Intro 1", "Intro 2", "Intro Drop", "Intro Drop 1", or "Intro Drop 2", as all normalize to base section "Intro"

#### Scenario: Filter by Chorus matches all chorus variations
- **WHEN** the user filters by Part = "Chorus" in Advanced Filters
- **THEN** the system SHALL return songs containing sections with names "Chorus", "Chorus A", "Chorus B", "Chorus 2", "Last Chorus", "Last Postchorus", or "Postchorus", as all normalize to base section "Chorus"

#### Scenario: Filter by Prechorus matches sub-variations
- **WHEN** the user filters by Part = "Prechorus" in Advanced Filters
- **THEN** the system SHALL return songs containing sections with names "Prechorus", "Prechorus A", "Prechorus B", or "Prechorus C", as all normalize to base section "Prechorus"

#### Scenario: Filter by Bridge matches only Bridge
- **WHEN** the user filters by Part = "Bridge" in Advanced Filters
- **THEN** the system SHALL return songs containing sections with name "Bridge" only, as Bridge has no sub-variations defined

#### Scenario: Filter by unknown section uses exact match
- **WHEN** the user filters by Part = "Instrumental" (not in any group) in Advanced Filters
- **THEN** the system SHALL normalize "Instrumental" to "Other", and SHALL return songs containing sections that also normalize to "Other" (exact match on normalized name)

#### Scenario: Case-insensitive section matching
- **WHEN** the user filters by Part = "verse" (lowercase) in Advanced Filters
- **THEN** the system SHALL normalize "verse" to "Verse", and SHALL match sections regardless of case (e.g., "VERSE", "Verse", "verse A")

#### Scenario: Whitespace handling in section names
- **WHEN** the user filters by Part = "  Verse  " (with whitespace) in Advanced Filters
- **THEN** the system SHALL trim whitespace, normalize to "Verse", and SHALL match sections with any whitespace variations

#### Scenario: Multiple part-specific filters with normalization
- **WHEN** the user adds multiple PART-specific filter blocks: Block 1 with Part = "Verse" and Block 2 with Part = "Chorus A"
- **THEN** the system SHALL normalize both to "Verse" and "Chorus" respectively, and SHALL return songs where at least one section normalizes to "Verse" AND at least one section normalizes to "Chorus"

#### Scenario: Filter preserves original section names in results
- **WHEN** filtering returns songs with sections that matched via normalization
- **THEN** the system SHALL display the original section names (e.g., "Verse A", "Intro Drop") in the UI, not the normalized names (e.g., "Verse", "Intro")

## ADDED Requirements

### Requirement: Section Name Normalization
The system SHALL provide a normalization function that maps section names to base sections for logical grouping.

#### Scenario: Intro group normalization
- **WHEN** normalizing section names "Intro", "Intro 1", "Intro 2", "Intro Drop", "Intro Drop 1", "Intro Drop 2"
- **THEN** the system SHALL return base section "Intro" for all variations

#### Scenario: Verse group normalization
- **WHEN** normalizing section names "Verse", "Verse A", "Verse B", "Verse C", "Verse 2"
- **THEN** the system SHALL return base section "Verse" for all variations

#### Scenario: Prechorus group normalization
- **WHEN** normalizing section names "Prechorus", "Prechorus A", "Prechorus B", "Prechorus C"
- **THEN** the system SHALL return base section "Prechorus" for all variations

#### Scenario: Chorus group normalization
- **WHEN** normalizing section names "Chorus", "Chorus A", "Chorus B", "Chorus 2", "Last Chorus", "Last Postchorus", "Postchorus"
- **THEN** the system SHALL return base section "Chorus" for all variations

#### Scenario: Bridge normalization
- **WHEN** normalizing section name "Bridge"
- **THEN** the system SHALL return base section "Bridge"

#### Scenario: Unknown section normalization
- **WHEN** normalizing section name "Instrumental" (not in any defined group)
- **THEN** the system SHALL return base section "Other"

#### Scenario: Case-insensitive normalization
- **WHEN** normalizing section names "VERSE", "verse", "Verse A", "VERSE B"
- **THEN** the system SHALL return base section "Verse" for all case variations

#### Scenario: Whitespace trimming in normalization
- **WHEN** normalizing section names "  Verse  ", "Verse A ", " Verse B"
- **THEN** the system SHALL trim whitespace and SHALL return base section "Verse" for all variations
