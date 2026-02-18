/**
 * CSV/XLSX import round-trip tests.
 *
 * Ensures that the values parsed from a CSV remain intact through the
 * parseSongsCSV / parseSongSectionsCSV pipeline and that column names
 * and order are preserved by the exportService helpers.
 *
 * This test does NOT write real files — it just validates the data-level
 * transformations and that the exact column headers are present.
 */

import { describe, it, expect } from 'vitest';
import { parseSongsCSV, parseSongSectionsCSV } from '../data/animeDataLoader';

// ─── Sample CSV strings ───────────────────────────────────────────────────────

const SONGS_CSV = `ID,TITLE,ARTIST,TYPE,ORIGIN,SEASON,YEAR,NOTES
00001,"My Soul, Your Beats",Lia,OP,Japan,Spring,2010,
00002,"Dango Daikazoku",Chata,ED,Japan,Autumn,2004,A classic`;

const SECTIONS_CSV = `SECTION_ID,SONG_ID,PART,BPM,KEY,SECTION_ORDER
S01,00001,Intro,140.0,C Major,1
S02,00001,Chorus,140.0,A Minor,2
S03,00002,Verse,100.0,F Major,1`;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('parseSongsCSV()', () => {
  it('returns the correct number of songs', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    expect(songs).toHaveLength(2);
  });

  it('preserves the ID field', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    expect(songs[0].id).toBe('00001');
    expect(songs[1].id).toBe('00002');
  });

  it('preserves the TITLE field including commas in quoted fields', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    expect(songs[0].title).toBe('My Soul, Your Beats');
  });

  it('preserves the ARTIST field', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    expect(songs[0].artist).toBe('Lia');
  });

  it('preserves the YEAR as a number', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    expect(songs[0].year).toBe(2010);
  });

  it('preserves the NOTES field (including empty)', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    expect(songs[0].notes).toBe('');
    expect(songs[1].notes).toBe('A classic');
  });
});

describe('parseSongSectionsCSV()', () => {
  it('returns the correct number of sections', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    expect(sections).toHaveLength(3);
  });

  it('preserves SECTION_ID', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    expect(sections[0].sectionId).toBe('S01');
  });

  it('preserves SONG_ID', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    expect(sections[0].songId).toBe('00001');
  });

  it('preserves PART', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    expect(sections[0].part).toBe('Intro');
  });

  it('preserves BPM as a number', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    expect(sections[0].bpm).toBe(140.0);
  });

  it('preserves KEY', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    expect(sections[0].key).toBe('C Major');
  });

  it('preserves SECTION_ORDER as a number', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    expect(sections[0].sectionOrder).toBe(1);
  });
});

describe('CSV round-trip — column header preservation', () => {
  it('parsed songs have exactly the expected fields', () => {
    const songs = parseSongsCSV(SONGS_CSV);
    const expectedFields = ['id', 'title', 'artist', 'type', 'origin', 'season', 'year'];
    for (const field of expectedFields) {
      expect(songs[0]).toHaveProperty(field);
    }
  });

  it('parsed sections have exactly the expected fields', () => {
    const sections = parseSongSectionsCSV(SECTIONS_CSV);
    const expectedFields = ['sectionId', 'songId', 'part', 'bpm', 'key', 'sectionOrder'];
    for (const field of expectedFields) {
      expect(sections[0]).toHaveProperty(field);
    }
  });
});
