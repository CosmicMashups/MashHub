import { describe, it, expect } from 'vitest';
import { getCamelotDistance, getCamelotPosition, parseCamelotKey } from '../constants/camelot';

describe('camelot', () => {
  describe('parseCamelotKey', () => {
    it('parses 8A and 8B notation', () => {
      expect(parseCamelotKey('8A')).toEqual({ position: 8, mode: 'A' });
      expect(parseCamelotKey('8B')).toEqual({ position: 8, mode: 'B' });
    });

    it('returns null for empty or unknown key', () => {
      expect(parseCamelotKey('')).toBeNull();
      expect(parseCamelotKey('  ')).toBeNull();
      expect(parseCamelotKey('UnknownKey')).toBeNull();
    });
  });

  describe('getCamelotDistance', () => {
    it('returns 0 for same key', () => {
      expect(getCamelotDistance('Am', 'Am')).toBe(0);
      expect(getCamelotDistance('C', 'C')).toBe(0);
    });

    it('returns 1 for adjacent (e.g. Am and Em)', () => {
      expect(getCamelotDistance('Am', 'Em')).toBe(1);
    });

    it('returns 1 for same position different mode (Am and A)', () => {
      expect(getCamelotDistance('Am', 'A')).toBe(1);
    });

    it('returns 6 for unknown key', () => {
      expect(getCamelotDistance('Am', '')).toBe(6);
      expect(getCamelotDistance('X', 'Y')).toBe(6);
    });
  });

  describe('getCamelotPosition', () => {
    it('returns number 1-12 for known key', () => {
      const p = getCamelotPosition('Am');
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(12);
    });

    it('returns null for unknown key', () => {
      expect(getCamelotPosition('')).toBeNull();
      expect(getCamelotPosition('Unknown')).toBeNull();
    });
  });
});
