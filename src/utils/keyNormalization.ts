import { KEY_MAX_SEMITONE_DISTANCE, ROOT_NOTES_STANDARD } from '../constants';

/**
 * Pre-computed 12×12 semitone-distance lookup table.
 * `SEMITONE_DISTANCE_MAP[i][j]` gives the circular semitone distance
 * between pitch classes `i` and `j` (always in [0, 6]).
 */
export const SEMITONE_DISTANCE_MAP: ReadonlyArray<ReadonlyArray<number>> = (() => {
  const table: number[][] = [];
  for (let i = 0; i < 12; i++) {
    table[i] = [];
    for (let j = 0; j < 12; j++) {
      const diff = Math.abs(i - j);
      table[i][j] = Math.min(diff, 12 - diff);
    }
  }
  return table;
})();

/** Chromatic pitch-class order (sharp spelling); index = pitch class 0–11. */
export const CHROMATIC_KEYS = [...ROOT_NOTES_STANDARD] as readonly string[];

export type ChromaticKey = (typeof ROOT_NOTES_STANDARD)[number];

/** Maps every valid note spelling (lowercased, trimmed) to chromatic position 0–11. */
export const NOTE_TO_SEMITONE: Readonly<Record<string, number>> = {
  c: 0,
  'b#': 0,
  dbb: 0,
  'c#': 1,
  db: 1,
  'b##': 1,
  d: 2,
  'c##': 2,
  ebb: 2,
  'd#': 3,
  eb: 3,
  fbb: 3,
  e: 4,
  fb: 4,
  'd##': 4,
  f: 5,
  'e#': 5,
  gbb: 5,
  'f#': 6,
  gb: 6,
  'e##': 6,
  g: 7,
  'f##': 7,
  abb: 7,
  'g#': 8,
  ab: 8,
  a: 9,
  bbb: 9,
  'g##': 9,
  'a#': 10,
  bb: 10,
  cbb: 10,
  b: 11,
  cb: 11,
  'a##': 11,
} as const;

/** Maps mode name (lowercased, trimmed) to semitone offset above Ionian root of same key signature. */
export const MODE_TO_OFFSET: Readonly<Record<string, number>> = {
  major: 0,
  ionian: 0,
  dorian: 2,
  phrygian: 4,
  lydian: 5,
  mixolydian: 7,
  minor: 9,
  aeolian: 9,
  'natural minor': 9,
  locrian: 11,
} as const;

/**
 * Parses a key string into root token and mode token.
 * Returns null if the string cannot be parsed into a recognisable root + mode pair.
 */
