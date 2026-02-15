## ADDED Requirements

### Requirement: Responsive Modal System
The application SHALL use bottom sheets for modals on mobile devices and centered dialogs on desktop, automatically selecting the appropriate component based on screen size.

#### Scenario: Mobile bottom sheet
- **WHEN** any modal or dialog is opened on a screen less than 768px wide
- **THEN** a bottom sheet component is used instead of a centered dialog
- **AND** the sheet slides up from the bottom with animation
- **AND** the sheet has rounded top corners
- **AND** a drag handle is visible at the top
- **AND** the sheet occupies 85-90% of viewport height

#### Scenario: Desktop centered dialog
- **WHEN** any modal or dialog is opened on a screen 768px or wider
- **THEN** a centered dialog component is used
- **AND** the dialog has appropriate max-width constraints
- **AND** the dialog is vertically centered with appropriate margins

#### Scenario: Sheet component behavior
- **WHEN** a bottom sheet is displayed
- **THEN** the user can dismiss it by dragging down, tapping backdrop, or tapping close button
- **AND** the sheet content is scrollable if it exceeds available height
- **AND** the sheet has a sticky footer for action buttons when needed
- **AND** the backdrop has appropriate opacity (50% black)

### Requirement: Responsive Form Layouts
Forms within modals and dialogs SHALL adapt their layout based on screen size.

#### Scenario: Mobile form layout
- **WHEN** a form is displayed in a mobile bottom sheet
- **THEN** form fields stack vertically
- **AND** labels appear above inputs
- **AND** inputs use full width
- **AND** button groups stack vertically or use a grid layout

#### Scenario: Desktop form layout
- **WHEN** a form is displayed in a desktop dialog
- **THEN** form fields can use multi-column layouts where appropriate
- **AND** labels can appear beside inputs
- **AND** buttons are displayed horizontally in the footer

#### Scenario: Touch-friendly form controls
- **WHEN** form controls are rendered on mobile
- **THEN** all inputs have minimum 44px height
- **AND** checkboxes and radio buttons have minimum 44×44px touch targets
- **AND** adequate spacing exists between form elements

### Requirement: Responsive Action Buttons
Action buttons in modals and dialogs SHALL adapt their layout and sizing based on screen size.

#### Scenario: Mobile action buttons
- **WHEN** action buttons are displayed in a mobile bottom sheet
- **THEN** buttons are displayed in a sticky footer
- **AND** buttons have minimum 44px height
- **AND** buttons use full width or equal-width grid layout
- **AND** primary and secondary actions are clearly distinguished

#### Scenario: Desktop action buttons
- **WHEN** action buttons are displayed in a desktop dialog
- **THEN** buttons are displayed in the dialog footer
- **AND** buttons are right-aligned with appropriate spacing
- **AND** buttons use standard sizing (not full width)
