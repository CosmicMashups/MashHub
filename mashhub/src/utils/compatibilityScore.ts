import type { Song } from '../types';
import { getCamelotDistance, getCamelotScore } from '../constants/camelot';

export type CompatibilityWarning =
  | 'bpm-mismatch'
  | 'key-clash'
  | 'bpm-outside-range'
  | 'key-outside-range'
  | 'duplicate-song';

export type CompatibilityLabel = 'High' | 'Medium' | 'Low';

export type CompatibilityColor = 'green' | 'yellow' | 'red';

export interface CompatibilityResult {
  score: number;
  bpmScore: number;
  keyScore: number;
  label: CompatibilityLabel;
  color: CompatibilityColor;
  warnings: CompatibilityWarning[];
  percentage: number;
}

/** Section constraints for song-vs-section compatibility (avoids importing ProjectSection before types step). */
export interface SectionConstraints {
  targetBpm?: number;
  bpmRangeMin?: number;
  bpmRangeMax?: number;
  targetKey?: string;
  keyRangeCamelot?: number;
  /** Allowed keys (e.g. from Key Range checkboxes). Song matches if its key is in this set. */
  keyRange?: string[];
}

function getLabelAndColor(score: number): { label: CompatibilityLabel; color: CompatibilityColor } {
  if (score >= 0.7) return { label: 'High', color: 'green' };
  if (score >= 0.4) return { label: 'Medium', color: 'yellow' };
  return { label: 'Low', color: 'red' };
}

/**
 * BPM score: max(0, 1 - bpmDiff / toleranceBpm). No rounding of BPM values.
 */
function computeBpmScore(bpmA: number | undefined, bpmB: number | undefined, toleranceBpm: number): number {
  if (bpmA == null || bpmB == null || typeof bpmA !== 'number' || typeof bpmB !== 'number') return 0.5;
  const bpmDiff = Math.abs(bpmA - bpmB);
  return Math.max(0, 1 - bpmDiff / toleranceBpm);
}

/** Check if a BPM value falls within [min, max] (inclusive). */
function bpmInRange(bpm: number, min: number, max: number): boolean {
  return bpm >= min && bpm <= max;
}

/**
 * True if the song BPM (or its double or half) falls within the section range.
 * E.g. 78 BPM satisfies 135-160 because 78*2 = 156 is in range.
 */
function songBpmMatchesRange(songBpm: number, rangeMin: number, rangeMax: number): boolean {
  return (
    bpmInRange(songBpm, rangeMin, rangeMax) ||
    bpmInRange(songBpm * 2, rangeMin, rangeMax) ||
    bpmInRange(songBpm / 2, rangeMin, rangeMax)
  );
}

/**
 * Minimum distance from song BPM (or its double or half) to the [rangeMin, rangeMax] interval.
 * Returns 0 if any variant is inside the range; otherwise the smallest distance to the interval.
 */
function minBpmDistanceToRange(songBpm: number, rangeMin: number, rangeMax: number): number {
  const candidates = [songBpm, songBpm * 2, songBpm / 2];
  let minDist = Infinity;
  for (const bpm of candidates) {
    if (bpm >= rangeMin && bpm <= rangeMax) return 0;
    const dist = Math.min(
      Math.abs(bpm - rangeMin),
      Math.abs(bpm - rangeMax)
    );
    minDist = Math.min(minDist, dist);
  }
  return minDist;
}

/**
 * Key score from Camelot: 0 steps = 1.0, 1 = 0.8, 2 = 0.6, 3+ = 0.2.
 */
function computeKeyScore(keyA: string | undefined, keyB: string | undefined): number {
  if (!keyA || !keyB) return 0.5;
  return getCamelotScore(keyA, keyB);
}

/**
 * Song-vs-song compatibility (e.g. Suggestion Drawer). Uses raw BPM (no rounding).
 * Final score = (bpmScore + keyScore) / 2.
 */
