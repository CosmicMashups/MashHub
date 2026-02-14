## ADDED Requirements

### Requirement: Centralized Theme Token System
The system SHALL provide a centralized theme token system that defines all colors used throughout the application using semantic naming conventions.

#### Scenario: Theme tokens are defined
- **WHEN** the application loads
- **THEN** all color values SHALL be defined in a single theme configuration file
- **AND** tokens SHALL use semantic names (e.g., `backgroundPrimary`, `textPrimary`, `surfaceElevated`)
- **AND** tokens SHALL have explicit mappings for both light and dark modes

#### Scenario: Components consume theme tokens
- **WHEN** a component renders
- **THEN** the component SHALL reference theme tokens instead of hard-coded color values
- **AND** the component SHALL NOT contain inline hex color values or direct Tailwind color classes (e.g., `bg-gray-800`)

### Requirement: Visual Consistency Across Themes
The system SHALL ensure visual consistency when switching between light and dark modes, with all components adapting immediately without requiring a page reload.

#### Scenario: Theme switch updates all components
- **WHEN** the user toggles between light and dark mode
- **THEN** all visible components SHALL update their colors immediately
- **AND** no component SHALL require a page reload to reflect theme changes
- **AND** all components SHALL maintain proper visual hierarchy

#### Scenario: Components match background hierarchy
- **WHEN** components are displayed in either theme
- **THEN** components SHALL not visually clash with their backgrounds
- **AND** surface elevation SHALL be clearly distinguishable
- **AND** dialog overlays SHALL have appropriate contrast

### Requirement: Surface and Elevation Hierarchy
The system SHALL define a clear surface elevation hierarchy that works appropriately for both light and dark modes.

#### Scenario: Surface levels are defined
- **WHEN** components use surface colors
- **THEN** the system SHALL provide distinct surface levels: base, surface, elevated, hover, selected
- **AND** light mode SHALL use shadows for elevation
- **AND** dark mode SHALL use subtle background variations for elevation
- **AND** each level SHALL have sufficient contrast from adjacent levels

### Requirement: Text Contrast Hierarchy
The system SHALL enforce a text contrast hierarchy with primary, secondary, muted, and disabled text levels that meet WCAG AA accessibility standards.

#### Scenario: Text colors meet contrast requirements
- **WHEN** text is displayed on any background
- **THEN** primary text SHALL have sufficient contrast (WCAG AA minimum)
- **AND** secondary text SHALL have sufficient contrast
- **AND** muted text SHALL be distinguishable but appropriately subdued
- **AND** disabled text SHALL be clearly distinguishable as disabled

#### Scenario: No low-contrast combinations
- **WHEN** any text and background combination is rendered
- **THEN** the combination SHALL NOT create low-contrast gray-on-gray scenarios
- **AND** accent colors SHALL remain readable on both light and dark backgrounds

### Requirement: Interactive State Standardization
The system SHALL standardize interactive states (hover, focus, active, disabled) using theme tokens instead of hard-coded color logic.

#### Scenario: Hover states use theme tokens
- **WHEN** a user hovers over an interactive element
- **THEN** the hover state SHALL use theme-defined hover colors
- **AND** hover states SHALL NOT use hard-coded darkening logic (e.g., `hover:bg-gray-800` when base is `bg-gray-700`)

#### Scenario: Focus states are consistent
- **WHEN** an element receives focus
- **THEN** the focus indicator SHALL use theme-defined focus colors
- **AND** focus indicators SHALL be visible in both light and dark modes

#### Scenario: Active and disabled states use tokens
- **WHEN** an element is in active or disabled state
- **THEN** the state SHALL use theme-defined colors
- **AND** disabled elements SHALL be clearly distinguishable from enabled elements

### Requirement: Component Color Refactoring
All UI components SHALL be refactored to consume theme tokens, removing all hard-coded color values.

#### Scenario: Header uses theme tokens
- **WHEN** the header component renders
- **THEN** it SHALL use theme tokens for background, text, and border colors
- **AND** it SHALL NOT contain hard-coded color classes

#### Scenario: Dialogs use theme tokens
- **WHEN** any dialog or modal component renders
- **THEN** it SHALL use theme tokens for overlay, surface, and text colors
- **AND** dialog overlays SHALL have proper contrast in both themes

#### Scenario: Lists use theme tokens
- **WHEN** list components render
- **THEN** they SHALL use theme tokens for item backgrounds, text, and hover states
- **AND** list items SHALL have proper hover contrast

#### Scenario: Forms use theme tokens
- **WHEN** form components render
- **THEN** they SHALL use theme tokens for inputs, labels, and borders
- **AND** focus states SHALL be clearly visible

### Requirement: Legacy CSS Cleanup
The system SHALL remove all legacy CSS color rules that conflict with the theme system.

#### Scenario: No conflicting color rules
- **WHEN** the application loads
- **THEN** `index.css` SHALL NOT contain hard-coded color values in `:root` that conflict with Tailwind
- **AND** `@media (prefers-color-scheme: light)` rules SHALL be removed if they conflict with theme system
- **AND** legacy button and link color rules SHALL be removed

### Requirement: Theme Toggle Integrity
The theme toggle SHALL update global theme state and all components SHALL re-render with new colors immediately.

#### Scenario: Theme toggle updates immediately
- **WHEN** the user clicks the theme toggle
- **THEN** the theme state SHALL update globally
- **AND** all components SHALL re-render with new theme colors immediately
- **AND** no component SHALL require reload to reflect theme change

#### Scenario: Theme preference persists
- **WHEN** the user selects a theme preference
- **THEN** the preference SHALL be saved to localStorage
- **AND** the preference SHALL be restored on page load
- **AND** there SHALL be no flash of incorrect theme before preference is applied