export function parseKeyString(keyString: string): { root: string; mode: string } | null {
  const trimmed = keyString.trim();
  if (!trimmed) return null;

  const naturalMinorMatch = trimmed.match(/^([A-Ga-g][#b]*)\s+(Natural\s+Minor)$/i);
  if (naturalMinorMatch?.[1] && naturalMinorMatch[2]) {
    return { root: naturalMinorMatch[1], mode: 'Natural Minor' };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 2) return null;

  const [root, mode] = parts;
  if (!root || !mode) return null;
  return { root, mode };
}

/**
 * Converts any supported key string to the chromatic pitch class (0–11) of its equivalent major (Ionian) key.
 */
export function normalizeKeyToPitchClass(keyString: string): number | null {
  const parsed = parseKeyString(keyString);
  if (!parsed) return null;

  const rootLower = parsed.root.toLowerCase().trim();
  const modeLower = parsed.mode.toLowerCase().trim();

  const rootSemitone = NOTE_TO_SEMITONE[rootLower];
  const modeOffset = MODE_TO_OFFSET[modeLower];

  if (rootSemitone === undefined || modeOffset === undefined) return null;

  return (rootSemitone - modeOffset + 12) % 12;
}

function formatRootForCanonical(root: string): string {
  if (!root) return root;
  const first = root[0]?.toUpperCase() ?? '';
  const rest = root.slice(1).toLowerCase();
  return first + rest;
}

function formatModeForCanonical(mode: string): string {
  if (mode.toLowerCase() === 'natural minor') return 'Natural Minor';
  return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
}

/**
 * Converts a raw key string into canonical "Root Mode" when possible.
 */
export function canonicalizeKeyString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const naturalMinorMatch = trimmed.match(/^([A-Ga-g][#b]*)\s+(Natural\s+Minor)$/i);
  if (naturalMinorMatch?.[1]) {
    const canon = `${formatRootForCanonical(naturalMinorMatch[1])} Natural Minor`;
    if (normalizeKeyToPitchClass(canon) !== null) return canon;
  }

  const minorShort = trimmed.match(/^([A-Ga-g][#b]*)m$/i);
  if (minorShort?.[1] && !/\s/.test(trimmed)) {
    const canon = `${formatRootForCanonical(minorShort[1])} Minor`;
    if (normalizeKeyToPitchClass(canon) !== null) return canon;
  }

  const single = trimmed.match(/^([A-Ga-g][#b]*)$/i);
  if (single?.[1]) {
    const canon = `${formatRootForCanonical(single[1])} Major`;
    if (normalizeKeyToPitchClass(canon) !== null) return canon;
  }

  const parsed = parseKeyString(trimmed);
  if (parsed && normalizeKeyToPitchClass(trimmed) !== null) {
    return `${formatRootForCanonical(parsed.root)} ${formatModeForCanonical(parsed.mode)}`;
  }

  return null;
}

/**
 * Resolves a key string to normalized pitch class (equivalent major), or null.
 * Applies canonicalization for bare roots (e.g. "Bb"), shorthand minor ("Am"), etc.
 */
export function pitchClassFromKey(key: string): number | null {
  const c = canonicalizeKeyString(key);
  if (c !== null) return normalizeKeyToPitchClass(c);
  return normalizeKeyToPitchClass(key);
}

/**
 * Normalized pitch class (0–11) of the key's equivalent major, for tolerance/range helpers.
 * Legacy bare roots and shorthand are canonicalized first.
 */
export function normalizeKey(key: string): number {
  const pc = pitchClassFromKey(key);
  if (pc === null) {
    throw new Error(`Unknown key: ${key}. Use canonical "Root Mode" (e.g. C Major, A Minor, D Dorian).`);
  }
  return pc;
}

/**
 * Allowed normalized pitch classes within ±tolerance semitones on the circle from targetKey.
 */
export function getKeyRange(targetKey: string, tolerance: number): Set<number> {
  let targetPc: number;
  try {
    targetPc = normalizeKey(targetKey);
  } catch {
    return new Set();
  }

  const allowed = new Set<number>();
  for (let i = -tolerance; i <= tolerance; i++) {
    allowed.add((targetPc + i + 12) % 12);
  }
  return allowed;
}

export function matchesKeyRange(songKeys: string[], targetKey: string, tolerance: number): boolean {
  const allowedIndices = getKeyRange(targetKey, tolerance);
  if (allowedIndices.size === 0) return false;

  return songKeys.some((key) => {
    const pc = pitchClassFromKey(key);
    return pc !== null && allowedIndices.has(pc);
  });
}

export function getKeyNames(indices: number[]): string[] {
  return indices.map((index) => ROOT_NOTES_STANDARD[index % 12]).filter(Boolean);
}

export function getCompatibleKeys(targetKey: string, tolerance: number): string[] {
  const allowedIndices = getKeyRange(targetKey, tolerance);
  return Array.from(allowedIndices).map((index) => ROOT_NOTES_STANDARD[index]);
}

export function areKeysCompatible(key1: string, key2: string, tolerance: number): boolean {
  const pc1 = pitchClassFromKey(key1);
  const pc2 = pitchClassFromKey(key2);
  if (pc1 === null || pc2 === null) return false;

  const diff = SEMITONE_DISTANCE_MAP[pc1][pc2];
  return diff <= tolerance;
}

/** Quick Match uses the same key-distance curve as the core matcher. */
export function getQuickMatchKeyScore(key1: string, key2: string): number {
  return calculateKeyDistance(key1, key2);
}

/**
 * Circular semitone distance between two pitch classes (0–6).
 */
export function circularSemitoneDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 12 - diff);
}

/**
 * Calculate harmonic distance-based similarity score between two keys (normalized equivalent major).
 * Returns 0 if either key is invalid (logs a warning for legacy/malformed data).
 */
export function calculateKeyDistance(key1: string, key2: string): number {
  const pc1 = pitchClassFromKey(key1);
  const pc2 = pitchClassFromKey(key2);

  if (pc1 === null || pc2 === null) {
    console.warn('[calculateKeyDistance] Unrecognised key:', { key1, key2 });
    return 0;
  }

  if (pc1 === pc2) {
    return 1.0;
  }

  const circularDistance = SEMITONE_DISTANCE_MAP[pc1][pc2];
  const normalizedDistance = circularDistance / KEY_MAX_SEMITONE_DISTANCE;
  const sectionScore = 1 - normalizedDistance;

  return Math.max(0, Math.min(1, sectionScore));
}

/**
 * Returns the canonical "Root Major" display string for a pitch class (sharp spelling).
 */
export function pitchClassToMajorKeyString(pc: number): string {
  const roots = ROOT_NOTES_STANDARD;
  return `${roots[((pc % 12) + 12) % 12]} Major`;
}

/**
 * Returns the equivalent major key string for any supported input key.
 */
export function getEquivalentMajorKey(keyString: string): string | null {
  const pc = pitchClassFromKey(keyString);
  if (pc === null) return null;
  return pitchClassToMajorKeyString(pc);
}

/** True when both keys normalize to the same equivalent-major pitch class. */
export function keysEqualNormalizedPitchClass(a: string, b: string): boolean {
  const pa = pitchClassFromKey(a);
  const pb = pitchClassFromKey(b);
  return pa !== null && pb !== null && pa === pb;
}

/** True when the song key matches any filter key by normalized pitch class. */
export function songKeyMatchesAnySelectedKey(songKey: string, selectedKeys: readonly string[]): boolean {
  const pc = pitchClassFromKey(songKey);
  if (pc === null) return false;
  return selectedKeys.some((fk) => pitchClassFromKey(fk) === pc);
}

/**
 * Return key string in sharp-only form for display (no flat spellings in common positions).
 */
export function keyToSharpDisplay(key: string | undefined): string {
  if (key == null || typeof key !== 'string') return '';
  const raw = key.trim();
  if (!raw) return '';
  return raw
    .replace(/\bDb\b/gi, 'C#')
    .replace(/\bEb\b/gi, 'D#')
    .replace(/\bGb\b/gi, 'F#')
    .replace(/\bAb\b/gi, 'G#')
    .replace(/\bBb\b/gi, 'A#');
}
