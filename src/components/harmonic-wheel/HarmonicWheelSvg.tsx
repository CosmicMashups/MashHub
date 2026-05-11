import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { musicKeyPalette } from '../../theme/colors';
import type { HarmonicSegment, PitchClass } from '../../utils/harmonicWheelDataset';
import { neighborCamelotPositions } from '../../utils/harmonicWheelDataset';
import { calculateKeyDistance } from '../../utils/keyNormalization';
import { wedgePath } from './wheelGeometry';

const CX = 200;
const CY = 200;
const OUTER = 190;
const INNER = 72;

export interface HarmonicWheelSvgProps {
  readonly segments: readonly HarmonicSegment[];
  readonly selectedPc: PitchClass | null;
  readonly hoveredPc: PitchClass | null;
  readonly onHoverPc: (pc: PitchClass | null) => void;
  readonly onSelectPc: (pc: PitchClass) => void;
}

function shortMajorLabel(representativeMajor: string): string {
  return representativeMajor.replace(/\s+Major$/i, '').trim();
}

export const HarmonicWheelSvg = memo(function HarmonicWheelSvg({
  segments,
  selectedPc,
  hoveredPc,
  onHoverPc,
  onSelectPc,
}: HarmonicWheelSvgProps) {
  const reduceMotion = useReducedMotion();

  const positionToPc = useMemo(() => {
    const m = new Map<number, PitchClass>();
    for (const s of segments) m.set(s.camelotPosition, s.pitchClass);
    return m;
  }, [segments]);

  const neighborPcs = useMemo(() => {
    if (hoveredPc === null) return null as ReadonlySet<PitchClass> | null;
    const seg = segments.find((s) => s.pitchClass === hoveredPc);
    if (!seg) return null;
    const [prev, next] = neighborCamelotPositions(seg.camelotPosition);
    const a = positionToPc.get(prev);
    const b = positionToPc.get(next);
    const set = new Set<PitchClass>();
    if (a !== undefined) set.add(a);
    if (b !== undefined) set.add(b);
    return set;
  }, [hoveredPc, segments, positionToPc]);

  const refKeyForFuzzy = useMemo(() => {
    if (hoveredPc !== null) {
      const s = segments.find((x) => x.pitchClass === hoveredPc);
      if (s) return s.representativeMajor;
    }
    if (selectedPc !== null) {
      const s = segments.find((x) => x.pitchClass === selectedPc);
      if (s) return s.representativeMajor;
    }
    return null;
  }, [hoveredPc, selectedPc, segments]);

  const fuzzyByPc = useMemo(() => {
    const map = new Map<PitchClass, number>();
    if (!refKeyForFuzzy) return map;
    for (const s of segments) {
      map.set(s.pitchClass, calculateKeyDistance(refKeyForFuzzy, s.representativeMajor));
    }
    return map;
  }, [refKeyForFuzzy, segments]);

  return (
    <div className="relative mx-auto w-full max-w-[min(100%,420px)]">
      <motion.div
        className="aspect-square w-full"
        animate={reduceMotion ? {} : { rotate: hoveredPc !== null ? 2 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <svg
          viewBox="0 0 400 400"
          className="h-full w-full touch-manipulation select-none"
          role="img"
          aria-label="Harmonic wheel: twelve Camelot positions, one wedge per equivalent-major pitch class"
        >
          {segments.map((seg) => {
            const color = musicKeyPalette[seg.camelotPosition as keyof typeof musicKeyPalette] ?? '#666';
            const isSelected = selectedPc === seg.pitchClass;
            const isNeighbor = neighborPcs?.has(seg.pitchClass) ?? false;
            const isSameGroupHover = hoveredPc !== null && hoveredPc === seg.pitchClass;
            const fuzzy = fuzzyByPc.get(seg.pitchClass) ?? 0;

            let strokeW = 1.5;
            let stroke = 'var(--theme-border-strong, #888)';
            let opacity = 0.88;

            if (isNeighbor && hoveredPc !== null) {
              strokeW = 3;
              stroke = 'currentColor';
              opacity = 0.95;
            }
            if (isSameGroupHover) {
              strokeW = 3.5;
              opacity = 1;
            }
            if (isSelected && hoveredPc === null) {
              strokeW = 3;
              stroke = 'var(--theme-border-focus, #1e3a5f)';
            }
            if (refKeyForFuzzy) {
              opacity = Math.min(1, opacity * (0.55 + 0.45 * fuzzy));
            }

            const d = wedgePath(CX, CY, INNER, OUTER, seg.startAngleDeg, seg.endAngleDeg);
            const mid = (seg.startAngleDeg + seg.endAngleDeg) / 2;
            const lr = (INNER + OUTER) / 2 + 8;
            const lx = CX + lr * Math.cos((mid * Math.PI) / 180);
            const ly = CY + lr * Math.sin((mid * Math.PI) / 180);
            const label = shortMajorLabel(seg.representativeMajor);
            const modeCount = seg.keys.length;

            return (
              <g key={seg.pitchClass}>
                <path
                  d={d}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  className="text-theme-text-primary"
                  style={{ color: 'var(--theme-text-primary)' }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Camelot position ${seg.camelotPosition}, ${label} major family, ${modeCount} relative modes`}
                  onMouseEnter={() => onHoverPc(seg.pitchClass)}
                  onMouseLeave={() => onHoverPc(null)}
                  onFocus={() => onHoverPc(seg.pitchClass)}
                  onBlur={() => onHoverPc(null)}
                  onClick={() => onSelectPc(seg.pitchClass)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPc(seg.pitchClass);
                    }
                  }}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none fill-white/95 text-[11px] font-semibold sm:text-xs"
                  style={{ textShadow: '0 0 4px rgba(0,0,0,0.45)' }}
                >
                  {label}
                </text>
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={INNER - 4} className="fill-theme-surface-elevated stroke-theme-border-default" strokeWidth={2} />
          <text
            x={CX}
            y={CY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-theme-text-secondary pointer-events-none text-[10px] sm:text-xs"
          >
            Camelot
          </text>
        </svg>
      </motion.div>
    </div>
  );
});
