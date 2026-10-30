import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Music, Edit, Trash2, GripVertical } from 'lucide-react';
import type { Song } from '../types';
import { keyToSharpDisplay } from '../utils/keyNormalization';
import { useLyricLinkContext } from './LyricLinkContext';
import { LyricLinkBadge } from '../components/LyricLinkBadge';

/** Parses display key string into root letter (sharp display) and mode quality. */
function parseKey(raw?: string): { letter: string; quality: string } {
  if (!raw || raw === '—') return { letter: '—', quality: '' };
  const parts = raw.trim().split(/\s+/);
  if (parts.length >= 2) {
    return { letter: parts[0], quality: parts.slice(1).join(' ') };
  }
  if (parts.length === 1) {
    const single = parts[0];
    if (single.endsWith('m') && single.length > 1) {
      return { letter: single.slice(0, -1), quality: 'Minor' };
    }
    return { letter: single, quality: 'Major' };
  }
  return { letter: raw || '—', quality: 'Major' };
}

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
  /** Optional gradient/style for the card (e.g. key-based gradient). Applied to root when provided. */
  backgroundStyle?: React.CSSProperties;
  /** When true (dark mode), use dark stroke for readability on gradient; when false, use white. Omit to skip stroke. */
  isDark?: boolean;
  /** Custom actions (e.g. ellipsis menu); when provided, replaces edit/delete buttons. */
  renderActions?: React.ReactNode;
}

export function SortableSongItem({ 
  song, 
  onEdit, 
  onDelete, 
  showActions = true,
  disableDrag = false,
  sortableId,
  transparentBackground = false,
  backgroundStyle,
  isDark = false,
  renderActions,
}: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId ?? song.id, disabled: disableDrag });

  const { linksBySongId, highlightedSongIds, setHighlightedLinkId } = useLyricLinkContext();
  const lyricLinks = linksBySongId.get(song.id) || [];
  const isHighlighted = highlightedSongIds.has(song.id);

  const transformStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasGradient = backgroundStyle != null;
  const rootStyle = hasGradient ? { ...backgroundStyle, ...transformStyle } : transformStyle;

  const bpmDisplay = song.primaryBpm ?? song.bpms?.[0] ?? 'N/A';
  const keyForDisplay = keyToSharpDisplay(song.primaryKey ?? song.keys?.[0]);
  const keyParsed = parseKey(keyForDisplay || undefined);
  const threeColumnLayout = hasGradient;
  const readabilityClass = hasGradient ? (isDark ? 'song-card-readability-dark' : 'song-card-readability-light') : '';

  return (
    <div
      ref={setNodeRef}
      style={rootStyle}
      className={`p-3 rounded-lg border transition-all w-full ${
        isHighlighted
          ? 'ring-2 ring-primary-400 border-primary-500 shadow-md'
          : hasGradient
          ? 'border-theme-border-subtle'
          : transparentBackground
          ? 'bg-transparent border-theme-border-subtle'
          : 'bg-theme-surface-base border-theme-border-default'
      } ${isDragging ? 'shadow-lg opacity-50' : 'hover:shadow-md'}`}
    >
      <div className={`flex items-center gap-3 w-full min-w-0 ${readabilityClass}`}>
        {!disableDrag && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing text-theme-text-muted hover:text-theme-text-secondary flex-shrink-0"
          >
            <GripVertical size={16} />
          </div>
        )}

        {threeColumnLayout ? (
          <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_2fr_minmax(0,1fr)] gap-2 sm:gap-4 items-center">
            <div className="min-w-0 text-center sm:text-left">
              <p className="font-bold text-theme-text-primary truncate tabular-nums">{String(bpmDisplay)}</p>
              <p className="text-xs text-theme-text-secondary">BPM</p>
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-theme-text-primary truncate">{song.title || '—'}</p>
                {lyricLinks.length > 0 && (
                  <LyricLinkBadge
                    links={lyricLinks}
                    onHoverLink={setHighlightedLinkId}
                    compact
                  />
                )}
              </div>
              <p className="text-xs text-theme-text-secondary truncate">{song.artist || 'Unknown Artist'}</p>
            </div>
            <div className="min-w-0 text-center sm:text-right">
              <p className="font-bold text-theme-text-primary truncate">{keyParsed.letter}</p>
              <p className="text-xs text-theme-text-secondary">{keyParsed.quality || ''}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Music size={16} className="text-theme-text-muted flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium text-theme-text-primary truncate">
                    {song.title}
                  </p>
                  {lyricLinks.length > 0 && (
                    <LyricLinkBadge
                      links={lyricLinks}
                      onHoverLink={setHighlightedLinkId}
                      compact
                    />
                  )}
                </div>
                <p className="text-xs text-theme-text-secondary truncate">
                  {song.artist || 'Unknown Artist'}
                </p>
              </div>
            </div>

            <div className="mt-1 flex items-center space-x-4 text-xs text-theme-text-secondary">
              <span>BPM: {String(bpmDisplay)}</span>
              <span>Key: {keyForDisplay || song.primaryKey || song.keys?.[0] || 'N/A'}</span>
            </div>
          </div>
        )}

        {(renderActions != null || (showActions && (onEdit != null || onDelete != null))) && (
          <div className="flex items-center space-x-1">
            {renderActions ?? (
              <>
                {onEdit && (
                  <button
                    onClick={() => onEdit(song)}
                    className="text-theme-text-muted hover:text-theme-accent-primary p-1"
                    title="Edit song"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(song.id)}
                    className="text-theme-text-muted hover:text-theme-accent-danger p-1"
                    title="Delete song"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