export function calculateCompatibilityScore(
  songA: Song,
  songB: Song,
  toleranceBpm = 10
): CompatibilityResult {
  const warnings: CompatibilityWarning[] = [];

  if (songA.id === songB.id) {
    warnings.push('duplicate-song');
    return {
      score: 0,
      bpmScore: 0,
      keyScore: 0,
      label: 'Low',
      color: 'red',
      warnings,
      percentage: 0,
    };
  }

  const bpmA = songA.primaryBpm ?? songA.bpms?.[0];
  const bpmB = songB.primaryBpm ?? songB.bpms?.[0];
  const keyA = songA.primaryKey ?? songA.keys?.[0] ?? '';
  const keyB = songB.primaryKey ?? songB.keys?.[0] ?? '';

  const bpmScore = computeBpmScore(bpmA, bpmB, toleranceBpm);
  const keyScore = computeKeyScore(keyA, keyB);

  if (bpmScore < 0.3) warnings.push('bpm-mismatch');
  if (keyScore <= 0.2) warnings.push('key-clash');

  const score = (bpmScore + keyScore) / 2;
  const { label, color } = getLabelAndColor(score);

  return {
    score,
    bpmScore,
    keyScore,
    label,
    color,
    warnings,
    percentage: Math.round(score * 100),
  };
}

/**
 * Song-vs-section compatibility. Uses section targetBpm/targetKey or ranges.
 * If no section BPM/key metadata: that dimension scores 1.0 (no opinion).
 */
export function calculateSectionCompatibility(
  song: Song,
  section: SectionConstraints,
  toleranceBpm = 10
): CompatibilityResult {
  const warnings: CompatibilityWarning[] = [];
  let bpmScore = 1.0;
  let keyScore = 1.0;

  const songBpm = song.primaryBpm ?? song.bpms?.[0];
  const songKey = song.primaryKey ?? song.keys?.[0] ?? '';

  // BPM: prefer explicit range when both min and max are set; otherwise use targetBpm
  if (
    section.bpmRangeMin != null &&
    section.bpmRangeMax != null &&
    typeof section.bpmRangeMin === 'number' &&
    typeof section.bpmRangeMax === 'number'
  ) {
    if (typeof songBpm === 'number') {
      if (songBpmMatchesRange(songBpm, section.bpmRangeMin, section.bpmRangeMax)) {
        bpmScore = 1.0;
      } else {
        const dist = minBpmDistanceToRange(songBpm, section.bpmRangeMin, section.bpmRangeMax);
        bpmScore = dist === 0 ? 1.0 : Math.max(0, 1 - dist / toleranceBpm);
        warnings.push('bpm-outside-range');
      }
    }
  } else if (section.targetBpm != null && typeof section.targetBpm === 'number') {
    const refBpm = section.targetBpm;
    if (songBpm == null || typeof songBpm !== 'number') {
      bpmScore = 0.5;
    } else {
      const diffDirect = Math.abs(songBpm - refBpm);
      const diffDouble = Math.abs(songBpm * 2 - refBpm);
      const diffHalf = Math.abs(songBpm / 2 - refBpm);
      const diff = Math.min(diffDirect, diffDouble, diffHalf);
      bpmScore = Math.max(0, 1 - diff / toleranceBpm);
      if (bpmScore < 0.3) warnings.push('bpm-outside-range');
    }
  }

  // Key: prefer keyRange (checkboxes) when present; otherwise use targetKey / keyRangeCamelot
  if (section.keyRange != null && section.keyRange.length > 0) {
    const songKeyNorm = songKey.trim().toLowerCase().replace(/\s+/g, '');
    const match = section.keyRange.some((allowed) => {
      const a = allowed.trim().toLowerCase().replace(/\s+/g, '');
      return songKeyNorm === a || songKeyNorm.startsWith(a) || a.startsWith(songKeyNorm);
    });
    if (match) {
      keyScore = 1.0;
    } else {
      keyScore = 0.2;
      warnings.push('key-outside-range');
    }
  } else if (section.targetKey) {
    if (!songKey) {
      keyScore = 0.5;
    } else {
      const steps = getCamelotDistance(songKey, section.targetKey);
      keyScore = steps === 0 ? 1 : steps === 1 ? 0.8 : steps === 2 ? 0.6 : 0.2;
      if (keyScore <= 0.2) warnings.push('key-outside-range');
    }
  } else if (section.keyRangeCamelot != null && section.targetKey) {
    const steps = getCamelotDistance(songKey, section.targetKey);
    if (steps > section.keyRangeCamelot) {
      keyScore = 0.2;
      warnings.push('key-outside-range');
    }
  }

  const score = (bpmScore + keyScore) / 2;
  const { label, color } = getLabelAndColor(score);

  return {
    score,
    bpmScore,
    keyScore,
    label,
    color,
    warnings,
    percentage: Math.round(score * 100),
  };
}

