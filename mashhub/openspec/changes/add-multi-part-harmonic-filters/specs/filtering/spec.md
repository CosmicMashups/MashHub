## MODIFIED Requirements

### Requirement: PART-Specific Harmonic Filtering
The system SHALL provide the ability to filter songs using multiple PART-specific harmonic filter blocks, where each block specifies a PART with optional BPM and Key constraints, and all blocks are combined with AND logic.

#### Scenario: Multiple PART filter blocks
- **WHEN** the user adds multiple PART-specific harmonic filter blocks in Advanced Filters (e.g., Verse: 85-95 BPM D Major, Chorus: 85-95 BPM F Major)
- **THEN** the system SHALL return songs where ALL specified PARTs satisfy their respective harmonic conditions simultaneously

#### Scenario: Single PART filter block
- **WHEN** the user adds one PART-specific harmonic filter block
- **THEN** the system SHALL behave as the original single PART filter, returning songs where the specified PART matches the harmonic conditions

#### Scenario: AND logic between blocks
- **WHEN** the user has multiple PART filter blocks (e.g., Block 1: Verse 85-95 BPM D Major, Block 2: Chorus 85-95 BPM F Major)
- **THEN** the system SHALL return only songs where Verse satisfies Block 1 conditions AND Chorus satisfies Block 2 conditions, and SHALL exclude songs that satisfy only one block

#### Scenario: Duplicate PART filters
- **WHEN** the user adds multiple filter blocks targeting the same PART (e.g., Block 1: Verse 85-95 BPM, Block 2: Verse D Major)
- **THEN** the system SHALL evaluate both conditions with AND logic, returning songs where the PART satisfies BOTH conditions simultaneously

#### Scenario: Missing PART exclusion
- **WHEN** a filter block specifies a PART that does not exist in a song
- **THEN** the system SHALL exclude that song from results, as it cannot satisfy the PART-specific condition

#### Scenario: Empty block prevention
- **WHEN** the user attempts to apply filters with an incomplete filter block (missing PART or missing all harmonic constraints)
- **THEN** the system SHALL prevent filter application and SHALL display validation feedback indicating the incomplete block

## ADDED Requirements

### Requirement: Multi-Block Filter UI
The system SHALL provide a repeatable "Add Part-Specific Harmonic Filter" component in the Advanced Filters dialog, allowing users to add, configure, and remove multiple PART-specific harmonic filter blocks.

#### Scenario: Adding filter blocks
- **WHEN** the user clicks "Add Part-Specific Harmonic Filter" in Advanced Filters
- **THEN** the system SHALL add a new filter block card with PART selector, BPM filter section, and Key filter section

#### Scenario: Removing filter blocks
- **WHEN** the user clicks the delete button on a filter block
- **THEN** the system SHALL remove that block and update the filter state accordingly

#### Scenario: Filter block structure
- **WHEN** a filter block is displayed
- **THEN** the block SHALL contain: PART selector dropdown, BPM filter (target+tolerance OR range), Key filter (target+tolerance OR range), and delete button, and SHALL be visually distinct with card-based design

#### Scenario: PART selector options
- **WHEN** the user opens the PART selector dropdown
- **THEN** the system SHALL display available PART values including: Verse, Chorus, Bridge, Intro, Outro, Pre-Chorus, and any custom PART values from the songSections table

#### Scenario: Collapsible blocks
- **WHEN** more than 3 filter blocks are present
- **THEN** the system SHALL allow collapsing blocks beyond the first 3, with a summary view showing all active blocks

#### Scenario: Summary preview
- **WHEN** filter blocks are configured in Advanced Filters
- **THEN** the system SHALL display a summary preview at the bottom showing all active PART filter conditions in a readable format

### Requirement: Filter Block Validation
The system SHALL validate that each filter block has at least a PART selected and at least one harmonic constraint (BPM or Key) before allowing filter application.

#### Scenario: Incomplete block validation
- **WHEN** a filter block has a PART selected but no BPM or Key constraints
- **THEN** the system SHALL mark the block as incomplete and SHALL prevent filter application until at least one constraint is added

#### Scenario: Missing PART validation
- **WHEN** a filter block has BPM or Key constraints but no PART selected
- **THEN** the system SHALL mark the block as incomplete and SHALL prevent filter application until a PART is selected

#### Scenario: Visual validation feedback
- **WHEN** a filter block is incomplete
- **THEN** the system SHALL provide visual feedback (e.g., border color, icon) indicating the block needs completion

### Requirement: Multi-Block Filter Performance
The system SHALL maintain filter performance when evaluating multiple PART-specific filter blocks using indexed queries and efficient result intersection.

#### Scenario: Multiple block query optimization
- **WHEN** filtering with multiple PART filter blocks (3+ blocks)
- **THEN** the system SHALL use indexed queries for each PART condition, SHALL query the most selective condition first, and SHALL intersect song IDs efficiently using Set operations

#### Scenario: Short-circuit evaluation
- **WHEN** evaluating multiple PART filter blocks
- **THEN** the system SHALL short-circuit evaluation if any condition yields no matching songs, and SHALL return empty results immediately

#### Scenario: Performance with many blocks
- **WHEN** filtering with 5+ PART filter blocks on a library with 10,000+ songs
- **THEN** the system SHALL complete filtering in under 200ms using optimized indexed queries and result intersection

#### Scenario: No N+1 queries
- **WHEN** evaluating multiple PART filter blocks
- **THEN** the system SHALL use indexed queries per condition and SHALL NOT perform separate queries for each song

### Requirement: Filter Block State Management
The system SHALL maintain filter block state with support for adding, removing, and updating individual blocks while preserving other filter state.

#### Scenario: Adding a block
- **WHEN** the user adds a new filter block
- **THEN** the system SHALL add an empty block to the filter state, and SHALL preserve existing blocks and other filter settings

#### Scenario: Removing a block
- **WHEN** the user removes a filter block
- **THEN** the system SHALL remove that block from filter state, and SHALL preserve other blocks and filter settings

#### Scenario: Updating block values
- **WHEN** the user modifies PART, BPM, or Key values in a filter block
- **THEN** the system SHALL update that specific block's state, and SHALL preserve other blocks and filter settings

#### Scenario: Filter reset
- **WHEN** the user clears all filters
- **THEN** the system SHALL remove all filter blocks and reset to empty state

### Requirement: Integration with Global Filters
The system SHALL combine multi-block PART-specific filters with global harmonic filters (inline BPM/Key) and other Advanced Filters using AND logic.

#### Scenario: Global and PART-specific filters combined
- **WHEN** the user applies both global BPM filter (inline) and PART-specific filter blocks
- **THEN** the system SHALL return songs where ANY section matches global BPM filter AND all PART-specific conditions are satisfied

#### Scenario: Multiple filter types combined
- **WHEN** the user applies global filters, PART-specific filters, and other Advanced Filters (Vocal Status, Type, etc.)
- **THEN** the system SHALL return songs that satisfy ALL filter conditions simultaneously
