## Why

Users need to find songs with complex harmonic patterns across multiple sections. For example, finding songs where the Verse has specific BPM and Key properties AND the Chorus has different BPM and Key properties. The current single PART-specific filter capability (from refactor-filter-ui-architecture) only supports filtering by one PART at a time. This extension enables compound harmonic queries that match real-world mixing and mashup workflows where different song sections must satisfy different harmonic constraints.

## What Changes

- **NEW**: Multiple PART-specific harmonic filter blocks in Advanced Filters dialog
- **NEW**: "Add Part-Specific Harmonic Filter" repeatable component
- **NEW**: AND logic for combining multiple PART-specific filter blocks
- **NEW**: Visual card-based UI for each filter block with delete functionality
- **MODIFIED**: Filter evaluation logic to support multiple PART-specific conditions with AND semantics
- **MODIFIED**: Database query optimization for multi-PART filtering scenarios
- Filter state model extended to support array of PART-specific filter blocks

## Impact

- Affected specs: filtering
- Affected code:
  - `src/components/FilterPanel.tsx` - Extended to support multiple PART filter blocks
  - `src/services/matchingService.ts` - Updated filtering logic for multi-PART AND evaluation
  - `src/services/database.ts` - Query optimization for multiple PART conditions
  - `src/types/index.ts` - Extended filter state interfaces for multi-block support
- Integrates with: `refactor-filter-ui-architecture` (extends PART-specific filtering capability)
