/**
 * Phase 8.6 — Dexie integration tests
 *
 * Uses fake-indexeddb so no real browser IndexedDB is required.
 * Each test gets a fresh, empty database by deleting and re-opening.
 */

// Inject fake IndexedDB globals BEFORE importing Dexie or the database module.
import 'fake-indexeddb/auto';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, songService, sectionService } from '../services/database';
import type { Song, SongSection } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const song1: Song = {
  id: '00001',
  title: 'Integration Song A',
  artist: 'Artist Alpha',
  type: 'OP',
  origin: 'Anime',
  year: 2023,
  season: 'Spring',
  notes: '',
  bpms: [],
  keys: [],
};

const section1: SongSection = {
  sectionId: 's001',
  songId: '00001',
  part: 'Intro',
  bpm: 120,
  key: 'C Major',
  sectionOrder: 1,
};

const section2: SongSection = {
  sectionId: 's002',
  songId: '00001',
  part: 'Chorus',
  bpm: 125,
  key: 'G Major',
  sectionOrder: 2,
};

async function resetDb() {
  await db.transaction('rw', [db.songs, db.songSections, db.projects, db.projectEntries], async () => {
    await db.songs.clear();
    await db.songSections.clear();
    await db.projects.clear();
    await db.projectEntries.clear();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dexie integration — song CRUD + section cleanup', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  // ── Add & read ─────────────────────────────────────────────────────────────

  it('adds a song and retrieves it by id', async () => {
    await db.songs.add(song1);
    const found = await db.songs.get('00001');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Integration Song A');
  });

  it('adds sections for a song and retrieves them', async () => {
    await db.songs.add(song1);
    await db.songSections.bulkAdd([section1, section2]);

    const sections = await sectionService.getBySongId('00001');
    expect(sections).toHaveLength(2);
    expect(sections.map(s => s.part)).toContain('Intro');
    expect(sections.map(s => s.part)).toContain('Chorus');
  });

  // ── Update ─────────────────────────────────────────────────────────────────

  it('updates a song field and reflects the change', async () => {
    await db.songs.add(song1);
    const updated: Song = { ...song1, title: 'Updated Title' };
    await songService.update(updated);
    const found = await db.songs.get('00001');
    expect(found?.title).toBe('Updated Title');
  });

  it('updates a section bpm and reflects the change', async () => {
    await db.songs.add(song1);
    await db.songSections.add(section1);

    await sectionService.update({ ...section1, bpm: 135 });
    const found = await db.songSections.get('s001');
    expect(found?.bpm).toBe(135);
  });

  // ── Delete ─────────────────────────────────────────────────────────────────

  it('deletes a song and its sections atomically', async () => {
    await db.songs.add(song1);
    await db.songSections.bulkAdd([section1, section2]);

    await songService.delete('00001');

    const foundSong = await db.songs.get('00001');
    const sections = await db.songSections.where('songId').equals('00001').toArray();
    expect(foundSong).toBeUndefined();
    expect(sections).toHaveLength(0);
  });

  // ── Orphan cleanup ─────────────────────────────────────────────────────────

  it('cleanOrphanedSections removes sections with no matching song', async () => {
    // Add sections whose songId does not exist in songs table
    const orphanSection: SongSection = {
      sectionId: 'orphan-001',
      songId: 'GHOST_ID',
      part: 'Verse',
      bpm: 100,
      key: 'D Minor',
      sectionOrder: 1,
    };
    await db.songSections.add(orphanSection);

    const removedCount = await sectionService.cleanOrphanedSections();
    expect(removedCount).toBe(1);

    const remaining = await db.songSections.toArray();
    expect(remaining).toHaveLength(0);
  });

  it('cleanOrphanedSections returns 0 when there are no orphans', async () => {
    await db.songs.add(song1);
    await db.songSections.bulkAdd([section1, section2]);

    const removedCount = await sectionService.cleanOrphanedSections();
    expect(removedCount).toBe(0);

    const remaining = await db.songSections.toArray();
    expect(remaining).toHaveLength(2);
  });

  // ── songService.getAll (section enrichment) ────────────────────────────────

  it('getAll returns songs enriched with their sections', async () => {
    await db.songs.add(song1);
    await db.songSections.bulkAdd([section1, section2]);

    const allSongs = await songService.getAll();
    expect(allSongs).toHaveLength(1);
    const enriched = allSongs[0]!;
    // bpms and keys are derived from sections during enrichment
    expect(enriched.bpms.length).toBeGreaterThan(0);
    expect(enriched.keys.length).toBeGreaterThan(0);
  });

  it('getAll returns empty array when database is empty', async () => {
    const allSongs = await songService.getAll();
    expect(allSongs).toHaveLength(0);
  });

  // ── bulkAdd ────────────────────────────────────────────────────────────────

  it('bulkAdd inserts multiple songs', async () => {
    const songs: Song[] = [
      { ...song1, id: '00001' },
      { ...song1, id: '00002', title: 'Song B' },
    ];
    await songService.bulkAdd(songs);
    const count = await db.songs.count();
    expect(count).toBe(2);
  });
});
