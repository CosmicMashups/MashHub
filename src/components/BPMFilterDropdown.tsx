import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Gauge } from 'lucide-react';
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
      return `${value.target} ±${value.tolerance} BPM`;
    }
    if (isRangeMode && (value.min !== undefined || value.max !== undefined)) {
      const min = value.min ?? 0;
      const max = value.max ?? 999;
      return `${min}-${max} BPM`;
    }
    return "BPM";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
          hasActiveFilter
            ? 'bg-sky-500/15 border-sky-400 text-sky-700 dark:text-sky-300 dark:bg-sky-500/20 shadow-sky-500/10'
            : 'bg-theme-surface-elevated border-theme-border-default text-theme-text-primary hover:bg-theme-surface-hover hover:border-theme-border-strong'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-1.5">
          <Gauge size={14} className="text-sky-500" />
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
              className="p-0.5 hover:bg-sky-500/20 rounded cursor-pointer"
              aria-label="Clear BPM filter"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-theme-surface-elevated border border-theme-border-strong text-theme-text-primary rounded-xl shadow-xl p-4 backdrop-blur-md">
          <div className="space-y-4">
            {/* Target BPM + Tolerance Mode */}
            <div>
              <label className="block text-xs font-bold text-theme-text-primary mb-2 flex items-center gap-1.5">
                <Gauge size={13} className="text-sky-500" />
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
                  className={`w-full px-3 py-1.5 border rounded-lg text-xs ${
                    isRangeMode
                      ? 'bg-theme-surface-base text-theme-text-disabled cursor-not-allowed opacity-60'
                      : 'border-theme-border-default bg-theme-surface-base text-theme-text-primary focus:ring-2 focus:ring-sky-500'
                  }`}
                  placeholder="Target BPM"
                  min="60"
                  max="300"
                />
                <div>
                  <label className="block text-[11px] text-theme-text-muted mb-1">
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
                    className={`w-full accent-sky-500 ${isRangeMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-theme-border-subtle pt-3">
              <label className="block text-xs font-bold text-theme-text-primary mb-2 flex items-center gap-1.5">
                <Gauge size={13} className="text-sky-400" />
                BPM Range
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="number"
                  value={isRangeMode ? (value.min ?? '') : ''}
                  onChange={(e) => {
                    const min = e.target.value ? parseInt(e.target.value) : undefined;
                    handleRangeChange(min, value.max);
                  }}
                  disabled={isTargetMode}
                  className={`px-3 py-1.5 border rounded-lg text-xs ${
                    isTargetMode
                      ? 'bg-theme-surface-base text-theme-text-disabled cursor-not-allowed opacity-60'
                      : 'border-theme-border-default bg-theme-surface-base text-theme-text-primary focus:ring-2 focus:ring-sky-500'
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
                  className={`px-3 py-1.5 border rounded-lg text-xs ${
                    isTargetMode
                      ? 'bg-theme-surface-base text-theme-text-disabled cursor-not-allowed opacity-60'
                      : 'border-theme-border-default bg-theme-surface-base text-theme-text-primary focus:ring-2 focus:ring-sky-500'
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
