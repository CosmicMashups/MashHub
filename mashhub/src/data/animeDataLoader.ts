import type { Song, SongSection } from '../types';
import animeCsvUrl from '../assets/anime.csv?url';
import songsCsvUrl from '../assets/songs.csv?url';
import songSectionsCsvUrl from '../assets/song_sections.csv?url';

// Parse the anime.csv data and convert to Song objects
export function parseAnimeCSV(csvText: string): Song[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const songs: Song[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handle commas within quoted fields)
    const fields = parseCSVLine(line);
    
    if (fields.length < 10) continue; // Expect at least the 10 base columns
    
    // CSV header: ID,TITLE,BPM,KEY,PART,ARTIST,TYPE,ORIGIN,YEAR,SEASON
    const [
      idStr,
      title,
      bpmStr,
      key,
      part,
      artist,
      type,
      origin,
      yearStr,
      season
    ] = fields;
    
    // Skip empty rows (require at minimum a title)
    if (!title) continue;
    
    // Parse BPM
    const bpm = parseFloat(bpmStr) || 0;
    const bpms = Number.isFinite(bpm) && bpm > 0 ? [bpm] : [];
    
    // Parse year
    const year = parseInt(yearStr) || 2020;
    
    // Normalize artist
    const normalizedArtist = (artist && artist.trim()) ? artist.trim() : 'Unknown Artist';
    
    // Parse keys
    const keys = [key]
      .filter(k => k && k.trim())
      .map(k => k.trim());
    
    // Determine season
    const seasonValue = (season && season.trim()) || getSeasonFromYear(year);
    
    const song: Song = {
      id: (idStr && idStr.trim()) || generateId(),
      title: title.trim(),
      bpms,
      keys: keys.length > 0 ? keys : [key || 'C Major'],
      part: part || 'Main',
      artist: normalizedArtist,
      type: type || 'Anime',
      origin: origin?.trim() ?? '',
      year,
      season: seasonValue,
      primaryBpm: bpm,
      primaryKey: key || 'C Major'
    };
    
    songs.push(song);
  }
  
  return songs;
}

// Helper function to parse CSV line handling quoted fields
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

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Determine season based on year
function getSeasonFromYear(year: number): string {
  if (year >= 2020) return 'Modern';
  if (year >= 2010) return '2010s';
  if (year >= 2000) return '2000s';
  if (year >= 1990) return '1990s';
  return 'Classic';
}

// Load anime data from the CSV file
export async function loadAnimeData(): Promise<Song[]> {
  try {
    // Import the CSV file as text
    const url = animeCsvUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load anime.csv (${response.status} ${response.statusText}) at ${url}`);
    }
    
    const csvText = await response.text();
    return parseAnimeCSV(csvText);
  } catch (error) {
    console.error('Error loading anime data:', error);
    return [];
  }
}

// Lightweight non-crypto hash for change detection
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

export async function loadAnimeDataWithHash(): Promise<{ songs: Song[]; hash: string }> {
  try {
    const url = animeCsvUrl;
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to load anime.csv (${response.status} ${response.statusText}) at ${url}`);
    }
    const csvText = await response.text();
    const songs = parseAnimeCSV(csvText);
    const hash = simpleHash(csvText);
    return { songs, hash };
  } catch (error) {
    console.error('Error loading anime data with hash:', error);
    return { songs: [], hash: '' };
  }
}

// Parse songs.csv
export function parseSongsCSV(csvText: string): Song[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const songs: Song[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = parseCSVLine(line);
    if (fields.length < 7) continue; // Expect at least ID, TITLE, ARTIST, TYPE, ORIGIN, SEASON, YEAR
    
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

// Parse song_sections.csv
export function parseSongSectionsCSV(csvText: string): SongSection[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const sections: SongSection[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = parseCSVLine(line);
    if (fields.length < 6) continue; // Expect SECTION_ID, SONG_ID, PART, BPM, KEY, SECTION_ORDER
    
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
      sectionOrder
    };
    
    sections.push(section);
  }
  
  return sections;
}

// Load songs and sections from CSV files
export async function loadSongsAndSections(): Promise<{ songs: Song[]; sections: SongSection[] }> {
  try {
    const [songsResponse, sectionsResponse] = await Promise.all([
      fetch(songsCsvUrl),
      fetch(songSectionsCsvUrl)
    ]);
    
    if (!songsResponse.ok) {
      throw new Error(`Failed to load songs.csv (${songsResponse.status} ${songsResponse.statusText})`);
    }
    
    if (!sectionsResponse.ok) {
      throw new Error(`Failed to load song_sections.csv (${sectionsResponse.status} ${sectionsResponse.statusText})`);
    }
    
    const songsText = await songsResponse.text();
    const sectionsText = await sectionsResponse.text();
    
    const songs = parseSongsCSV(songsText);
    const sections = parseSongSectionsCSV(sectionsText);
    
    // Validate relationships
    const songIds = new Set(songs.map(s => s.id));
    const orphanSections = sections.filter(s => !songIds.has(s.songId));
    
    if (orphanSections.length > 0) {
      console.warn(`Found ${orphanSections.length} orphan sections (sections without matching songs):`, orphanSections);
    }
    
    // Filter out orphan sections
    const validSections = sections.filter(s => songIds.has(s.songId));
    
    return { songs, sections: validSections };
  } catch (error) {
    console.error('Error loading songs and sections:', error);
    return { songs: [], sections: [] };
  }
}

// Load songs and sections with hash for change detection
export async function loadSongsAndSectionsWithHash(): Promise<{ songs: Song[]; sections: SongSection[]; hash: string }> {
  try {
    const [songsResponse, sectionsResponse] = await Promise.all([
      fetch(songsCsvUrl, { cache: 'no-cache' }),
      fetch(songSectionsCsvUrl, { cache: 'no-cache' })
    ]);
    
    if (!songsResponse.ok || !sectionsResponse.ok) {
      throw new Error('Failed to load CSV files');
    }
    
    const songsText = await songsResponse.text();
    const sectionsText = await sectionsResponse.text();
    
    const songs = parseSongsCSV(songsText);
    const sections = parseSongSectionsCSV(sectionsText);
    
    // Validate relationships
    const songIds = new Set(songs.map(s => s.id));
    const orphanSections = sections.filter(s => !songIds.has(s.songId));
    
    if (orphanSections.length > 0) {
      console.warn(`Found ${orphanSections.length} orphan sections:`, orphanSections);
    }
    
    const validSections = sections.filter(s => songIds.has(s.songId));
    
    // Create combined hash for change detection
    const combinedText = songsText + sectionsText;
    const hash = simpleHash(combinedText);
    
    return { songs, sections: validSections, hash };
  } catch (error) {
    console.error('Error loading songs and sections with hash:', error);
    return { songs: [], sections: [], hash: '' };
  }
}
