## ADDED Requirements

### Requirement: Responsive Project Grid
The project manager SHALL display projects in a responsive grid that adapts to screen size.

#### Scenario: Desktop project grid
- **WHEN** the viewport width is 1280px or greater
- **THEN** projects are displayed in a 4-column grid
- **AND** project cards show full information including creation date
- **AND** action buttons are displayed horizontally

#### Scenario: Tablet project grid
- **WHEN** the viewport width is between 1024px and 1279px
- **THEN** projects are displayed in a 3-column grid
- **AND** project cards maintain full information display

#### Scenario: Mobile project grid
- **WHEN** the viewport width is less than 1024px
- **THEN** projects are displayed in a single-column layout on mobile (≤640px)
- **AND** projects are displayed in a 2-column grid on tablet (641px-1023px)
- **AND** project cards use compact layout with essential information
- **AND** action buttons stack vertically on mobile

#### Scenario: Responsive project card
- **WHEN** a project card is rendered
- **THEN** the card adapts its padding based on screen size (16px mobile, 24px desktop)
- **AND** metadata is abbreviated on mobile when space is limited
- **AND** all interactive elements meet minimum 40px touch target size

### Requirement: Mobile Project Song Reordering
The application SHALL provide a button-based reordering alternative for mobile devices, replacing drag-and-drop functionality.

#### Scenario: Mobile reordering mode
- **WHEN** the user views a project song list on a screen less than 768px wide
- **THEN** a "Reorder" button is displayed
- **AND** tapping the button enters edit mode
- **AND** in edit mode, each song displays up/down arrow buttons
- **AND** arrow buttons are disabled at list boundaries (top/bottom)

#### Scenario: Reordering interaction
- **WHEN** the user is in reordering mode on mobile
- **THEN** tapping the up arrow moves the song up one position
- **AND** tapping the down arrow moves the song down one position
- **AND** the list updates immediately with visual feedback
- **AND** tapping "Done" exits edit mode

#### Scenario: Desktop drag-and-drop
- **WHEN** the user views a project song list on a screen 768px or wider
- **THEN** drag-and-drop functionality is available
- **AND** songs can be reordered by dragging
- **AND** visual feedback is provided during drag operations

#### Scenario: Touch-friendly reordering controls
- **WHEN** reordering controls are displayed on mobile
- **THEN** arrow buttons have minimum 44×44px touch targets
- **AND** buttons are clearly labeled and accessible
- **AND** disabled states are visually distinct
