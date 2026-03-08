import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown, Snowflake, Flower2, Sun, Leaf, type LucideIcon } from 'lucide-react';
import { SEASON_OPTIONS } from '../constants';

export type SeasonValue = (typeof SEASON_OPTIONS)[number] | '';

const SEASON_CONFIG: Record<string, { Icon: LucideIcon; colorClass: string }> = {
  Winter: { Icon: Snowflake, colorClass: 'text-sky-500' },
  Spring: { Icon: Flower2, colorClass: 'text-emerald-500' },
  Summer: { Icon: Sun, colorClass: 'text-amber-500' },
  Fall: { Icon: Leaf, colorClass: 'text-orange-500' },
};

interface SeasonSelectProps {
  id?: string;
  value: SeasonValue;
  onChange: (value: SeasonValue) => void;
  placeholder?: string;
  className?: string;
  label?: ReactNode;
}

export function SeasonSelect({
  id,
  value,
  onChange,
  placeholder = 'Select season',
  className = '',
  label,
}: SeasonSelectProps) {
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

  const selectedConfig = value ? SEASON_CONFIG[value] : null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-left"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || 'Season'}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedConfig ? (
            <>
              <selectedConfig.Icon size={16} className={`shrink-0 ${selectedConfig.colorClass}`} />
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-gray-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[12rem] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg py-1"
          role="listbox"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === ''}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            {placeholder}
          </button>
          {SEASON_OPTIONS.map((season) => {
            const config = SEASON_CONFIG[season];
            const Icon = config.Icon;
            return (
              <button
                key={season}
                type="button"
                role="option"
                aria-selected={value === season}
                onClick={() => {
                  onChange(season);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  value === season
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={16} className={`shrink-0 ${config.colorClass}`} />
                {season}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { SEASON_CONFIG };
