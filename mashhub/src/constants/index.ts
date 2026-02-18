/**
 * Application-wide constants.
 * All magic numbers and string literals are defined here to avoid inline literals scattered
 * throughout the codebase. Import from this file instead of using bare literals.
 */

// ─── Fuse.js Search ────────────────────────────────────────────────────────────

/** Fuse.js match threshold: 0 = perfect match, 1 = match anything. */
export const FUSE_THRESHOLD = 0.6;

/** Fuse.js maximum character distance for a match. */
export const FUSE_DISTANCE = 100;

/** Fuse.js minimum number of characters that must match. */
export const FUSE_MIN_MATCH_CHAR_LENGTH = 2;

/** Default number of search results per page. */
export const SEARCH_PAGE_SIZE = 25;

/** Debounce delay (ms) applied to the search input before triggering Fuse.js. */
export const SEARCH_DEBOUNCE_MS = 300;

// ─── Match Scoring Weights ──────────────────────────────────────────────────────

/** Weight applied to the BPM compatibility score in standard match scoring. */
export const MATCH_WEIGHT_BPM = 0.4;

/** Weight applied to the key compatibility score in standard match scoring. */
export const MATCH_WEIGHT_KEY = 0.3;

/** Weight applied to type match in standard match scoring. */
export const MATCH_WEIGHT_TYPE = 0.1;

/** Weight applied to year match in standard match scoring. */
export const MATCH_WEIGHT_YEAR = 0.05;

/** Weight applied to text search (title) match in standard match scoring. */
export const MATCH_WEIGHT_TEXT = 0.05;

/** Weight applied to part-specific key score in quick-match scoring. */
export const QUICK_MATCH_WEIGHT_KEY = 0.45;

/** Weight applied to part-specific BPM score in quick-match scoring. */
export const QUICK_MATCH_WEIGHT_BPM = 0.45;

/** Weight applied to artist match in quick-match scoring. */
export const QUICK_MATCH_WEIGHT_ARTIST = 0.05;

/** Weight applied to origin match in quick-match scoring. */
export const QUICK_MATCH_WEIGHT_ORIGIN = 0.05;

// ─── BPM Matching ───────────────────────────────────────────────────────────────

/** Default BPM tolerance (±BPM) used for quick-match harmonic detection. */
export const DEFAULT_BPM_TOLERANCE = 10;

/**
 * Denominator used in the less-sensitive BPM compatibility score formula.
 * Formula: max(0, 1 - bpmDiff / BPM_SCORE_DENOMINATOR)
 * Equals 15 * 1.5 to apply a 1.5× sensitivity reduction.
 */
export const BPM_SCORE_DENOMINATOR = 22.5;

// ─── Key Matching ───────────────────────────────────────────────────────────────

/** Default key tolerance (semitones) for harmonic matching. */
export const DEFAULT_KEY_TOLERANCE = 2;

/** Score given when pitch classes match but modes differ (major vs minor). */
export const KEY_MODE_MISMATCH_SCORE = 0.85;

/** Maximum semitone distance used to normalize key distance to [0,1]. */
export const KEY_MAX_SEMITONE_DISTANCE = 6;

// ─── Section Names ──────────────────────────────────────────────────────────────

/** The canonical base section names used throughout the app. */
export const BASE_SECTION_NAMES = [
  'Intro',
  'Verse',
  'Prechorus',
  'Chorus',
  'Bridge',
  'Other',
] as const;

export type BaseSectionName = typeof BASE_SECTION_NAMES[number];

// ─── Database / Service Layer ───────────────────────────────────────────────────

/** Batch size used when bulk-inserting songs to avoid blocking the main thread. */
export const SONG_BULK_INSERT_BATCH_SIZE = 100;

/**
 * TTL (ms) for the in-memory section cache.
 * Cache entries older than this are considered stale and will be re-fetched from Dexie.
 */
export const SECTION_CACHE_TTL_MS = 60_000;

/** Timeout (ms) for waiting on the initial database open. */
export const DB_OPEN_TIMEOUT_MS = 10_000;

// ─── Loading ────────────────────────────────────────────────────────────────────

/** Maximum ms to wait for any async loading operation before showing an error. */
export const LOADING_TIMEOUT_MS = 10_000;
