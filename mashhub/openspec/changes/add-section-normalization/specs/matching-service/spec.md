## MODIFIED Requirements

### Requirement: Part-Specific Key Matching in Quick Match
The system SHALL calculate part-specific key similarity scores using normalized section names, where related section variations are treated as the same base section for matching purposes.

#### Scenario: Matching Verse with Verse A
- **WHEN** comparing songs where Song A has section "Verse" with key "D Major" and Song B has section "Verse A" with key "D Major"
- **THEN** the system SHALL normalize both section names to "Verse", SHALL recognize them as matching sections, and SHALL calculate key similarity score for that section

#### Scenario: Matching Intro variations
- **WHEN** comparing songs where Song A has section "Intro 1" with key "C Major" and Song B has section "Intro Drop" with key "C Major"
- **THEN** the system SHALL normalize both section names to "Intro", SHALL recognize them as matching sections, and SHALL calculate key similarity score

#### Scenario: Matching Chorus variations
- **WHEN** comparing songs where Song A has section "Chorus" with key "F Major" and Song B has section "Last Chorus" with key "F Major"
- **THEN** the system SHALL normalize both section names to "Chorus", SHALL recognize them as matching sections, and SHALL calculate key similarity score

#### Scenario: Non-matching sections remain distinct
- **WHEN** comparing songs where Song A has section "Verse" with key "D Major" and Song B has section "Chorus" with key "D Major"
- **THEN** the system SHALL normalize "Verse" to "Verse" and "Chorus" to "Chorus", SHALL recognize them as different base sections, and SHALL NOT calculate key similarity score (section score = 0)

#### Scenario: Multiple sub-variations in same song
- **WHEN** comparing songs where Song A has sections ["Verse A: D Major", "Verse B: E Major"] and Song B has section "Verse: D Major"
- **THEN** the system SHALL normalize all sections to "Verse", SHALL compare "Verse A" and "Verse B" against "Verse" independently, SHALL calculate section scores for each, and SHALL average the scores

#### Scenario: Case-insensitive section matching
- **WHEN** comparing songs where Song A has section "verse" (lowercase) with key "D Major" and Song B has section "VERSE A" (uppercase) with key "D Major"
- **THEN** the system SHALL normalize both to "Verse", SHALL recognize them as matching sections, and SHALL calculate key similarity score

#### Scenario: Unknown sections normalize to Other
- **WHEN** comparing songs where Song A has section "Instrumental" with key "D Major" and Song B has section "Solo" with key "D Major"
- **THEN** the system SHALL normalize both to "Other", SHALL recognize them as matching sections (both are "Other"), and SHALL calculate key similarity score

#### Scenario: Section matching uses normalized names only
- **WHEN** calculating part-specific key scores
- **THEN** the system SHALL compare normalized section names, not original section names, and SHALL use normalized names for section compatibility determination

#### Scenario: Original section names preserved in match results
- **WHEN** match results are returned with section information
- **THEN** the system SHALL include original section names (e.g., "Verse A", "Intro Drop") in the results, not normalized names (e.g., "Verse", "Intro")

## MODIFIED Requirements

### Requirement: Harmonic Matching
The system SHALL find harmonically compatible songs by evaluating section-level BPM and key relationships using normalized section names.

#### Scenario: Section-level harmonic matching with normalization
- **WHEN** finding harmonic matches for a target song with section "Verse A"
- **THEN** the system SHALL normalize "Verse A" to "Verse", SHALL evaluate harmonic relationships with candidate song sections that normalize to "Verse" (e.g., "Verse", "Verse B", "Verse C"), and SHALL score based on the best section-to-section match

#### Scenario: Multiple normalized sections in matching
- **WHEN** a song has multiple sections that normalize to the same base section (e.g., "Verse A", "Verse B", "Verse C")
- **THEN** the system SHALL treat them as distinct sections internally for scoring, but SHALL use normalized names for section compatibility determination
