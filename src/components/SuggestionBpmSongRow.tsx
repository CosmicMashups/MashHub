import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Plus } from 'lucide-react';
import type { ProjectWithSections } from '../types';
import { getKeyGradientStyle } from '../utils/keyColors';
import { useDarkMode } from '../hooks/useTheme';
import type { SuggestionPaneSong } from '../utils/suggestionPaneSongs';

export const SUGGESTION_DRAG_PREFIX = 'suggestion-';

export interface SuggestionBpmSongRowProps {
  song: SuggestionPaneSong;
  project: ProjectWithSections | null;
  targetSectionId: string | null;
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
}

export function SuggestionBpmSongRow({
  song,
  project,
  targetSectionId,
  onAddSong,
}: SuggestionBpmSongRowProps) {
  const isDark = useDarkMode();
  const bpm = song.primaryBpm ?? song.bpms?.[0];
  const primaryKey = song.primaryKey ?? song.keys?.[0];
  const gradientStyle = getKeyGradientStyle(primaryKey, isDark);
  const hasGradient = gradientStyle != null && Object.keys(gradientStyle).length > 0;
  const readabilityClass = hasGradient
    ? isDark
      ? 'song-card-readability-dark'
      : 'song-card-readability-light'
    : '';

  const canDrag = Boolean(targetSectionId && !song.alreadyInProject);
  const dragId = `${SUGGESTION_DRAG_PREFIX}${song.id}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: { song },
    disabled: !canDrag,
  });

  const tooltipTitle = song.displayReasons?.length
    ? `${song.title}${song.artist ? ` — ${song.artist}` : ''}\n${song.displayReasons.join(' · ')}`
    : `${song.title}${song.artist ? ` — ${song.artist}` : ''}`;

  return (
    <div
      ref={canDrag ? setNodeRef : undefined}
      role="row"
      className={`group grid grid-cols-[48px_1fr_auto] items-center gap-1 px-2 py-1 min-h-[32px] transition-colors duration-100 hover:bg-theme-surface-hover ${
        isDragging ? 'opacity-40 scale-95 z-10' : ''
      }`}
    >
      <div className="flex items-center justify-end gap-0.5 w-12 tabular-nums text-sm">
        {canDrag && (
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 p-0.5 text-theme-text-muted hover:text-theme-text-secondary touch-none cursor-grab active:cursor-grabbing"
            aria-label={`Drag ${song.title} to section`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={12} />
          </button>
        )}
        <span
          className={
            song.isInstrumentalInProject
              ? 'text-amber-500 dark:text-amber-400 font-medium'
              : bpm != null
                ? 'text-theme-text-secondary'
                : 'text-theme-text-muted'
          }
        >
          {bpm ?? '—'}
        </span>
      </div>

      <div
        className={`min-w-0 overflow-hidden rounded-[3px] px-2 py-1 ${readabilityClass}`}
        style={gradientStyle}
      >
        <p
          className="text-xs font-medium truncate text-theme-text-primary"
          title={tooltipTitle}
        >
          {song.title}
          {song.alreadyInProject && (
            <span className="ml-1 text-[10px] text-emerald-500">[IN PROJECT]</span>
          )}
        </p>
      </div>

      <div className="flex items-center justify-end">
        {targetSectionId && project && (
          <button
            type="button"
            disabled={song.alreadyInProject}
            onClick={() => {
              if (!song.alreadyInProject) {
                onAddSong(project.id, song.id, targetSectionId);
              }
            }}
            className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-theme-border-default text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-state-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {song.alreadyInProject ? (
              'In project'
            ) : (
              <span className="inline-flex items-center gap-0.5">
                <Plus size={10} /> Add
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
