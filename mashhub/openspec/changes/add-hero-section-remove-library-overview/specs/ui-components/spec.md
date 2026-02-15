## REMOVED Requirements

### Requirement: Library Overview Display
**Reason**: Redundant with Utility Dialog statistics. Replaced by Hero Section which provides better visual introduction and includes statistics in a more engaging format.
**Migration**: Statistics (Total Songs, Total Projects) are now displayed in the Hero Section statistics strip.

## ADDED Requirements

### Requirement: Hero Section Component
The application SHALL display a Hero Section component positioned between the Header and Search Bar sections.

#### Scenario: Hero Section displays on page load
- **WHEN** the application loads
- **THEN** the Hero Section is visible below the Header and above the Search Bar
- **AND** the Hero Section displays with a fade-in and translateY entrance animation

#### Scenario: Hero Section responsive layout
- **WHEN** the viewport width is less than 768px
- **THEN** the Hero Section content stacks vertically
- **WHEN** the viewport width is 768px or greater
- **THEN** the Hero Section displays in a two-column layout (content left, decorative visual right)

### Requirement: Hero Section Content
The Hero Section SHALL display the following content elements:
- Application title: "MashHub — Intelligent Music Matching"
- Compelling slogan: "Craft Perfect Transitions."
- Short description (2-3 lines) highlighting core features
- Feature highlight badges (Harmonic Matching, Part-Specific Keys, Smart Filtering)

#### Scenario: Hero Section displays all content elements
- **WHEN** the Hero Section is rendered
- **THEN** the application title is displayed prominently
- **AND** the slogan is displayed below the title
- **AND** the description text is displayed below the slogan
- **AND** three feature badges are displayed

### Requirement: Hero Section Call-to-Action Buttons
The Hero Section SHALL include two call-to-action buttons: "Start Matching" and "Explore Library".

#### Scenario: CTA buttons are interactive
- **WHEN** the user clicks "Start Matching"
- **THEN** the application scrolls to or focuses on the filter/search section
- **WHEN** the user clicks "Explore Library"
- **THEN** the application scrolls to or focuses on the song list section

### Requirement: Hero Section Statistics Strip
The Hero Section SHALL display a statistics strip showing:
- Total Songs count
- Total Projects count
- Supported Years (calculated from songs data)

#### Scenario: Statistics display current data
- **WHEN** the Hero Section is rendered
- **THEN** the statistics strip displays the current total songs count
- **AND** the statistics strip displays the current total projects count
- **AND** the statistics strip displays the number of unique years in the songs collection
- **WHEN** songs or projects are added or removed
- **THEN** the statistics update reactively

#### Scenario: Statistics handle empty data
- **WHEN** there are no songs in the library
- **THEN** the Total Songs count displays as 0
- **WHEN** there are no projects
- **THEN** the Total Projects count displays as 0
- **WHEN** there are no songs with year data
- **THEN** the Supported Years displays as 0 or "N/A"

### Requirement: Hero Section Visual Design
The Hero Section SHALL implement a premium visual design with:
- Gradient background (dark navy → deep blue for dark mode, soft cool gradient for light mode)
- Soft radial glow accents
- Glassmorphism content card effect
- Floating decorative blurred shapes (CSS-based, no heavy assets)
- High contrast, accessible typography

#### Scenario: Hero Section adapts to theme
- **WHEN** the application is in dark mode
- **THEN** the Hero Section displays with dark navy to deep blue gradient background
- **WHEN** the application is in light mode
- **THEN** the Hero Section displays with soft cool gradient background
- **AND** text maintains WCAG AA contrast ratios in both modes

### Requirement: Hero Section Animations
The Hero Section SHALL include smooth entrance animations:
- Fade-in animation
- TranslateY (slide up) animation
- Animations maintain 60fps smoothness
- No heavy infinite loops

#### Scenario: Hero Section animates on mount
- **WHEN** the Hero Section component mounts
- **THEN** it fades in from opacity 0 to 1
- **AND** it translates upward from a slight offset
- **AND** the animation completes smoothly without jank

### Requirement: Hero Section Accessibility
The Hero Section SHALL be accessible with:
- Accessible text scaling
- WCAG AA contrast ratios
- Proper ARIA labels on interactive elements
- Keyboard navigation support

#### Scenario: Hero Section is keyboard accessible
- **WHEN** the user navigates with keyboard (Tab key)
- **THEN** focus moves to CTA buttons in logical order
- **AND** buttons are activated with Enter or Space key
- **AND** focus indicators are visible

#### Scenario: Hero Section supports screen readers
- **WHEN** a screen reader reads the Hero Section
- **THEN** all text content is announced
- **AND** interactive elements have descriptive labels
- **AND** statistics are announced with context
