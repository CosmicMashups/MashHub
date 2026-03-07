## ADDED Requirements

### Requirement: Compatibility Score Calculation
The system SHALL provide a single function to compute compatibility between two songs using BPM and key (Camelot).

#### Scenario: BPM score formula
- **WHEN** calculateCompatibilityScore(songA, songB, toleranceBpm) is called
- **THEN** bpmDiff SHALL be the absolute difference of primaryBpm of songA and songB
- **AND** bpmScore SHALL be max(0, 1 - bpmDiff / toleranceBpm)
- **AND** BPM values SHALL be used as stored with no rounding

#### Scenario: Key score Camelot distance
- **WHEN** key score is computed
- **THEN** the system SHALL use Camelot wheel distance (same key 1.0, 1 step 0.8, 2 steps 0.6, 3+ or clash 0.2)
- **AND** the Camelot wheel mapping SHALL be defined in a constant (e.g. src/constants/camelot.ts)

#### Scenario: Final score and label
- **WHEN** the compatibility result is returned
- **THEN** score SHALL be (bpmScore + keyScore) / 2 in the range 0.0–1.0
- **AND** label SHALL be 'High' when score >= 0.7, 'Medium' when score >= 0.4, else 'Low'

#### Scenario: Warnings
- **WHEN** bpmScore < 0.3 the result SHALL include warning 'bpm-mismatch'
- **WHEN** keyScore <= 0.2 the result SHALL include warning 'key-clash'
- **WHEN** songA.id === songB.id the result SHALL include warning 'duplicate-song'

### Requirement: Camelot Wheel Utility
The system SHALL provide a Camelot wheel mapping and distance function for key comparison.

#### Scenario: Same key distance zero
- **WHEN** getCamelotDistance(keyA, keyB) is called with the same key
- **THEN** the distance SHALL be 0 (or equivalent for score 1.0)

#### Scenario: Adjacent key distance
- **WHEN** two keys are one step apart on the Camelot wheel (e.g. Am and Em)
- **THEN** the distance SHALL correspond to score 0.8

#### Scenario: Position for graph
- **WHEN** getCamelotPosition(key) is called
- **THEN** the function SHALL return a numeric position (e.g. 1–12) suitable for the Key graph Y-axis

### Requirement: Section Warnings
The system SHALL provide a function that returns warnings for consecutive song pairs in a section.

#### Scenario: Consecutive pair warnings
- **WHEN** getWarningsForSection(songs) is called
- **THEN** the function SHALL iterate consecutive pairs (songs[i], songs[i+1])
- **AND** for each pair SHALL call calculateCompatibilityScore and collect warnings from the result
- **AND** each warning SHALL include type, label, and the two song ids

#### Scenario: Duplicate song in section
- **WHEN** the same song id appears more than once in the section
- **THEN** the function SHALL include a duplicate-song warning for that pair

#### Scenario: No warnings
- **WHEN** all consecutive pairs have high compatibility and no duplicates
- **THEN** the function SHALL return an empty array

### Requirement: Warning Icon on Section Card
Section cards SHALL show a warning icon when the section has compatibility warnings.

#### Scenario: Icon visibility
- **WHEN** getWarningsForSection(songs) returns a non-empty array for the section
- **THEN** a warning icon (e.g. ⚠) SHALL be shown in the section card header
- **AND** hover SHALL show a tooltip listing each warning (e.g. "BPM mismatch: Song A → Song B", "Key clash: Song B → Song C")
