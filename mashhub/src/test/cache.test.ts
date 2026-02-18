/**
 * Unit tests for src/utils/cache.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheGet, cacheSet, cacheInvalidate, cacheInvalidatePrefix, cacheClear } from '../utils/cache';

describe('cache utilities', () => {
  beforeEach(() => {
    cacheClear();
    vi.useRealTimers();
  });

  it('cacheGet returns undefined for missing key', () => {
    expect(cacheGet('no-such-key')).toBeUndefined();
  });

  it('cacheSet + cacheGet returns stored value', () => {
    cacheSet('foo', 42);
    expect(cacheGet('foo')).toBe(42);
  });

  it('cacheGet returns typed value', () => {
    const arr = [1, 2, 3];
    cacheSet<number[]>('nums', arr);
    expect(cacheGet<number[]>('nums')).toEqual([1, 2, 3]);
  });

  it('cacheInvalidate removes a specific key', () => {
    cacheSet('a', 1);
    cacheSet('b', 2);
    cacheInvalidate('a');
    expect(cacheGet('a')).toBeUndefined();
    expect(cacheGet('b')).toBe(2);
  });

  it('cacheInvalidatePrefix removes all keys with the prefix', () => {
    cacheSet('sections:001', ['s1']);
    cacheSet('sections:002', ['s2']);
    cacheSet('other:key', 'keep me');
    cacheInvalidatePrefix('sections:');
    expect(cacheGet('sections:001')).toBeUndefined();
    expect(cacheGet('sections:002')).toBeUndefined();
    expect(cacheGet('other:key')).toBe('keep me');
  });

  it('cacheClear removes everything', () => {
    cacheSet('x', 1);
    cacheSet('y', 2);
    cacheClear();
    expect(cacheGet('x')).toBeUndefined();
    expect(cacheGet('y')).toBeUndefined();
  });

  it('expired entries return undefined', () => {
    vi.useFakeTimers();
    cacheSet('ttl-key', 'value', 100); // 100ms TTL
    vi.advanceTimersByTime(200);       // advance past TTL
    expect(cacheGet('ttl-key')).toBeUndefined();
    vi.useRealTimers();
  });

  it('non-expired entries still return value', () => {
    vi.useFakeTimers();
    cacheSet('ttl-key2', 'value', 5000); // 5 s TTL
    vi.advanceTimersByTime(4000);
    expect(cacheGet('ttl-key2')).toBe('value');
    vi.useRealTimers();
  });
});
