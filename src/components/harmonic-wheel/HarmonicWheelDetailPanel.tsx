import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, ArrowRight, Filter, Disc3 } from 'lucide-react';
import type { HarmonicSegment } from '../../utils/harmonicWheelDataset';
import { camelotLabelForPitchClass } from '../../utils/harmonicWheelDataset';

export interface HarmonicWheelDetailPanelProps {
  readonly segment: HarmonicSegment | null;
  readonly onUseInFilters?: (canonicalKey: string) => void;
}

export const HarmonicWheelDetailPanel = memo(function HarmonicWheelDetailPanel({
  segment,
  onUseInFilters,
}: HarmonicWheelDetailPanelProps) {
  const navigate = useNavigate();

  const camelotMajor = useMemo(
    () => (segment ? camelotLabelForPitchClass(segment.pitchClass, 'B') : null),
    [segment]
  );

  if (!segment) {
    return (
      <aside
        className="rounded-2xl border border-theme-border-default bg-theme-surface-base p-6 shadow-[var(--theme-shadow-card)]"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 mb-2 text-theme-text-muted">
          <Disc3 className="w-5 h-5 text-theme-accent-primary" />
          <h2 className="text-base font-semibold text-theme-text-primary">Harmonic Family Details</h2>
        </div>
        <p className="text-sm text-theme-text-secondary leading-relaxed">
          Select a wedge on the wheel to view every relative mode MashHub groups into this harmonic family (sharing the same normalized equivalent-major pitch class).
        </p>
      </aside>
    );
  }

  const majorEntry = segment.keys.find((k) => k.mode === 'Major');
  const filterKey = majorEntry?.key ?? segment.representativeMajor;

  return (
    <aside
      className="rounded-2xl border border-theme-border-default bg-theme-surface-base p-6 shadow-[var(--theme-shadow-card)] space-y-5"
      aria-live="polite"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-theme-text-primary">
            {segment.representativeMajor.replace(' Major', '')} family
          </h2>
          {camelotMajor && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/25">
              Camelot {camelotMajor}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-theme-text-secondary leading-relaxed">
          These keys share one pitch-class collection after normalization. MashHub treats them as the same harmonic family for matching.
        </p>
      </div>

      {/* Relative Modes - Always fully shown in a prominent, styled grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-secondary flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-primary-500" />
            Relative Modes ({segment.keys.length})
          </h3>
          <span className="text-[11px] text-theme-text-muted">
            Click any mode to filter
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {segment.keys.map((k) => {
            const isMajor = k.mode.toLowerCase() === 'major';
            const isMinor = k.mode.toLowerCase() === 'minor';
            const camelotCode = isMajor
              ? `${segment.camelotPosition}B`
              : isMinor
              ? `${segment.camelotPosition}A`
              : null;

            return (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  if (onUseInFilters) onUseInFilters(k.key);
                  else navigate(`/?applyKey=${encodeURIComponent(k.key)}`);
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all group cursor-pointer ${
                  isMajor
                    ? 'border-primary-500/35 bg-primary-500/5 hover:bg-primary-500/15 hover:border-primary-500/60 dark:bg-primary-500/10'
                    : isMinor
                    ? 'border-purple-500/35 bg-purple-500/5 hover:bg-purple-500/15 hover:border-purple-500/60 dark:bg-purple-500/10'
                    : 'border-theme-border-default bg-theme-surface-elevated/70 hover:bg-theme-surface-hover hover:border-theme-border-focus'
                }`}
                title={`Filter library by ${k.key}`}
              >
                <div className="min-w-0 pr-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-theme-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {k.key}
                    </span>
                    {camelotCode && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                          isMajor
                            ? 'bg-primary-500/20 text-primary-700 dark:text-primary-300 border border-primary-500/30'
                            : 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {camelotCode}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-theme-text-muted font-medium block mt-0.5">
                    {k.mode} mode
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-theme-text-muted opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Actions & Library Bridge */}
      <div className="pt-3 border-t border-theme-border-default space-y-3">
        <button
          type="button"
          className="btn-primary w-full text-sm flex items-center justify-center gap-2 py-2.5 px-4"
          onClick={() => {
            if (onUseInFilters) onUseInFilters(filterKey);
            else navigate(`/?applyKey=${encodeURIComponent(filterKey)}`);
          }}
        >
          <Filter className="w-4 h-4" />
          Filter Library by {filterKey}
        </button>

        <p className="text-[11px] text-theme-text-muted text-center leading-normal">
          Opens the catalog on the home page with the key filter applied for this harmonic family.
        </p>
      </div>
    </aside>
  );
});
