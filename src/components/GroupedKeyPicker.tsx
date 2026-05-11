import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MUSICAL_MODES, ROOT_NOTES_BY_MODE, type MusicalMode } from '../constants';
import { getEquivalentMajorKey } from '../utils/keyNormalization';

export interface GroupedKeyPickerProps {
  value: string[];
  onChange: (keys: string[]) => void;
  /** When true, show muted "≡ Eb Major" under each key label. */
  showEquivalentMajor?: boolean;
  /** Modes shown as groups (default: all 7). */
  modes?: readonly MusicalMode[];
  /** Which mode groups start expanded (default: Major only). */
  defaultExpandedModes?: ReadonlySet<MusicalMode>;
  className?: string;
}

const DEFAULT_EXPANDED = new Set<MusicalMode>(['Major']);

export function GroupedKeyPicker({
  value,
  onChange,
  showEquivalentMajor = false,
  modes = MUSICAL_MODES,
  defaultExpandedModes = DEFAULT_EXPANDED,
  className = '',
}: GroupedKeyPickerProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<MusicalMode>>(() => new Set(defaultExpandedModes));

  const toggleMode = (mode: MusicalMode) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  };

  const toggleKey = (fullKey: string) => {
    if (value.includes(fullKey)) {
      onChange(value.filter((k) => k !== fullKey));
    } else {
      onChange([...value, fullKey]);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {modes.map((mode) => {
        const roots = ROOT_NOTES_BY_MODE[mode];
        const isOpen = expanded.has(mode);
        return (
          <div key={mode} className="border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => toggleMode(mode)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm font-medium bg-gray-50 dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {mode}
            </button>
            {isOpen && (
              <div className="p-2 grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                {roots.map((root) => {
                  const fullKey = `${root} ${mode}`;
                  const equiv = showEquivalentMajor ? getEquivalentMajorKey(fullKey) : null;
                  return (
                    <label
                      key={fullKey}
                      className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600/50 p-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(fullKey)}
                        onChange={() => toggleKey(fullKey)}
                        className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {fullKey}
                        {equiv && equiv !== fullKey && (
                          <span className="block text-xs text-gray-500 dark:text-gray-400">≡ {equiv}</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** `<select>` with `<optgroup>` per mode — for single-value key fields. */
export function GroupedKeySelect({
  value,
  onChange,
  modes = MUSICAL_MODES,
  allowEmptyOption,
  emptyLabel = 'Any',
  id,
  className = '',
  disabled = false,
}: {
  value: string;
  onChange: (key: string) => void;
  modes?: readonly MusicalMode[];
  allowEmptyOption?: boolean;
  emptyLabel?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {allowEmptyOption && <option value="">{emptyLabel}</option>}
      {modes.map((mode) => (
        <optgroup key={mode} label={mode}>
          {ROOT_NOTES_BY_MODE[mode].map((root) => {
            const fullKey = `${root} ${mode}`;
            return (
              <option key={fullKey} value={fullKey}>
                {fullKey}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
}
