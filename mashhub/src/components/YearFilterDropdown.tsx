import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

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
    return "Filter Year";
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
              aria-label="Clear Year filter"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={isOpen ? 'transform rotate-180' : ''} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={min ?? ''}
                onChange={(e) => {
                  const newMin = e.target.value ? parseInt(e.target.value) : undefined;
                  onChange(newMin, max);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
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
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
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
