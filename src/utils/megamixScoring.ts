import type { Song, SongSection } from '../types';
import {
  BPM_SCORE_DENOMINATOR,
  MATCH_WEIGHT_BPM,
  MATCH_WEIGHT_KEY,
  MEGAMIX_KEY_SOFT_PENALTY_MULTIPLIER,
  MEGAMIX_KEY_SOFT_PENALTY_THRESHOLD,
} from '../constants';
import { calculateKeyDistance } from './keyNormalization';
import { scoreQuickMatchPairSync } from '../services/matchingService';

export interface MegamixConfig {
  mainInstrumentalSongId?: string;
  mainInstrumentalSongName?: string;
  acceptedKeys?: string[];
  bpmRangeMin?: number;
  bpmRangeMax?: number;
}

export interface MegamixCompatibilityResult {
  score: number;
  bpmScore: number;
  keyScore: number;
  reasons: string[];
}

function effectiveAcceptedKeys(config: MegamixConfig): string[] | undefined {
  const k = config.acceptedKeys;
  if (!k || k.length === 0) return undefined;
  return k;
}

export function megamixConfigHasConstraints(config: MegamixConfig): boolean {
  return (
    config.mainInstrumentalSongId != null ||
    (config.mainInstrumentalSongName != null && config.mainInstrumentalSongName.trim() !== '') ||
    effectiveAcceptedKeys(config) != null ||
    config.bpmRangeMin != null ||
    config.bpmRangeMax != null
  );
}

/** Single-section fallback for BPM/key when the library song has no `sections` loaded. */
export function resolveCandidateSections(candidate: Song, candidateSections: SongSection[]): SongSection[] {
  if (candidateSections.length > 0) return candidateSections;
  const bpm = candidate.primaryBpm ?? candidate.bpms?.[0];
  const keyStr = candidate.primaryKey ?? candidate.keys?.[0];
  const keyTrim = keyStr != null && String(keyStr).trim() !== '' ? String(keyStr).trim() : '';
  if (bpm == null && keyTrim === '') {
    return [];
  }
  return [
    {
      sectionId: `megamix-synth-${candidate.id}`,
      songId: candidate.id,
      part: 'Main',
      bpm: bpm ?? 0,
      key: keyTrim,
      sectionOrder: 1,
    },
  ];
}

function collectCandidateSectionKeys(sections: SongSection[], candidate: Song): string[] {
  const fromSections = sections
    .map((s) => s.key?.trim())
    .filter((k): k is string => Boolean(k && k.length > 0));
  if (fromSections.length > 0) return fromSections;
  const pk = candidate.primaryKey ?? candidate.keys?.[0];
  if (pk && pk.trim()) return [pk.trim()];
  return [];
}

function collectCandidateBpms(sections: SongSection[], candidate: Song): number[] {
  const fromSections = sections.map((s) => s.bpm).filter((b) => typeof b === 'number' && !Number.isNaN(b));
  if (fromSections.length > 0) return fromSections;
  const pb = candidate.primaryBpm ?? candidate.bpms?.[0];
  if (pb != null && !Number.isNaN(pb)) return [pb];
  return [];
}

/** When accepted keys or BPM range are configured, candidate must satisfy them exactly (keys: same normalized pitch class as one accepted chip; BPM: at least one reading inside range). */
export function songMatchesMegamixFilters(
  candidate: Song,
  candidateSections: SongSection[],
  config: MegamixConfig
): boolean {
  const resolved = resolveCandidateSections(candidate, candidateSections);
  const accepted = effectiveAcceptedKeys(config);
  const hasBpmGate = config.bpmRangeMin != null || config.bpmRangeMax != null;

  if (accepted) {
    const keys = collectCandidateSectionKeys(resolved, candidate);
    if (keys.length === 0) return false;
    const best = maxKeySimilarityToAccepted(keys, accepted);
    if (best < 1 - 1e-9) return false;
  }

  if (hasBpmGate) {
    const bpms = collectCandidateBpms(resolved, candidate);
    if (bpms.length === 0) return false;
    if (
      !bpms.some((bpm) =>
        bpmWithinProjectRange(bpm, config.bpmRangeMin, config.bpmRangeMax).inside
      )
    ) {
      return false;
    }
  }

  return true;
}

