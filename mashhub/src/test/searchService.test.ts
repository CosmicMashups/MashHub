/**
 * Unit tests for the SearchService module-level singleton.
 *
 * Tests cover:
 *   - initSearchService / updateSongs
 *   - Fuzzy search with typos
 *   - Empty query
 *   - Single character query (below min match char length)
 *   - Long strings
 *   - Result limit
 *   - getSuggestions
 *   - addSong / removeSong incremental updates
 *   - _resetForTesting isolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initSearchService,
  search,
  getSuggestions,
  addSong,
  removeSong,
  updateSongs,
  _resetForTesting,
} from '../services/searchService';
import type { Song } from '../types';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const makeSong = (overrides: Partial<Song> & Pick<Song, 'id' | 'title' | 'artist'>): Song => ({
  bpms: [120],
  keys: ['C Major'],
  type: 'OP',
  origin: 'Japan',
  year: 2023,
  season: 'Spring',
  primaryBpm: 120,
  primaryKey: 'C Major',
  ...overrides,
});

const ANGEL_BEATS = makeSong({ id: '001', title: 'My Soul, Your Beats', artist: 'Lia', type: 'OP' });
const CLANNAD = makeSong({ id: '002', title: 'Dango Daikazoku', artist: 'Chata', type: 'ED' });
const SPIRITED_AWAY = makeSong({ id: '003', title: 'Always With Me', artist: 'Joe Hisaishi', type: 'OST', origin: 'Japan' });

const TEST_SONGS: Song[] = [ANGEL_BEATS, CLANNAD, SPIRITED_AWAY];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SearchService — module singleton', () => {
  beforeEach(() => {
    _resetForTesting();
    initSearchService(TEST_SONGS);
  });

  describe('search()', () => {
    it('returns empty array for an empty query', () => {
      expect(search('')).toEqual([]);
    });

    it('returns empty array for whitespace-only query', () => {
      expect(search('   ')).toEqual([]);
    });

    it('returns empty array before init (after reset)', () => {
      _resetForTesting();
      // fuseInstance is null — search should not throw
      expect(() => search('angel')).not.toThrow();
      expect(search('angel')).toEqual([]);
    });

    it('finds an exact title match', () => {
      const results = search('Dango Daikazoku');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe('002');
    });

    it('finds a match with a minor typo (fuzzy)', () => {
      // "Dango" with a transposition typo
      const results = search('Dngao');
      expect(results.length).toBeGreaterThan(0);
    });

    it('finds by artist name', () => {
      const results = search('Hisaishi');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe('003');
    });

    it('returns at most limit results', () => {
      const LIMIT = 1;
      const results = search('a', LIMIT);
      expect(results.length).toBeLessThanOrEqual(LIMIT);
    });

    it('handles a very long query without throwing', () => {
      const longQuery = 'anime song title '.repeat(100);
      expect(() => search(longQuery)).not.toThrow();
    });

    it('single character query under minMatchCharLength returns empty', () => {
      // FUSE_MIN_MATCH_CHAR_LENGTH is 2, so a single char should return nothing
      const results = search('a');
      expect(results).toEqual([]);
    });
  });

  describe('getSuggestions()', () => {
    it('returns string suggestions for a matching query', () => {
      const suggs = getSuggestions('Dango');
      expect(Array.isArray(suggs)).toBe(true);
      expect(suggs.length).toBeGreaterThan(0);
      expect(typeof suggs[0]).toBe('string');
    });

    it('returns empty array for a query below min length', () => {
      expect(getSuggestions('a')).toEqual([]);
    });
  });

  describe('addSong()', () => {
    it('makes a newly added song searchable without rebuilding index', () => {
      const newSong = makeSong({ id: '999', title: 'Waltz For Zizi', artist: 'Yuki Kajiura' });
      addSong(newSong);
      const results = search('Waltz Zizi');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.id).toBe('999');
    });
  });

  describe('removeSong()', () => {
    it('removes a song from search results', () => {
      // Confirm it's there first
      expect(search('Always With Me').length).toBeGreaterThan(0);
      removeSong('003');
      // After removal, the spirited away song should not appear
      const after = search('Always With Me');
      expect(after.every((r) => r.item.id !== '003')).toBe(true);
    });
  });

  describe('updateSongs()', () => {
    it('replaces the collection and old songs are no longer found', () => {
      const replacementSongs: Song[] = [
        makeSong({ id: 'A01', title: 'Uninstall', artist: 'Hitomi Harada' }),
      ];
      updateSongs(replacementSongs);
      // Old song should not be found
      const oldResults = search('Dango');
      expect(oldResults.every((r) => r.item.id !== '002')).toBe(true);
      // New song should be found
      const newResults = search('Uninstall');
      expect(newResults.length).toBeGreaterThan(0);
    });
  });
});
