import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Calendar } from 'lucide-react';

interface YearFilterDropdownProps {
  min?: number;
  max?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  onClear: () => void;
}

export function YearFilterDropdown({ min, max, onChange, onClear }: YearFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilter = min !== undefined || max !== undefined;

  const getDisplayText = () => {
    if (min !== undefined && max !== undefined) {
      return `${min} - ${max}`;
    }
    if (min !== undefined) {
      return `${min}+`;
    }
    if (max !== undefined) {
      return `-${max}`;
    }
    return "Period";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          hasActiveFilter
            ? 'bg-amber-500/15 border-amber-400 text-amber-700 dark:text-amber-300 dark:bg-amber-500/20 shadow-amber-500/10'
            : 'bg-theme-surface-elevated border-theme-border-default text-theme-text-primary hover:bg-theme-surface-hover hover:border-theme-border-strong'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-amber-500" />
          {getDisplayText()}
        </span>
        <div className="flex items-center space-x-1.5">
          {hasActiveFilter && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-0.5 hover:bg-amber-500/20 rounded cursor-pointer"
              aria-label="Clear Year filter"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-theme-surface-elevated border border-theme-border-strong text-theme-text-primary rounded-xl shadow-xl p-4 backdrop-blur-md">
          <div>
            <label className="block text-xs font-bold text-theme-text-primary mb-2 flex items-center gap-1.5">
              <Calendar size={13} className="text-amber-500" />
              Year Range
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="number"
                value={min ?? ''}
                onChange={(e) => {
                  const newMin = e.target.value ? parseInt(e.target.value) : undefined;
                  onChange(newMin, max);
                }}
                className="w-full px-3 py-1.5 border border-theme-border-default bg-theme-surface-base rounded-lg text-xs text-theme-text-primary focus:ring-2 focus:ring-amber-500"
                placeholder="Min Year"
                min="1900"
                max="2030"
              />
              <input
                type="number"
                value={max ?? ''}
                onChange={(e) => {
                  const newMax = e.target.value ? parseInt(e.target.value) : undefined;
                  onChange(min, newMax);
                }}
                className="w-full px-3 py-1.5 border border-theme-border-default bg-theme-surface-base rounded-lg text-xs text-theme-text-primary focus:ring-2 focus:ring-amber-500"
                placeholder="Max Year"
                min="1900"
                max="2030"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
