import type { HarmonicMode, FilterState, PartHarmonicFilterBlock } from '../types';
import type { MatchCriteria } from '../services/matchingService';

// Helper to check if harmonic mode has values
export function hasHarmonicValues(mode: HarmonicMode): boolean {
  if (!mode || mode.mode === null) return false;
  if (mode.mode === "target") {
    return mode.target !== undefined && mode.tolerance !== undefined;
  }
  if (mode.mode === "range") {
    return mode.min !== undefined || mode.max !== undefined;
  }
  return false;
}

// Helper to enforce mutual exclusivity - returns updated mode
export function enforceBpmExclusivity(
  currentMode: HarmonicMode,
  newValue: Partial<HarmonicMode>
): HarmonicMode {
  const updated = { ...currentMode, ...newValue };
  
  // If range mode is being set, clear target mode
  if (updated.mode === "range" || (updated.min !== undefined || updated.max !== undefined)) {
    updated.mode = "range";
    updated.target = undefined;
    updated.tolerance = undefined;
  }
  // If target mode is being set, clear range mode
  else if (updated.mode === "target" || (updated.target !== undefined && updated.tolerance !== undefined)) {
    updated.mode = "target";
    updated.min = undefined;
    updated.max = undefined;
  }
  
  return updated;
}

// Helper to enforce mutual exclusivity for keys
export function enforceKeyExclusivity(
  currentMode: HarmonicMode,
  newValue: Partial<HarmonicMode>
): HarmonicMode {
  return enforceBpmExclusivity(currentMode, newValue);
}

// Convert FilterState to MatchCriteria for backward compatibility
export function filterStateToMatchCriteria(state: FilterState): MatchCriteria {
  const criteria: MatchCriteria = {};
  
  // Global BPM filter
  if (state.bpm.mode === "target" && state.bpm.target !== undefined && state.bpm.tolerance !== undefined) {
    criteria.targetBpm = typeof state.bpm.target === "number" ? state.bpm.target : undefined;
    criteria.bpmTolerance = state.bpm.tolerance;
  } else if (state.bpm.mode === "range") {
    criteria.bpmRange = [
      state.bpm.min ?? 0,
      state.bpm.max ?? 999
    ];
  }
  
  // Global Key filter
  if (state.key.mode === "target" && state.key.target !== undefined && state.key.tolerance !== undefined) {
    criteria.targetKey = typeof state.key.target === "string" ? state.key.target : undefined;
    criteria.keyTolerance = state.key.tolerance;
  } else if (state.key.mode === "range" && typeof state.key.min === "string" && typeof state.key.max === "string") {
    criteria.keyRangeStart = state.key.min;
    criteria.keyRangeEnd = state.key.max;
  }
  
  // Year filter
  if (state.year.min !== undefined || state.year.max !== undefined) {
    criteria.yearRange = [
      state.year.min ?? 1900,
      state.year.max ?? 2030
    ];
  }
  
  // Advanced filters
  if (state.advanced.vocalStatus) criteria.vocalStatus = state.advanced.vocalStatus;
  if (state.advanced.type) criteria.type = state.advanced.type;
  if (state.advanced.origin) criteria.origin = state.advanced.origin;
  if (state.advanced.season) criteria.season = state.advanced.season;
  if (state.advanced.artist) criteria.artist = state.advanced.artist;
  if (state.advanced.text) criteria.searchText = state.advanced.text;
  
  // PART-specific filters (will be handled separately in matching service)
  if (state.advanced.partSpecific && state.advanced.partSpecific.length > 0) {
    criteria.partSpecificFilters = state.advanced.partSpecific;
  }
  
  return criteria;
}

// Create default FilterState
export function createDefaultFilterState(): FilterState {
  return {
    bpm: { mode: null },
    key: { mode: null },
    year: {},
    advanced: {
      partSpecific: []
    }
  };
}

// Validate filter block completeness
export function isFilterBlockComplete(block: PartHarmonicFilterBlock): boolean {
  if (!block.part) return false;
  const hasBpm = block.bpm && hasHarmonicValues(block.bpm);
  const hasKey = block.key && hasHarmonicValues(block.key);
  return hasBpm || hasKey;
}
