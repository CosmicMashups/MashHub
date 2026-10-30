import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Tv, Globe, Sparkles, Layers, type LucideIcon } from 'lucide-react';

const TYPE_OPTIONS = ['Anime', 'Western', 'KPop'] as const;

const TYPE_CONFIG: Record<string, { Icon: LucideIcon; colorClass: string }> = {
  Anime: { Icon: Tv, colorClass: 'text-indigo-500' },
  Western: { Icon: Globe, colorClass: 'text-amber-500' },
  KPop: { Icon: Sparkles, colorClass: 'text-pink-500' },
};

interface TypeFilterDropdownProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  onClear: () => void;
}

export function TypeFilterDropdown({ value, onChange, onClear }: TypeFilterDropdownProps) {
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

  const handleTypeSelect = (type: string) => {
    if (value === type) {
      onChange(undefined);
    } else {
      onChange(type);
    }
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (hasActiveFilter) {
      return value;
    }
    return 'Type';
  };

  const activeConfig = value && TYPE_CONFIG[value] ? TYPE_CONFIG[value] : undefined;
  const ActiveIcon = activeConfig?.Icon || Layers;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          hasActiveFilter
            ? 'bg-rose-500/15 border-rose-400 text-rose-700 dark:text-rose-300 dark:bg-rose-500/20 shadow-rose-500/10'
            : 'bg-theme-surface-elevated border-theme-border-default text-theme-text-primary hover:bg-theme-surface-hover hover:border-theme-border-strong'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-1.5">
          <ActiveIcon size={14} className={hasActiveFilter && activeConfig ? activeConfig.colorClass : "text-rose-500"} />
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
              className="p-0.5 hover:bg-rose-500/20 rounded cursor-pointer"
              aria-label="Clear Type filter"
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
            {TYPE_OPTIONS.map((type) => {
              const config = TYPE_CONFIG[type];
              const Icon = config.Icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeSelect(type)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                    value === type
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      : 'text-theme-text-secondary hover:bg-theme-surface-hover hover:text-theme-text-primary'
                  }`}
                >
                  <Icon size={14} className={`shrink-0 ${config.colorClass}`} />
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
