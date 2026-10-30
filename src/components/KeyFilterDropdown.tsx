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
      return `${value.length} keys`;
    }
    return 'Key';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          hasActiveFilter
            ? 'bg-emerald-500/15 border-emerald-400 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/20 shadow-emerald-500/10'
            : 'bg-theme-surface-elevated border-theme-border-default text-theme-text-primary hover:bg-theme-surface-hover hover:border-theme-border-strong'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-1.5">
          <Music size={14} className="text-emerald-500" />
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
              className="p-0.5 hover:bg-emerald-500/20 rounded cursor-pointer"
              aria-label="Clear Key filter"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-theme-surface-elevated border border-theme-border-strong text-theme-text-primary rounded-xl shadow-xl p-3.5 backdrop-blur-md">
          <label className="block text-xs font-bold text-theme-text-primary mb-2 flex items-center gap-1.5">
            <Music size={13} className="text-emerald-500" />
            Select Keys
          </label>
          <GroupedKeyPicker value={value} onChange={onChange} showEquivalentMajor />
          {hasActiveFilter && (
            <div className="pt-2 mt-2 border-t border-theme-border-subtle">
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
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
