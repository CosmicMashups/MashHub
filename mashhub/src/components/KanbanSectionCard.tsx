import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSongItem } from '../contexts/SortableSongItem';
import { ExpandableNotes } from './ExpandableNotes';
import { SectionSettingsDialog } from './SectionSettingsDialog';
import { getWarningsForSection } from '../utils/sectionWarnings';
import { getKeyGradientStyle } from '../utils/keyColors';
import { useDarkMode } from '../hooks/useTheme';
import type { Song } from '../types';
import type { ProjectWithSections, ProjectSection } from '../types';
import { Plus, Music, ArrowUp, ArrowDown, AlertTriangle, MoreVertical, Settings, Trash2, Move, Lock, Unlock } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';

export interface KanbanSectionCardProps {
  section: ProjectWithSections['sections'][number];
  projectId: string;
  onRequestAddSong: (projectId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onEditSong?: (song: Song) => void;
  onNotesChange: (entryId: string, notes: string) => void;
  onUpdateSection?: (section: ProjectSection) => Promise<void>;
  onDeleteSection?: (sectionId: string) => Promise<void>;
  allSections?: ProjectWithSections['sections'][number][];
  onMoveToSection?: (entryId: string, targetSectionId: string) => void;
  onToggleLock?: (entryId: string) => void;
  compactMode: boolean;
}

export function KanbanSectionCard({
  section,
  projectId,
  onRequestAddSong,
  onRemoveEntry,
  onReorderEntries,
  onEditSong,
  onNotesChange,
  onUpdateSection,
  onDeleteSection,
  allSections = [],
  onMoveToSection,
  onToggleLock,
  compactMode,
}: KanbanSectionCardProps) {
  const [showWarningTooltip, setShowWarningTooltip] = useState(false);
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const [sectionSettingsOpen, setSectionSettingsOpen] = useState(false);
  const [songMenuEntryId, setSongMenuEntryId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const songMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setSectionMenuOpen(false);
      if (songMenuRef.current && !songMenuRef.current.contains(e.target as Node)) setSongMenuEntryId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isMobile = useIsMobile();
  const isDark = useDarkMode();
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
  });

