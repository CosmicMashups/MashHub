import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { SortableSongItem } from '../contexts/SortableSongItem';
import type { Song } from '../types';
import { Plus, Music } from 'lucide-react';

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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (over && over.id === `section-${projectId}-${sectionName}`) {
      // Handle reordering within section
      const oldIndex = songs.findIndex(song => song.id === active.id);
      const newIndex = songs.findIndex(song => song.id === over.id);
      
      if (oldIndex !== newIndex) {
        const newSongs = arrayMove(songs, oldIndex, newIndex);
        onReorderSongs?.(projectId, sectionName, newSongs.map(s => s.id));
      }
    }
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
      </div>
    </div>
  );
}