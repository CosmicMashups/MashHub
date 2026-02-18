## ADDED Requirements

### Requirement: ARIA Labels on All Interactive Elements
Every interactive element (button, input, drag handle, dropdown trigger) that does not have a visible text label SHALL have an `aria-label` or be associated with a visible `<label>` element.

#### Scenario: Icon-only buttons have accessible names
- **WHEN** an assistive technology reads the theme toggle button
- **THEN** it announces "Toggle theme" (or equivalent) rather than an empty label

#### Scenario: Drag handles have accessible names
- **WHEN** an assistive technology focuses a drag handle in the project manager
- **THEN** it announces "Drag to reorder [song title]"

### Requirement: Modal Focus Management
All modal dialogs SHALL implement focus trapping on open and restore focus to the trigger element on close. Modals SHALL have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal title element.

#### Scenario: Focus is trapped inside an open modal
- **WHEN** a modal is open and the user presses Tab repeatedly
- **THEN** focus cycles only through interactive elements inside the modal and does not escape to the background page

#### Scenario: Focus returns to trigger on close
- **WHEN** a modal is dismissed via the close button or Escape key
- **THEN** focus returns to the element that triggered the modal's opening

#### Scenario: Modal has correct ARIA role
- **WHEN** the modal DOM is inspected
- **THEN** the dialog container element has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to a heading element inside the modal

### Requirement: Song List ARIA Roles
The song list container SHALL have `role="list"` and each song item SHALL have `role="listitem"` to provide semantic list structure for screen readers.

#### Scenario: Screen reader announces list length
- **WHEN** an assistive technology enters the song list
- **THEN** it announces "list, N items" where N matches the current filtered song count

### Requirement: Live Search Result Announcements
A visually hidden `aria-live="polite"` region SHALL announce the count of search results whenever the search query or active filters change.

#### Scenario: Result count is announced after search
- **WHEN** the user types a search query and results update
- **THEN** within 500ms, a screen reader announces "24 songs found" (or equivalent count)

#### Scenario: No results is announced
- **WHEN** the search query returns zero results
- **THEN** a screen reader announces "No songs found"

### Requirement: Keyboard-Navigable Search Suggestions
The search suggestions dropdown SHALL support full keyboard navigation: arrow keys to move focus through suggestions, Enter to select, and Escape to dismiss.

#### Scenario: Arrow keys navigate suggestions
- **WHEN** the suggestions dropdown is open and the user presses the down arrow key
- **THEN** focus moves to the first suggestion item; subsequent down arrow presses move to subsequent items

#### Scenario: Escape dismisses suggestions
- **WHEN** the suggestions dropdown is open and the user presses Escape
- **THEN** the dropdown closes and focus returns to the search input

### Requirement: Filter Groups Have Fieldset Structure
Groups of related filter checkboxes and radio buttons SHALL be wrapped in `<fieldset>` elements with a `<legend>` that describes the group.

#### Scenario: Key filter checkboxes have a group label
- **WHEN** the key filter section in `FilterPanel` or `AdvancedFiltersDialog` is inspected
- **THEN** the checkboxes are contained within a `<fieldset>` whose `<legend>` text is "Key" or equivalent
