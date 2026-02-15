## ADDED Requirements

### Requirement: Responsive Header Navigation
The application SHALL provide a responsive header that adapts to screen size, showing a horizontal navigation menu on desktop and a mobile menu drawer on mobile devices.

#### Scenario: Desktop header display
- **WHEN** the viewport width is 1024px or greater
- **THEN** the header displays a horizontal navigation menu with all navigation links visible
- **AND** action buttons (Projects, Add Song, Utilities) are visible in the header
- **AND** the mobile menu button is hidden

#### Scenario: Mobile header display
- **WHEN** the viewport width is less than 1024px
- **THEN** the header displays a mobile menu button (hamburger icon)
- **AND** the horizontal navigation menu is hidden
- **AND** primary action buttons are accessible via the mobile menu drawer

#### Scenario: Mobile menu drawer interaction
- **WHEN** the user taps the mobile menu button on a screen less than 1024px wide
- **THEN** a drawer slides in from the left side of the screen
- **AND** the drawer displays all navigation links with icons
- **AND** the drawer displays action buttons (Projects, Add Song, Utilities, Filters)
- **AND** a backdrop overlay appears behind the drawer
- **AND** tapping the backdrop or close button closes the drawer

#### Scenario: Touch target sizes
- **WHEN** any interactive element in the header is rendered
- **THEN** the element has a minimum touch target size of 44×44 pixels
- **AND** the element has adequate spacing from adjacent elements

### Requirement: Responsive Hero Section
The hero section SHALL adapt its layout, typography, and spacing based on screen size to provide optimal viewing on all devices.

#### Scenario: Desktop hero section
- **WHEN** the viewport width is 1024px or greater
- **THEN** the hero section displays content in a two-column layout (content left, visual right)
- **AND** the title uses large typography (text-5xl to text-7xl)
- **AND** badges and buttons are displayed horizontally
- **AND** statistics are displayed in a 3-column grid

#### Scenario: Mobile hero section
- **WHEN** the viewport width is less than 1024px
- **THEN** the hero section displays content in a single-column stacked layout
- **AND** the title uses responsive typography (text-4xl on mobile, scaling up)
- **AND** badges stack vertically on very small screens (≤640px)
- **AND** call-to-action buttons are full-width on mobile
- **AND** statistics are displayed in a 2-column grid on mobile, 3-column on tablet

#### Scenario: Responsive spacing
- **WHEN** the hero section is rendered
- **THEN** padding adjusts based on screen size (py-12 mobile, py-16 tablet, py-24 desktop)
- **AND** gaps between elements scale appropriately

### Requirement: Responsive Container System
The application SHALL use a responsive container system that provides appropriate padding and max-width constraints across all screen sizes.

#### Scenario: Container padding
- **WHEN** content is rendered in the main container
- **THEN** horizontal padding is 16px (px-4) on mobile, 24px (px-6) on tablet, 32px (px-8) on desktop
- **AND** the container has a maximum width of 1280px (max-w-7xl) on large screens

#### Scenario: Safe area support
- **WHEN** the application is rendered on a device with notches or safe areas
- **THEN** padding respects safe area insets using CSS environment variables
- **AND** content is not obscured by device notches or system UI
