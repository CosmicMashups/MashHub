## MODIFIED Requirements

### Requirement: BPM Filtering
The system SHALL filter songs based on section-level BPM values, returning songs where ANY section matches the BPM criteria.

#### Scenario: BPM range filtering
- **WHEN** filtering songs by BPM range [minBpm, maxBpm]
- **THEN** the system SHALL query the songSections table for sections with BPM within the range, SHALL join to songs table, and SHALL return unique songs (not sections) where at least one section matches

#### Scenario: BPM filtering performance
- **WHEN** filtering by BPM on a large library (10,000+ songs)
- **THEN** the query SHALL use the [SONG_ID+BPM] compound index for optimal performance, and SHALL complete in under 100ms

#### Scenario: Multiple sections matching
- **WHEN** a song has multiple sections that match the BPM filter
- **THEN** the song SHALL appear in results only once, regardless of how many sections match

### Requirement: Key Filtering
The system SHALL filter songs based on section-level KEY values, returning songs where ANY section matches the key criteria.

#### Scenario: Key range filtering
- **WHEN** filtering songs by key range or target key with tolerance
- **THEN** the system SHALL query the songSections table for sections with matching keys, SHALL join to songs table, and SHALL return unique songs where at least one section matches

#### Scenario: Key filtering performance
- **WHEN** filtering by key on a large library
- **THEN** the query SHALL use the [SONG_ID+KEY] compound index for optimal performance, and SHALL complete in under 100ms

### Requirement: Combined Filtering
The system SHALL support filtering by multiple criteria simultaneously, where a song matches if ANY section satisfies ALL criteria.

#### Scenario: BPM and key combined filter
- **WHEN** filtering by both BPM range and key criteria
- **THEN** the system SHALL return songs where at least one section matches both the BPM and key criteria simultaneously

#### Scenario: Multiple criteria filtering
- **WHEN** filtering by BPM, key, vocal status, type, and year
- **THEN** the system SHALL apply section-level filters for BPM and key, song-level filters for other criteria, and SHALL return songs where at least one section matches section-level criteria AND the song matches song-level criteria

## MODIFIED Requirements

### Requirement: Filter Performance
The system SHALL maintain filter performance for large libraries by using indexed queries and avoiding N+1 query patterns.

#### Scenario: Efficient join queries
- **WHEN** filtering songs by section properties
- **THEN** the system SHALL use a single indexed query with join, and SHALL NOT perform separate queries for each song

#### Scenario: Filter result caching
- **WHEN** the same filter criteria are applied multiple times
- **THEN** the system MAY cache filter results to improve performance, and SHALL invalidate cache when data changes
