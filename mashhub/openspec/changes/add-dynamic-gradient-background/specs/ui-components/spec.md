## MODIFIED Requirements

### Requirement: Song Details Dialog Visual Design
The Song Details dialog SHALL display a dynamic gradient background derived from the dominant colors of the song's cover artwork.

#### Scenario: Dynamic gradient from cover image
- **WHEN** the Song Details dialog is opened
- **AND** a cover image is available (from Jikan or Spotify API)
- **THEN** the system SHALL extract 2-3 dominant colors from the cover image
- **AND** the dialog background SHALL display a gradient using those extracted colors
- **AND** the gradient SHALL be applied smoothly without affecting text readability

#### Scenario: Fallback to default colors
- **WHEN** the Song Details dialog is opened
- **AND** color extraction fails (CORS error, image load failure, etc.)
- **THEN** the dialog SHALL use default theme background colors
- **AND** the dialog SHALL remain fully functional

#### Scenario: Color extraction caching
- **WHEN** the same song's details dialog is opened multiple times
- **THEN** the system SHALL use cached extracted colors
- **AND** color extraction SHALL NOT be performed again for the same image URL
