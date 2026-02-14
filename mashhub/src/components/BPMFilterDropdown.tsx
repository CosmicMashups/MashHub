import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { HarmonicMode } from '../types';
import { enforceBpmExclusivity, hasHarmonicValues } from '../utils/filterState';

interface BPMFilterDropdownProps {
  value: HarmonicMode;
  onChange: (value: HarmonicMode) => void;
  onClear: () => void;
}

export function BPMFilterDropdown({ value, onChange, onClear }: BPMFilterDropdownProps) {
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
  const isRangeMode = value.mode === "range" || (value.min !== undefined || value.max !== undefined);
  const isTargetMode = value.mode === "target" || (value.target !== undefined && value.tolerance !== undefined);

  const handleTargetChange = (target: number | undefined, tolerance: number | undefined) => {
    const updated = enforceBpmExclusivity(value, {
      mode: "target",
      target,
      tolerance: tolerance ?? 10
    });
    onChange(updated);
  };

  const handleRangeChange = (min: number | undefined, max: number | undefined) => {
    const updated = enforceBpmExclusivity(value, {
      mode: "range",
      min,
      max
    });
    onChange(updated);
  };

  const getDisplayText = () => {
    if (isTargetMode && value.target !== undefined && value.tolerance !== undefined) {
      return `${value.target} ±${value.tolerance}`;
    }
    if (isRangeMode && (value.min !== undefined || value.max !== undefined)) {
      const min = value.min ?? 0;
      const max = value.max ?? 999;
      return `${min}-${max}`;
    }
    return "Filter BPM";
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
              aria-label="Clear BPM filter"
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
            {/* Target BPM + Tolerance Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target BPM ± Tolerance
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={isTargetMode ? (value.target as number | undefined) ?? '' : ''}
                  onChange={(e) => {
                    const target = e.target.value ? parseInt(e.target.value) : undefined;
                    handleTargetChange(target, value.tolerance);
                  }}
                  disabled={isRangeMode}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${
                    isRangeMode
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                  placeholder="Target BPM"
                  min="60"
                  max="300"
                />
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Tolerance: ±{isTargetMode ? (value.tolerance ?? 10) : 10}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={isTargetMode ? (value.tolerance ?? 10) : 10}
                    onChange={(e) => {
                      const tolerance = parseInt(e.target.value);
                      handleTargetChange(value.target as number | undefined, tolerance);
                    }}
                    disabled={isRangeMode}
                    className={`w-full ${isRangeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                BPM Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={isRangeMode ? (value.min ?? '') : ''}
                  onChange={(e) => {
                    const min = e.target.value ? parseInt(e.target.value) : undefined;
                    handleRangeChange(min, value.max);
                  }}
                  disabled={isTargetMode}
                  className={`px-3 py-2 border rounded-md text-sm ${
                    isTargetMode
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                  placeholder="Min BPM"
                  min="40"
                  max="400"
                />
                <input
                  type="number"
                  value={isRangeMode ? (value.max ?? '') : ''}
                  onChange={(e) => {
                    const max = e.target.value ? parseInt(e.target.value) : undefined;
                    handleRangeChange(value.min, max);
                  }}
                  disabled={isTargetMode}
                  className={`px-3 py-2 border rounded-md text-sm ${
                    isTargetMode
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                  placeholder="Max BPM"
                  min="40"
                  max="400"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
