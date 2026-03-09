/**
 * Pure CSV parsing for songs and song_sections. No Vite/asset imports.
 * Safe to use from Node (e.g. scripts/seed.ts) and from the browser.
 */
import type { Song, SongSection } from '../types';

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getSeasonFromYear(year: number): string {
  if (year >= 2020) return 'Modern';
  if (year >= 2010) return '2010s';
  if (year >= 2000) return '2000s';
  if (year >= 1990) return '1990s';
  return 'Classic';
}

export function parseSongsCSV(csvText: string): Song[] {
  const lines = csvText.split('\n').filter((line) => line.trim());
  const songs: Song[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    if (fields.length < 7) continue;
    const [idStr, title, artist, type, origin, season, yearStr, notes] = fields;
    if (!title) continue;
    const year = parseInt(yearStr) || 2020;
    const seasonValue = (season && season.trim()) || getSeasonFromYear(year);
    const normalizedArtist = (artist && artist.trim()) ? artist.trim() : 'Unknown Artist';
    const song: Song = {
      id: (idStr && idStr.trim()) || generateId(),
      title: title.trim(),
      artist: normalizedArtist,
      type: (type && type.trim()) || 'Anime',
      origin: origin?.trim() ?? '',
      year,
      season: seasonValue,
      notes: (notes && notes.trim()) || '',
      bpms: [],
      keys: [],
    };
    songs.push(song);
  }
  return songs;
}

export function parseSongSectionsCSV(csvText: string): SongSection[] {
  const lines = csvText.split('\n').filter((line) => line.trim());
  const sections: SongSection[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    if (fields.length < 6) continue;
    const [sectionIdStr, songId, part, bpmStr, key, sectionOrderStr] = fields;
    if (!songId || !sectionIdStr) continue;
    const bpm = parseFloat(bpmStr) || 0;
    const sectionOrder = parseInt(sectionOrderStr) || 1;
    const section: SongSection = {
      sectionId: sectionIdStr.trim(),
      songId: songId.trim(),
      part: (part && part.trim()) || 'Main',
      bpm: Number.isFinite(bpm) && bpm > 0 ? bpm : 0,
      key: (key && key.trim()) || 'C Major',
      sectionOrder,
    };
    sections.push(section);
  }
  return sections;
}
