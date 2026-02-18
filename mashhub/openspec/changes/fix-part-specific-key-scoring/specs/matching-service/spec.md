## MODIFIED Requirements

### Requirement: Part-Specific Key Matching in Quick Match
The system SHALL calculate part-specific key similarity scores using mathematically correct, distance-based harmonic scoring that reflects true musical relationships between song sections.

#### Scenario: Exact key match (100% score)
- **WHEN** comparing two songs where Song A has section "Verse" with key "D Major" and Song B has section "Verse" with key "D Major"
- **THEN** the system SHALL assign a section score of 1.0 (100% match) for that section

#### Scenario: Distance-based scoring for different keys
- **WHEN** comparing two songs where Song A has section "Verse" with key "F Major" (pitch class 5) and Song B has section "Verse" with key "F# Major" (pitch class 6)
- **THEN** the system SHALL calculate circular semitone distance as 1, normalized distance as 1/6, and section score as approximately 0.833 (1 - 1/6)

#### Scenario: Multiple keys per section
- **WHEN** comparing sections where Song A section has keys ["D Major", "F Major"] and Song B section has keys ["D Major", "G Major"]
- **THEN** the system SHALL compute pairwise similarity between all key combinations, SHALL use the MAX similarity score (D Major vs D Major = 1.0), and SHALL assign that as the section score

#### Scenario: Part name matching requirement
- **WHEN** comparing songs where Song A has section "Verse" with key "D Major" and Song B has section "Chorus" with key "D Major"
- **THEN** the system SHALL NOT compare these keys (different parts), and SHALL assign section score of 0 for Song A's "Verse" section

#### Scenario: Missing part in candidate song
- **WHEN** comparing songs where Song A has section "Verse" with key "D Major" and Song B does not have a "Verse" section
- **THEN** the system SHALL assign section score of 0 for Song A's "Verse" section

#### Scenario: Full-song key fallback
- **WHEN** comparing songs where Song A has sections ["Verse: D# Major", "Chorus: F# Major"] and Song B has only "Full Song: E Major"
- **THEN** the system SHALL compare "E Major" against each section in Song A independently (D# vs E, F# vs E), SHALL compute section scores for each, and SHALL average these scores

#### Scenario: Mode penalty application
- **WHEN** comparing keys where Song A section has "D Major" (pitch class 2, major) and Song B section has "D Minor" (pitch class 2, minor)
- **THEN** the system SHALL detect matching pitch class but different mode, SHALL apply mode penalty of 0.15, and SHALL assign section score of 0.85 (1.0 - 0.15)

#### Scenario: Aggregation across all sections
- **WHEN** comparing songs where Song A has 3 sections with scores [1.0, 0.833, 0.667] and Song B has matching sections
- **THEN** the system SHALL average all section scores: (1.0 + 0.833 + 0.667) / 3 = 0.833, and SHALL use this as the final part-specific key score

#### Scenario: Circular semitone distance calculation
- **WHEN** calculating distance between "B Major" (pitch class 11) and "C Major" (pitch class 0)
- **THEN** the system SHALL compute circular distance as min(|11 - 0|, 12 - |11 - 0|) = min(11, 1) = 1, and SHALL normalize to 1/6 for scoring

#### Scenario: Enharmonic equivalent handling
- **WHEN** comparing keys "C#" and "Db"
- **THEN** the system SHALL normalize both to pitch class 1, SHALL recognize them as identical, and SHALL assign distance of 0 (100% match)

#### Scenario: Invalid key string handling
- **WHEN** encountering an invalid key string that cannot be parsed
- **THEN** the system SHALL safely ignore that key, SHALL not throw errors, and SHALL assign section score of 0 if no valid keys remain

#### Scenario: Missing key data
- **WHEN** a section has no key data (null, undefined, empty string)
- **THEN** the system SHALL assign section score of 0 for that section

#### Scenario: Case-insensitive parsing
- **WHEN** comparing keys "d major" and "D Major"
- **THEN** the system SHALL parse both case-insensitively, SHALL recognize them as identical, and SHALL assign distance of 0 (100% match)

#### Scenario: Final score normalization
- **WHEN** calculating the final part-specific key score
- **THEN** the system SHALL ensure the score is between 0 and 1 inclusive, and SHALL multiply by 0.45 (45% weight) when adding to total match score

## ADDED Requirements

### Requirement: Key Parsing and Pitch Class Calculation
The system SHALL provide helper functions to parse musical keys into pitch class numbers and detect mode (Major/Minor).

#### Scenario: Pitch class extraction
- **WHEN** parsing key "D Major"
- **THEN** the system SHALL extract pitch class 2 (D) and mode "major"

#### Scenario: Enharmonic normalization
- **WHEN** parsing keys "C#", "Db", "B#"
- **THEN** the system SHALL normalize to standard pitch class representation (C# = 1, Db = 1, B# = 0)

#### Scenario: Mode detection
- **WHEN** parsing keys "D Major", "D Minor", "D"
- **THEN** the system SHALL detect mode as "major", "minor", or null respectively

### Requirement: Performance Optimization for Key Scoring
The system SHALL optimize key scoring calculations to maintain performance with large song libraries.

#### Scenario: Precomputed pitch classes
- **WHEN** calculating key scores for multiple songs
- **THEN** the system SHALL precompute pitch class values for all keys, and SHALL cache parsed key objects to avoid redundant parsing

#### Scenario: Efficient pairwise comparison
- **WHEN** comparing sections with multiple keys
- **THEN** the system SHALL use efficient algorithms to avoid O(n²) full-library comparisons, and SHALL limit comparisons to relevant sections only
