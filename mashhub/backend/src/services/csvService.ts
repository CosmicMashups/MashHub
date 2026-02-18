import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { SongCSVRow, SongSectionCSVRow, ParsedSong, ParsedSongSection } from '../types';

/**
 * Service for parsing and validating CSV files containing song and section data.
 * Handles data transformation, type conversion, and relationship validation.
 */
export class CSVService {
  /**
   * Parse songs.csv file and transform to ParsedSong format.
   * Handles ID padding, type conversion, and null value handling.
   */
  async parseSongsCSV(filePath: string): Promise<ParsedSong[]> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as SongCSVRow[];

    return records.map(row => ({
      id: row.ID.padStart(5, '0'),
      title: row.TITLE,
      artist: row.ARTIST,
      type: row.TYPE || null,
      origin: row.ORIGIN || null,
      season: row.SEASON || null,
      year: row.YEAR ? parseInt(row.YEAR, 10) : null,
      notes: row.NOTES || null,
    }));
  }

  /**
   * Parse song_sections.csv file and transform to ParsedSongSection format.
   * Handles ID padding, BPM/KEY parsing, and section order conversion.
   */
  async parseSongSectionsCSV(filePath: string): Promise<ParsedSongSection[]> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as SongSectionCSVRow[];

    return records.map(row => ({
      sectionId: row.SECTION_ID,
      songId: row.SONG_ID.padStart(5, '0'),
      part: row.PART,
      bpm: row.BPM ? parseFloat(row.BPM) : null,
      key: row.KEY || null,
      sectionOrder: parseInt(row.SECTION_ORDER, 10),
    }));
  }

  /**
   * Validate that all sections reference existing songs.
   * Returns valid sections and orphan sections (sections without parent songs).
   * Orphan sections are excluded from import to maintain data integrity.
   */
  validateSections(songs: ParsedSong[], sections: ParsedSongSection[]): {
    valid: ParsedSongSection[];
    orphans: ParsedSongSection[];
  } {
    const songIds = new Set(songs.map(s => s.id));
    const valid: ParsedSongSection[] = [];
    const orphans: ParsedSongSection[] = [];

    for (const section of sections) {
      if (songIds.has(section.songId)) {
        valid.push(section);
      } else {
        orphans.push(section);
      }
    }

    return { valid, orphans };
  }
}
