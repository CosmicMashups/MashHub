/**
 * Unit tests for normalizeSectionName().
 *
 * Covers:
 *   - All canonical base section names map to themselves
 *   - All defined section variations map to the correct base
 *   - Case-insensitive matching
 *   - Whitespace trimming
 *   - Unknown section names → "Other"
 *   - Null / undefined / empty input → "Other"
 *   - Cache consistency across repeated calls
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeSectionName, clearNormalizationCache } from '../utils/sectionNormalization';

describe('normalizeSectionName()', () => {
  beforeEach(() => {
    clearNormalizationCache();
  });

  // ── Base section names ────────────────────────────────────────────────────

  it('maps "Intro" → "Intro"', () => {
    expect(normalizeSectionName('Intro')).toBe('Intro');
  });

  it('maps "Verse" → "Verse"', () => {
    expect(normalizeSectionName('Verse')).toBe('Verse');
  });

  it('maps "Prechorus" → "Prechorus"', () => {
    expect(normalizeSectionName('Prechorus')).toBe('Prechorus');
  });

  it('maps "Chorus" → "Chorus"', () => {
    expect(normalizeSectionName('Chorus')).toBe('Chorus');
  });

  it('maps "Bridge" → "Bridge"', () => {
    expect(normalizeSectionName('Bridge')).toBe('Bridge');
  });

  // ── Variant mappings ─────────────────────────────────────────────────────

  it('maps "Intro Drop" → "Intro"', () => {
    expect(normalizeSectionName('Intro Drop')).toBe('Intro');
  });

  it('maps "Intro 1" → "Intro"', () => {
    expect(normalizeSectionName('Intro 1')).toBe('Intro');
  });

  it('maps "Verse A" → "Verse"', () => {
    expect(normalizeSectionName('Verse A')).toBe('Verse');
  });

  it('maps "Verse B" → "Verse"', () => {
    expect(normalizeSectionName('Verse B')).toBe('Verse');
  });

  it('maps "Verse 2" → "Verse"', () => {
    expect(normalizeSectionName('Verse 2')).toBe('Verse');
  });

  it('maps "Prechorus A" → "Prechorus"', () => {
    expect(normalizeSectionName('Prechorus A')).toBe('Prechorus');
  });

  it('maps "Last Chorus" → "Chorus"', () => {
    expect(normalizeSectionName('Last Chorus')).toBe('Chorus');
  });

  it('maps "Postchorus" → "Chorus"', () => {
    expect(normalizeSectionName('Postchorus')).toBe('Chorus');
  });

  it('maps "Chorus A" → "Chorus"', () => {
    expect(normalizeSectionName('Chorus A')).toBe('Chorus');
  });

  // ── Case-insensitivity ────────────────────────────────────────────────────

  it('maps "VERSE" (all caps) → "Verse"', () => {
    expect(normalizeSectionName('VERSE')).toBe('Verse');
  });

  it('maps "verse a" (all lower) → "Verse"', () => {
    expect(normalizeSectionName('verse a')).toBe('Verse');
  });

  it('maps "CHORUS" → "Chorus"', () => {
    expect(normalizeSectionName('CHORUS')).toBe('Chorus');
  });

  // ── Whitespace trimming ───────────────────────────────────────────────────

  it('trims leading/trailing whitespace before matching', () => {
    expect(normalizeSectionName('  VERSE  ')).toBe('Verse');
  });

  it('trims and matches mixed case with spaces', () => {
    expect(normalizeSectionName('  bridge  ')).toBe('Bridge');
  });

  // ── Unknown / fallback ────────────────────────────────────────────────────

  it('maps unknown section name → "Other"', () => {
    expect(normalizeSectionName('Instrumental')).toBe('Other');
  });

  it('maps "Solo" → "Other"', () => {
    expect(normalizeSectionName('Solo')).toBe('Other');
  });

  it('maps empty string → "Other"', () => {
    expect(normalizeSectionName('')).toBe('Other');
  });

  it('maps whitespace-only string → "Other"', () => {
    expect(normalizeSectionName('   ')).toBe('Other');
  });

  it('maps null → "Other"', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeSectionName(null as any)).toBe('Other');
  });

  it('maps undefined → "Other"', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(normalizeSectionName(undefined as any)).toBe('Other');
  });

  // ── Caching consistency ────────────────────────────────────────────────────

  it('returns the same result on repeated calls (cache hit)', () => {
    const first = normalizeSectionName('Verse A');
    const second = normalizeSectionName('Verse A');
    expect(first).toBe(second);
    expect(first).toBe('Verse');
  });
});
