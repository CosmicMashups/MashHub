import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Tv, Globe, Sparkles, type LucideIcon } from 'lucide-react';

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
  const ActiveIcon = activeConfig?.Icon;

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
          {hasActiveFilter && ActiveIcon && activeConfig ? (
            <>
              <ActiveIcon size={16} className={`shrink-0 ${activeConfig.colorClass}`} />
              {getDisplayText()}
            </>
          ) : (
            getDisplayText()
          )}
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
              aria-label="Clear Type filter"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={isOpen ? 'transform rotate-180' : ''} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2">
          <div className="space-y-1">
            {TYPE_OPTIONS.map((type) => {
              const config = TYPE_CONFIG[type];
              const Icon = config.Icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeSelect(type)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                    value === type
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
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
