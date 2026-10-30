export type LyricLanguage = 'en' | 'ja' | 'ko' | 'tl' | 'other';
export type LyricMatchKind = 'exact' | 'lemma' | 'semantic';
export type LyricIngestStatus = 'found' | 'not_found' | 'instrumental' | 'error' | 'manual';
export type LyricEmbeddingStatus = 'pending' | 'partial' | 'done' | 'skipped';

export interface LyricLine {
  id: number;
  songId: string;
  lineIndex: number;
  text: string;
  startMs?: number;
  sectionHint?: string;
  repeatCount?: number;
  lang: LyricLanguage;
  tokens: string[];
  surfaceTokens: string[];
}

export interface LyricMatchMember {
  songId: string;
  title: string;
  artist: string;
  lineId: number;
  lineIndex: number;
  lineText: string;
  startMs?: number;
  highlightTerms: string[];
}

export interface LyricMatchGroup {
  id: string; // stable: `${lang}:${kind}:${sharedTerms.join('+')}` (semantic: hash of line ids)
  language: LyricLanguage;
  kind: LyricMatchKind;
  sharedTerms: string[];
  label: string;
  isCommonWord: boolean;
  semanticSimilarity?: number; // 0..1, semantic only
  rank: number;
  members: LyricMatchMember[]; // >= 2 distinct songs
}

export interface SongLyricRecord {
  songId: string;
  status: LyricIngestStatus;
  source?: 'lrclib' | 'lyricsovh' | 'manual';
  sourceTrackId?: string;
  matchConfidence?: number;
  plainLyrics?: string;
  hasTimestamps: boolean;
  languageSummary: string[];
  processedVersion: number;
  embeddingStatus: LyricEmbeddingStatus;
  fetchedAt: string;
  errorDetail?: string;
}

export interface ProjectLyricLinkMember {
  linkId: string;
  songId: string;
  lineId?: number;
  lineText: string;
  lineIndex?: number;
}

export interface ProjectLyricLink {
  id: string;
  projectId: string;
  userId?: string;
  groupKey: string;
  lang: LyricLanguage;
  matchKind: LyricMatchKind;
  sharedTerms: string[];
  label: string;
  createdAt: string;
  members: ProjectLyricLinkMember[];
}

export interface LyricCandidate {
  id: number | string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}
