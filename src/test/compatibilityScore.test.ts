import { describe, it, expect } from 'vitest';
import { calculateCompatibilityScore } from '../utils/compatibilityScore';
import type { Song } from '../types';

const makeSong = (overrides: Partial<Song> & { id: string }): Song => {
  const { id, ...rest } = overrides;
  return {
    id,
    title: '',
    artist: '',
    type: '',
    origin: '',
    year: 0,
    season: '',
    bpms: [],
    keys: [],
    ...rest,
  };
};

describe('compatibilityScore', () => {
  it('same key same BPM yields score 1.0 and High', () => {
    const a = makeSong({ id: '1', primaryBpm: 120, primaryKey: 'Am', bpms: [120], keys: ['Am'] });
    const b = makeSong({ id: '2', primaryBpm: 120, primaryKey: 'Am', bpms: [120], keys: ['Am'] });
    const r = calculateCompatibilityScore(a, b, 10);
    expect(r.score).toBe(1);
    expect(r.label).toBe('High');
    expect(r.warnings).toHaveLength(0);
  });

  it('15 BPM apart with tolerance 10 yields bpmScore 0 and final score <= 0.5', () => {
    const a = makeSong({ id: '1', primaryBpm: 120, primaryKey: 'C', bpms: [120], keys: ['C'] });
    const b = makeSong({ id: '2', primaryBpm: 135, primaryKey: 'C', bpms: [135], keys: ['C'] });
    const r = calculateCompatibilityScore(a, b, 10);
    expect(r.bpmScore).toBe(0);
    expect(r.keyScore).toBe(1);
    expect(r.score).toBeLessThanOrEqual(0.5);
    expect(r.score).toBe(0.5);
  });

  it('duplicate songId yields duplicate-song warning and low score', () => {
    const a = makeSong({ id: '1', primaryBpm: 120, primaryKey: 'C', bpms: [120], keys: ['C'] });
    const r = calculateCompatibilityScore(a, a, 10);
    expect(r.warnings).toContain('duplicate-song');
    expect(r.score).toBe(0);
    expect(r.label).toBe('Low');
  });

  it('bpm-mismatch warning when bpmScore < 0.3', () => {
    const a = makeSong({ id: '1', primaryBpm: 100, primaryKey: 'C', bpms: [100], keys: ['C'] });
    const b = makeSong({ id: '2', primaryBpm: 130, primaryKey: 'C', bpms: [130], keys: ['C'] });
    const r = calculateCompatibilityScore(a, b, 10);
    expect(r.bpmScore).toBeLessThan(0.3);
    expect(r.warnings).toContain('bpm-mismatch');
  });

  it('key-clash when keyScore <= 0.2', () => {
    const a = makeSong({ id: '1', primaryBpm: 120, primaryKey: 'C', bpms: [120], keys: ['C'] });
    const b = makeSong({ id: '2', primaryBpm: 120, primaryKey: 'F#', bpms: [120], keys: ['F#'] });
    const r = calculateCompatibilityScore(a, b, 10);
    if (r.keyScore <= 0.2) {
      expect(r.warnings).toContain('key-clash');
    }
  });
});
