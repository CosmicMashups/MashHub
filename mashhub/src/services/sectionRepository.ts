/**
 * SectionRepository — Batch-aware section fetching with TTL cache.
 *
 * Replaces the N+1 pattern of calling `db.songSections.where('songId').equals(id)` for each
 * song individually. Instead, uses a single `anyOf` query to fetch all sections in one
 * IndexedDB cursor operation.
 *
 * Cache strategy:
 *   - `sections:{songId}` — per-song array, populated during batch loads
 *   - `sections:all`      — last full-batch Map (invalidated on any write)
 * Both keys use the module TTL of 60 s and are explicitly invalidated on write operations.
 */

import type { SongSection } from '../types';
import { db } from './database';
import { cacheGet, cacheSet, cacheInvalidate, cacheInvalidatePrefix } from '../utils/cache';

const PREFIX = 'sections:';

/**
 * Fetch sections for a list of song IDs using a single `anyOf` batch query.
 * Results are cached per song ID. A warm cache hit returns immediately without
 * touching IndexedDB.
 *
 * @returns A Map from songId → SongSection[] (sorted by sectionOrder, ascending).
 */
export async function getForSongs(songIds: string[]): Promise<Map<string, SongSection[]>> {
  if (songIds.length === 0) return new Map();

  // Check which IDs are already in cache
  const result = new Map<string, SongSection[]>();
  const missing: string[] = [];

  for (const id of songIds) {
    const cached = cacheGet<SongSection[]>(`${PREFIX}${id}`);
    if (cached !== undefined) {
      result.set(id, cached);
    } else {
      missing.push(id);
    }
  }

  if (missing.length === 0) return result;

  // One batch query for all missing IDs
  const rows = await db.songSections
    .where('songId')
    .anyOf(missing)
    .toArray();

  // Group by songId and sort by sectionOrder
  const grouped = new Map<string, SongSection[]>();
  for (const row of rows) {
    const arr = grouped.get(row.songId) ?? [];
    arr.push(row);
    grouped.set(row.songId, arr);
  }

  for (const id of missing) {
    const sections = (grouped.get(id) ?? []).sort(
      (a, b) => a.sectionOrder - b.sectionOrder
    );
    grouped.set(id, sections);
    cacheSet(`${PREFIX}${id}`, sections);
    result.set(id, sections);
  }

  return result;
}

/**
 * Fetch sections for a single song ID.
 * Uses the same batch infrastructure so concurrent single-song calls benefit from cache.
 */
export async function getForSong(songId: string): Promise<SongSection[]> {
  const map = await getForSongs([songId]);
  return map.get(songId) ?? [];
}

/**
 * Invalidate all section cache entries for a given song ID.
 * Call this after adding, updating, or deleting sections for that song.
 */
export function invalidateSong(songId: string): void {
  cacheInvalidate(`${PREFIX}${songId}`);
}

/**
 * Invalidate ALL section cache entries.
 * Call this after bulk imports, clearAll, or any operation that touches many songs.
 */
export function invalidateAll(): void {
  cacheInvalidatePrefix(PREFIX);
  cacheInvalidate('parts:unique');
}
