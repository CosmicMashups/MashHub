import { memo, useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { resolveQueryToPitchClass } from '../../utils/harmonicWheelDataset';
import type { PitchClass } from '../../utils/harmonicWheelDataset';

export interface HarmonicWheelSearchBarProps {
  readonly onFocusPitchClass: (pc: PitchClass | null) => void;
}

export const HarmonicWheelSearchBar = memo(function HarmonicWheelSearchBar({
  onFocusPitchClass,
}: HarmonicWheelSearchBarProps) {
  const [query, setQuery] = useState('');

  const runSearch = useCallback(() => {
    const pc = resolveQueryToPitchClass(query);
    if (pc === null) {
      onFocusPitchClass(null);
      return;
    }
    onFocusPitchClass(pc);
  }, [query, onFocusPitchClass]);

  return (
    <div className="w-full max-w-xl">
      <label htmlFor="harmonic-wheel-search" className="sr-only">
        Search key or Camelot code
      </label>
      <div className="flex gap-2 rounded-xl border border-theme-border-default bg-theme-surface-elevated p-1 shadow-sm focus-within:ring-2 focus-within:ring-theme-border-focus">
        <div className="flex flex-1 items-center gap-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-theme-text-tertiary" aria-hidden />
          <input
            id="harmonic-wheel-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runSearch();
              }
            }}
            placeholder="Key (e.g. D Minor) or Camelot (e.g. 10A)"
            className="min-h-[44px] flex-1 bg-transparent text-sm text-theme-text-primary outline-none placeholder:text-theme-text-tertiary"
            autoComplete="off"
          />
        </div>
        <button type="button" onClick={runSearch} className="btn-primary shrink-0 px-4 py-2 text-sm">
          Go
        </button>
      </div>
    </div>
  );
});
