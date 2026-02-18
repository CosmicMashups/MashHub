## ADDED Requirements

### Requirement: Non-Blocking Dialog Initialization Work
The system SHALL perform dialog-related initialization work (matching, Dexie/IndexedDB queries, image/color extraction) in a way that does not block the main thread or cause noticeable UI freezes.

#### Scenario: Async dialog initialization
- **WHEN** a dialog is opened and triggers initialization work that involves data loading or computation
- **THEN** that work SHALL be executed asynchronously
- **AND** the dialog SHALL remain responsive to user input (e.g., scroll, close, basic interactions) while work completes

#### Scenario: Cancellable background operations
- **WHEN** a dialog that has triggered background work is closed or its target entity changes (e.g., user selects a different song)
- **THEN** any outstanding initialization operations for that dialog SHALL be cancelled or safely ignored
- **AND** the system SHALL NOT continue unnecessary work that could degrade UI responsiveness