/**
 * Returns true if the song passes the section's key range and BPM range (filtering only).
 * Used to exclude songs that are outside the section's allowed ranges before ordering by target similarity.
 */
export function songPassesSectionConstraints(song: Song, section: SectionConstraints): boolean {
  const songBpm = song.primaryBpm ?? song.bpms?.[0];
  const songKey = song.primaryKey ?? song.keys?.[0] ?? '';

  if (
    section.bpmRangeMin != null &&
    section.bpmRangeMax != null &&
    typeof section.bpmRangeMin === 'number' &&
    typeof section.bpmRangeMax === 'number'
  ) {
    if (typeof songBpm !== 'number') return false;
    if (!songBpmMatchesRange(songBpm, section.bpmRangeMin, section.bpmRangeMax)) return false;
  } else if (section.targetBpm != null && typeof section.targetBpm === 'number') {
    if (typeof songBpm !== 'number') return true;
    const toleranceBpm = 10;
    const diffDirect = Math.abs(songBpm - section.targetBpm);
    const diffDouble = Math.abs(songBpm * 2 - section.targetBpm);
    const diffHalf = Math.abs(songBpm / 2 - section.targetBpm);
    const diff = Math.min(diffDirect, diffDouble, diffHalf);
    if (diff > toleranceBpm) return false;
  }

  if (section.keyRange != null && section.keyRange.length > 0) {
    const songKeyNorm = songKey.trim().toLowerCase().replace(/\s+/g, '');
    const match = section.keyRange.some((allowed) => {
      const a = allowed.trim().toLowerCase().replace(/\s+/g, '');
      return songKeyNorm === a || songKeyNorm.startsWith(a) || a.startsWith(songKeyNorm);
    });
    if (!match) return false;
  } else if (section.targetKey && section.keyRangeCamelot != null) {
    const steps = getCamelotDistance(songKey, section.targetKey);
    if (steps > section.keyRangeCamelot) return false;
  }

  return true;
}

/**
 * Crisp similarity percentage (0-100) for ordering only. Uses section target Key and target BPM
 * (not key range or BPM range). BPM considers song BPM, 2x, and 1/2 for best match.
 * Use after filtering by ranges so the list is ordered by "most similar to target" first.
 */
export function computeTargetSimilarity(
  song: Song,
  targetKey: string | undefined,
  targetBpm: number | undefined,
  toleranceBpm = 10
): number {
  const songBpm = song.primaryBpm ?? song.bpms?.[0];
  const songKey = song.primaryKey ?? song.keys?.[0] ?? '';

  let bpmScore = 0.5;
  if (targetBpm != null && typeof targetBpm === 'number' && typeof songBpm === 'number') {
    const diffDirect = Math.abs(songBpm - targetBpm);
    const diffDouble = Math.abs(songBpm * 2 - targetBpm);
    const diffHalf = Math.abs(songBpm / 2 - targetBpm);
    const diff = Math.min(diffDirect, diffDouble, diffHalf);
    bpmScore = Math.max(0, 1 - diff / toleranceBpm);
  }

  let keyScore = 0.5;
  if (targetKey && songKey) {
    keyScore = getCamelotScore(songKey, targetKey);
  }

  const score = (bpmScore + keyScore) / 2;
  return Math.round(score * 100);
}
