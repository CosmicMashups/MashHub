import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, CloudSun } from 'lucide-react';
import { SEASON_CONFIG } from './SeasonSelect';

interface SeasonFilterDropdownProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  onClear: () => void;
}

const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'] as const;

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

  const activeConfig = value ? SEASON_CONFIG[value] : undefined;
  const ActiveIcon = activeConfig?.Icon || CloudSun;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          hasActiveFilter
            ? 'bg-purple-500/15 border-purple-400 text-purple-700 dark:text-purple-300 dark:bg-purple-500/20 shadow-purple-500/10'
            : 'bg-theme-surface-elevated border-theme-border-default text-theme-text-primary hover:bg-theme-surface-hover hover:border-theme-border-strong'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-1.5">
          <ActiveIcon size={14} className={hasActiveFilter && activeConfig ? activeConfig.colorClass : "text-purple-500"} />
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
              className="p-0.5 hover:bg-purple-500/20 rounded cursor-pointer"
              aria-label="Clear Season filter"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-48 bg-theme-surface-elevated border border-theme-border-strong text-theme-text-primary rounded-xl shadow-xl p-2 backdrop-blur-md">
          <div className="space-y-1">
            {SEASONS.map(season => {
              const config = SEASON_CONFIG[season];
              const Icon = config.Icon;
              return (
                <button
                  key={season}
                  type="button"
                  onClick={() => handleSeasonSelect(season)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    value === season
                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                      : 'text-theme-text-secondary hover:bg-theme-surface-hover hover:text-theme-text-primary'
                  }`}
                >
                  <Icon size={14} className={`shrink-0 ${config.colorClass}`} />
                  {season}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
