/**
 * Camelot wheel: 24 positions.
 * Inner ring 12A-1A = minor (mode 'A'), outer ring 12B-1B = major (mode 'B').
 * Adjacent positions are harmonically compatible.
 */

export type CamelotMode = 'A' | 'B';

/** Maps key name variants to Camelot position (1-12) and mode (A=minor, B=major). */
export const KEY_TO_CAMELOT: Record<string, { position: number; mode: CamelotMode }> = {
  // Minor (A)
  Am: { position: 8, mode: 'A' },
  Em: { position: 9, mode: 'A' },
  Bm: { position: 10, mode: 'A' },
  'F#m': { position: 11, mode: 'A' },
  'C#m': { position: 12, mode: 'A' },
  'G#m': { position: 1, mode: 'A' },
  Ebm: { position: 2, mode: 'A' },
  Bbm: { position: 3, mode: 'A' },
  Fm: { position: 4, mode: 'A' },
  Cm: { position: 5, mode: 'A' },
  Gm: { position: 6, mode: 'A' },
  Dm: { position: 7, mode: 'A' },
  // Major (B)
  C: { position: 8, mode: 'B' },
  G: { position: 9, mode: 'B' },
  D: { position: 10, mode: 'B' },
  A: { position: 11, mode: 'B' },
  E: { position: 12, mode: 'B' },
  B: { position: 1, mode: 'B' },
  'F#': { position: 2, mode: 'B' },
  'C#': { position: 3, mode: 'B' },
  Db: { position: 3, mode: 'B' },
  'G#': { position: 4, mode: 'B' },
  Ab: { position: 4, mode: 'B' },
  'D#': { position: 5, mode: 'B' },
  Eb: { position: 5, mode: 'B' },
  'A#': { position: 6, mode: 'B' },
  Bb: { position: 6, mode: 'B' },
  F: { position: 7, mode: 'B' },
};

// Normalized keys (lowercase, no spaces) for lookup
const normalizedKeyMap = new Map<string, { position: number; mode: CamelotMode }>();
function buildNormalizedMap(): void {
  for (const [key, value] of Object.entries(KEY_TO_CAMELOT)) {
    const n = key.trim().toLowerCase().replace(/\s+/g, '');
    if (!normalizedKeyMap.has(n)) normalizedKeyMap.set(n, value);
  }
}
buildNormalizedMap();

/**
 * Parse "8A" or "8B" notation to position and mode. Returns null if invalid.
 */
export function parseCamelotKey(key: string): { position: number; mode: CamelotMode } | null {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  const match = /^(\d{1,2})([ABab])$/i.exec(trimmed);
  if (match) {
    const position = parseInt(match[1], 10);
    if (position >= 1 && position <= 12) {
      return { position, mode: match[2].toUpperCase() as CamelotMode };
    }
  }
  const normalized = trimmed.toLowerCase().replace(/\s+/g, '');
  return normalizedKeyMap.get(normalized) ?? KEY_TO_CAMELOT[trimmed] ?? null;
}

/**
 * Circular distance on 12-position wheel (0-6). Same position different mode (A vs B) adds 1.
 */
export function getCamelotDistance(keyA: string, keyB: string): number {
  const a = parseCamelotKey(keyA);
  const b = parseCamelotKey(keyB);
  if (!a || !b) return 6;
  const numDiff = Math.abs(a.position - b.position);
  const circularNum = Math.min(numDiff, 12 - numDiff);
  const modeDiff = a.mode === b.mode ? 0 : 1;
  if (circularNum === 0) return modeDiff;
  return circularNum + modeDiff;
}

/**
 * Returns 1-12 for use as Y-axis value in graphs. Uses position only (ignores mode).
 */
export function getCamelotPosition(key: string): number | null {
  const parsed = parseCamelotKey(key);
  return parsed ? parsed.position : null;
}

/**
 * Key score from Camelot distance (for compatibility): 0 steps = 1.0, 1 = 0.8, 2 = 0.6, 3+ = 0.2.
 */
export function getCamelotScore(keyA: string, keyB: string): number {
  const steps = getCamelotDistance(keyA, keyB);
  if (steps === 0) return 1;
  if (steps === 1) return 0.8;
  if (steps === 2) return 0.6;
  return 0.2;
}
