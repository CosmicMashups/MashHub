import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  MoreVertical,
  Lock,
  Eye,
  Edit3,
  Move,
  Unlock,
  Layers3,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import type { Song, ProjectSection } from '../types';
import { getKeyGradientStyle } from '../utils/keyColors';
import { getRoleLabel } from '../utils/entryDisplay';
import { useDarkMode } from '../hooks/useTheme';
import { SPREADSHEET_ROW_GRID_CLASS } from '../utils/spreadsheetLayout';
import { useLyricLinkContext } from '../contexts/LyricLinkContext';
import { LyricLinkBadge } from './LyricLinkBadge';

export type SpreadsheetEntrySong = Song & {
  entryId: string;
  locked: boolean;
  notes?: string;
  performanceRole?: 'vocal' | 'instrumental' | 'both';
  usedInMashup?: boolean;
};

export interface SpreadsheetSongRowProps {
  song: SpreadsheetEntrySong;
  onRemoveEntry: (entryId: string) => void;
  onMoveToSection: (entryId: string, targetSectionId: string) => void;
  onToggleLock: (entryId: string) => void;
  onUpdateEntryMetadata?: (
    entryId: string,
    metadata: { performanceRole?: 'vocal' | 'instrumental' | 'both'; usedInMashup?: boolean }
  ) => void;
  onViewSong?: (song: Song) => void;
  onEditSong?: (song: Song) => void;
  otherSections: ProjectSection[];
}

