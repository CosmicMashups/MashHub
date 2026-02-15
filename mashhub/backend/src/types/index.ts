export interface SongCSVRow {
  ID: string;
  TITLE: string;
  ARTIST: string;
  TYPE?: string;
  ORIGIN?: string;
  SEASON?: string;
  YEAR?: string;
  NOTES?: string;
}

export interface SongSectionCSVRow {
  SECTION_ID: string;
  SONG_ID: string;
  PART: string;
  BPM?: string;
  KEY?: string;
  SECTION_ORDER: string;
}

export interface ParsedSong {
  id: string;
  title: string;
  artist: string;
  type: string | null;
  origin: string | null;
  season: string | null;
  year: number | null;
  notes: string | null;
}

export interface ParsedSongSection {
  sectionId: string;
  songId: string;
  part: string;
  bpm: number | null;
  key: string | null;
  sectionOrder: number;
}
