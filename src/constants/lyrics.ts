import type { LyricLanguage, LyricMatchKind } from '../types/lyrics';

/** Cosine similarity threshold for semantic matches */
export const LYRIC_SEMANTIC_THRESHOLD = 0.82;

/** Document frequency ratio cutoff for common words (e.g. > 5% of indexed songs) */
export const LYRIC_COMMON_DF_RATIO = 0.05;

/** Minimum number of songs indexed in a language before DF rarity checks activate */
export const LYRIC_MIN_CORPUS_FOR_DF = 20;

/** Maximum contiguous n-gram length for phrase matching */
export const LYRIC_MAX_NGRAM = 4;

/** Minimum string match confidence threshold for LRCLIB candidates */
export const LYRIC_MIN_CONFIDENCE = 0.75;

/** Maximum songs fetched per single ingest request (hard rule: 1) */
export const MAX_SONGS_PER_REQUEST = 1;

/** Max songs allowed in compare-selected mode */
export const MAX_COMPARE_SONGS = 20;

/** Minimum token character length to index */
export const MIN_TOKEN_LENGTH = 2;

/** Rate limits: default 150 fetches per user per hour */
export const LYRIC_RATE_LIMIT_PER_HOUR = 150;

/** Client queue concurrency */
export const LYRIC_INGEST_CONCURRENCY = 3;

/** Max retries per song ingest */
export const LYRIC_INGEST_MAX_RETRIES = 2;

/** Match kind ranking weights */
export const LYRIC_KIND_WEIGHTS: Record<LyricMatchKind, number> = {
  exact: 1.0,
  lemma: 0.85,
  semantic: 0.7,
};

/** Common filler vocables that must be dropped like stopwords */
export const LYRIC_FILLER_VOCABLES: Record<LyricLanguage, string[]> = {
  en: [
    'oh', 'ooh', 'yeah', 'yeh', 'ah', 'uh', 'hey', 'la', 'na', 'woah', 'whoa',
    'mm', 'hmm', 'huh', 'yo', 'ay', 'aye', 'ha', 'da', 'dum', 'woo'
  ],
  ja: [
    'あ', 'ああ', 'おお', 'ええ', 'ううん', 'らら', 'ららら', 'ふふ', 'へい', 'いぇい', 'なな'
  ],
  ko: [
    '아', '아아', '오', '어', '우', '예', '워', '헤이', '랄라', '라라', '음'
  ],
  tl: [
    'oh', 'ooh', 'ha', 'ah', 'ay', 'hala', 'uy', 'woah', 'yeah', 'na', 'la'
  ],
  other: [
    'oh', 'ooh', 'yeah', 'ah', 'la', 'na', 'hey'
  ]
};
