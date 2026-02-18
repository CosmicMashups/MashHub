export interface SongSection {
  sectionId: string;
  songId: string;
  part: string;
  bpm: number;
  key: string;
  sectionOrder: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  type: string;
  origin: string;
  year: number;
  season: string;
  // Optional metadata used across UI/search; kept on the base type because most components
  // operate on enriched songs, not the raw minimal row.
  part?: string;
  notes?: string;

  // Harmonic data used across filtering/matching/search UI.
  // These are populated for all songs in the UI layer; allow empty arrays for incomplete data.
  bpms: number[];
  keys: string[];
  primaryBpm?: number;
  primaryKey?: string;

  // Optional fields used by some cards/filters.
  vocalStatus?: string;

  // Some UI surfaces pass around songs with sections attached; keep optional to avoid
  // forcing all call-sites to use SongWithSections.
  sections?: SongSection[];
}

export interface SongWithSections extends Song {
  sections: SongSection[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ProjectEntry {
  id: string;
  projectId: string;
  songId: string;
  sectionId?: string | null;
  sectionName: string;
  orderIndex: number;
}
  
  export interface FilterOptions {
    searchText: string;
    bpmRange: [number, number];
    keyTolerance: number;
    targetKey?: string;
  }

// Filter state model for new filter architecture
export interface HarmonicMode {
  mode: "target" | "range" | null;
  target?: number | string;
  tolerance?: number;
  min?: number;
  max?: number;
}

export interface PartHarmonicFilterBlock {
  part?: string;
  bpm?: HarmonicMode;
  key?: string[]; // Array of selected keys (checkboxes)
}

export interface FilterState {
  bpm: HarmonicMode;
  key: string[]; // Array of selected keys (checkboxes)
  year: {
    min?: number;
    max?: number;
  };
  advanced: {
    type?: string;
    origin?: string;
    season?: string;
    artist?: string;
    text?: string;
    partSpecific?: PartHarmonicFilterBlock[];
    partSpecificKey?: {
      section: string;
      key: string;
    } | null;
  };
}

// Spotify integration types
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  popularity: number;
}

export interface SpotifyMapping {
  songId: string;
  spotifyTrackId: string;
  spotifyAlbumId?: string;
  imageUrlLarge?: string;
  imageUrlMedium?: string;
  imageUrlSmall?: string;
  previewUrl?: string;
  spotifyExternalUrl?: string;
  confidenceScore: number; // 0-100
  mappedAt: Date;
  lastVerified?: Date;
  manualOverride: boolean;
  marketCode?: string; // e.g., 'US', 'JP'
}