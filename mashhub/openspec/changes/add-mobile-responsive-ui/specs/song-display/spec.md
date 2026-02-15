## ADDED Requirements

### Requirement: Responsive Song List Display
The song list SHALL display as cards on mobile/tablet and as a table on desktop, automatically adapting based on screen size.

#### Scenario: Desktop table view
- **WHEN** the viewport width is 1024px or greater
- **THEN** songs are displayed in a table format with columns: ID, Title, Artist, BPM, Key, Year, Type, Actions
- **AND** all columns are visible
- **AND** table rows are hoverable and clickable
- **AND** actions are accessible via a dropdown menu in each row

#### Scenario: Tablet card view
- **WHEN** the viewport width is between 768px and 1023px
- **THEN** songs are displayed as cards in a list
- **AND** each card shows title, artist, BPM, key, year, and type
- **AND** cards include quick action buttons (View, Add to Project)
- **AND** cards show expandable section information if available

#### Scenario: Mobile card view
- **WHEN** the viewport width is less than 768px
- **THEN** songs are displayed as compact cards in a list
- **AND** each card shows title, artist, and essential metadata (BPM, key, year)
- **AND** badges are abbreviated when space is limited (V/I instead of Vocal/Instrumental)
- **AND** cards include a quick actions bar at the bottom
- **AND** cards have a minimum height of 80px for touch interaction

#### Scenario: Touch-friendly song cards
- **WHEN** song cards are rendered on mobile
- **THEN** all interactive elements have minimum 44×44px touch targets
- **AND** cards have adequate spacing between them (12px minimum)
- **AND** text is truncated with ellipsis to prevent overflow
- **AND** action buttons are clearly visible and accessible

### Requirement: Responsive Song Details Display
Song details SHALL be displayed in a bottom sheet on mobile and a centered dialog on desktop.

#### Scenario: Mobile song details sheet
- **WHEN** the user opens song details on a screen less than 768px wide
- **THEN** a bottom sheet slides up from the bottom
- **AND** the sheet displays all song information in a scrollable format
- **AND** sections are displayed as vertical cards with stacked information
- **AND** action buttons are displayed in a sticky footer at the bottom
- **AND** the sheet has a drag handle for dismissal

#### Scenario: Desktop song details dialog
- **WHEN** the user opens song details on a screen 768px or wider
- **THEN** a centered modal dialog is displayed
- **AND** song information is organized in a grid layout
- **AND** sections are displayed as horizontal cards with inline information
- **AND** action buttons are displayed in the dialog footer

#### Scenario: Responsive section display
- **WHEN** song sections are displayed
- **THEN** mobile shows sections as vertical cards with stacked BPM and key badges
- **AND** desktop shows sections as horizontal cards with inline BPM and key badges
- **AND** section information is clearly readable on all screen sizes
