import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Song } from '../types';
import { GripVertical, Music, Edit3, Trash2 } from 'lucide-react';

interface SortableSongItemProps {
  song: Song;
  onEdit?: (song: Song) => void;
  onDelete?: (songId: string) => void;
  showActions?: boolean;
}

export function SortableSongItem({ 
  song, 
  onEdit, 
  onDelete, 
  showActions = true 
}: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-3 rounded-lg border transition-all ${
        isDragging ? 'shadow-lg opacity-50' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical size={16} />
        </div>
        
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
            <span className={`px-2 py-1 rounded-full text-xs ${
              song.vocalStatus === 'Vocal' ? 'bg-green-100 text-green-800' :
              song.vocalStatus === 'Instrumental' ? 'bg-blue-100 text-blue-800' :
              song.vocalStatus === 'Both' ? 'bg-purple-100 text-purple-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {song.vocalStatus}
            </span>
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