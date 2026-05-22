import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Music2 } from 'lucide-react';
import { PROJECT_SONG_TYPE_OPTIONS } from '../../constants/songOriginTypes';
import { FloatingFieldShell } from './FloatingFieldShell';

export interface FloatingSongTypeMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  id?: string;
}

export function FloatingSongTypeMultiSelect({ value, onChange, id }: FloatingSongTypeMultiSelectProps) {
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

  const selected = value.filter(Boolean);
  const hasFilter = selected.length > 0;

  const toggleType = (typeValue: string) => {
    if (selected.includes(typeValue)) {
      onChange(selected.filter((t) => t !== typeValue));
    } else {
      onChange([...selected, typeValue]);
    }
  };

  const displayText = hasFilter
    ? selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} types selected`
    : 'All song types';

  return (
    <div className="relative" ref={dropdownRef}>
      <FloatingFieldShell
        label="Song types"
        icon={<Music2 size={16} className="text-violet-500" />}
        id={id}
      >
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="floating-input-trigger"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="truncate flex-1 min-w-0">{displayText}</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {hasFilter && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange([]);
                  }
                }}
                className="p-0.5 rounded hover:bg-theme-state-hover text-theme-text-muted cursor-pointer"
                aria-label="Clear song type filter"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown size={16} className={`text-theme-text-muted ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </FloatingFieldShell>

      {isOpen && (
        <div
          className="floating-input-dropdown-panel p-2"
          role="listbox"
          aria-multiselectable="true"
        >
          {PROJECT_SONG_TYPE_OPTIONS.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer ${
                  checked
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200'
                    : 'text-theme-text-primary hover:bg-theme-state-hover'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleType(opt.value)}
                  className="rounded border-theme-border-default text-primary-600 focus:ring-primary-500"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
