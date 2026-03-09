## ADDED Requirements

### Requirement: Floating Label Input Component

The system SHALL provide a reusable FloatingInput component that replicates Flutter/Material floating label behavior: label initially inside the field; on focus or when the field contains text, the label SHALL animate upward and become smaller, positioned at the top-left of the input border.

#### Scenario: Default state

- **WHEN** the field is empty and unfocused
- **THEN** the label is visible inside the field with larger font and neutral color

#### Scenario: Focused or filled state

- **WHEN** the field gains focus or has a non-empty value
- **THEN** the label moves upward, reduces in size, and sits at the top border; the input border accommodates the label visually

#### Scenario: Error and disabled states

- **WHEN** the field is in error state
- **THEN** the border and label use error color; helper text MAY be shown and SHALL be readable by screen readers

- **WHEN** the field is disabled
- **THEN** the field has reduced opacity and does not respond to pointer or focus

### Requirement: Floating Label Animation and Theming

Animations SHALL use 200–250ms duration and ease-out or cubic-bezier(0.4,0,0.2,1). Only GPU-friendly properties (transform, opacity) SHALL be animated. Colors SHALL come from the design token system for light and dark themes.

#### Scenario: Theme tokens

- **WHEN** the application is in light or dark mode
- **THEN** floating input border, label, and state colors use theme tokens

### Requirement: Accessibility for Floating Inputs

The floating label SHALL remain associated with the input via htmlFor and id. Focus SHALL be keyboard accessible. When in error state, aria-invalid SHALL be set and error message SHALL be exposed to screen readers.

#### Scenario: Association and error

- **WHEN** a floating input has an error
- **THEN** the input has aria-invalid and the error message is linked via aria-describedby or role="alert"

### Requirement: System-Wide Use of Floating Inputs

All form input fields (login, register, settings, and other forms) SHALL use the FloatingInput or FloatingPasswordInput component. No raw input elements SHALL remain for standard form fields except where a special case is documented.

#### Scenario: Auth forms use floating inputs

- **WHEN** the user visits Login, Register, or Account Settings
- **THEN** all text and password fields use the floating label component
