import { describe, it, expect } from 'vitest';
import { getSuggestions } from '../services/smartSectionBuilder';
import type { Song } from '../types';

const makeSong = (id: string, bpm: number, key: string): Song => ({
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
});

describe('smartSectionBuilder', () => {
  it('excludes songs already in target section', () => {
    const project = {
      id: 'p1',
      sections: [{ id: 'sec-main', name: 'Main', songs: [makeSong('1', 120, 'C')] }],
    };
    const allSongs = [makeSong('1', 120, 'C'), makeSong('2', 122, 'C')];
    const results = getSuggestions(project, 'sec-main', allSongs, 'other', 20);
    expect(results.every((r) => r.song.id !== '1')).toBe(true);
  });

  it('seasonal ranks by compatibility with last song in section', () => {
    const ref = makeSong('ref', 120, 'C');
    const project = {
      id: 'p1',
      sections: [{ id: 'sec-main', name: 'Main', songs: [ref] }],
    };
    const close = makeSong('close', 121, 'C');
    const far = makeSong('far', 140, 'F#');
    const allSongs = [close, far];
    const results = getSuggestions(project, 'sec-main', allSongs, 'seasonal', 20);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].song.id).toBe('close');
  });

  it('song-megamix ranks already-used song lower than unused', () => {
    const project = {
      id: 'p1',
      sections: [
        { id: 'sec-main', name: 'Main', songs: [makeSong('used', 120, 'C')] },
        { id: 'sec-outro', name: 'Outro', songs: [] },
      ],
    };
    const allSongs = [makeSong('used', 120, 'C'), makeSong('unused', 120, 'C')];
    const results = getSuggestions(project, 'sec-outro', allSongs, 'song-megamix', 20);
    const unusedFirst =
      results.findIndex((r) => r.song.id === 'unused') < results.findIndex((r) => r.song.id === 'used');
    expect(unusedFirst).toBe(true);
  });
});
