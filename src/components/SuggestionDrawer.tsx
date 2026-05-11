import { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripVertical } from 'lucide-react';
import { getSuggestions, getSongsForYearSeason } from '../services/smartSectionBuilder';
import { scoreQuickMatchPairSync } from '../services/matchingService';
import type { Song, SongSection } from '../types';
import type { ProjectWithSections } from '../types';
import { getKeyGradientStyle } from '../utils/keyColors';
import { useDarkMode } from '../hooks/useTheme';
import type { MegamixConfig } from '../utils/megamixScoring';
import {
  megamixConfigHasConstraints,
  resolveCandidateSections,
  scoreSongAgainstMegamixConfig,
  songMatchesMegamixFilters,
} from '../utils/megamixScoring';

const SUGGESTION_DRAG_PREFIX = 'suggestion-';
const MEGAMIX_SUGGESTION_LIMIT = 20;

function DraggableSuggestionCard({
  song,
  alreadyAdded,
  project,
  targetSectionId,
  onAddSong,
  subtitle,
  rightLabel,
}: {
  song: Song;
  alreadyAdded: boolean;
  project: ProjectWithSections | null;
  targetSectionId: string | null;
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
  subtitle: string;
  rightLabel?: React.ReactNode;
}) {
  const id = `${SUGGESTION_DRAG_PREFIX}${song.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { song },
    disabled: alreadyAdded,
  });
  const bpm = song.primaryBpm ?? song.bpms?.[0];
  const key = song.primaryKey ?? song.keys?.[0];
  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex gap-2 ${isDragging ? 'opacity-50' : ''}`}
      style={getKeyGradientStyle(key, useDarkMode())}
    >
      {!alreadyAdded && (
        <div
          className="flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to section"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{song.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist || 'Unknown Artist'}</p>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          BPM: {bpm != null ? bpm : '—'} | Key: {key ?? '—'}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
          {rightLabel}
          <button
            type="button"
            disabled={alreadyAdded}
            onClick={(e) => {
              e.stopPropagation();
              if (project && targetSectionId && !alreadyAdded) onAddSong(project.id, song.id, targetSectionId);
            }}
            className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {alreadyAdded ? 'Already Added' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface SuggestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetSectionId: string | null;
  project: ProjectWithSections | null;
  allSongs: Song[];
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
  megamixConfig?: MegamixConfig;
  instrumentalSong?: Song;
  instrumentalSections?: SongSection[];
}

export function SuggestionDrawer({
  isOpen,
  onClose,
  targetSectionId,
  project,
  allSongs,
  onAddSong,
  megamixConfig,
  instrumentalSong,
  instrumentalSections,
}: SuggestionDrawerProps) {
  const projectType = project?.type ?? 'other';
  const useYearSeasonList = projectType === 'seasonal' || projectType === 'year-end';

  const megamixSuggestionMode =
    projectType === 'song-megamix' && megamixConfig != null && megamixConfigHasConstraints(megamixConfig);

  const megamixHasKeyOrBpmFilter = Boolean(
    megamixConfig &&
      ((megamixConfig.acceptedKeys?.length ?? 0) > 0 ||
        megamixConfig.bpmRangeMin != null ||
        megamixConfig.bpmRangeMax != null)
  );

  const inProjectIds = useMemo(() => {
    if (!project) return new Set<string>();
    return new Set(project.sections.flatMap((s) => s.songs.map((song) => song.id)));
  }, [project]);

  const yearSeasonSongsAll = useMemo(() => {
    if (!project || !useYearSeasonList) return [];
    return getSongsForYearSeason(project, allSongs);
  }, [project, allSongs, useYearSeasonList]);

  const yearSeasonSongs = useMemo(() => {
    return yearSeasonSongsAll.filter((song) => !inProjectIds.has(song.id));
  }, [yearSeasonSongsAll, inProjectIds]);

  const baseSuggestions = useMemo(() => {
    if (!project || !targetSectionId || useYearSeasonList) return [];
    const raw = getSuggestions(project, targetSectionId, allSongs, projectType, MEGAMIX_SUGGESTION_LIMIT);
    return raw.filter(({ song }) => !inProjectIds.has(song.id));
  }, [project, targetSectionId, allSongs, projectType, useYearSeasonList, inProjectIds]);

  const megamixSuggestions = useMemo(() => {
    if (!megamixSuggestionMode || !project || !megamixConfig) return [];

    const inst = instrumentalSong;
    const instSections = instrumentalSections ?? [];

    const rows: { song: Song; compatibilityScore: number; displayReasons: string[] }[] = [];

    for (const song of allSongs) {
      if (inProjectIds.has(song.id)) continue;
      if (inst && song.type !== inst.type) continue;

      const lib = allSongs.find((x) => x.id === song.id) ?? song;
      const sections = lib.sections ?? [];

      if (!songMatchesMegamixFilters(lib, sections, megamixConfig)) continue;

      const resolved = resolveCandidateSections(lib, sections);

      if (inst && instSections.length > 0) {
        const { matchScore, reasons } = scoreQuickMatchPairSync(
          inst,
          instSections,
          lib,
          resolved
        );
        rows.push({
          song,
          compatibilityScore: matchScore,
          displayReasons: reasons,
        });
      } else {
        const r = scoreSongAgainstMegamixConfig(
          lib,
          sections,
          megamixConfig,
          inst,
          instSections.length > 0 ? instSections : undefined
        );
        rows.push({
          song,
          compatibilityScore: r.score,
          displayReasons: r.reasons,
        });
      }
    }

    rows.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    return rows.slice(0, MEGAMIX_SUGGESTION_LIMIT);
  }, [
    megamixSuggestionMode,
    project,
    megamixConfig,
    allSongs,
    inProjectIds,
    instrumentalSong,
    instrumentalSections,
  ]);

  const suggestions = useMemo(() => {
    if (megamixSuggestionMode) {
      return megamixSuggestions;
    }
    return baseSuggestions.map((s) => ({
      song: s.song,
      compatibilityScore: s.compatibilityScore,
      displayReasons: s.reasons,
    }));
  }, [megamixSuggestionMode, megamixSuggestions, baseSuggestions]);

  if (!isOpen) return null;

  const megamixEmptyFiltered =
    megamixSuggestionMode &&
    megamixHasKeyOrBpmFilter &&
    suggestions.length === 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:bg-transparent"
        onClick={onClose}
        aria-hidden
      />
      <AnimatePresence>
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.2 }}
          className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Suggest Songs</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {useYearSeasonList ? (
              targetSectionId ? (
                yearSeasonSongs.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {yearSeasonSongsAll.length === 0
                      ? `No songs in ${projectType === 'seasonal' ? 'this season/year' : 'this year'}. Set Year${projectType === 'seasonal' ? ' and Season' : ''} in Settings.`
                      : 'All songs in this season/year are already in the project.'}
                  </p>
                ) : (
                  yearSeasonSongs.map((song) => (
                    <DraggableSuggestionCard
                      key={song.id}
                      song={song}
                      alreadyAdded={false}
                      project={project}
                      targetSectionId={targetSectionId}
                      onAddSong={onAddSong}
                      subtitle={projectType === 'seasonal' ? `${project?.season ?? ''} ${project?.year ?? ''}`.trim() : String(project?.year ?? '')}
                    />
                  ))
                )
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Select a section to add songs.</p>
              )
            ) : targetSectionId ? (
              suggestions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {megamixEmptyFiltered
                    ? 'No songs match your accepted keys and BPM range. Adjust them in project settings.'
                    : 'No suggestions. Add songs to your library.'}
                </p>
              ) : (
                suggestions.map(({ song, compatibilityScore, displayReasons }) => (
                  <DraggableSuggestionCard
                    key={song.id}
                    song={song}
                    alreadyAdded={false}
                    project={project}
                    targetSectionId={targetSectionId}
                    onAddSong={onAddSong}
                    subtitle={displayReasons.join(' · ')}
                    rightLabel={
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                        {Math.min(100, Math.round(compatibilityScore * 100))}%
                      </span>
                    }
                  />
                ))
              )
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Select a section to see suggestions.</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
