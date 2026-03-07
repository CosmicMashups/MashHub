import type { Song } from '../types';
import type { ProjectType } from '../types';
import { calculateCompatibilityScore, calculateSectionCompatibility, songPassesSectionConstraints, computeTargetSimilarity } from '../utils/compatibilityScore';

export interface SuggestionResult {
  song: Song;
  compatibilityScore: number;
  reasons: string[];
}

/** Section with optional compatibility constraints. */
export interface SectionForSuggestions {
  id: string;
  name: string;
  songs: Song[];
  targetBpm?: number;
  bpmRangeMin?: number;
  bpmRangeMax?: number;
  targetKey?: string;
  keyRangeCamelot?: number;
  keyRange?: string[];
}

/** Project with sections (and optional section constraints). Used for suggestions. */
export interface ProjectWithSectionsForSuggestions {
  id: string;
  type?: import('../types').ProjectType;
  /** Project year filter (Year-End / Seasonal). */
  year?: number;
  /** Project season filter (Seasonal). */
  season?: string;
  sections: SectionForSuggestions[];
}

/** Compatibility score uses only BPM + key (no vocal, year, type, text). Per-project-type prioritization applied after. */
export function getSuggestions(
  project: ProjectWithSectionsForSuggestions | null,
  targetSectionId: string | null,
  allSongs: Song[],
  projectType: ProjectType,
  limit = 20
): SuggestionResult[] {
  if (!project || !targetSectionId) return [];
  const targetSection = project.sections.find((s) => s.id === targetSectionId);
  if (!targetSection) return [];
  const targetSongs = targetSection.songs;
  const targetSongIds = new Set(targetSongs.map((s) => s.id));
  const inProjectSongIds = new Set(project.sections.flatMap((s) => s.songs.map((song) => song.id)));
  let candidates = allSongs.filter((s) => !targetSongIds.has(s.id));

  const projectYear = project.year;
  const projectSeason = project.season;

  if (projectType === 'year-end' && projectYear != null) {
    candidates = candidates.filter((s) => s.year != null && s.year === projectYear);
  } else if (projectType === 'seasonal') {
    if (projectSeason != null && projectSeason.trim() !== '') {
      const seasonLower = projectSeason.trim().toLowerCase();
      candidates = candidates.filter((s) => s.season != null && s.season.trim().toLowerCase() === seasonLower);
    }
    if (projectYear != null) {
      candidates = candidates.filter((s) => s.year != null && s.year === projectYear);
    }
  }
  const referenceSong = targetSongs.length > 0 ? targetSongs[targetSongs.length - 1] : null;

  const hasSectionConstraints =
    targetSection.targetBpm != null ||
    (targetSection.bpmRangeMin != null && targetSection.bpmRangeMax != null) ||
    targetSection.targetKey != null ||
    (targetSection.keyRange != null && targetSection.keyRange.length > 0);

  if (hasSectionConstraints) {
    candidates = candidates.filter((song) => songPassesSectionConstraints(song, targetSection));
  }

  const scored: SuggestionResult[] = candidates.map((song) => {
    let result;
    let orderScore: number;
    if (hasSectionConstraints) {
      result = calculateSectionCompatibility(song, targetSection);
      orderScore = computeTargetSimilarity(song, targetSection.targetKey, targetSection.targetBpm) / 100;
    } else if (referenceSong) {
      result = calculateCompatibilityScore(referenceSong, song);
      orderScore = result.score;
    } else {
      result = { score: 0.5, bpmScore: 0.5, keyScore: 0.5, label: 'Medium' as const, color: 'yellow' as const, warnings: [], percentage: 50 };
      orderScore = 0.5;
    }
    const reasons: string[] = [];
    if (result.bpmScore >= 0.7) reasons.push('BPM match');
    if (result.keyScore >= 0.7) reasons.push('Key match');

    let score = orderScore;
    if (projectType === 'song-megamix') {
      if (!inProjectSongIds.has(song.id)) reasons.push('Not yet in project');
      score += inProjectSongIds.has(song.id) ? 0 : 0.2;
    } else if (projectType === 'seasonal') {
      if (projectSeason != null && projectSeason.trim() !== '' && song.season && song.season.trim().toLowerCase() === projectSeason.trim().toLowerCase()) {
        reasons.push('Same season');
        score += 0.2;
      }
      if (projectYear != null && song.year != null && song.year === projectYear) {
        reasons.push('Same year');
        score += 0.15;
      }
      if (referenceSong && song.origin && referenceSong.origin && song.origin === referenceSong.origin) {
        reasons.push('Same origin');
        score += 0.1;
      }
    } else if (projectType === 'year-end') {
      if (projectYear != null && song.year != null && song.year === projectYear) {
        reasons.push('Same year');
        score += 0.25;
      } else if (referenceSong && song.year != null && referenceSong.year != null && song.year === referenceSong.year) {
        reasons.push('Same year');
        score += 0.2;
      }
    }

    return {
      song,
      compatibilityScore: hasSectionConstraints ? orderScore : Math.min(1, score),
      reasons: reasons.length ? reasons : [result.label],
    };
  });

  if (projectType === 'song-megamix') {
    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  } else if (projectType === 'seasonal' || projectType === 'year-end') {
    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  } else {
    scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  return scored.slice(0, limit);
}

/**
 * Returns all songs that fall within the project's year/season for monitoring.
 * Seasonal: same season and same year. Year-End: same year only.
 * Used by Suggest Songs to show what's available and what's not yet added.
 */
export function getSongsForYearSeason(
  project: ProjectWithSectionsForSuggestions | null,
  allSongs: Song[]
): Song[] {
  if (!project) return [];
  const projectYear = project.year;
  const projectSeason = project.season;
  const type = project.type ?? 'other';

  if (type === 'year-end' && projectYear != null) {
    return allSongs.filter((s) => s.year != null && s.year === projectYear);
  }
  if (type === 'seasonal') {
    let list = allSongs;
    if (projectSeason != null && projectSeason.trim() !== '') {
      const seasonLower = projectSeason.trim().toLowerCase();
      list = list.filter((s) => s.season != null && s.season.trim().toLowerCase() === seasonLower);
    }
    if (projectYear != null) {
      list = list.filter((s) => s.year != null && s.year === projectYear);
    }
    return list;
  }
  return [];
}

export const smartSectionBuilder = { getSuggestions, getSongsForYearSeason };
