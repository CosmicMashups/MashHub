import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sun, Snowflake, Flower2, Leaf, type LucideIcon } from 'lucide-react';
import { SEASON_OPTIONS } from '../../constants';
import { FloatingFieldShell } from './FloatingFieldShell';
import type { SeasonValue } from '../SeasonSelect';

const SEASON_CONFIG: Record<string, { Icon: LucideIcon; colorClass: string }> = {
  Winter: { Icon: Snowflake, colorClass: 'text-sky-500' },
  Spring: { Icon: Flower2, colorClass: 'text-emerald-500' },
  Summer: { Icon: Sun, colorClass: 'text-amber-500' },
  Fall: { Icon: Leaf, colorClass: 'text-orange-500' },
};

export interface FloatingSeasonSelectProps {
  id?: string;
  value: SeasonValue;
  onChange: (value: SeasonValue) => void;
  placeholder?: string;
}

export function FloatingSeasonSelect({
  id,
  value,
  onChange,
  placeholder = 'Select season',
}: FloatingSeasonSelectProps) {
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
    <div className="relative" ref={dropdownRef}>
      <FloatingFieldShell label="Season" icon={<Sun size={16} className="text-sky-500" />} id={id}>
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="floating-input-trigger"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex items-center gap-2 min-w-0 flex-1">
            {selectedConfig ? (
              <>
                <selectedConfig.Icon size={16} className={`shrink-0 ${selectedConfig.colorClass}`} />
                <span className="truncate">{value}</span>
              </>
            ) : (
              <span className="floating-input-trigger-placeholder truncate">{placeholder}</span>
            )}
          </span>
          <ChevronDown size={16} className={`shrink-0 text-theme-text-muted transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </FloatingFieldShell>

      {isOpen && (
        <div className="floating-input-dropdown-panel py-1" role="listbox">
          <button
            type="button"
            role="option"
            aria-selected={value === ''}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-theme-text-muted hover:bg-theme-state-hover"
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
                    : 'text-theme-text-primary hover:bg-theme-state-hover'
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
