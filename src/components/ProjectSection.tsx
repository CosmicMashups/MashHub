import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSongItem } from '../contexts/SortableSongItem';
import type { Song } from '../types';
import { Plus, Music, ArrowUp, ArrowDown } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

interface ProjectSectionProps {
  sectionName: string;
  songs: Song[];
  projectId: string;
  onAddSong?: (projectId: string, sectionName: string) => void;
  onEditSong?: (song: Song) => void;
  onRemoveSong?: (projectId: string, songId: string) => void;
  onReorderSongs?: (projectId: string, sectionName: string, songIds: string[]) => void;
}

export function ProjectSection({
  sectionName,
  songs,
  projectId,
  onAddSong,
  onEditSong,
  onRemoveSong,
  onReorderSongs
}: ProjectSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${projectId}-${sectionName}`,
  });

  const isMobile = useIsMobile();

  const handleMoveUp = (index: number) => {
    if (index === 0 || !onReorderSongs) return;
    const newOrder = [...songs];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorderSongs(projectId, sectionName, newOrder.map(s => s.id));
  };

  const handleMoveDown = (index: number) => {
    if (index === songs.length - 1 || !onReorderSongs) return;
    const newOrder = [...songs];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onReorderSongs(projectId, sectionName, newOrder.map(s => s.id));
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">{sectionName}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{songs.length} songs</span>
          {onAddSong && (
            <button
              onClick={() => onAddSong(projectId, sectionName)}
              className="text-primary-600 hover:text-primary-800 p-1"
              title="Add song to section"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`min-h-[100px] space-y-2 transition-colors ${
          isOver ? 'bg-primary-50 border-2 border-dashed border-primary-300' : ''
        }`}
      >
        {songs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Music size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No songs in this section</p>
            <p className="text-xs text-gray-400">Drag songs here or click + to add</p>
          </div>
        ) : (
          <>
            {isMobile ? (
              // Mobile: Show reorder buttons
              <div className="space-y-2">
                {songs.map((song, index) => (
                  <div key={song.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <SortableSongItem
                        song={song}
                        onEdit={onEditSong}
                        onDelete={(songId) => onRemoveSong?.(projectId, songId)}
                        disableDrag={true}
                      />
                    </div>
                    <div className="flex flex-col ml-2 gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                        aria-label="Move up"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === songs.length - 1}
                        className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                        aria-label="Move down"
                      >
                        <ArrowDown size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop: Use drag-and-drop
              <SortableContext items={songs.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {songs.map((song) => (
                  <SortableSongItem
                    key={song.id}
                    song={song}
                    onEdit={onEditSong}
                    onDelete={(songId) => onRemoveSong?.(projectId, songId)}
                  />
                ))}
              </SortableContext>
            )}
          </>
        )}
      </div>
    </div>
  );
}