import { memo, useState, useRef, useEffect } from 'react';
import { Eye, Plus, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import type { Song } from '../types';
import { AlbumArtwork } from './AlbumArtwork';
import { getKeyChipStyle, getKeyRowStyle } from '../utils/keyColors';
import { useDarkMode } from '../hooks/useTheme';

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
  const isDark = useDarkMode();
  
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
    <div
      className="rounded-xl border border-theme-border-default overflow-hidden hover:border-theme-border-strong transition-all shadow-xs"
      style={primaryKey ? getKeyRowStyle(primaryKey, isDark) : undefined}
    >
      <div className="p-3.5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0">
              <AlbumArtwork
                imageUrl={coverImageUrl}
                alt={`${song.title} by ${song.artist || 'Unknown Artist'}`}
                size="small"
                aspectRatio="square"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate text-theme-text-primary">
                {song.title}
              </h3>
              <p className="text-xs text-theme-text-secondary truncate">
                {song.artist || 'Unknown Artist'}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="h-8 w-8 flex items-center justify-center shrink-0 rounded-md hover:bg-theme-surface-hover transition-colors text-theme-text-muted hover:text-theme-text-primary"
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-theme-surface-elevated rounded-lg shadow-md border border-theme-border-default z-50 py-1">
                <button
                  onClick={() => {
                    onSongClick?.(song);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-theme-text-primary hover:bg-theme-surface-hover active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Eye size={14} />
                  View Details
                </button>
                <button
                  onClick={() => {
                    onEditSong?.(song);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-theme-text-primary hover:bg-theme-surface-hover active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Edit3 size={14} />
                  Edit Track
                </button>
                <button
                  onClick={() => {
                    onAddToProject?.(song);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-theme-text-primary hover:bg-theme-surface-hover active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Plus size={14} />
                  Add to Section
                </button>
                <div className="border-t border-theme-border-subtle my-1" />
                <button
                  onClick={() => {
                    onDeleteSong?.(song.id);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-theme-accent-danger hover:bg-theme-accent-danger/10 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center gap-2 mb-2 font-mono text-xs">
          {primaryBpm && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold tabular-nums">
              {primaryBpm} BPM
            </span>
          )}
          {primaryKey && (
            <span
              className="px-2 py-0.5 rounded font-mono text-xs font-bold border shadow-xs tabular-nums"
              style={getKeyChipStyle(primaryKey, isDark)}
            >
              {primaryKey}
            </span>
          )}
          {song.year && (
            <span className="text-theme-text-muted tabular-nums ml-auto text-[11px]">
              {song.year}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {matchInfo && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${matchInfo.colorClass}`}>
              {matchInfo.percentage}% match
            </span>
          )}
          {vocalStatus && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-theme-surface-elevated border border-theme-border-subtle text-theme-text-secondary">
              {compact ? vocalStatus[0] : vocalStatus}
            </span>
          )}
          {song.type && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-theme-text-muted bg-theme-surface-elevated/60 border border-theme-border-subtle">
              {song.type}
            </span>
          )}
        </div>
      </div>

      {/* Quick actions bar */}
      <div className="border-t border-theme-border-subtle bg-theme-surface-elevated px-3 py-2 flex gap-2">
        <button
          className="flex-1 min-h-[34px] flex items-center justify-center gap-1.5 text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-surface-base rounded-md transition-colors border border-transparent hover:border-theme-border-subtle"
          onClick={() => onSongClick?.(song)}
        >
          <Eye size={14} />
          <span>Details</span>
        </button>
        <button
          className="flex-1 min-h-[34px] flex items-center justify-center gap-1.5 text-xs font-semibold text-theme-accent-contrast bg-theme-accent-primary hover:bg-theme-accent-hover rounded-md transition-colors"
          onClick={() => onAddToProject?.(song)}
        >
          <Plus size={14} />
          <span>Section</span>
        </button>
      </div>
    </div>
  );
});

