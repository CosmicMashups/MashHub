import { describe, expect, it } from 'vitest';
import { getBpmMembership } from '../fuzzy/bpmMembership';
import { getKeyMembership } from '../fuzzy/keyMembership';

describe('discrete fuzzy membership utilities', () => {
  describe('getBpmMembership', () => {
    it('returns exact anchor values', () => {
      expect(getBpmMembership(0)).toBeCloseTo(1.0, 10);
      expect(getBpmMembership(5)).toBeCloseTo(0.9, 10);
      expect(getBpmMembership(10)).toBeCloseTo(0.8, 10);
      expect(getBpmMembership(12)).toBeCloseTo(0.7, 10);
      expect(getBpmMembership(20)).toBeCloseTo(0.0, 10);
    });

    it('linearly interpolates between anchors', () => {
      // midpoint between 5 (0.9) and 10 (0.8)
      expect(getBpmMembership(7.5)).toBeCloseTo(0.85, 10);
      // midpoint between 12 (0.7) and 20 (0.0)
      expect(getBpmMembership(16)).toBeCloseTo(0.35, 10);
    });

    it('handles edge cases safely', () => {
      expect(getBpmMembership(-4)).toBeCloseTo(1.0, 10);
      expect(getBpmMembership(Number.NaN)).toBe(0);
      expect(getBpmMembership(Number.POSITIVE_INFINITY)).toBe(0);
      expect(getBpmMembership(999)).toBe(0);
    });
  });

  describe('getKeyMembership', () => {
    it('returns exact anchor values', () => {
      expect(getKeyMembership(0)).toBeCloseTo(1.0, 10);
      expect(getKeyMembership(1)).toBeCloseTo(0.95, 10);
      expect(getKeyMembership(2)).toBeCloseTo(0.9, 10);
      expect(getKeyMembership(3)).toBeCloseTo(0.8, 10);
      expect(getKeyMembership(6)).toBeCloseTo(0.0, 10);
    });

    it('linearly interpolates between anchors', () => {
      // between 2 (0.9) and 3 (0.8)
      expect(getKeyMembership(2.5)).toBeCloseTo(0.85, 10);
      // between 3 (0.8) and 6 (0.0)
      expect(getKeyMembership(4.5)).toBeCloseTo(0.4, 10);
    });

    it('handles edge cases safely', () => {
      expect(getKeyMembership(-1)).toBeCloseTo(1.0, 10);
      expect(getKeyMembership(Number.NaN)).toBe(0);
      expect(getKeyMembership(Number.NEGATIVE_INFINITY)).toBe(0);
      expect(getKeyMembership(99)).toBe(0);
    });
  });

  it('maintains weighted outputs for Sugeno aggregation constants', () => {
    const muBpm = getBpmMembership(5); // exact anchor = 0.9
    const muKey = getKeyMembership(1); // exact anchor = 0.95
    const muArtist = 1;
    const muTitle = 1;

    const zBpm = muBpm * 0.45;
    const zKey = muKey * 0.45;
    const zArtist = muArtist * 0.05;
    const zTitle = muTitle * 0.05;
    const matchScore = zBpm + zKey + zArtist + zTitle;

    expect(zBpm).toBeCloseTo(0.405, 10);
    expect(zKey).toBeCloseTo(0.4275, 10);
    expect(matchScore).toBeCloseTo(0.9325, 10);
  });
});
