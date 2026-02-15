## MODIFIED Requirements

### Requirement: BPM Similarity Calculation
The system SHALL calculate BPM similarity using a tolerance window approach that minimizes penalty for close BPM values (≤5 BPM difference) and applies gradual reduction beyond the tolerance window.

#### Scenario: Exact or close BPM match
- **WHEN** the BPM difference between two songs is ≤5 BPM
- **THEN** the similarity score SHALL be 1.0 (no penalty)

#### Scenario: Gradual penalty beyond tolerance
- **WHEN** the BPM difference is >5 BPM but ≤15 BPM
- **THEN** the similarity score SHALL be calculated as `max(0, 1 - (distance - 5) / 15)`, providing gradual reduction

#### Scenario: Hard cutoff for large differences
- **WHEN** the BPM difference is >15 BPM
- **THEN** the similarity score SHALL be 0 (hard cutoff)

#### Scenario: Normalized output
- **WHEN** calculating BPM similarity
- **THEN** the output SHALL be normalized between 0 and 1, compatible with the existing 45% weight in the matching algorithm

#### Scenario: Harmonic relationships preserved
- **WHEN** calculating BPM similarity
- **THEN** harmonic BPM relationships (e.g., 120 and 240) SHALL still be supported and evaluated separately from direct BPM matching

#### Scenario: Weight distribution unchanged
- **WHEN** calculating match scores
- **THEN** the BPM weight distribution (45%) SHALL remain unchanged, and only the similarity calculation function SHALL be modified
