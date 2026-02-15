## ADDED Requirements

### Requirement: Responsive Search Bar
The search bar SHALL adapt its layout and filter access based on screen size, providing touch-friendly controls on mobile devices.

#### Scenario: Desktop search bar
- **WHEN** the viewport width is 768px or greater
- **THEN** the search input and filter button are displayed side-by-side
- **AND** the filter button shows text ("Filters") with an icon
- **AND** active filters are displayed as individual tags below the search bar

#### Scenario: Mobile search bar
- **WHEN** the viewport width is less than 768px
- **THEN** the search input takes full width
- **AND** the filter button is an icon-only button with a badge showing active filter count
- **AND** active filters are displayed as a compact summary button that opens the filter sheet

#### Scenario: Touch-friendly search controls
- **WHEN** the search bar is rendered on mobile
- **THEN** all interactive elements have minimum 44×44px touch targets
- **AND** the search input has a minimum height of 44px
- **AND** sufficient spacing exists between interactive elements

### Requirement: Mobile Filter Sheet
The application SHALL provide a bottom sheet component for filter dialogs on mobile devices, replacing centered dialogs.

#### Scenario: Mobile filter sheet display
- **WHEN** the user opens the filter dialog on a screen less than 768px wide
- **THEN** a bottom sheet slides up from the bottom of the screen
- **AND** the sheet occupies 90% of the viewport height
- **AND** the sheet has rounded top corners
- **AND** a drag handle is visible at the top of the sheet
- **AND** a backdrop overlay appears behind the sheet

#### Scenario: Filter sheet interaction
- **WHEN** the filter sheet is open
- **THEN** the user can drag the sheet down to dismiss it
- **AND** tapping the backdrop closes the sheet
- **AND** tapping the close button (X) closes the sheet
- **AND** the sheet content is scrollable if it exceeds the available height

#### Scenario: Accordion filter layout on mobile
- **WHEN** the filter sheet is displayed on mobile
- **THEN** filter groups are organized in an accordion layout
- **AND** each accordion item shows the filter group name, icon, and active count badge
- **AND** users can expand/collapse individual filter groups
- **AND** the accordion allows multiple groups to be open simultaneously

#### Scenario: Desktop filter dialog
- **WHEN** the user opens the filter dialog on a screen 768px or wider
- **THEN** a centered modal dialog is displayed
- **AND** all filter groups are fully expanded
- **AND** the dialog has a maximum width of 768px
- **AND** the dialog has a maximum height of 85vh with scrollable content

### Requirement: Responsive Filter Controls
Filter controls SHALL adapt their layout and interaction patterns based on screen size.

#### Scenario: Compact filter controls on mobile
- **WHEN** filter controls are rendered on mobile
- **THEN** form inputs use full width
- **AND** button groups stack vertically when space is limited
- **AND** labels and inputs have adequate spacing for touch interaction

#### Scenario: Active filter display
- **WHEN** filters are active
- **THEN** mobile displays a compact summary button showing filter count
- **AND** desktop displays individual filter tags with remove buttons
- **AND** both provide a "Clear All" action
