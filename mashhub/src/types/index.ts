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
  vocalStatus: 'Vocal' | 'Instrumental' | 'Both' | 'Pending';
  notes?: string;
}

export interface SongWithSections extends Song {
  sections: SongSection[];
  bpms: number[];
  keys: string[];
  primaryBpm?: number;
  primaryKey?: string;
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
    vocalStatus?: string;
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
  key?: HarmonicMode;
}

export interface FilterState {
  bpm: HarmonicMode;
  key: HarmonicMode;
  year: {
    min?: number;
    max?: number;
  };
  advanced: {
    vocalStatus?: string;
    type?: string;
    origin?: string;
    season?: string;
    artist?: string;
    text?: string;
    partSpecific?: PartHarmonicFilterBlock[];
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