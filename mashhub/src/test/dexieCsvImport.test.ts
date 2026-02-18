/**
 * Phase 8.7 — Dexie integration test: CSV import verification
 *
 * Parses CSV text with the real parseSongsCSV / parseSongSectionsCSV functions,
 * then writes the results into a fake IndexedDB and verifies counts and data.
 */

// Inject fake IndexedDB globals BEFORE importing Dexie or the database module.
import 'fake-indexeddb/auto';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db, songService, sectionService } from '../services/database';
import { parseSongsCSV, parseSongSectionsCSV } from '../data/animeDataLoader';

// ---------------------------------------------------------------------------
// Inline CSV fixtures (no file I/O needed in tests)
// ---------------------------------------------------------------------------

const SONGS_CSV = `ID,TITLE,ARTIST,TYPE,ORIGIN,SEASON,YEAR,NOTES
00001,Dragon Night,SEKAI NO OWARI,OP,Japan,Winter,2014,
00002,Silhouette,KANA-BOON,OP,Japan,Fall,2014,
00003,Crossing Field,LiSA,OP,Japan,Summer,2012,first SAO OP
`;

const SECTIONS_CSV = `SECTION_ID,SONG_ID,PART,BPM,KEY,SECTION_ORDER
sec001,00001,Intro,142,A Major,1
sec002,00001,Verse,142,A Major,2
sec003,00001,Chorus,142,F# Minor,3
sec004,00002,Intro,168,C# Minor,1
sec005,00002,Chorus,168,C# Minor,2
sec006,00003,Intro,137,D Major,1
sec007,00003,Verse,137,D Major,2
`;

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

describe('Dexie integration — CSV import', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
  });

  // ── Parsing ────────────────────────────────────────────────────────────────

  it('parseSongsCSV returns the correct number of songs', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    expect(songs).toHaveLength(3);
  });

  it('parseSongsCSV maps fields correctly for the first song', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    const first = songs[0]!;
    expect(first.id).toBe('00001');
    expect(first.title).toBe('Dragon Night');
    expect(first.artist).toBe('SEKAI NO OWARI');
    expect(first.type).toBe('OP');
    expect(first.origin).toBe('Japan');
    expect(first.season).toBe('Winter');
    expect(first.year).toBe(2014);
  });

  it('parseSongSectionsCSV returns the correct number of sections', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    expect(sections).toHaveLength(7);
  });

  it('parseSongSectionsCSV maps fields correctly for the first section', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    const first = sections[0]!;
    expect(first.sectionId).toBe('sec001');
    expect(first.songId).toBe('00001');
    expect(first.part).toBe('Intro');
    expect(first.bpm).toBe(142);
    expect(first.key).toBe('A Major');
    expect(first.sectionOrder).toBe(1);
  });

  // ── Database import ────────────────────────────────────────────────────────

  it('imports songs into IndexedDB and verifies count', async () => {
    const songs = parseSongsCSV(SONGS_CSV);
    await songService.bulkAdd(songs);

    const count = await db.songs.count();
    expect(count).toBe(3);
  });

  it('imports sections into IndexedDB and verifies count', async () => {
    const songs = parseSongsCSV(SONGS_CSV);
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    await songService.bulkAdd(songs);
    await sectionService.bulkAdd(sections);

    const count = await db.songSections.count();
    expect(count).toBe(7);
  });

  it('first song data matches the CSV source after import', async () => {
    const songs = parseSongsCSV(SONGS_CSV);
    await songService.bulkAdd(songs);

    const found = await db.songs.get('00001');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Dragon Night');
    expect(found?.artist).toBe('SEKAI NO OWARI');
    expect(found?.year).toBe(2014);
  });

  it('sections are correctly associated with their songs', async () => {
    const songs = parseSongsCSV(SONGS_CSV);
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    await songService.bulkAdd(songs);
    await sectionService.bulkAdd(sections);

    // Song 00001 has 3 sections
    const song1Sections = await sectionService.getBySongId('00001');
    expect(song1Sections).toHaveLength(3);

    // Song 00002 has 2 sections
    const song2Sections = await sectionService.getBySongId('00002');
    expect(song2Sections).toHaveLength(2);

    // Song 00003 has 2 sections
    const song3Sections = await sectionService.getBySongId('00003');
    expect(song3Sections).toHaveLength(2);
  });

  it('songService.getAll enriches songs with bpms and keys from sections', async () => {
    const songs = parseSongsCSV(SONGS_CSV);
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    await songService.bulkAdd(songs);
    await sectionService.bulkAdd(sections);

    const allSongs = await songService.getAll();
    expect(allSongs).toHaveLength(3);

    // Dragon Night sections have bpm 142 → enriched song should have it
    const dragonNight = allSongs.find(s => s.id === '00001');
    expect(dragonNight).toBeDefined();
    expect(dragonNight!.bpms).toContain(142);
    expect(dragonNight!.keys).toContain('A Major');
  });

  it('notes field with text is preserved after import', async () => {
    const songs = parseSongsCSV(SONGS_CSV);
    await songService.bulkAdd(songs);

    const song3 = await db.songs.get('00003');
    expect(song3?.notes).toBe('first SAO OP');
  });

  it('notes field left empty is stored as empty string', async () => {
    const songs = parseSongsCSV(SONGS_CSV);
    await songService.bulkAdd(songs);

    const song1 = await db.songs.get('00001');
    // Either empty string or undefined/null is acceptable for a blank notes field
    expect(song1?.notes ?? '').toBe('');
  });
});
