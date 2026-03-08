## Why

The current Library Overview section provides minimal value with basic statistics that are already available in the Utility Dialog. The application lacks a compelling visual introduction that communicates MashHub's value proposition and core capabilities. A premium Hero Section positioned prominently below the header will improve first impressions, better communicate the product's purpose, and replace the redundant Library Overview with more meaningful content.

## What Changes

- **REMOVED**: Library Overview component and section (lines 546-562 in `src/App.tsx`)
- **REMOVED**: Associated statistics display, layout spacing, and any unused state related to Library Overview
- **ADDED**: Hero Section component positioned between Header and Search Bar
- **ADDED**: Premium visual design with gradient backgrounds, glassmorphism effects, and animated entrance
- **ADDED**: Feature highlight badges (Harmonic Matching, Part-Specific Keys, Smart Filtering)
- **ADDED**: Call-to-action buttons (Start Matching, Explore Library)
- **ADDED**: Statistics strip displaying Total Songs, Total Projects, and Supported Years
- **MODIFIED**: Main layout structure to accommodate Hero Section placement

## Impact

- Affected specs: ui-components
- Affected code:
  - `src/App.tsx` - Remove Library Overview, add Hero Section placement
  - `src/components/HeroSection.tsx` - New component (to be created)
  - No changes to filtering logic, search functionality, or data management
  - No changes to header or search bar components
  - No database or API changes
