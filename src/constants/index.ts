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
export const MATCH_WEIGHT_BPM = 0.45;

/** Weight applied to the key compatibility score in standard match scoring. */
export const MATCH_WEIGHT_KEY = 0.45;

/** Weight applied to artist match in standard match scoring. */
export const MATCH_WEIGHT_ARTIST = 0.05;

/** Weight applied to title match in standard match scoring. */
export const MATCH_WEIGHT_TITLE = 0.05;

/** Weight applied to part-specific key score in quick-match scoring. */
export const QUICK_MATCH_WEIGHT_KEY = 0.45;

/** Weight applied to part-specific BPM score in quick-match scoring. */
export const QUICK_MATCH_WEIGHT_BPM = 0.45;

/** Weight applied to artist match in quick-match scoring. */
export const QUICK_MATCH_WEIGHT_ARTIST = 0.05;

/** Weight applied to origin match in quick-match scoring. */
export const QUICK_MATCH_WEIGHT_ORIGIN = 0.05;

/** Blend: megamix compatibility vs existing suggestion score in SuggestionDrawer (megamix portion). */
export const MEGAMIX_COMPATIBILITY_BLEND_WEIGHT = 0.6;

/** Multiplier when candidate key similarity to accepted keys is below MEGAMIX_KEY_SOFT_PENALTY_THRESHOLD. */
export const MEGAMIX_KEY_SOFT_PENALTY_MULTIPLIER = 0.6;

/** Similarity floor (0–1) below which the soft key penalty applies in megamix Path A. */
export const MEGAMIX_KEY_SOFT_PENALTY_THRESHOLD = 0.5;

/** Suggestions below this blended/megamix score show the “relax constraints” empty-state hint. */
export const MEGAMIX_MIN_SCORE_FOR_SUGGESTION = 0.3;

// ─── BPM Matching ───────────────────────────────────────────────────────────────

/** Default BPM tolerance (±BPM) used for quick-match harmonic detection. */
export const DEFAULT_BPM_TOLERANCE = 10;

/**
 * Tolerance (percent) around harmonic BPM ratios for quick match.
 * E.g. 4 → ±4%: 96 vs 93 (ratio 1.03) passes (near ratio 1), 96 vs 120 (ratio 0.8, 5% from 0.75) fails.
 */
export const BPM_HARMONIC_RATIO_TOLERANCE_PERCENT = 4;

/**
 * Denominator used in the less-sensitive BPM compatibility score formula.
 * Formula: max(0, 1 - bpmDiff / BPM_SCORE_DENOMINATOR)
 * Equals 15 * 1.5 to apply a 1.5× sensitivity reduction.
 */
export const BPM_SCORE_DENOMINATOR = 22.5;

// ─── Key Matching ───────────────────────────────────────────────────────────────

/** Default key tolerance (semitones) for harmonic matching. */
export const DEFAULT_KEY_TOLERANCE = 2;

/** Maximum semitone distance used to normalize key distance to [0,1]. */
export const KEY_MAX_SEMITONE_DISTANCE = 6;

// ─── Musical keys (7 diatonic modes × 12 pitch classes) ─────────────────────────

export const MUSICAL_MODES = [
  'Major',
  'Minor',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Locrian',
] as const;

export type MusicalMode = (typeof MUSICAL_MODES)[number];

/** Canonical sharp spellings per pitch class (display / storage for major). */
export const ROOT_NOTES_STANDARD = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export const ROOT_NOTES_FLAT_ALIASES: Readonly<Record<string, string>> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
} as const;

export const ROOT_NOTES_BY_MODE: Readonly<Record<MusicalMode, readonly string[]>> = {
  Major: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  Minor: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  Dorian: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  Phrygian: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  Lydian: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  Mixolydian: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  Locrian: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
} as const;

/**
 * All 84 canonical key strings (7 modes × 12 pitch classes).
 * First 12 entries are the original major keys (backward compatible order).
 */
export const ALL_MUSICAL_KEYS: readonly string[] = MUSICAL_MODES.flatMap((mode) =>
  ROOT_NOTES_BY_MODE[mode].map((root) => `${root} ${mode}`)
);

// ─── Key Options (exact order for UI: Key dropdown, Key Range checkboxes) ─────────

/** Key roots in exact chromatic order (sharp spelling). */
export const KEY_OPTIONS_ORDERED = ROOT_NOTES_STANDARD;

/** Key options with " Major" suffix — derived from canonical major list. */
export const KEY_OPTIONS_MAJOR = ROOT_NOTES_BY_MODE.Major.map((k) => `${k} Major`);

/** Season options for Suggest Songs (Project Settings). */
export const SEASON_OPTIONS = ['Winter', 'Spring', 'Summer', 'Fall'] as const;

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
/** Number of songs to insert per batch in bulkAdd operations. Larger batches are faster but may block UI. */
export const SONG_BULK_INSERT_BATCH_SIZE = 500;

/**
 * TTL (ms) for the in-memory section cache.
 * Cache entries older than this are considered stale and will be re-fetched from Dexie.
 */
export const SECTION_CACHE_TTL_MS = 60_000;

/** Timeout (ms) for waiting on the initial database open. */
// Increased to 60 seconds to accommodate large datasets (20k+ rows)
export const DB_OPEN_TIMEOUT_MS = 60_000;

// ─── Loading ────────────────────────────────────────────────────────────────────

/** Maximum ms to wait for any async loading operation before showing an error. */
// Increased to 60 seconds to accommodate large datasets (20k+ rows)
export const LOADING_TIMEOUT_MS = 60_000;

