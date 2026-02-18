## MODIFIED Requirements

### Requirement: Song Matching Algorithm
The system SHALL match songs based on section-level properties, scoring each section independently, then aggregating to song-level using a best-match strategy. The matching SHALL preserve the weighted scoring model: BPM (40%), Key (30%), Vocal Status (10%), Type (10%), Year (5%), Text Search (5%).

#### Scenario: Section-level BPM matching
- **WHEN** matching songs with target BPM criteria
- **THEN** the system SHALL evaluate each section's BPM against the criteria, score each section independently, and SHALL use the highest section score as the song's BPM score component

#### Scenario: Section-level key matching
- **WHEN** matching songs with target key criteria
- **THEN** the system SHALL evaluate each section's KEY against the criteria, score each section independently, and SHALL use the highest section score as the song's key score component

#### Scenario: Best-match aggregation
- **WHEN** a song has multiple sections with different match scores
- **THEN** the system SHALL use the section with the highest combined score to represent the song's match score, and SHALL include that section's details in the MatchResult

#### Scenario: Weighted scoring preservation
- **WHEN** calculating match scores
- **THEN** the system SHALL apply weights: BPM 40%, Key 30%, Vocal Status 10%, Type 10%, Year 5%, Text Search 5%, and SHALL sum these weighted components to produce the final match score

#### Scenario: Match result with section details
- **WHEN** a match result is returned
- **THEN** the MatchResult SHALL include the bestMatchingSection property containing the section ID, PART, BPM, and KEY of the highest-scoring section

### Requirement: Harmonic Matching
The system SHALL find harmonically compatible songs by evaluating section-level BPM and key relationships.

#### Scenario: Section-level harmonic BPM
- **WHEN** finding harmonic matches for a target song
- **THEN** the system SHALL evaluate harmonic relationships between each section of the target song and each section of candidate songs, and SHALL score based on the best section-to-section match

#### Scenario: Section-level harmonic key
- **WHEN** finding harmonic matches for a target song
- **THEN** the system SHALL evaluate key compatibility between each section of the target song and each section of candidate songs, and SHALL score based on the best section-to-section match

## ADDED Requirements

### Requirement: Section Match Breakdown
The system SHALL optionally provide a breakdown of match scores for all sections of a song, not just the best match.

#### Scenario: Section breakdown request
- **WHEN** a match result is requested with includeSectionBreakdown flag
- **THEN** the MatchResult SHALL include a sections array with individual scores for each section, ordered by score descending

#### Scenario: Section breakdown structure
- **WHEN** section breakdown is included
- **THEN** each section entry SHALL contain: sectionId, part, bpm, key, bpmScore, keyScore, and totalScore
