import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [expanded, setExpanded] = useState(false);

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
        <p className="text-sm text-theme-text-secondary">
          Select a wedge on the wheel to see every mode MashHub groups into this harmonic family (same normalized
          equivalent-major pitch class).
        </p>
      </aside>
    );
  }

  const majorEntry = segment.keys.find((k) => k.mode === 'Major');
  const filterKey = majorEntry?.key ?? segment.representativeMajor;
  const modesLine = expanded
    ? segment.keys.map((k) => k.key).join(', ')
    : `${majorEntry?.key ?? segment.representativeMajor} and ${Math.max(0, segment.keys.length - 1)} other mode(s)`;

  return (
    <aside
      className="rounded-2xl border border-theme-border-default bg-theme-surface-base p-6 shadow-[var(--theme-shadow-card)]"
      aria-live="polite"
    >
      <h2 className="text-lg font-semibold text-theme-text-primary">
        {segment.representativeMajor.replace(' Major', '')} family
        {camelotMajor && (
          <span className="ml-2 text-sm font-normal text-theme-text-secondary">({camelotMajor})</span>
        )}
      </h2>
      <p className="mt-3 text-sm text-theme-text-secondary">
        These keys share one pitch-class collection after normalization. MashHub treats them as the same harmonic
        family for matching.
      </p>
      <p className="mt-2 text-sm text-theme-text-primary">
        <span className="font-medium">Relative modes: </span>
        {modesLine}
      </p>
      {segment.keys.length > 1 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-sm font-medium text-theme-accent-primary hover:underline"
        >
          {expanded ? 'Show summary' : 'Show all mode names'}
        </button>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() => {
            if (onUseInFilters) onUseInFilters(filterKey);
            else navigate(`/?applyKey=${encodeURIComponent(filterKey)}`);
          }}
        >
          Use in filters
        </button>
      </div>
      <p className="mt-4 text-xs text-theme-text-tertiary">
        Library bridge: opens the home page with query <code className="rounded bg-theme-background-secondary px-1">applyKey</code> set
        to a representative major key so the key filter is applied once.
      </p>
    </aside>
  );
});
