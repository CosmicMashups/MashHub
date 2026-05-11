import Fuse from 'fuse.js';
import { ALL_MUSICAL_KEYS, MUSICAL_MODES, ROOT_NOTES_FLAT_ALIASES } from '../constants';
import { getCamelotPosition, parseCamelotKey, type CamelotMode } from '../constants/camelot';
import type { KeyString } from '../types';
import {
  canonicalizeKeyString,
  normalizeKeyToPitchClass,
  parseKeyString,
  pitchClassToMajorKeyString,
} from './keyNormalization';

/** Pitch class 0–11 (chromatic). */
export type PitchClass = number;

export interface WheelKeyEntry {
  readonly key: KeyString;
  readonly pitchClass: PitchClass;
  readonly mode: string;
  readonly displayOrder: number;
}

export interface HarmonicSegment {
  readonly pitchClass: PitchClass;
  /** Camelot clock position 1–12 from equivalent major; never null after build. */
  readonly camelotPosition: number;
  readonly representativeMajor: KeyString;
  readonly keys: readonly WheelKeyEntry[];
  /** Wedge arc in degrees (SVG), clockwise from +x or per layout convention. */
  readonly startAngleDeg: number;
  readonly endAngleDeg: number;
}

export interface WheelSearchRecord {
  readonly key: KeyString;
  readonly pitchClass: PitchClass;
  /** Extra strings to match (enharmonic roots, etc.). */
  readonly aliases: readonly string[];
  /** e.g. "8B", "8b" for Fuse. */
  readonly camelotTerms: readonly string[];
}

const MODE_ORDER = new Map<string, number>(MUSICAL_MODES.map((m, i) => [m, i]));

function modeSortKey(mode: string): number {
  return MODE_ORDER.get(mode) ?? 99;
}

function buildWheelKeyEntry(key: KeyString, pc: PitchClass): WheelKeyEntry | null {
  const parsed = parseKeyString(key);
  if (!parsed) return null;
  return {
    key,
    pitchClass: pc,
    mode: parsed.mode,
    displayOrder: modeSortKey(parsed.mode),
  };
}

function collectAliasesForKey(key: KeyString, root: string): string[] {
  const parsed = parseKeyString(key);
  if (!parsed) return [];
  const rootVariants = new Set<string>([root]);
  const flat = ROOT_NOTES_FLAT_ALIASES[root];
  if (flat) rootVariants.add(flat);
  const sharp = Object.entries(ROOT_NOTES_FLAT_ALIASES).find(([, v]) => v === root)?.[0];
  if (sharp) rootVariants.add(sharp);
  const out = new Set<string>();
  for (const r of rootVariants) {
    out.add(`${r} ${parsed.mode}`);
  }
  return [...out];
}

function camelotTermsForKey(key: KeyString): string[] {
  const parsed = parseCamelotKey(key);
  if (!parsed) return [];
  const { position, mode } = parsed;
  return [`${position}${mode}`, `${position}${mode.toLowerCase()}`];
}

/**
 * Pitch class for a Camelot code like "8B" or "8A" (matches parseCamelotKey on canonical keys).
 */
export function pitchClassFromCamelotNotation(query: string): PitchClass | null {
  const parsed = parseCamelotKey(query.trim());
  if (!parsed) return null;
  for (const key of ALL_MUSICAL_KEYS) {
    const c = parseCamelotKey(key);
    if (c && c.position === parsed.position && c.mode === parsed.mode) {
      const pc = normalizeKeyToPitchClass(key);
      if (pc !== null) return pc;
    }
  }
  return null;
}

function fallbackCamelotPosition(pc: PitchClass): number {
  return ((pc + 3) % 12) + 1;
}

/**
 * Build 12 harmonic segments: keys grouped by normalized equivalent-major pitch class,
 * ordered by Camelot clock (1–12), with wedge angles in that order.
 */
