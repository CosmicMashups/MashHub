import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Music } from 'lucide-react';
import { GroupedKeyPicker } from './GroupedKeyPicker';

interface KeyFilterDropdownProps {
  value: string[];
  onChange: (value: string[]) => void;
  onClear: () => void;
}

export function KeyFilterDropdown({ value, onChange, onClear }: KeyFilterDropdownProps) {
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

  const hasActiveFilter = value && value.length > 0;

  const getDisplayText = () => {
    if (hasActiveFilter) {
      if (value.length === 1) {
        return value[0];
      }
      return `${value.length} keys selected`;
    }
    return 'Key';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
          hasActiveFilter
            ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-2">
          <Music size={16} className="text-emerald-500" />
          {getDisplayText()}
        </span>
        <div className="flex items-center space-x-2">
          {hasActiveFilter && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-0.5 hover:bg-primary-100 dark:hover:bg-primary-800 rounded"
              aria-label="Clear Key filter"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={isOpen ? 'transform rotate-180' : ''} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Music size={14} className="text-emerald-500" />
            Select Keys
          </label>
          <GroupedKeyPicker value={value} onChange={onChange} showEquivalentMajor />
          {hasActiveFilter && (
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center gap-1"
              >
                <X size={12} />
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
