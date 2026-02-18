import { memo, useState, useRef, useEffect } from 'react';
import { Eye, Plus, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import type { Song } from '../types';
import { AlbumArtwork } from './AlbumArtwork';

interface SongCardProps {
  song: Song;
  compact?: boolean;
  coverImageUrl?: string;
  onEditSong?: (song: Song) => void;
  onDeleteSong?: (songId: string) => void;
  onAddToProject?: (song: Song) => void;
  onSongClick?: (song: Song) => void;
  searchScore?: number; // Fuzzy search score (0-1, lower is better match)
}

/**
 * SongCard - Mobile/Tablet card view for songs
 * Displays song information in a touch-friendly card format.
 * Wrapped in React.memo to skip re-renders when props haven't changed.
 */
export const SongCard = memo(function SongCard({
  song,
  compact = false,
  coverImageUrl,
  onEditSong,
  onDeleteSong,
  onAddToProject,
  onSongClick,
  searchScore,
}: SongCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const primaryBpm = song.primaryBpm || song.bpms?.[0];
  const primaryKey = song.primaryKey || song.keys?.[0];
  const vocalStatus = song.vocalStatus || (song.type?.includes('Vocal') ? 'Vocal' : 'Instrumental');
  
  // Calculate search match percentage and color
  const getSearchMatchInfo = (): { percentage: number; colorClass: string } | null => {
    if (searchScore === undefined) return null;
    const percentage = Math.round((1 - searchScore) * 100);
    let colorClass = 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    if (percentage >= 80) colorClass = 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30';
    else if (percentage >= 60) colorClass = 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30';
    return { percentage, colorClass };
  };
  
  const matchInfo = getSearchMatchInfo();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [showMenu]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0">
              <AlbumArtwork
                imageUrl={coverImageUrl}
                alt={`${song.title} by ${song.artist}`}
                size="small"
                aspectRatio="square"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base md:text-lg truncate text-gray-900 dark:text-white">
                {song.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate text-gray-600 dark:text-gray-400">
                {song.artist}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="h-9 w-9 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button
                  onClick={() => {
                    onSongClick?.(song);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    onEditSong?.(song);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Song
                </button>
                <button
                  onClick={() => {
                    onAddToProject?.(song);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to Project
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this song?')) {
                      onDeleteSong?.(song.id);
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Row */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {primaryBpm && (
            <>
              <span className="font-medium text-gray-700 dark:text-gray-300">{primaryBpm} BPM</span>
              <span className="text-gray-400">•</span>
            </>
          )}
          {primaryKey && (
            <>
              <span className="font-medium text-gray-700 dark:text-gray-300">{primaryKey}</span>
              <span className="text-gray-400">•</span>
            </>
          )}
          {song.year && (
            <span className="text-gray-600 dark:text-gray-400">{song.year}</span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {matchInfo && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${matchInfo.colorClass}`}>
              {matchInfo.percentage}% match
            </span>
          )}
          {vocalStatus && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
              {compact ? vocalStatus[0] : vocalStatus}
            </span>
          )}
          {song.type && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
              {song.type}
            </span>
          )}
        </div>

        {/* Expandable sections info - only on tablet/desktop */}
        {!compact && song.sections && song.sections.length > 1 && (
          <button
            className="w-full mt-3 flex items-center justify-between text-xs text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 py-2 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => onSongClick?.(song)}
          >
            <span>{song.sections.length} sections</span>
            <span>View →</span>
          </button>
        )}
      </div>

      {/* Quick actions bar - touch-friendly */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 flex gap-2">
        <button
          className="flex-1 h-9 min-h-[44px] flex items-center justify-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          onClick={() => onSongClick?.(song)}
        >
          <Eye className="h-4 w-4 md:mr-1" />
          <span className="hidden md:inline">View</span>
        </button>
        <button
          className="flex-1 h-9 min-h-[44px] flex items-center justify-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          onClick={() => onAddToProject?.(song)}
        >
          <Plus className="h-4 w-4 md:mr-1" />
          <span className="hidden md:inline">Add</span>
        </button>
      </div>
    </div>
  );
});
