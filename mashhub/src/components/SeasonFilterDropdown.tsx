import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface SeasonFilterDropdownProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  onClear: () => void;
}

const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];

export function SeasonFilterDropdown({ value, onChange, onClear }: SeasonFilterDropdownProps) {
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

  const hasActiveFilter = value !== undefined && value !== '';

  const handleSeasonSelect = (season: string) => {
    if (value === season) {
      onChange(undefined);
    } else {
      onChange(season);
    }
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (hasActiveFilter) {
      return value;
    }
    return "Season";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
          hasActiveFilter
            ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{getDisplayText()}</span>
        <div className="flex items-center space-x-2">
          {hasActiveFilter && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-0.5 hover:bg-primary-100 dark:hover:bg-primary-800 rounded"
              aria-label="Clear Season filter"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={isOpen ? 'transform rotate-180' : ''} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2">
          <div className="space-y-1">
            {SEASONS.map(season => (
              <button
                key={season}
                type="button"
                onClick={() => handleSeasonSelect(season)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  value === season
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