function maxKeySimilarityToAccepted(candidateKeys: string[], accepted: string[]): number {
  let best = 0;
  for (const ck of candidateKeys) {
    for (const ak of accepted) {
      best = Math.max(best, calculateKeyDistance(ck, ak));
    }
  }
  return best;
}

function bpmWithinProjectRange(
  bpm: number,
  min?: number,
  max?: number
): { inside: boolean; delta: number } {
  if (min != null && max != null) {
    if (bpm >= min && bpm <= max) return { inside: true, delta: 0 };
    const delta = bpm < min ? min - bpm : bpm - max;
    return { inside: false, delta };
  }
  if (min != null && bpm < min) return { inside: false, delta: min - bpm };
  if (max != null && bpm > max) return { inside: false, delta: bpm - max };
  return { inside: true, delta: 0 };
}

function bpmRangePenaltyMultiplierForCandidate(candidate: Song, sections: SongSection[], config: MegamixConfig): number {
  const min = config.bpmRangeMin;
  const max = config.bpmRangeMax;
  if (min == null && max == null) return 1;

  const bpms = collectCandidateBpms(sections, candidate);
  if (bpms.length === 0) return 1;

  let worstMultiplier = 1;
  for (const bpm of bpms) {
    const { inside, delta } = bpmWithinProjectRange(bpm, min, max);
    if (!inside && delta > 0) {
      const m = Math.max(0, 1 - delta / BPM_SCORE_DENOMINATOR);
      worstMultiplier = Math.min(worstMultiplier, m);
    }
  }
  return worstMultiplier;
}

function pathBBpmScore(candidate: Song, sections: SongSection[], config: MegamixConfig): number {
  const min = config.bpmRangeMin;
  const max = config.bpmRangeMax;
  if (min == null && max == null) return 1;

  const bpms = collectCandidateBpms(sections, candidate);
  if (bpms.length === 0) return 1;

  let best = 0;
  for (const bpm of bpms) {
    let dist = 0;
    if (min != null && max != null) {
      dist = bpm < min ? min - bpm : bpm > max ? bpm - max : 0;
    } else if (min != null && bpm < min) {
      dist = min - bpm;
    } else if (max != null && bpm > max) {
      dist = bpm - max;
    }
    const s = dist <= 0 ? 1 : Math.max(0, 1 - dist / BPM_SCORE_DENOMINATOR);
    best = Math.max(best, s);
  }
  return best;
}

function pathBKeyScore(candidate: Song, sections: SongSection[], accepted: string[] | undefined): number {
  if (!accepted) return 1;
  const keys = collectCandidateSectionKeys(sections, candidate);
  if (keys.length === 0) return 0;
  return maxKeySimilarityToAccepted(keys, accepted);
}

/**
 * Scores a candidate song against optional song-megamix project configuration.
 * Paths: A = instrumental in DB with sections; B = constraints without usable instrumental DB match; C = no config.
 */
