import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Settings,
  MoreVertical,
  GripVertical,
  ArrowDownNarrowWide,
  Trash2,
  Plus,
} from 'lucide-react';
import type { Song, ProjectSection, ProjectWithSections } from '../types';
import { keyToSharpDisplay } from '../utils/keyNormalization';
import { getKeyGradientStyle } from '../utils/keyColors';
import { useDarkMode } from '../hooks/useTheme';
import { sortSectionEntriesByBpmOrKey, type SectionSortOption } from '../utils/entryDisplay';
import { SectionSettingsDialog } from './SectionSettingsDialog';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { SpreadsheetSongRow, type SpreadsheetEntrySong } from './SpreadsheetSongRow';
import {
  SPREADSHEET_COLUMN_CLASS,
  SPREADSHEET_ROW_GRID_CLASS,
} from '../utils/spreadsheetLayout';

export interface SpreadsheetSectionColumnProps {
  section: ProjectWithSections['sections'][number];
  projectId: string;
  onRequestAddSong: (projectId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onUpdateSection: (section: ProjectSection) => void | Promise<void>;
  onDeleteSection: (sectionId: string) => void | Promise<void>;
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

export function SpreadsheetSectionColumn({
  section,
  projectId,
  onRequestAddSong,
  onRemoveEntry,
  onReorderEntries,
  onUpdateSection,
  onDeleteSection,
  onMoveToSection,
  onToggleLock,
  onUpdateEntryMetadata,
  onViewSong,
  onEditSong,
  otherSections,
}: SpreadsheetSectionColumnProps) {
  const isDark = useDarkMode();
  const songs = section.songs as SpreadsheetEntrySong[];
  const [sectionSettingsOpen, setSectionSettingsOpen] = useState(false);
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const {
    attributes: sectionAttributes,
    listeners: sectionListeners,
    setNodeRef: setSectionSortableRef,
    transform: sectionTransform,
    transition: sectionTransition,
    isDragging: isSectionDragging,
  } = useSortable({ id: `section-${section.id}` });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `section-${section.id}`,
  });

  const sectionStyle = {
    transform: CSS.Transform.toString(sectionTransform),
    transition: sectionTransition,
  };

