import { useCallback } from 'react';
import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { calculateCompatibilityScore } from '../utils/compatibilityScore';
import type { Song } from '../types';
import type { ProjectWithSections } from '../types';
import { getKeyGradientStyle } from '../utils/keyColors';
import { useDarkMode } from '../hooks/useTheme';

export interface MegamixTimelineProps {
  project: ProjectWithSections;
  onRequestAddSong: (projectId: string, sectionId: string) => void;
  onAddSong: (projectId: string, songId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onEditSong?: (song: Song) => void;
}

export function MegamixTimeline({
  project,
  onRequestAddSong,
  onRemoveEntry: _onRemoveEntry,
  onReorderEntries,
  onEditSong: _onEditSong,
}: MegamixTimelineProps) {
  const mainSection = project.sections.find((s) => s.name === 'Main') ?? project.sections[0];
  const songs = mainSection?.songs ?? [];
  const projectId = project.id;
  const sectionId = mainSection?.id ?? '';
  const isDark = useDarkMode();

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      if (!activeId.startsWith('entry-') || !overId.startsWith('entry-')) return;
      const oldIndex = songs.findIndex((s) => s.entryId === activeId.replace('entry-', ''));
      const newIndex = songs.findIndex((s) => s.entryId === overId.replace('entry-', ''));
      if (oldIndex === -1 || newIndex === -1) return;
      const newOrder = [...songs];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);
      onReorderEntries(sectionId, newOrder.map((s) => s.entryId));
    },
    [songs, sectionId, onReorderEntries]
  );

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex overflow-x-auto gap-3 pb-4 min-h-[120px]">
        {songs.map((song, index) => {
          const prev = songs[index - 1];
          const next = songs[index + 1];
          const compatWithPrev = prev ? calculateCompatibilityScore(prev, song).score : 1;
          const compatWithNext = next ? calculateCompatibilityScore(song, next).score : 1;
          const dotColor = compatWithPrev >= 0.7 && compatWithNext >= 0.7 ? 'bg-green-500' : compatWithPrev >= 0.4 && compatWithNext >= 0.4 ? 'bg-yellow-500' : 'bg-red-500';
          return (
            <div
              key={song.entryId}
              className="flex-shrink-0 w-32 min-h-[80px] p-2 rounded-lg border border-gray-200 dark:border-gray-600 flex flex-col justify-between"
              style={getKeyGradientStyle(song.primaryKey ?? song.keys?.[0], isDark)}
            >
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={song.title}>
                {song.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {song.primaryBpm ?? song.bpms?.[0] ?? '—'} BPM
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`w-2 h-2 rounded-full ${dotColor}`} title="Compatibility" />
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => sectionId && onRequestAddSong(projectId, sectionId)}
          className="flex-shrink-0 w-32 min-h-[80px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600"
          aria-label="Add slot"
        >
          +
        </button>
      </div>
    </DndContext>
  );
}
