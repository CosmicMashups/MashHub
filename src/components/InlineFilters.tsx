import { BPMFilterDropdown } from './BPMFilterDropdown';
import { KeyFilterDropdown } from './KeyFilterDropdown';
import { YearFilterDropdown } from './YearFilterDropdown';
import { SeasonFilterDropdown } from './SeasonFilterDropdown';
import { TypeFilterDropdown } from './TypeFilterDropdown';
import { Filter } from 'lucide-react';
import type { FilterState } from '../types';
import type { MatchCriteria } from '../services/matchingService';

interface InlineFiltersProps {
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
  onAdvancedFiltersClick: () => void;
  onApplyFilters?: (criteria: MatchCriteria) => Promise<void>;
}

export function InlineFilters({ filterState, onFilterChange, onAdvancedFiltersClick, onApplyFilters }: InlineFiltersProps) {
  const applyFilters = async (newState: FilterState) => {
    onFilterChange(newState);
    if (onApplyFilters) {
      const { filterStateToMatchCriteria } = await import('../utils/filterState');
      const criteria = filterStateToMatchCriteria(newState);
      await onApplyFilters(criteria);
    }
  };

  const handleBpmChange = async (bpm: FilterState['bpm']) => {
    await applyFilters({ ...filterState, bpm });
  };

  const handleBpmClear = async () => {
    await applyFilters({ ...filterState, bpm: { mode: null } });
  };

  const handleKeyChange = async (key: FilterState['key']) => {
    await applyFilters({ ...filterState, key });
  };

  const handleKeyClear = async () => {
    await applyFilters({ ...filterState, key: [] });
  };

  const handleYearChange = async (min: number | undefined, max: number | undefined) => {
    await applyFilters({ ...filterState, year: { min, max } });
  };

  const handleYearClear = async () => {
    await applyFilters({ ...filterState, year: {} });
  };

  const handleSeasonChange = async (season: string | undefined) => {
    await applyFilters({
      ...filterState,
      advanced: {
        ...filterState.advanced,
        season
      }
    });
  };

  const handleSeasonClear = async () => {
    await applyFilters({
      ...filterState,
      advanced: {
        ...filterState.advanced,
        season: undefined
      }
    });
  };

  const handleTypeChange = async (type: string | undefined) => {
    await applyFilters({
      ...filterState,
      advanced: {
        ...filterState.advanced,
        type
      }
    });
  };

  const handleTypeClear = async () => {
    await applyFilters({
      ...filterState,
      advanced: {
        ...filterState.advanced,
        type: undefined
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xs shadow-2xs">
      <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mr-1 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-theme-accent-primary" />
        Filter:
      </span>
      <BPMFilterDropdown
        value={filterState.bpm}
        onChange={handleBpmChange}
        onClear={handleBpmClear}
      />
      <KeyFilterDropdown
        value={filterState.key}
        onChange={handleKeyChange}
        onClear={handleKeyClear}
      />
      <YearFilterDropdown
        min={filterState.year.min}
        max={filterState.year.max}
        onChange={handleYearChange}
        onClear={handleYearClear}
      />
      <SeasonFilterDropdown
        value={filterState.advanced.season}
        onChange={handleSeasonChange}
        onClear={handleSeasonClear}
      />
      <TypeFilterDropdown
        value={filterState.advanced.type}
        onChange={handleTypeChange}
        onClear={handleTypeClear}
      />
      <button
        type="button"
        onClick={onAdvancedFiltersClick}
        className="inline-flex items-center px-3.5 py-1.5 border border-indigo-200 dark:border-indigo-800/80 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-gradient-to-r from-indigo-500/10 to-sky-500/10 hover:from-indigo-500/20 hover:to-sky-500/20 transition-all shadow-xs active:scale-[0.98] cursor-pointer ml-auto"
      >
        <Filter size={13} className="mr-1.5 text-indigo-600 dark:text-indigo-400" />
        Advanced Filters
      </button>
    </div>
  );
}