export function SpreadsheetSongRow({
  song,
  onRemoveEntry,
  onMoveToSection,
  onToggleLock,
  onUpdateEntryMetadata,
  onViewSong,
  onEditSong,
  otherSections,
}: SpreadsheetSongRowProps) {
  const isDark = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { linksBySongId, highlightedSongIds, setHighlightedLinkId } = useLyricLinkContext();
  const lyricLinks = linksBySongId.get(song.id) || [];
  const isHighlighted = highlightedSongIds.has(song.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `entry-${song.entryId}`,
    disabled: song.locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const bpm = song.primaryBpm ?? song.bpms?.[0];
  const keyLabel = song.primaryKey ?? song.keys?.[0];
  const gradientStyle = getKeyGradientStyle(keyLabel, isDark);
  const readabilityClass = isDark ? 'song-card-readability-dark' : 'song-card-readability-light';

  const notesTrimmed = song.notes?.trim() ?? '';
  const notesIsEmpty = !notesTrimmed;
  const notesDisplay = notesIsEmpty ? '—' : notesTrimmed;
  const isInstrumental = song.performanceRole === 'instrumental';

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="row"
      className={`group ${SPREADSHEET_ROW_GRID_CLASS} px-2 py-1 min-h-[32px] transition-colors duration-100 hover:bg-theme-surface-hover ${
        isHighlighted ? 'ring-1 ring-primary-400 bg-primary-500/5' : ''
      } ${song.locked ? 'opacity-60' : ''} ${isDragging ? 'opacity-40 scale-95 z-10' : ''}`}
    >
      <div className="flex items-center justify-end gap-0.5 tabular-nums text-sm">
        {song.locked && (
          <Lock size={10} className="text-theme-text-muted flex-shrink-0" aria-hidden />
        )}
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-0.5 text-theme-text-muted hover:text-theme-text-secondary touch-none cursor-grab active:cursor-grabbing"
          aria-label={`Drag to reorder ${song.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </button>
        <span
          className={
            isInstrumental
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
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className="text-xs font-medium text-theme-text-primary line-clamp-2 break-words leading-snug"
            title={`${song.title}${song.artist ? ` — ${song.artist}` : ''}`}
          >
            {song.title}
            {song.usedInMashup && (
              <span className="ml-1 text-[10px] text-emerald-500">[USED]</span>
            )}
          </p>
          {lyricLinks.length > 0 && (
            <LyricLinkBadge
              links={lyricLinks}
              onHoverLink={setHighlightedLinkId}
              compact
            />
          )}
        </div>
      </div>

      <div className="relative flex items-start justify-end gap-1 min-w-0">
        <span
          className={`min-w-0 text-right text-xs leading-snug line-clamp-2 break-words ${
            notesIsEmpty ? 'text-theme-text-muted' : 'text-theme-text-secondary'
          }`}
          title={notesTrimmed || undefined}
          aria-label={notesTrimmed ? `Notes: ${notesTrimmed}` : 'No notes'}
        >
          {notesDisplay}
        </span>
        <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="p-0.5 text-theme-text-muted hover:text-theme-text-secondary"
            aria-label={`Options for ${song.title}`}
          >
            <MoreVertical size={12} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-0.5 py-1 w-44 bg-theme-surface-base border border-theme-border-default rounded-lg shadow-lg z-20 text-xs">
              {onViewSong && (
                <button
                  type="button"
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-theme-text-primary hover:bg-theme-state-hover"
                  onClick={() => {
                    onViewSong(song);
                    setMenuOpen(false);
                  }}
                >
                  <Eye size={12} /> View details
                </button>
              )}
              {onEditSong && (
                <button
                  type="button"
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-theme-text-primary hover:bg-theme-state-hover"
                  onClick={() => {
                    onEditSong(song);
                    setMenuOpen(false);
                  }}
                >
                  <Edit3 size={12} /> Edit
                </button>
              )}
              {otherSections.length > 0 && (
                <>
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-theme-text-muted uppercase tracking-wider">
                    Move to
                  </div>
                  {otherSections.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      className="w-full flex items-center gap-1.5 px-2.5 py-1 text-left text-theme-text-primary hover:bg-theme-state-hover truncate"
                      onClick={() => {
                        onMoveToSection(song.entryId, sec.id);
                        setMenuOpen(false);
                      }}
                    >
                      <Move size={12} /> {sec.name}
                    </button>
                  ))}
                </>
              )}
              <div className="my-1 border-t border-theme-border-subtle" />
              <button
                type="button"
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-theme-text-primary hover:bg-theme-state-hover"
                onClick={() => {
                  onToggleLock(song.entryId);
                  setMenuOpen(false);
                }}
              >
                {song.locked ? (
                  <>
                    <Unlock size={12} /> Unlock position
                  </>
                ) : (
                  <>
                    <Lock size={12} /> Lock position
                  </>
                )}
              </button>
              {onUpdateEntryMetadata && (
                <>
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-theme-text-muted uppercase tracking-wider">
                    Performance role
                  </div>
                  <button
                    type="button"
                    className="w-full flex items-center gap-1.5 px-2.5 py-1 text-left text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => {
                      onUpdateEntryMetadata(song.entryId, { performanceRole: 'vocal' });
                      setMenuOpen(false);
                    }}
                  >
                    <Layers3 size={12} /> Vocal {song.performanceRole === 'vocal' ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-1.5 px-2.5 py-1 text-left text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => {
                      onUpdateEntryMetadata(song.entryId, { performanceRole: 'instrumental' });
                      setMenuOpen(false);
                    }}
                  >
                    <Layers3 size={12} /> Instrumental {song.performanceRole === 'instrumental' ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => {
                      onUpdateEntryMetadata(song.entryId, { performanceRole: 'both' });
                      setMenuOpen(false);
                    }}
                  >
                    <Layers3 size={12} /> Both {song.performanceRole === 'both' ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-1.5 px-2.5 py-1 text-left text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => {
                      onUpdateEntryMetadata(song.entryId, {
                        usedInMashup: !(song.usedInMashup ?? false),
                      });
                      setMenuOpen(false);
                    }}
                  >
                    <CheckCircle2 size={12} />{' '}
                    {song.usedInMashup ? 'Mark unused' : 'Mark used in mashup'}
                  </button>
                </>
              )}
              <div className="my-1 border-t border-theme-border-subtle" />
              <button
                type="button"
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left text-theme-accent-danger hover:bg-theme-state-hover"
                onClick={() => {
                  onRemoveEntry(song.entryId);
                  setMenuOpen(false);
                }}
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
