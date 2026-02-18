/**
 * Lightweight in-memory key/value cache with per-entry TTL.
 *
 * Design:
 * - No external dependencies — plain Map with timestamps.
 * - Entries are invalidated explicitly (on write) OR lazily (on next read past TTL).
 * - Cache keys follow the pattern:
 *     "sections:{songId}"   — sections for a specific song
 *     "sections:all"        — full batch sections Map
 *     "parts:unique"        — unique part name list
 */

import { SECTION_CACHE_TTL_MS } from '../constants';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Single module-level store; shared across all callers in the same JS context.
const store = new Map<string, CacheEntry<unknown>>();

/**
 * Retrieve a cached value. Returns `undefined` if missing or expired.
 */
export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/**
 * Store a value in the cache with the global TTL.
 */
export function cacheSet<T>(key: string, value: T, ttlMs: number = SECTION_CACHE_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Remove a specific cache entry.
 */
export function cacheInvalidate(key: string): void {
  store.delete(key);
}

/**
 * Remove all cache entries whose keys start with the given prefix.
 * Use `cacheInvalidatePrefix('sections:')` to clear all per-song section caches at once.
 */
export function cacheInvalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

/**
 * Clear the entire cache. Primarily used in tests via `beforeEach`.
 */
export function cacheClear(): void {
  store.clear();
}
