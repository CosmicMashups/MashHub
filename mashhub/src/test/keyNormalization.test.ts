/**
 * Unit tests for key normalization utilities and the pre-computed semitone distance map.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeKey,
  calculateKeyDistance,
  SEMITONE_DISTANCE_MAP,
  CHROMATIC_KEYS,
} from '../utils/keyNormalization';

describe('normalizeKey()', () => {
  it('returns index 0 for C Major', () => {
    expect(normalizeKey('C Major')).toBe(0);
  });

  it('normalises Db to C# (index 1)', () => {
    expect(normalizeKey('Db')).toBe(1);
  });

  it('normalises Bb to A# (index 10)', () => {
    expect(normalizeKey('Bb Minor')).toBe(10);
  });

  it('throws on unrecognised key', () => {
    expect(() => normalizeKey('Q Major')).toThrow();
  });
});

describe('SEMITONE_DISTANCE_MAP', () => {
  it('has 12 rows', () => {
    expect(SEMITONE_DISTANCE_MAP.length).toBe(12);
  });

  it('has 12 columns in each row', () => {
    for (const row of SEMITONE_DISTANCE_MAP) {
      expect(row.length).toBe(12);
    }
  });

  it('diagonal (same pitch class) has distance 0', () => {
    for (let i = 0; i < 12; i++) {
      expect(SEMITONE_DISTANCE_MAP[i][i]).toBe(0);
    }
  });

  it('is symmetric: [i][j] === [j][i]', () => {
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        expect(SEMITONE_DISTANCE_MAP[i][j]).toBe(SEMITONE_DISTANCE_MAP[j][i]);
      }
    }
  });

  it('C (0) → F# (6) = 6 (tritone, max distance)', () => {
    const cIdx = CHROMATIC_KEYS.indexOf('C');
    const fsIdx = CHROMATIC_KEYS.indexOf('F#');
    expect(SEMITONE_DISTANCE_MAP[cIdx][fsIdx]).toBe(6);
  });

  it('C (0) → G (7) = 5 (not 7, because circular distance wraps)', () => {
    const cIdx = CHROMATIC_KEYS.indexOf('C');
    const gIdx = CHROMATIC_KEYS.indexOf('G');
    expect(SEMITONE_DISTANCE_MAP[cIdx][gIdx]).toBe(5);
  });

  it('all entries are in [0, 6]', () => {
    for (const row of SEMITONE_DISTANCE_MAP) {
      for (const dist of row) {
        expect(dist).toBeGreaterThanOrEqual(0);
        expect(dist).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe('calculateKeyDistance()', () => {
  it('returns 1.0 for exact same key and mode', () => {
    expect(calculateKeyDistance('C Major', 'C Major')).toBe(1.0);
  });

  it('returns 0.85 for same pitch class different mode', () => {
    expect(calculateKeyDistance('C Major', 'C Minor')).toBe(0.85);
  });

  it('returns 0 for a tritone apart (F# vs C)', () => {
    expect(calculateKeyDistance('C Major', 'F# Major')).toBe(0);
  });

  it('returns 0 for invalid key input', () => {
    expect(calculateKeyDistance('NotAKey', 'C Major')).toBe(0);
  });

  it('result is in [0, 1] for all pairs', () => {
    const keys = ['C Major', 'D Minor', 'G Major', 'A# Major', 'F# Minor'];
    for (const k1 of keys) {
      for (const k2 of keys) {
        const score = calculateKeyDistance(k1, k2);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });
});