  const setBodyRef = (node: HTMLDivElement | null) => {
    setDroppableRef(node);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSectionMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSortSection = (sortBy: SectionSortOption) => {
    const sorted = sortSectionEntriesByBpmOrKey(songs, sortBy);
    onReorderEntries(section.id, sorted.map((s) => s.entryId));
    setSortMenuOpen(false);
  };

  const hasTargetLine =
    section.targetBpm != null ||
    (section.targetKey != null && String(section.targetKey).trim() !== '');

  const targetLineParts: string[] = [];
  if (section.targetBpm != null) {
    targetLineParts.push(`${section.targetBpm} BPM`);
  }
  if (section.targetKey != null && String(section.targetKey).trim() !== '') {
    targetLineParts.push(keyToSharpDisplay(section.targetKey) || section.targetKey);
  }

  const entryIds = songs.map((s) => `entry-${s.entryId}`);
  const displayName = section.name?.trim() || 'Section';

  const sectionKey = section.targetKey != null && String(section.targetKey).trim() !== ''
    ? section.targetKey
    : undefined;
  const headerGradientStyle = sectionKey ? getKeyGradientStyle(sectionKey, isDark) : undefined;
  const headerHasGradient =
    headerGradientStyle != null && Object.keys(headerGradientStyle).length > 0;
  const headerReadabilityClass = headerHasGradient
    ? isDark
      ? 'song-card-readability-dark'
      : 'song-card-readability-light'
    : '';

  return (
    <div
      ref={setSectionSortableRef}
      style={sectionStyle}
      role="region"
      aria-label={`${displayName}, ${songs.length} songs`}
      className={`${SPREADSHEET_COLUMN_CLASS} rounded-lg border border-theme-border-default overflow-hidden ${
        isSectionDragging ? 'opacity-60 z-10' : ''
      }`}
    >
      <div
        className={`sticky top-0 z-10 border-b border-theme-border-default ${
          headerHasGradient ? headerReadabilityClass : 'bg-theme-surface-elevated'
        }`}
        style={headerHasGradient ? headerGradientStyle : undefined}
      >
        <div className="grid grid-cols-3 items-center gap-1 min-h-[2rem] px-2 pt-2 pb-1">
          <div className="flex items-center justify-start min-w-0">
            <button
              type="button"
              className="p-0.5 text-theme-text-muted hover:text-theme-text-secondary cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
              aria-label={`Drag to reorder section ${displayName}`}
              {...sectionAttributes}
              {...sectionListeners}
            >
              <GripVertical size={14} />
            </button>
          </div>
          <h3
            className="text-sm font-semibold text-theme-text-primary truncate text-center min-w-0 px-0.5"
            title={displayName}
          >
            {displayName}
          </h3>
          <div className="flex items-center justify-end gap-0.5 min-w-0">
            <button
              type="button"
              onClick={() => setSectionSettingsOpen(true)}
              className="p-1 text-theme-text-muted hover:text-theme-text-secondary"
              aria-label={`Section settings for ${displayName}`}
            >
              <Settings size={14} />
            </button>
            <div className="relative" ref={sortMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSortMenuOpen((o) => !o);
                }}
                className="p-1 text-theme-text-muted hover:text-theme-text-secondary disabled:opacity-40"
                aria-label={`Sort songs in ${displayName}`}
                disabled={songs.length < 2}
              >
                <ArrowDownNarrowWide size={14} />
              </button>
              {sortMenuOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 w-52 bg-theme-surface-base border border-theme-border-default rounded-lg shadow-lg z-20">
                  <div className="px-3 py-1.5 text-xs font-medium text-theme-text-muted border-b border-theme-border-subtle">
                    Sort by
                  </div>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => handleSortSection('bpm-asc')}
                  >
                    BPM (low to high)
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => handleSortSection('bpm-desc')}
                  >
                    BPM (high to low)
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => handleSortSection('key-asc')}
                  >
                    Key (low to high)
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => handleSortSection('key-desc')}
                  >
                    Key (high to low)
                  </button>
                </div>
              )}
            </div>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSectionMenuOpen((o) => !o);
                }}
                className="p-1 text-theme-text-muted hover:text-theme-text-secondary"
                aria-label={`Section options for ${displayName}`}
              >
                <MoreVertical size={14} />
              </button>
              {sectionMenuOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-theme-surface-base border border-theme-border-default rounded-lg shadow-lg z-20">
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                    onClick={() => {
                      setSectionMenuOpen(false);
                      setSectionSettingsOpen(true);
                    }}
                  >
                    <Settings size={14} /> Section settings
                  </button>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-accent-danger hover:bg-theme-state-hover"
                    onClick={() => {
                      setSectionMenuOpen(false);
                      setConfirmDeleteOpen(true);
                    }}
                  >
                    <Trash2 size={14} /> Delete section
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasTargetLine && (
          <p className="px-2 pb-1 text-xs text-theme-text-secondary text-center truncate tabular-nums">
            {targetLineParts.join(' · ')}
          </p>
        )}

        <div
          className={`${SPREADSHEET_ROW_GRID_CLASS} px-2 pb-1 text-xs text-theme-text-muted uppercase tracking-wide`}
        >
          <span className="text-right tabular-nums">BPM</span>
          <span>Song title</span>
          <span className="text-right">Notes</span>
        </div>
      </div>

      <div
        ref={setBodyRef}
        className={`flex-1 min-h-[80px] transition-colors duration-100 ${
          isOver ? 'bg-theme-surface-selected/50' : ''
        }`}
      >
        {songs.length === 0 ? (
          <div className="text-xs text-theme-text-muted text-center py-4 px-2">
            <p>No songs in this section</p>
            <button
              type="button"
              className="mt-2 text-theme-accent-primary hover:underline"
              onClick={() => onRequestAddSong(projectId, section.id)}
            >
              + Add the first one
            </button>
          </div>
        ) : (
          <SortableContext items={entryIds} strategy={verticalListSortingStrategy}>
            {songs.map((song) => (
              <SpreadsheetSongRow
                key={song.entryId}
                song={song}
                onRemoveEntry={onRemoveEntry}
                onMoveToSection={onMoveToSection}
                onToggleLock={onToggleLock}
                onUpdateEntryMetadata={onUpdateEntryMetadata}
                onViewSong={onViewSong}
                onEditSong={onEditSong}
                otherSections={otherSections}
              />
            ))}
          </SortableContext>
        )}
      </div>

      <button
        type="button"
        onClick={() => onRequestAddSong(projectId, section.id)}
        className="text-xs text-theme-text-muted hover:text-theme-text-primary border border-dashed border-theme-border-subtle rounded-md py-1.5 mx-2 mb-2 mt-1 flex items-center justify-center gap-1 transition-colors"
      >
        <Plus size={12} /> Add song
      </button>

      <SectionSettingsDialog
        isOpen={sectionSettingsOpen}
        onClose={() => setSectionSettingsOpen(false)}
        section={section}
        onSave={async (updated) => {
          await onUpdateSection(updated);
          setSectionSettingsOpen(false);
        }}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete section"
        message={`Delete "${displayName}" and remove all songs from this section?`}
        confirmText="Delete"
        destructive
        onConfirm={() => {
          void onDeleteSection(section.id);
          setConfirmDeleteOpen(false);
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
