/**
 * SearchService — Module-level Fuse.js singleton.
 *
 * The Fuse index is created once via `initSearchService()` and updated
 * incrementally:
 *   - `updateSongs(songs)`   → fuse.setCollection()  (full collection replace, e.g. after import)
 *   - `addSong(song)`        → fuse.add()             (single add, O(log n))
 *   - `removeSong(id)`       → fuse.remove()          (single remove, O(log n))
 *
 * No new Fuse constructor is called on individual mutations, eliminating the
 * O(n log n) rebuild that occurred in the old class-based implementation.
 *
 * For test isolation, call `_resetForTesting()` in beforeEach to set fuseInstance
 * back to null so the next `initSearchService` creates a fresh instance.
 */

import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';
import type { Song } from '../types';
import {
  FUSE_THRESHOLD,
  FUSE_DISTANCE,
  FUSE_MIN_MATCH_CHAR_LENGTH,
  SEARCH_PAGE_SIZE,
} from '../constants';

// ─── Fuse Options ───────────────────────────────────────────────────────────────

const fuseOptions: IFuseOptions<Song> = {
  keys: [
    { name: 'title',  weight: 0.4 },
    { name: 'artist', weight: 0.3 },
    { name: 'type',   weight: 0.15 },
    { name: 'origin', weight: 0.1 },
    { name: 'part',   weight: 0.05 },
  ],
  threshold:          FUSE_THRESHOLD,
  distance:           FUSE_DISTANCE,
  includeScore:       true,
  includeMatches:     true,
  minMatchCharLength: FUSE_MIN_MATCH_CHAR_LENGTH,
  shouldSort:         true,
  findAllMatches:     true,
  ignoreLocation:     true,
  useExtendedSearch:  true,
};

// ─── Module State ───────────────────────────────────────────────────────────────

let fuseInstance: Fuse<Song> | null = null;

// ─── Lifecycle ──────────────────────────────────────────────────────────────────

/**
 * Initialise (or re-initialise) the Fuse index with the given songs array.
 * Should be called once when songs are first loaded from Dexie.
 */
export function initSearchService(songs: Song[]): void {
  fuseInstance = new Fuse(songs, fuseOptions);
}

/**
 * Replace the entire Fuse collection. Use after a bulk CSV import that replaces
 * all songs. Avoids constructing a new Fuse instance.
 */
export function updateSongs(songs: Song[]): void {
  if (!fuseInstance) {
    fuseInstance = new Fuse(songs, fuseOptions);
    return;
  }
  fuseInstance.setCollection(songs);
}

/**
 * Add a single song to the Fuse index incrementally — O(log n), no full rebuild.
 */
export function addSong(song: Song): void {
  if (!fuseInstance) {
    fuseInstance = new Fuse([song], fuseOptions);
    return;
  }
  fuseInstance.add(song);
}

/**
 * Remove a single song from the Fuse index by ID — O(log n), no full rebuild.
 */
export function removeSong(id: string): void {
  if (!fuseInstance) return;
  fuseInstance.remove((doc) => doc.id === id);
}

// ─── Search ─────────────────────────────────────────────────────────────────────

/**
 * Fuzzy search. Returns up to `limit` results (default: SEARCH_PAGE_SIZE).
 */
export function search(query: string, limit?: number): FuseResult<Song>[] {
  if (!fuseInstance || !query.trim()) return [];
  const results = fuseInstance.search(query);
  return results.slice(0, limit ?? SEARCH_PAGE_SIZE);
}

/**
 * Advanced search that applies field-level filters after fuzzy scoring.
 */
export function searchAdvanced(
  query: string,
  filters: {
    type?: string;
    yearRange?: [number, number];
    bpmRange?: [number, number];
    keyTolerance?: number;
    targetKey?: string;
  }
): FuseResult<Song>[] {
  let results = search(query);

  if (filters.type) {
    const t = filters.type.toLowerCase();
    results = results.filter((r) => r.item.type.toLowerCase().includes(t));
  }

  if (filters.yearRange) {
    const [minYear, maxYear] = filters.yearRange;
    results = results.filter(
      (r) => r.item.year >= minYear && r.item.year <= maxYear
    );
  }

  if (filters.bpmRange) {
    const [minBpm, maxBpm] = filters.bpmRange;
    results = results.filter((r) =>
      r.item.bpms.some((bpm) => bpm >= minBpm && bpm <= maxBpm)
    );
  }

  if (filters.targetKey && filters.keyTolerance !== undefined) {
    const tk = filters.targetKey.toLowerCase();
    results = results.filter((r) =>
      r.item.keys.some((k) => k.toLowerCase().includes(tk))
    );
  }

  return results;
}

/**
 * Return up to `limit` autocomplete suggestion strings for the given query.
 */
export function getSuggestions(query: string, limit = 5): string[] {
  if (query.length < FUSE_MIN_MATCH_CHAR_LENGTH) return [];

  const results = search(query, limit);
  const suggestions = new Set<string>();
  const q = query.toLowerCase();

  for (const result of results) {
    if (result.item.title.toLowerCase().includes(q)) suggestions.add(result.item.title);
    if (result.item.artist.toLowerCase().includes(q)) suggestions.add(result.item.artist);
    if (result.item.type.toLowerCase().includes(q)) suggestions.add(result.item.type);
    if (suggestions.size >= limit) break;
  }

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Extended search syntax (e.g. "title:Angel artist:Lia").
 */
export function searchExtended(query: string): FuseResult<Song>[] {
  if (!query.trim()) return [];
  const parsed = parseExtendedQuery(query);
  if (!fuseInstance) return [];
  return fuseInstance.search(parsed);
}

/** @internal */
function parseExtendedQuery(query: string): string {
  return query
    .split(' ')
    .map((part) => {
      if (!part.includes(':')) return part;
      const [field, value] = part.split(':', 2) as [string, string];
      const fieldMap: Record<string, string> = {
        title: 'title',
        artist: 'artist',
        type: 'type',
        origin: 'origin',
        part: 'part',
      };
      const mapped = fieldMap[field.toLowerCase()];
      return mapped ? `${mapped}:"${value}"` : part;
    })
    .join(' ');
}

// ─── Test Helpers ────────────────────────────────────────────────────────────────

/**
 * Reset the singleton for test isolation.
 * Call in `beforeEach` in Vitest tests.
 * @internal — do not use in production code.
 */
export function _resetForTesting(): void {
  fuseInstance = null;
}