export function scoreSongAgainstMegamixConfig(
  candidate: Song,
  candidateSections: SongSection[],
  config: MegamixConfig,
  instrumentalSong?: Song,
  instrumentalSections?: SongSection[]
): MegamixCompatibilityResult {
  if (!megamixConfigHasConstraints(config)) {
    return { score: 1, bpmScore: 1, keyScore: 1, reasons: [] };
  }

  const accepted = effectiveAcceptedKeys(config);
  const hasBpmRange = config.bpmRangeMin != null || config.bpmRangeMax != null;
  const hasOnlyStaleInstrumentalId =
    Boolean(config.mainInstrumentalSongId) &&
    instrumentalSong == null &&
    accepted == null &&
    !hasBpmRange &&
    !config.mainInstrumentalSongName?.trim();
  if (hasOnlyStaleInstrumentalId) {
    return {
      score: 1,
      bpmScore: 1,
      keyScore: 1,
      reasons: ['Referenced instrumental not found in library — score neutral'],
    };
  }

  const resolvedCandidate = resolveCandidateSections(candidate, candidateSections);

  const pathA =
    instrumentalSong != null &&
    instrumentalSections != null &&
    instrumentalSections.length > 0;

  if (pathA) {
    const quick = scoreQuickMatchPairSync(
      instrumentalSong,
      instrumentalSections,
      candidate,
      resolvedCandidate
    );
    let score = Math.max(0, Math.min(1, quick.matchScore));
    let bpmScore = quick.bpmScore;
    let keyScore = quick.keyScore;
    const reasons = [...quick.reasons];

    if (accepted) {
      const candKeys = collectCandidateSectionKeys(resolvedCandidate, candidate);
      const maxSim = candKeys.length > 0 ? maxKeySimilarityToAccepted(candKeys, accepted) : 0;
      if (maxSim < MEGAMIX_KEY_SOFT_PENALTY_THRESHOLD) {
        score *= MEGAMIX_KEY_SOFT_PENALTY_MULTIPLIER;
        reasons.push(
          `Key gate: best match to accepted keys (${Math.round(maxSim * 100)}%) is below ${Math.round(MEGAMIX_KEY_SOFT_PENALTY_THRESHOLD * 100)}% — soft penalty applied`
        );
      } else if (candKeys.length > 0) {
        reasons.push(
          `Key: best similarity to accepted keys ${Math.round(maxSim * 100)}%`
        );
      }
    }

    const bpmMult = bpmRangePenaltyMultiplierForCandidate(candidate, resolvedCandidate, config);
    if (bpmMult < 1) {
      score *= bpmMult;
      const min = config.bpmRangeMin;
      const max = config.bpmRangeMax;
      const label =
        min != null && max != null ? `${min}–${max}` : min != null ? `≥ ${min}` : max != null ? `≤ ${max}` : '';
      reasons.push(`BPM range penalty (outside megamix range ${label}): multiplier ${Math.round(bpmMult * 100)}%`);
    } else if (config.bpmRangeMin != null || config.bpmRangeMax != null) {
      const pb = candidate.primaryBpm ?? candidate.bpms?.[0];
      const min = config.bpmRangeMin;
      const max = config.bpmRangeMax;
      if (pb != null) {
        const { inside } = bpmWithinProjectRange(pb, min, max);
        if (inside) {
          reasons.push(
            `BPM: ${pb} within megamix range${min != null && max != null ? ` ${min}–${max}` : ''}`
          );
        }
      }
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      bpmScore: Math.max(0, Math.min(1, bpmScore)),
      keyScore: Math.max(0, Math.min(1, keyScore)),
      reasons,
    };
  }

  if (accepted == null && !hasBpmRange) {
    return { score: 1, bpmScore: 1, keyScore: 1, reasons: ['No instrumental configured — score neutral'] };
  }

  const bpmScore = pathBBpmScore(candidate, resolvedCandidate, config);
  const keyScore = pathBKeyScore(candidate, resolvedCandidate, accepted);
  const score = keyScore * MATCH_WEIGHT_KEY + bpmScore * MATCH_WEIGHT_BPM;
  const reasons: string[] = [];

  if (config.bpmRangeMin != null || config.bpmRangeMax != null) {
    reasons.push(`BPM compatibility (megamix range): ${Math.round(bpmScore * 100)}%`);
  }
  if (accepted) {
    reasons.push(
      keyScore >= 0.99
        ? `Key: matches accepted key set (${Math.round(keyScore * 100)}%)`
        : `Key: partial compatibility to accepted keys (${Math.round(keyScore * 100)}%)`
    );
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    bpmScore: Math.max(0, Math.min(1, bpmScore)),
    keyScore: Math.max(0, Math.min(1, keyScore)),
    reasons,
  };
}
