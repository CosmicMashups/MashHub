import { filterSongsByProjectSongTypes } from '../constants/songOriginTypes';
import { getSuggestions, getSongsForYearSeason } from '../services/smartSectionBuilder';
import { scoreQuickMatchPairSync } from '../services/matchingService';
import type { KeyString, Song, SongSection } from '../types';
import type { ProjectWithSections } from '../types';
import type { MegamixConfig } from './megamixScoring';
import {
  megamixConfigHasConstraints,
  resolveCandidateSections,
  scoreSongAgainstMegamixConfig,
  songMatchesMegamixFilters,
} from './megamixScoring';

const SUGGESTION_PANE_LIMIT = 10000;
const MEGAMIX_PANE_LIMIT = 10000;

export type SuggestionPaneSong = Song & {
  primaryBpm?: number;
  primaryKey?: KeyString;
  alreadyInProject: boolean;
  isInstrumentalInProject: boolean;
  notesText: string;
  compatibilityScore?: number;
  displayReasons?: string[];
};

export interface ResolveSuggestionPaneSongsParams {
  project: ProjectWithSections | null;
  targetSectionId: string | null;
  allSongs: Song[];
  megamixConfig?: MegamixConfig;
  instrumentalSong?: Song;
  instrumentalSections?: SongSection[];
  includeAlreadyInProject: boolean;
}

function getInProjectIds(project: ProjectWithSections | null): Set<string> {
  if (!project) return new Set();
  return new Set(project.sections.flatMap((s) => s.songs.map((song) => song.id)));
}

function isInstrumentalInProject(project: ProjectWithSections, songId: string): boolean {
  return project.sections.some((s) =>
    s.songs.some((entry) => entry.id === songId && entry.performanceRole === 'instrumental')
  );
}

function enrichSong(
  song: Song,
  project: ProjectWithSections | null,
  meta?: { compatibilityScore?: number; displayReasons?: string[] }
): SuggestionPaneSong {
  const alreadyInProject = project
    ? project.sections.some((s) => s.songs.some((e) => e.id === song.id))
    : false;
  const notesRaw = (song.notes ?? '').trim();
  return {
    ...song,
    primaryBpm: song.primaryBpm ?? song.bpms?.[0],
    primaryKey: song.primaryKey ?? song.keys?.[0],
    alreadyInProject,
    isInstrumentalInProject: project ? isInstrumentalInProject(project, song.id) : false,
    notesText: notesRaw,
    compatibilityScore: meta?.compatibilityScore,
    displayReasons: meta?.displayReasons,
  };
}

function mergeInProjectSongs(
  project: ProjectWithSections,
  allSongs: Song[],
  existing: SuggestionPaneSong[]
): SuggestionPaneSong[] {
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const section of project.sections) {
    for (const entry of section.songs) {
      if (byId.has(entry.id)) continue;
      const lib = allSongs.find((s) => s.id === entry.id) ?? entry;
      byId.set(entry.id, enrichSong(lib));
    }
  }
  return Array.from(byId.values());
}

export function resolveSuggestionPaneSongs(params: ResolveSuggestionPaneSongsParams): SuggestionPaneSong[] {
  const {
    project,
    targetSectionId,
    allSongs,
    megamixConfig,
    instrumentalSong,
    instrumentalSections,
    includeAlreadyInProject,
  } = params;

  if (!project || !targetSectionId) return [];

  const typeFilteredSongs = filterSongsByProjectSongTypes(allSongs, project.allowedSongTypes);
  const projectType = project.type ?? 'other';
  const useYearSeasonList = projectType === 'seasonal' || projectType === 'year-end';
  const inProjectIds = getInProjectIds(project);

  const megamixSuggestionMode =
    projectType === 'song-megamix' && megamixConfig != null && megamixConfigHasConstraints(megamixConfig);

  if (useYearSeasonList) {
    let list = getSongsForYearSeason(project, typeFilteredSongs);
    if (!includeAlreadyInProject) {
      list = list.filter((s) => !inProjectIds.has(s.id));
    }
    return list.map((song) => enrichSong(song, project));
  }

  if (megamixSuggestionMode && megamixConfig) {
    const inst = instrumentalSong;
    const instSections = instrumentalSections ?? [];
    const rows: { song: Song; compatibilityScore: number; displayReasons: string[] }[] = [];

    for (const song of typeFilteredSongs) {
      if (!includeAlreadyInProject && inProjectIds.has(song.id)) continue;
      if (inst && song.type !== inst.type) continue;

      const lib = typeFilteredSongs.find((x) => x.id === song.id) ?? song;
      const sections = lib.sections ?? [];

      if (!songMatchesMegamixFilters(lib, sections, megamixConfig)) continue;

      const resolved = resolveCandidateSections(lib, sections);

      if (inst && instSections.length > 0) {
        const { matchScore, reasons } = scoreQuickMatchPairSync(inst, instSections, lib, resolved);
        rows.push({ song, compatibilityScore: matchScore, displayReasons: reasons });
      } else {
        const r = scoreSongAgainstMegamixConfig(
          lib,
          sections,
          megamixConfig,
          inst,
          instSections.length > 0 ? instSections : undefined
        );
        rows.push({ song, compatibilityScore: r.score, displayReasons: r.reasons });
      }
    }

    rows.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    const limited = rows.slice(0, MEGAMIX_PANE_LIMIT);
    let result = limited.map(({ song, compatibilityScore, displayReasons }) =>
      enrichSong(song, project, { compatibilityScore, displayReasons })
    );
    if (includeAlreadyInProject) {
      result = mergeInProjectSongs(project, allSongs, result);
    }
    return result;
  }

  const raw = getSuggestions(project, targetSectionId, typeFilteredSongs, projectType, SUGGESTION_PANE_LIMIT);
  let filtered = includeAlreadyInProject
    ? raw
    : raw.filter(({ song }) => !inProjectIds.has(song.id));

  let result = filtered.map(({ song, compatibilityScore, reasons }) =>
    enrichSong(song, project, { compatibilityScore, displayReasons: reasons })
  );

  if (includeAlreadyInProject) {
    result = mergeInProjectSongs(project, allSongs, result);
  }

  return result;
}
