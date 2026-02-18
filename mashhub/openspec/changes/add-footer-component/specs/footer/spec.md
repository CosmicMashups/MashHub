## ADDED Requirements

### Requirement: Footer Component
The application SHALL display a Footer component at the bottom of the main layout that provides navigation links, creator credits, API attributions, and copyright information.

#### Scenario: Footer displays on page load
- **WHEN** the application loads
- **THEN** the Footer component is visible at the bottom of the page
- **AND** the Footer contains all required sections (Brand, Product, Resources, Creator Credits)

#### Scenario: Footer responsive layout
- **WHEN** the viewport width is desktop size (≥768px)
- **THEN** the Footer displays in a multi-column layout (3-4 columns)
- **WHEN** the viewport width is mobile size (<768px)
- **THEN** the Footer sections stack vertically

### Requirement: Footer Brand Section
The Footer SHALL include a Brand section displaying the application name and a brief description.

#### Scenario: Brand section displays correctly
- **WHEN** the Footer is rendered
- **THEN** the Brand section displays "MashHub" as the app name
- **AND** the Brand section displays a short description (1-2 lines) about the application
- **AND** the description text is styled with appropriate typography

### Requirement: Footer Product Links
The Footer SHALL include a Product section with links to key application features and documentation.

#### Scenario: Product links are accessible
- **WHEN** the Footer is rendered
- **THEN** the Product section displays links for: Features, Advanced Matching, Projects, Filtering, Documentation
- **AND** each link has appropriate hover effects
- **AND** links may be placeholders if routing is not yet implemented

### Requirement: Footer Resources Section
The Footer SHALL include a Resources section with links to external resources, API credits, and legal pages.

#### Scenario: Resources links are accessible
- **WHEN** the Footer is rendered
- **THEN** the Resources section displays links for: GitHub (placeholder), API Credits, Privacy Policy, Terms of Service
- **AND** the API Credits link or content mentions Spotify API and Jikan API
- **AND** each link has appropriate hover effects

### Requirement: Footer Creator Credits
The Footer SHALL include a Creator Credits section with social media links to the creator's profiles.

#### Scenario: Creator social links are accessible
- **WHEN** the Footer is rendered
- **THEN** the Creator section displays social media links with icons for:
  - YouTube: https://www.youtube.com/c/CosmicMashups
  - Twitter: https://twitter.com/CosmicMashups
  - TikTok: https://www.tiktok.com/@cosmic_mashups
  - MyAnimeList: https://myanimelist.net/profile/CosmicMashups
  - Bandcamp: https://cosmicmashups.bandcamp.com/
- **AND** each link opens in a new tab with `target="_blank"` and `rel="noopener noreferrer"`
- **AND** external links are clearly indicated visually

### Requirement: Footer Copyright Notice
The Footer SHALL display a copyright notice with the current year.

#### Scenario: Copyright displays current year
- **WHEN** the Footer is rendered
- **THEN** the copyright notice displays "© {currentYear} MashHub. All rights reserved."
- **AND** the year is dynamically calculated from the current date

### Requirement: Footer Theme Integration
The Footer SHALL use the existing theme token system for consistent styling across light and dark modes.

#### Scenario: Footer adapts to theme
- **WHEN** the user switches between light and dark mode
- **THEN** the Footer background, text, and border colors update immediately
- **AND** the Footer uses theme tokens (e.g., `bg-theme-background-primary`, `text-theme-text-primary`)
- **AND** the Footer maintains proper contrast ratios in both modes

### Requirement: Footer Visual Design
The Footer SHALL have a modern, premium appearance that matches the Hero Section styling.

#### Scenario: Footer matches design system
- **WHEN** the Footer is rendered
- **THEN** the Footer has a subtle top border separator
- **AND** the Footer has appropriate spacing and padding
- **AND** the Footer uses clean typography hierarchy
- **AND** the Footer has a soft gradient or elevated background (matching Hero Section style)

### Requirement: Footer Link Interactions
The Footer SHALL provide clear visual feedback for interactive elements.

#### Scenario: Links have hover effects
- **WHEN** the user hovers over a Footer link
- **THEN** the link displays a hover effect (underline, color shift, or opacity change)
- **AND** the transition is smooth
- **AND** the hover effect uses theme accent colors

### Requirement: Footer Accessibility
The Footer SHALL be accessible to users with disabilities and assistive technologies.

#### Scenario: Footer is keyboard navigable
- **WHEN** the user navigates using only the keyboard (Tab key)
- **THEN** all Footer links receive focus in a logical order
- **AND** focused links have visible focus indicators
- **AND** links can be activated with Enter key

#### Scenario: Footer has proper ARIA labels
- **WHEN** the Footer is rendered
- **THEN** external links have appropriate ARIA labels indicating they open in a new tab
- **AND** section headers have proper semantic HTML structure
- **AND** color contrast meets WCAG AA standards

### Requirement: Footer Integration
The Footer SHALL be integrated into the main application layout without breaking existing functionality.

#### Scenario: Footer placement in layout
- **WHEN** the application renders
- **THEN** the Footer is positioned below all main content
- **AND** the Footer is inside the main layout container
- **AND** the Footer does not interfere with existing components (Header, Hero Section, SongList, etc.)
