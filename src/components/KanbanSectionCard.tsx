import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSongItem } from '../contexts/SortableSongItem';
import { EntryNotesDialog } from './EntryNotesDialog';
import { SectionSettingsDialog } from './SectionSettingsDialog';
import { getWarningsForSection } from '../utils/sectionWarnings';
import { getKeyGradientStyle, normalizeKeyForCamelot } from '../utils/keyColors';
import { getCamelotPosition } from '../constants/camelot';
import { keyToSharpDisplay } from '../utils/keyNormalization';
import { useDarkMode } from '../hooks/useTheme';
import type { Song } from '../types';
import type { ProjectWithSections, ProjectSection } from '../types';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { Plus, Music, ArrowUp, ArrowDown, AlertTriangle, MoreVertical, Settings, Trash2, Move, Lock, Unlock, Eye, FileText, ArrowDownNarrowWide, GripVertical, Mic2, Disc3, Layers3, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { ConfirmDialog } from './ui/ConfirmDialog';

export interface KanbanSectionCardProps {
  section: ProjectWithSections['sections'][number];
  projectId: string;
  onRequestAddSong: (projectId: string, sectionId: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onReorderEntries: (sectionId: string, entryIds: string[]) => void;
  onEditSong?: (song: Song) => void;
  onViewSong?: (song: Song) => void;
  onNotesChange: (entryId: string, notes: string) => void;
  onUpdateSection?: (section: ProjectSection) => Promise<void>;
  onDeleteSection?: (sectionId: string) => Promise<void>;
  allSections?: ProjectWithSections['sections'][number][];
  onMoveToSection?: (entryId: string, targetSectionId: string, targetOrderIndex?: number) => void;
  onToggleLock?: (entryId: string) => void;
  onUpdateEntryMetadata?: (
    entryId: string,
    metadata: { performanceRole?: 'vocal' | 'instrumental' | 'both'; usedInMashup?: boolean }
  ) => void;
  compactMode: boolean;
  dragHandleListeners?: SyntheticListenerMap;
  dragHandleAttributes?: DraggableAttributes;
}

export function KanbanSectionCard({
  section,
  projectId,
  onRequestAddSong,
  onRemoveEntry,
  onReorderEntries,
  onEditSong,
  onViewSong,
  onNotesChange,
  onUpdateSection,
  onDeleteSection,
  allSections = [],
  onMoveToSection,
  onToggleLock,
  onUpdateEntryMetadata,
  compactMode,
  dragHandleAttributes,
  dragHandleListeners,
}: KanbanSectionCardProps) {
  const [showWarningTooltip, setShowWarningTooltip] = useState(false);
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const [sectionSettingsOpen, setSectionSettingsOpen] = useState(false);
  const [songMenuEntryId, setSongMenuEntryId] = useState<string | null>(null);
  const [notesDialogEntryId, setNotesDialogEntryId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const songMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setSectionMenuOpen(false);
      if (songMenuRef.current && !songMenuRef.current.contains(e.target as Node)) setSongMenuEntryId(null);
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setSortMenuOpen(false);
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

  type SortOption = 'bpm-asc' | 'bpm-desc' | 'key-asc' | 'key-desc';
  const handleSortSection = (sortBy: SortOption) => {
    const sorted = [...songs];
    if (sortBy === 'bpm-asc') {
      sorted.sort((a, b) => (a.primaryBpm ?? a.bpms?.[0] ?? 0) - (b.primaryBpm ?? b.bpms?.[0] ?? 0));
    } else if (sortBy === 'bpm-desc') {
      sorted.sort((a, b) => (b.primaryBpm ?? b.bpms?.[0] ?? 0) - (a.primaryBpm ?? a.bpms?.[0] ?? 0));
    } else if (sortBy === 'key-asc') {
      sorted.sort((a, b) => {
        const posA = getCamelotPosition(normalizeKeyForCamelot(a.primaryKey ?? a.keys?.[0]) ?? '') ?? 99;
        const posB = getCamelotPosition(normalizeKeyForCamelot(b.primaryKey ?? b.keys?.[0]) ?? '') ?? 99;
        return posA - posB;
      });
    } else {
      sorted.sort((a, b) => {
        const posA = getCamelotPosition(normalizeKeyForCamelot(a.primaryKey ?? a.keys?.[0]) ?? '') ?? 99;
        const posB = getCamelotPosition(normalizeKeyForCamelot(b.primaryKey ?? b.keys?.[0]) ?? '') ?? 99;
        return posB - posA;
      });
    }
    onReorderEntries(section.id, sorted.map((s) => s.entryId));
    setSortMenuOpen(false);
  };

  const getRoleLabel = (role: 'vocal' | 'instrumental' | 'both') => {
    if (role === 'vocal') return 'Vocal';
    if (role === 'instrumental') return 'Instrumental';
    return 'Both';
  };

  return (
    <div className="bg-theme-surface-base rounded-xl shadow-sm border border-theme-border-default p-4 min-w-0 w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...dragHandleAttributes}
            {...dragHandleListeners}
            className="p-1 rounded cursor-grab active:cursor-grabbing text-theme-text-muted hover:text-theme-text-secondary touch-none"
            aria-label="Drag to reorder section"
          >
            <GripVertical size={18} />
          </button>
          <h3 className="text-lg font-medium text-theme-text-primary">{section.name}</h3>
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
          <span className="text-sm text-theme-text-secondary">{songs.length} songs</span>
          <button
            type="button"
            onClick={() => onRequestAddSong(projectId, section.id)}
            className="text-theme-accent-primary hover:text-theme-state-active p-1"
            title="Add song to section"
            aria-label="Add song"
          >
            <Plus size={16} />
          </button>
          <div className="relative" ref={sortMenuRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSortMenuOpen((o) => !o); }}
              className="p-1 text-theme-text-muted hover:text-theme-text-secondary disabled:opacity-40"
              title="Sort songs"
              aria-label="Sort songs"
              disabled={songs.length < 2}
            >
              <ArrowDownNarrowWide size={16} />
            </button>
            {sortMenuOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 w-52 bg-theme-surface-base border border-theme-border-default rounded-lg shadow-lg z-20">
                <div className="px-3 py-1.5 text-xs font-medium text-theme-text-muted border-b border-theme-border-subtle">Sort by</div>
                <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => handleSortSection('bpm-asc')}>
                  BPM (low to high)
                </button>
                <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => handleSortSection('bpm-desc')}>
                  BPM (high to low)
                </button>
                <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => handleSortSection('key-asc')}>
                  Key (low to high)
                </button>
                <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => handleSortSection('key-desc')}>
                  Key (high to low)
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSectionMenuOpen((o) => !o); }}
              className="text-theme-text-muted hover:text-theme-text-secondary p-1"
              aria-label="Section options"
            >
              <MoreVertical size={14} />
            </button>
            {sectionMenuOpen && (
              <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-theme-surface-base border border-theme-border-default rounded-lg shadow-lg z-20">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                  onClick={() => { setSectionMenuOpen(false); setSectionSettingsOpen(true); }}
                >
                  <Settings size={14} /> Section settings
                </button>
                {onDeleteSection && (
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
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[100px] space-y-2 transition-colors w-full min-w-0 ${
          isOver ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-300 dark:border-primary-600 rounded-lg' : ''
        }`}
      >
        {songs.length === 0 ? (
          <div className="text-center py-8 text-theme-text-secondary">
            <Music size={32} className="mx-auto mb-2 text-theme-text-disabled" />
            <p className="text-sm">No songs in this section</p>
            <p className="text-xs text-theme-text-muted">Drag songs here or click + to add</p>
          </div>
        ) : compactMode ? (
          <ul className="space-y-1 text-sm font-mono text-theme-text-secondary">
            {songs.map((song) => {
              const keyLabel = song.primaryKey ?? song.keys?.[0];
              return (
                <li
                  key={song.id}
                  className="flex items-center justify-between gap-2 py-1 px-2 -mx-1 rounded border-b border-theme-border-subtle"
                  style={getKeyGradientStyle(keyLabel, isDark)}
                >
                  <span className="truncate text-theme-text-primary">
                    {song.title}
                    {song.usedInMashup && <span className="ml-1 text-[10px] text-emerald-500">[USED]</span>}
                  </span>
                  <span className="flex-shrink-0 text-theme-text-secondary">
                    {song.primaryBpm ?? song.bpms?.[0] ?? '—'} | {(keyToSharpDisplay(keyLabel) || keyLabel) ?? '—'} | {getRoleLabel(song.performanceRole ?? 'both')}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : isMobile ? (
          <div className="space-y-2 w-full">
            {songs.map((song, index) => {
              const keyLabel = song.primaryKey ?? song.keys?.[0];
              const gradientStyle = getKeyGradientStyle(keyLabel, isDark);
              return (
                <div key={song.entryId} className="flex items-center gap-2 w-full">
                  <div className="flex-1 min-w-0">
                  <SortableSongItem
                    song={song}
                    sortableId={`entry-${song.entryId}`}
                    disableDrag={song.locked}
                    backgroundStyle={gradientStyle}
                    isDark={isDark}
                    showActions={false}
                    renderActions={
                      <div className="flex items-center gap-1">
                        <div className="relative" ref={songMenuEntryId === song.entryId ? songMenuRef : undefined}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSongMenuEntryId(songMenuEntryId === song.entryId ? null : song.entryId); }}
                            className="p-1 text-theme-text-muted hover:text-theme-text-secondary"
                            aria-label="Song options"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {songMenuEntryId === song.entryId && (
                            <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-theme-surface-base border border-theme-border-default rounded-lg shadow-lg z-20">
                              {onViewSong && (
                                <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => { onViewSong(song); setSongMenuEntryId(null); }}>
                                  <Eye size={14} /> View
                                </button>
                              )}
                              <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => { setNotesDialogEntryId(song.entryId); setSongMenuEntryId(null); }}>
                                <FileText size={14} /> Notes
                              </button>
                              {onMoveToSection && allSections.filter((s) => s.id !== section.id).length > 0 && (
                                <>
                                  <div className="px-3 py-1 text-xs font-medium text-theme-text-muted">Move to section</div>
                                  {allSections.filter((s) => s.id !== section.id).map((s) => (
                                    <button key={s.id} type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => { onMoveToSection(song.entryId, s.id); setSongMenuEntryId(null); }}>
                                      <Move size={14} /> {s.name}
                                    </button>
                                  ))}
                                </>
                              )}
                              {onToggleLock && (
                                <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => { onToggleLock(song.entryId); setSongMenuEntryId(null); }}>
                                  {song.locked ? <><Unlock size={14} /> Unlock position</> : <><Lock size={14} /> Lock position</>}
                                </button>
                              )}
                              {onUpdateEntryMetadata && (
                                <>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                                    onClick={() => {
                                      const current = song.performanceRole ?? 'both';
                                      const next = current === 'vocal' ? 'instrumental' : current === 'instrumental' ? 'both' : 'vocal';
                                      onUpdateEntryMetadata(song.entryId, { performanceRole: next });
                                      setSongMenuEntryId(null);
                                    }}
                                  >
                                    <Layers3 size={14} /> Role: {getRoleLabel(song.performanceRole ?? 'both')}
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                                    onClick={() => {
                                      onUpdateEntryMetadata(song.entryId, { usedInMashup: !(song.usedInMashup ?? false) });
                                      setSongMenuEntryId(null);
                                    }}
                                  >
                                    <CheckCircle2 size={14} /> {song.usedInMashup ? 'Mark unused' : 'Mark used in mashup'}
                                  </button>
                                </>
                              )}
                              <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-accent-danger hover:bg-theme-state-hover" onClick={() => { onRemoveEntry(song.entryId); setSongMenuEntryId(null); }}>
                                <Trash2 size={14} /> Remove from section
                              </button>
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={() => handleMoveUp(index)} disabled={index === 0} aria-label="Move up" className="p-1 text-theme-text-secondary hover:text-theme-text-primary disabled:opacity-30"><ArrowUp size={18} /></button>
                        <button type="button" onClick={() => handleMoveDown(index)} disabled={index === songs.length - 1} aria-label="Move down" className="p-1 text-theme-text-secondary hover:text-theme-text-primary disabled:opacity-30"><ArrowDown size={18} /></button>
                      </div>
                    }
                  />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <SortableContext items={songs.map((s) => `entry-${s.entryId}`)} strategy={verticalListSortingStrategy}>
            {songs.map((song) => {
              const keyLabel = song.primaryKey ?? song.keys?.[0];
              const gradientStyle = getKeyGradientStyle(keyLabel, isDark);
              return (
                <div key={song.entryId} className="flex items-start gap-2 rounded-lg w-full min-w-0">
                  {song.locked && (
                    <Lock size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-label="Locked" />
                  )}
                  <div className="flex-1 min-w-0">
                  <SortableSongItem
                    song={song}
                    sortableId={`entry-${song.entryId}`}
                    disableDrag={song.locked}
                    backgroundStyle={gradientStyle}
                    isDark={isDark}
                    showActions={false}
                    renderActions={
                      <div className="relative flex-shrink-0" ref={songMenuEntryId === song.entryId ? songMenuRef : undefined}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSongMenuEntryId(songMenuEntryId === song.entryId ? null : song.entryId); }}
                          className="p-1 text-theme-text-muted hover:text-theme-text-secondary"
                          aria-label="Song options"
                        >
                          <MoreVertical size={14} />
                        </button>
                        {songMenuEntryId === song.entryId && (
                          <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-theme-surface-base border border-theme-border-default rounded-lg shadow-lg z-20">
                            {onViewSong && (
                              <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => { onViewSong(song); setSongMenuEntryId(null); }}>
                                <Eye size={14} /> View
                              </button>
                            )}
                            <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => { setNotesDialogEntryId(song.entryId); setSongMenuEntryId(null); }}>
                              <FileText size={14} /> Notes
                            </button>
                            {onMoveToSection && allSections.filter((s) => s.id !== section.id).length > 0 && (
                              <>
                                <div className="px-3 py-1 text-xs font-medium text-theme-text-muted">Move to section</div>
                                {allSections.filter((s) => s.id !== section.id).map((s) => (
                                  <button key={s.id} type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => { onMoveToSection(song.entryId, s.id); setSongMenuEntryId(null); }}>
                                    <Move size={14} /> {s.name}
                                  </button>
                                ))}
                              </>
                            )}
                            {onToggleLock && (
                              <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover" onClick={() => { onToggleLock(song.entryId); setSongMenuEntryId(null); }}>
                                {song.locked ? <><Unlock size={14} /> Unlock position</> : <><Lock size={14} /> Lock position</>}
                              </button>
                            )}
                              {onUpdateEntryMetadata && (
                                <>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                                    onClick={() => {
                                      const current = song.performanceRole ?? 'both';
                                      const next = current === 'vocal' ? 'instrumental' : current === 'instrumental' ? 'both' : 'vocal';
                                      onUpdateEntryMetadata(song.entryId, { performanceRole: next });
                                      setSongMenuEntryId(null);
                                    }}
                                  >
                                    <Layers3 size={14} /> Role: {getRoleLabel(song.performanceRole ?? 'both')}
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-state-hover"
                                    onClick={() => {
                                      onUpdateEntryMetadata(song.entryId, { usedInMashup: !(song.usedInMashup ?? false) });
                                      setSongMenuEntryId(null);
                                    }}
                                  >
                                    <CheckCircle2 size={14} /> {song.usedInMashup ? 'Mark unused' : 'Mark used in mashup'}
                                  </button>
                                </>
                              )}
                            <button type="button" className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-theme-accent-danger hover:bg-theme-state-hover" onClick={() => { onRemoveEntry(song.entryId); setSongMenuEntryId(null); }}>
                              <Trash2 size={14} /> Remove from section
                            </button>
                          </div>
                        )}
                      </div>
                    }
                  />
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

      {notesDialogEntryId != null && (() => {
        const entry = songs.find((s) => s.entryId === notesDialogEntryId);
        if (!entry) return null;
        return (
          <EntryNotesDialog
            isOpen={true}
            onClose={() => setNotesDialogEntryId(null)}
            songTitle={entry.title}
            initialValue={entry.notes ?? ''}
            onSave={(notes) => { onNotesChange(entry.entryId, notes); setNotesDialogEntryId(null); }}
          />
        );
      })()}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete section?"
        message="Delete this section and remove its songs from the project?"
        confirmText="Delete"
        destructive
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          void onDeleteSection?.(section.id);
          setConfirmDeleteOpen(false);
        }}
      />
    </div>
  );
}
