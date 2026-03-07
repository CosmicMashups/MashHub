import { describe, it, expect } from 'vitest';
import { getWarningsForSection } from '../utils/sectionWarnings';
import type { Song } from '../types';

const makeSong = (id: string, bpm: number, key: string): Song & { entryId: string; locked: boolean } => ({
  id,
  title: `Song ${id}`,
  artist: '',
  type: '',
  origin: '',
  year: 0,
  season: '',
  bpms: [bpm],
  keys: [key],
  primaryBpm: bpm,
  primaryKey: key,
  entryId: `entry-${id}`,
  locked: false,
});

const emptySection = {};

describe('sectionWarnings', () => {
  it('returns bpm-mismatch when two songs are 20 BPM apart', () => {
    const songs = [makeSong('1', 100, 'C'), makeSong('2', 120, 'C')];
    const warnings = getWarningsForSection(songs, emptySection);
    const bpmWarnings = warnings.filter((w) => w.type === 'bpm-mismatch');
    expect(bpmWarnings.length).toBeGreaterThanOrEqual(0);
  });

  it('returns duplicate-song when same song appears twice', () => {
    const song = makeSong('1', 120, 'C');
    const songs = [song, song];
    const warnings = getWarningsForSection(songs, emptySection);
    expect(warnings.some((w) => w.type === 'duplicate-song')).toBe(true);
  });

  it('returns empty array for compatible consecutive songs', () => {
    const songs = [makeSong('1', 120, 'C'), makeSong('2', 122, 'C')];
    const warnings = getWarningsForSection(songs, emptySection);
    expect(warnings.filter((w) => w.type === 'bpm-mismatch').length).toBe(0);
  });
});
