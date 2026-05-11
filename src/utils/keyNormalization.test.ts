import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  normalizeKeyToPitchClass,
  calculateKeyDistance,
  canonicalizeKeyString,
  parseKeyString,
  SEMITONE_DISTANCE_MAP,
  CHROMATIC_KEYS,
  normalizeKey,
  pitchClassFromKey,
  getQuickMatchKeyScore,
} from './keyNormalization';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('normalizeKeyToPitchClass', () => {
  it('major keys backward compatible', () => {
    expect(normalizeKeyToPitchClass('C Major')).toBe(0);
    expect(normalizeKeyToPitchClass('G Major')).toBe(7);
    expect(normalizeKeyToPitchClass('F# Major')).toBe(6);
    expect(normalizeKeyToPitchClass('Bb Major')).toBe(10);
  });

  it('relative equivalences on PC 0 (C major tonality)', () => {
    expect(normalizeKeyToPitchClass('A Minor')).toBe(0);
    expect(normalizeKeyToPitchClass('D Dorian')).toBe(0);
    expect(normalizeKeyToPitchClass('G Mixolydian')).toBe(0);
    expect(normalizeKeyToPitchClass('F Lydian')).toBe(0);
    expect(normalizeKeyToPitchClass('E Phrygian')).toBe(0);
    expect(normalizeKeyToPitchClass('B Locrian')).toBe(0);
  });

  it('C Minor maps to Eb tonality (PC 3)', () => {
    expect(normalizeKeyToPitchClass('C Minor')).toBe(3);
  });

  it('enharmonic spellings share PC', () => {
    expect(normalizeKeyToPitchClass('C# Major')).toBe(normalizeKeyToPitchClass('Db Major'));
    expect(normalizeKeyToPitchClass('Eb Minor')).toBe(normalizeKeyToPitchClass('D# Minor'));
    expect(normalizeKeyToPitchClass('Ab Minor')).toBe(normalizeKeyToPitchClass('G# Minor'));
    expect(normalizeKeyToPitchClass('Fb Major')).toBe(normalizeKeyToPitchClass('E Major'));
    expect(normalizeKeyToPitchClass('B# Major')).toBe(normalizeKeyToPitchClass('C Major'));
  });

  it('user-supplied equivalence rows', () => {
    expect(normalizeKeyToPitchClass('Gb Lydian')).toBe(1);
    expect(normalizeKeyToPitchClass('Bb Minor')).toBe(1);
    expect(normalizeKeyToPitchClass('F Phrygian')).toBe(1);
    expect(normalizeKeyToPitchClass('C Locrian')).toBe(1);
    expect(normalizeKeyToPitchClass('Ab Lydian')).toBe(3);
    expect(normalizeKeyToPitchClass('C Minor')).toBe(3);
    expect(normalizeKeyToPitchClass('G Phrygian')).toBe(3);
    expect(normalizeKeyToPitchClass('D Locrian')).toBe(3);
    expect(normalizeKeyToPitchClass('B Lydian')).toBe(6);
    expect(normalizeKeyToPitchClass('Eb Minor')).toBe(6);
    expect(normalizeKeyToPitchClass('A# Phrygian')).toBe(6);
    expect(normalizeKeyToPitchClass('E Lydian')).toBe(11);
    expect(normalizeKeyToPitchClass('G# Minor')).toBe(11);
    expect(normalizeKeyToPitchClass('Ab Minor')).toBe(11);
  });

  it('returns null for invalid input', () => {
    expect(normalizeKeyToPitchClass('Not A Key')).toBeNull();
    expect(normalizeKeyToPitchClass('')).toBeNull();
    expect(normalizeKeyToPitchClass('C')).toBeNull();
  });
});

describe('calculateKeyDistance', () => {
  it('modal equivalents distance 0 (score 1)', () => {
    expect(calculateKeyDistance('C Major', 'A Minor')).toBe(1);
    expect(calculateKeyDistance('C Major', 'D Dorian')).toBe(1);
    expect(calculateKeyDistance('C Major', 'G Mixolydian')).toBe(1);
  });

  it('C Major vs C Minor = 3 semitones → 0.5', () => {
    expect(calculateKeyDistance('C Major', 'C Minor')).toBeCloseTo(0.5, 5);
  });

  it('tritone major pair', () => {
    expect(calculateKeyDistance('C Major', 'F# Major')).toBe(0);
  });

  it('C Major vs Eb Minor (PC 6) tritone from C', () => {
    expect(calculateKeyDistance('C Major', 'Eb Minor')).toBe(0);
  });

  it('invalid keys return 0 with warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(calculateKeyDistance('NotAKey', 'C Major')).toBe(0);
    expect(spy).toHaveBeenCalled();
  });

  it('getQuickMatchKeyScore matches calculateKeyDistance', () => {
    expect(getQuickMatchKeyScore('C Major', 'A Minor')).toBe(calculateKeyDistance('C Major', 'A Minor'));
  });
});

describe('canonicalizeKeyString', () => {
  it('bare root and shorthand minor', () => {
    expect(canonicalizeKeyString('Bb')).toBe('Bb Major');
    expect(canonicalizeKeyString('Am')).toBe('A Minor');
    expect(canonicalizeKeyString('C Natural Minor')).toBe('C Natural Minor');
  });
});

describe('parseKeyString', () => {
  it('parses two-token and natural minor', () => {
    expect(parseKeyString('D Dorian')).toEqual({ root: 'D', mode: 'Dorian' });
    expect(parseKeyString('c natural minor')).toEqual({ root: 'c', mode: 'Natural Minor' });
  });
});

describe('normalizeKey()', () => {
  it('returns normalized pitch class index', () => {
    expect(normalizeKey('C Major')).toBe(0);
    expect(normalizeKey('A Minor')).toBe(0);
    expect(normalizeKey('Bb')).toBe(10);
  });

  it('throws on invalid', () => {
    expect(() => normalizeKey('Q Major')).toThrow();
  });
});

describe('pitchClassFromKey', () => {
  it('canonicalizes before resolving', () => {
    expect(pitchClassFromKey('Am')).toBe(0);
  });
});

describe('SEMITONE_DISTANCE_MAP', () => {
  it('has 12×12 numeric entries', () => {
    expect(SEMITONE_DISTANCE_MAP.length).toBe(12);
    for (const row of SEMITONE_DISTANCE_MAP) {
      expect(row.length).toBe(12);
    }
  });

  it('C to F# is 6', () => {
    const cIdx = CHROMATIC_KEYS.indexOf('C');
    const fsIdx = CHROMATIC_KEYS.indexOf('F#');
    expect(SEMITONE_DISTANCE_MAP[cIdx][fsIdx]).toBe(6);
  });
});