  const songs = section.songs;
  const warnings = getWarningsForSection(
    songs.map((s) => ({ ...s, entryId: s.entryId, locked: s.locked })),
    section
  );

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...songs];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorderEntries(section.id, newOrder.map((s) => s.entryId));
  };

  const handleMoveDown = (index: number) => {
    if (index === songs.length - 1) return;
    const newOrder = [...songs];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onReorderEntries(section.id, newOrder.map((s) => s.entryId));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{section.name}</h3>
          {warnings.length > 0 && (
            <div className="relative" onMouseEnter={() => setShowWarningTooltip(true)} onMouseLeave={() => setShowWarningTooltip(false)}>
              <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" aria-label="Warnings" />
              {showWarningTooltip && (
                <div className="absolute left-0 top-full mt-1 z-10 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                  {warnings.map((w, i) => (
                    <div key={i}>{w.label}{w.detail ? `: ${w.detail}` : `: ${w.songIds.join(' → ')}`}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{songs.length} songs</span>
          <button
            type="button"
            onClick={() => onRequestAddSong(projectId, section.id)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 p-1"
            title="Add song to section"
            aria-label="Add song"
          >
            <Plus size={16} />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSectionMenuOpen((o) => !o); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              aria-label="Section options"
            >
              <MoreVertical size={14} />
            </button>
            {sectionMenuOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => { setSectionMenuOpen(false); setSectionSettingsOpen(true); }}
                >
                  <Settings size={14} /> Section settings
                </button>
                {onDeleteSection && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setSectionMenuOpen(false);
                      if (window.confirm('Delete this section and remove its songs from the project?')) void onDeleteSection(section.id);
                    }}
                  >
                    <Trash2 size={14} /> Delete section
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[100px] space-y-2 transition-colors ${
          isOver ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-300 dark:border-primary-600 rounded-lg' : ''
        }`}
      >
        {songs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Music size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-500" />
            <p className="text-sm">No songs in this section</p>
            <p className="text-xs">Drag songs here or click + to add</p>
          </div>
        ) : compactMode ? (
          <ul className="space-y-1 text-sm font-mono text-gray-700 dark:text-gray-300">
            {songs.map((song) => {
              const keyLabel = song.primaryKey ?? song.keys?.[0];
              return (
                <li
                  key={song.id}
                  className="flex items-center justify-between gap-2 py-1 px-2 -mx-1 rounded border-b border-gray-100 dark:border-gray-700"
                  style={getKeyGradientStyle(keyLabel, isDark)}
                >
                  <span className="truncate">{song.title}</span>
                  <span className="flex-shrink-0">
                    {song.primaryBpm ?? song.bpms?.[0] ?? '—'} | {keyLabel ?? '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : isMobile ? (
          <div className="space-y-2">
            {songs.map((song, index) => {
              const keyLabel = song.primaryKey ?? song.keys?.[0];
              return (
                <div
                  key={song.entryId}
                  className="rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex flex-col gap-2"
                  style={getKeyGradientStyle(keyLabel, isDark)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {song.locked && <Lock size={14} className="text-amber-600 flex-shrink-0" />}
                      <SortableSongItem
                        song={song}
                        sortableId={`entry-${song.entryId}`}
                        onEdit={onEditSong}
                        onDelete={() => onRemoveEntry(song.entryId)}
                        disableDrag={song.locked}
                        transparentBackground
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => handleMoveUp(index)} disabled={index === 0} aria-label="Move up" className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30">
                        <ArrowUp size={18} />
                      </button>
                      <button type="button" onClick={() => handleMoveDown(index)} disabled={index === songs.length - 1} aria-label="Move down" className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30">
                        <ArrowDown size={18} />
                      </button>
                    </div>
                  </div>
                  <ExpandableNotes
                    initialValue={song.notes}
                    onSave={(notes) => onNotesChange(song.entryId, notes)}
                    placeholder="Crowd warmup"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <SortableContext items={songs.map((s) => `entry-${s.entryId}`)} strategy={verticalListSortingStrategy}>
            {songs.map((song) => {
              const keyLabel = song.primaryKey ?? song.keys?.[0];
              return (
                <div
                  key={song.entryId}
                  className="rounded-lg p-3 border border-gray-200 dark:border-gray-600 space-y-1 flex items-start gap-2"
                  style={getKeyGradientStyle(keyLabel, isDark)}
                >
                  {song.locked && (
                    <Lock size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-label="Locked" />
                  )}
                  <div className="flex-1 min-w-0">
                  <SortableSongItem
                    song={song}
                    sortableId={`entry-${song.entryId}`}
                    onEdit={onEditSong}
                    onDelete={() => onRemoveEntry(song.entryId)}
                    disableDrag={song.locked}
                    transparentBackground
                  />
                  <ExpandableNotes
                    initialValue={song.notes}
                    onSave={(notes) => onNotesChange(song.entryId, notes)}
                    placeholder="Crowd warmup"
                  />
                </div>
                <div className="relative flex-shrink-0" ref={songMenuEntryId === song.entryId ? songMenuRef : undefined}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSongMenuEntryId(songMenuEntryId === song.entryId ? null : song.entryId); }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Song menu"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {songMenuEntryId === song.entryId && (
                    <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                      {onMoveToSection && allSections.filter((s) => s.id !== section.id).length > 0 && (
                        <>
                          <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">Move to section</div>
                          {allSections.filter((s) => s.id !== section.id).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => { onMoveToSection(song.entryId, s.id); setSongMenuEntryId(null); }}
                            >
                              <Move size={14} /> {s.name}
                            </button>
                          ))}
                        </>
                      )}
                      {onToggleLock && (
                        <button
                          type="button"
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => { onToggleLock(song.entryId); setSongMenuEntryId(null); }}
                        >
                          {song.locked ? <><Unlock size={14} /> Unlock position</> : <><Lock size={14} /> Lock position</>}
                        </button>
                      )}
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => { onRemoveEntry(song.entryId); setSongMenuEntryId(null); }}
                      >
                        <Trash2 size={14} /> Remove from section
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </SortableContext>
        )}
      </div>

      <SectionSettingsDialog
        isOpen={sectionSettingsOpen}
        onClose={() => setSectionSettingsOpen(false)}
        section={section}
        onSave={async (updated) => {
          await onUpdateSection?.(updated);
          setSectionSettingsOpen(false);
        }}
      />
    </div>
  );
}
