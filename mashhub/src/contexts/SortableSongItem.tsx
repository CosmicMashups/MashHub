import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Song } from '../types';
import { GripVertical, Music, Edit3, Trash2 } from 'lucide-react';

interface SortableSongItemProps {
  song: Song;
  onEdit?: (song: Song) => void;
  onDelete?: (songId: string) => void;
  showActions?: boolean;
  disableDrag?: boolean;
  /** When in Kanban, use entry-based id for drag (e.g. `entry-${entryId}`). */
  sortableId?: string;
  /** When true, no solid background so parent key gradient shows through. */
  transparentBackground?: boolean;
}

export function SortableSongItem({ 
  song, 
  onEdit, 
  onDelete, 
  showActions = true,
  disableDrag = false,
  sortableId,
  transparentBackground = false,
}: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId ?? song.id, disabled: disableDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border transition-all ${
        transparentBackground
          ? 'bg-transparent border-gray-200/80 dark:border-gray-600/80'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      } ${isDragging ? 'shadow-lg opacity-50' : 'hover:shadow-md'}`}
    >
      <div className="flex items-center space-x-3">
        {!disableDrag && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical size={16} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <Music size={16} className="text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {song.title}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {song.artist}
              </p>
            </div>
          </div>
          
          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
            <span>BPM: {song.primaryBpm || song.bpms[0] || 'N/A'}</span>
            <span>Key: {song.primaryKey || song.keys[0] || 'N/A'}</span>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-1">
            {onEdit && (
              <button
                onClick={() => onEdit(song)}
                className="text-gray-400 hover:text-primary-600 p-1"
                title="Edit song"
              >
                <Edit3 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(song.id)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Remove from project"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}