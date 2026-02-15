import { BPMFilterDropdown } from './BPMFilterDropdown';
import { KeyFilterDropdown } from './KeyFilterDropdown';
import { YearFilterDropdown } from './YearFilterDropdown';
import { Filter } from 'lucide-react';
import type { FilterState } from '../types';

interface InlineFiltersProps {
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
  onAdvancedFiltersClick: () => void;
  onApplyFilters?: (criteria: any) => Promise<void>;
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

  return (
    <div className="flex flex-wrap items-center gap-3 mt-4">
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
      <button
        type="button"
        onClick={onAdvancedFiltersClick}
        className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter size={16} className="mr-2" />
        Advanced Filters
      </button>
    </div>
  );
}
