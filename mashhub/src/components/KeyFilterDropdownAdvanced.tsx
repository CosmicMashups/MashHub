import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { HarmonicMode } from '../types';
import { enforceKeyExclusivity, hasHarmonicValues } from '../utils/filterState';

interface KeyFilterDropdownAdvancedProps {
  value: HarmonicMode;
  onChange: (value: HarmonicMode) => void;
  onClear: () => void;
}

const KEY_OPTIONS = [
  'C Major', 'C# Major', 'D Major', 'D# Major', 'E Major', 'F Major',
  'F# Major', 'G Major', 'G# Major', 'A Major', 'A# Major', 'B Major',
  'C Minor', 'C# Minor', 'D Minor', 'D# Minor', 'E Minor', 'F Minor',
  'F# Minor', 'G Minor', 'G# Minor', 'A Minor', 'A# Minor', 'B Minor'
];

export function KeyFilterDropdownAdvanced({ value, onChange, onClear }: KeyFilterDropdownAdvancedProps) {
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

  const hasActiveFilter = hasHarmonicValues(value);
  const isRangeMode = value.mode === "range" || (typeof value.min === "string" && typeof value.max === "string");
  const isTargetMode = value.mode === "target" || (typeof value.target === "string" && value.tolerance !== undefined);

  const handleTargetChange = (target: string | undefined, tolerance: number | undefined) => {
    const updated = enforceKeyExclusivity(value, {
      mode: "target",
      target,
      tolerance: tolerance ?? 2
    });
    onChange(updated);
  };

  const handleRangeChange = (start: string | undefined, end: string | undefined) => {
    const updated = enforceKeyExclusivity(value, {
      mode: "range",
      min: start,
      max: end
    });
    onChange(updated);
  };

  const getDisplayText = () => {
    if (isTargetMode && typeof value.target === "string" && value.tolerance !== undefined) {
      return `${value.target} ±${value.tolerance}`;
    }
    if (isRangeMode && typeof value.min === "string" && typeof value.max === "string") {
      return `${value.min} → ${value.max}`;
    }
    return "Filter Key";
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
              aria-label="Clear Key filter"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={isOpen ? 'transform rotate-180' : ''} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
          <div className="space-y-4">
            {/* Target Key + Tolerance Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Key ± Tolerance
              </label>
              <div className="space-y-2">
                <select
                  value={isTargetMode ? (value.target as string | undefined) ?? '' : ''}
                  onChange={(e) => {
                    const target = e.target.value || undefined;
                    handleTargetChange(target, value.tolerance);
                  }}
                  disabled={isRangeMode}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    isRangeMode
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <option value="">Any key</option>
                  {KEY_OPTIONS.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Tolerance: {isTargetMode ? (value.tolerance ?? 2) : 2} semitones
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={isTargetMode ? (value.tolerance ?? 2) : 2}
                    onChange={(e) => {
                      const tolerance = parseInt(e.target.value);
                      handleTargetChange(value.target as string | undefined, tolerance);
                    }}
                    disabled={isRangeMode}
                    className={`w-full ${isRangeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key Linked Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={isRangeMode ? (value.min as string | undefined) ?? '' : ''}
                  onChange={(e) => {
                    const start = e.target.value || undefined;
                    handleRangeChange(start, value.max as string | undefined);
                  }}
                  disabled={isTargetMode}
                  className={`px-3 py-2 border rounded-md text-sm ${
                    isTargetMode
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <option value="">Start key</option>
                  {KEY_OPTIONS.filter(k => k.includes('Major')).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <select
                  value={isRangeMode ? (value.max as string | undefined) ?? '' : ''}
                  onChange={(e) => {
                    const end = e.target.value || undefined;
                    handleRangeChange(value.min as string | undefined, end);
                  }}
                  disabled={isTargetMode}
                  className={`px-3 py-2 border rounded-md text-sm ${
                    isTargetMode
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <option value="">End key</option>
                  {KEY_OPTIONS.filter(k => k.includes('Major')).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Circular range across enharmonics, inclusive.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