export function buildHarmonicWheelSegments(): readonly HarmonicSegment[] {
  const buckets = new Map<PitchClass, WheelKeyEntry[]>();

  for (const key of ALL_MUSICAL_KEYS) {
    const pc = normalizeKeyToPitchClass(key);
    if (pc === null) continue;
    const entry = buildWheelKeyEntry(key, pc);
    if (!entry) continue;
    let arr = buckets.get(pc);
    if (!arr) {
      arr = [];
      buckets.set(pc, arr);
    }
    arr.push(entry);
  }

  for (const arr of buckets.values()) {
    arr.sort((a, b) => a.displayOrder - b.displayOrder || a.key.localeCompare(b.key));
  }

  const raw: Omit<HarmonicSegment, 'startAngleDeg' | 'endAngleDeg'>[] = [];

  for (let pc = 0; pc < 12; pc++) {
    const keys = buckets.get(pc) ?? [];
    const representativeMajor = pitchClassToMajorKeyString(pc) as KeyString;
    let camelotPosition = getCamelotPosition(representativeMajor);
    if (camelotPosition === null) camelotPosition = fallbackCamelotPosition(pc);

    raw.push({
      pitchClass: pc,
      camelotPosition,
      representativeMajor,
      keys: Object.freeze([...keys]) as readonly WheelKeyEntry[],
    });
  }

  raw.sort((a, b) => a.camelotPosition - b.camelotPosition);

  const wedge = 360 / 12;
  return Object.freeze(
    raw.map((seg, idx) => {
      const startAngleDeg = -90 + idx * wedge;
      const endAngleDeg = startAngleDeg + wedge;
      return Object.freeze({
        ...seg,
        startAngleDeg,
        endAngleDeg,
      });
    })
  ) as readonly HarmonicSegment[];
}

export function buildWheelSearchRecords(segments: readonly HarmonicSegment[]): readonly WheelSearchRecord[] {
  const records: WheelSearchRecord[] = [];

  for (const seg of segments) {
    for (const w of seg.keys) {
      const parsed = parseKeyString(w.key);
      const root = parsed?.root ?? '';
      const aliases = collectAliasesForKey(w.key, root);
      const camelotTerms = camelotTermsForKey(w.key);
      records.push({
        key: w.key,
        pitchClass: w.pitchClass,
        aliases: Object.freeze([...new Set(aliases)]),
        camelotTerms: Object.freeze([...new Set(camelotTerms)]),
      });
    }
  }

  return Object.freeze(records);
}

let cachedSegments: readonly HarmonicSegment[] | null = null;
let cachedSearchRecords: readonly WheelSearchRecord[] | null = null;
let cachedFuse: Fuse<WheelSearchRecord> | null = null;

export function getHarmonicWheelSegments(): readonly HarmonicSegment[] {
  if (!cachedSegments) cachedSegments = buildHarmonicWheelSegments();
  return cachedSegments;
}

export function getWheelSearchRecords(): readonly WheelSearchRecord[] {
  if (!cachedSearchRecords) {
    cachedSearchRecords = buildWheelSearchRecords(getHarmonicWheelSegments());
  }
  return cachedSearchRecords;
}

export function getWheelSearchFuse(): Fuse<WheelSearchRecord> {
  if (!cachedFuse) {
    cachedFuse = new Fuse(getWheelSearchRecords(), {
      keys: [
        { name: 'key', weight: 0.55 },
        { name: 'aliases', weight: 0.25 },
        { name: 'camelotTerms', weight: 0.2 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
  }
  return cachedFuse;
}

export function neighborCamelotPositions(position: number): readonly [number, number] {
  const p = Math.max(1, Math.min(12, position));
  const prev = p === 1 ? 12 : p - 1;
  const next = p === 12 ? 1 : p + 1;
  return [prev, next] as const;
}

export function resolveQueryToPitchClass(query: string): PitchClass | null {
  const q = query.trim();
  if (!q) return null;

  const fromCamelot = pitchClassFromCamelotNotation(q);
  if (fromCamelot !== null) return fromCamelot;

  const canon = canonicalizeKeyString(q);
  if (canon) {
    const pc = normalizeKeyToPitchClass(canon);
    if (pc !== null) return pc;
  }

  const pcDirect = normalizeKeyToPitchClass(q);
  if (pcDirect !== null) return pcDirect;

  const fuse = getWheelSearchFuse();
  const hits = fuse.search(q, { limit: 1 });
  if (hits.length > 0) return hits[0].item.pitchClass;

  return null;
}

export function camelotLabelForPitchClass(
  pc: PitchClass,
  mode: CamelotMode = 'B'
): string | null {
  const major = pitchClassToMajorKeyString(pc);
  const parsed = parseCamelotKey(major);
  if (!parsed) return null;
  if (mode === 'B') return `${parsed.position}B`;
  return `${parsed.position}A`;
}
