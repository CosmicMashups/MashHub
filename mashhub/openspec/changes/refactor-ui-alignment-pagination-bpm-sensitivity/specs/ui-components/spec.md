## ADDED Requirements

### Requirement: Customizable Pagination
The system SHALL provide a results-per-page selector allowing users to choose between 10, 20, 30, or 50 items per page.

#### Scenario: User selects page size
- **WHEN** a user changes the items-per-page selector
- **THEN** the pagination SHALL reset to page 1, display the selected number of items per page, and persist the selection for the current session

#### Scenario: Page size selector placement
- **WHEN** viewing paginated results
- **THEN** the page size selector SHALL appear in the top-right of the results section, inline with pagination controls

### Requirement: Responsive Top Matches Grid
The system SHALL display Top Matches cards in a responsive grid layout that adapts to screen size.

#### Scenario: Large screen display
- **WHEN** viewing Top Matches on a large screen (desktop)
- **THEN** cards SHALL display in a grid with 2-4 cards per row

#### Scenario: Small screen display
- **WHEN** viewing Top Matches on a small screen (mobile)
- **THEN** cards SHALL stack vertically in a single column

### Requirement: Color-Coded Match Affinity
The system SHALL display match scores with color-coded affinity indicators based on match score thresholds.

#### Scenario: High affinity display
- **WHEN** a match score is >= 0.85
- **THEN** the score and explanation label SHALL be displayed in green

#### Scenario: Medium affinity display
- **WHEN** a match score is between 0.65 and 0.84
- **THEN** the score and explanation label SHALL be displayed in yellow/amber

#### Scenario: Low affinity display
- **WHEN** a match score is < 0.65
- **THEN** the score and explanation label SHALL be displayed in neutral/muted colors

#### Scenario: Accessibility compliance
- **WHEN** displaying color-coded affinity
- **THEN** the numeric score SHALL always be visible and color contrast SHALL meet WCAG AA minimum standards

### Requirement: Compact Match Explanation Format
The system SHALL display match explanations in a shortened, structured format.

#### Scenario: Compact explanation display
- **WHEN** displaying match reasons
- **THEN** explanations SHALL use the format "BPM + Key + Section Match" instead of verbose sentences, and redundant phrasing SHALL be removed

## MODIFIED Requirements

### Requirement: UI Element Alignment
The system SHALL center-align all action buttons, section titles, table header labels, empty state messages, and the "Find Matches" button.

#### Scenario: Button alignment
- **WHEN** rendering action buttons
- **THEN** buttons SHALL be center-aligned using consistent flexbox alignment strategy

#### Scenario: Table header alignment
- **WHEN** rendering table headers
- **THEN** header cells SHALL use consistent text alignment, and header and body column alignment SHALL match exactly

#### Scenario: Section title alignment
- **WHEN** rendering section titles
- **THEN** titles SHALL be center-aligned

#### Scenario: Empty state alignment
- **WHEN** displaying empty state messages
- **THEN** messages SHALL be center-aligned

#### Scenario: Find Matches button alignment
- **WHEN** rendering the "Find Matches" button
- **THEN** the button SHALL be center-aligned consistently with other action buttons

#### Scenario: Layout stability
- **WHEN** rendering UI elements
- **THEN** no layout shifting SHALL occur due to padding differences, and a shared utility class SHALL be used for center alignment

### Requirement: Vertical Spacing and Padding
The system SHALL use consistent vertical spacing between sections, cards, and content blocks.

#### Scenario: Section spacing
- **WHEN** rendering major sections
- **THEN** vertical padding between sections SHALL be 24px-40px

#### Scenario: Card spacing
- **WHEN** rendering cards
- **THEN** cards SHALL have increased padding and spacing between cards

#### Scenario: Filter panel spacing
- **WHEN** rendering filter panels and results
- **THEN** vertical spacing between filter panel and results SHALL be increased

#### Scenario: Header spacing
- **WHEN** rendering headers and content blocks
- **THEN** vertical spacing between headers and content SHALL be increased

#### Scenario: Responsive spacing
- **WHEN** rendering on small screens
- **THEN** spacing SHALL NOT create excessive empty space, and width SHALL NOT be unnecessarily increased
