import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSongs } from '../hooks/useSongs';
import { projectService } from '../services/database';
import type { ProjectWithSections, ProjectSection, Song } from '../types';
import { KanbanBoard } from '../components/KanbanBoard';
import { MegamixTimeline } from '../components/MegamixTimeline';
import { SuggestionDrawer } from '../components/SuggestionDrawer';
import { ProjectOptionsMenu } from '../components/ProjectOptionsMenu';
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { Plus, Settings, Search, Sparkles, LayoutGrid, LayoutList, Music, X, ArrowLeft } from 'lucide-react';
import { KEY_OPTIONS_ORDERED } from '../constants';
import { getSuggestions, getSongsForYearSeason } from '../services/smartSectionBuilder';
import { getKeyGradientStyle } from '../utils/keyColors';
import { useDarkMode } from '../hooks/useTheme';
import { Footer } from '../components/Footer';

export function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { songs } = useSongs();
  const [project, setProject] = useState<ProjectWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [targetSection, setTargetSection] = useState<{ projectId: string; sectionId: string } | null>(null);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionKey, setNewSectionKey] = useState('');
  const [newSectionBpm, setNewSectionBpm] = useState('');
  const [newSectionBpmMin, setNewSectionBpmMin] = useState('');
  const [newSectionBpmMax, setNewSectionBpmMax] = useState('');
  const [newSectionKeyRange, setNewSectionKeyRange] = useState<string[]>([]);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsType, setSettingsType] = useState<ProjectWithSections['type']>('other');
  const [settingsYear, setSettingsYear] = useState<string>('');
  const [settingsSeason, setSettingsSeason] = useState('');
  const [suggestionDrawerOpen, setSuggestionDrawerOpen] = useState(false);
  const [draggedSuggestionSong, setDraggedSuggestionSong] = useState<Song | null>(null);
  const [compactMode, setCompactMode] = useState(() => {
    try {
      return localStorage.getItem('mashhub_compact_mode') === 'true';
    } catch { return false; }
  });

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await projectService.getProjectWithSections(projectId);
      setProject(data);
      setSettingsName(data.name);
      setSettingsType(data.type);
      setSettingsYear(data.year != null ? String(data.year) : '');
      setSettingsSeason(data.season ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  useEffect(() => {
    try {
      localStorage.setItem('mashhub_compact_mode', String(compactMode));
    } catch { /* ignore */ }
  }, [compactMode]);

  const handleAddSongToSection = async (pid: string, songId: string, sectionId: string) => {
    await projectService.addSongToSection(pid, songId, sectionId);
    await loadProject();
  };

  const handleRemoveEntry = async (entryId: string) => {
    await projectService.removeSongFromSection(entryId);
    await loadProject();
  };

  const handleReorderEntries = async (sectionId: string, entryIds: string[]) => {
    await projectService.reorderEntriesInSection(sectionId, entryIds);
    await loadProject();
  };

  const handleNotesChange = async (entryId: string, notes: string) => {
    await projectService.updateEntryNotes(entryId, notes);
    await loadProject();
  };

  const handleUpdateProject = async (p: { id: string; name: string; type: ProjectWithSections['type']; createdAt: Date; year?: number; season?: string }) => {
    await projectService.update(p);
    setProject((prev) => (prev && prev.id === p.id ? { ...prev, name: p.name, type: p.type, year: p.year, season: p.season } : prev));
  };

  const handleSaveProjectSettings = async () => {
    if (!project || !settingsName.trim()) return;
    try {
      const yearNum = settingsYear.trim() ? parseInt(settingsYear.trim(), 10) : undefined;
      const year = yearNum != null && !Number.isNaN(yearNum) ? yearNum : undefined;
      const season = settingsSeason.trim() || undefined;
      await handleUpdateProject({ ...project, name: settingsName.trim(), type: settingsType, year, season });
      setShowProjectSettingsModal(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Failed to update project. Please try again.');
    }
  };

  const isDark = useDarkMode();

  const handleAddSongToSectionClick = (pid: string, sectionId: string) => {
    setTargetSection({ projectId: pid, sectionId });
    setShowAddSongModal(true);
  };

  const handleSongSelect = async (song: Song) => {
    if (targetSection) {
      try {
        await handleAddSongToSection(targetSection.projectId, song.id, targetSection.sectionId);
        setShowAddSongModal(false);
        setTargetSection(null);
        setSongSearchQuery('');
      } catch (err) {
        console.error('Failed to add song:', err);
        alert('Failed to add song to section. Please try again.');
      }
    }
  };

  const getFilteredSongs = () => {
    if (!project) return [];
    const projectTypeForFilter = project.type ?? 'other';

    // Base candidates: respect project season/year if applicable
    let base = songs;
    if (projectTypeForFilter === 'seasonal' || projectTypeForFilter === 'year-end') {
      base = getSongsForYearSeason(project, songs);
    }

    // Then apply section-specific harmonic constraints (BPM/key)
    if (targetSection) {
      const section = project.sections.find((s) => s.id === targetSection.sectionId);
      if (section && (section.targetBpm != null || (section.bpmRangeMin != null && section.bpmRangeMax != null) || section.targetKey != null || (section.keyRange != null && section.keyRange.length > 0))) {
        const suggested = getSuggestions(project, targetSection.sectionId, base, projectTypeForFilter, 10000);
        base = suggested.map((s) => s.song);
      }
    }

    if (!songSearchQuery.trim()) return base;
    const q = songSearchQuery.toLowerCase();
    return base.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.type && s.type.toLowerCase().includes(q)) ||
        (s.origin && s.origin.toLowerCase().includes(q)) ||
        (s.season && s.season.toLowerCase().includes(q)) ||
        (s.keys && s.keys.some((k) => k.toLowerCase().includes(q))) ||
        (s.bpms && s.bpms.some((b) => String(b).includes(q)))
    );
  };

  const handleAddCustomSection = async () => {
    if (!newSectionName.trim() || !project) return;
    try {
      const targetBpm = newSectionBpm.trim() ? Number(newSectionBpm) : undefined;
      const bpmRangeMin = newSectionBpmMin.trim() ? Number(newSectionBpmMin) : undefined;
      const bpmRangeMax = newSectionBpmMax.trim() ? Number(newSectionBpmMax) : undefined;
      const targetKey = newSectionKey.trim() || undefined;
      const keyRange = newSectionKeyRange.length > 0 ? [...newSectionKeyRange] : undefined;
      await projectService.addSection({
        projectId: project.id,
        name: newSectionName.trim(),
        orderIndex: project.sections.length,
        targetBpm,
        bpmRangeMin,
        bpmRangeMax,
        targetKey,
        keyRange,
      });
      setNewSectionName('');
      setNewSectionKey('');
      setNewSectionBpm('');
      setNewSectionBpmMin('');
      setNewSectionBpmMax('');
      setNewSectionKeyRange([]);
      setShowAddSectionModal(false);
      await loadProject();
    } catch (err) {
      console.error('Failed to add section:', err);
      alert('Failed to add section. Please try again.');
    }
  };

  const handleUpdateSection = async (section: ProjectSection) => {
    await projectService.updateSection(section);
    await loadProject();
  };

  const handleDeleteSection = async (sectionId: string) => {
    await projectService.deleteSection(sectionId);
    await loadProject();
  };

  const handleMoveToSection = async (entryId: string, targetSectionId: string) => {
    await projectService.moveSongToSection(entryId, targetSectionId);
    await loadProject();
  };

  const handleToggleLock = async (entryId: string) => {
    await projectService.toggleLock(entryId);
    await loadProject();
  };

  const handleWorkspaceDragStart = useCallback(
    (event: DragStartEvent) => {
      const activeId = String(event.active.id);
      if (activeId.startsWith('suggestion-')) {
        const songId = activeId.replace('suggestion-', '');
        const song = songs.find((s) => s.id === songId) ?? null;
        setDraggedSuggestionSong(song);
      }
    },
    [songs]
  );

  const handleWorkspaceDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggedSuggestionSong(null);
      if (!over || !project) return;
      const overId = String(over.id);
      if (!overId.startsWith('section-')) return;
      const targetSectionId = overId.replace('section-', '');

      const activeId = String(active.id);
      if (activeId.startsWith('suggestion-')) {
        const songId = activeId.replace('suggestion-', '');
        await handleAddSongToSection(project.id, songId, targetSectionId);
        return;
      }
      if (activeId.startsWith('entry-')) {
        const entryId = activeId.replace('entry-', '');
        const sourceSection = project.sections.find((s) => s.songs.some((song) => song.entryId === entryId));
        if (sourceSection && sourceSection.id !== targetSectionId) {
          const songId = sourceSection.songs.find((s) => s.entryId === entryId)?.id;
          if (songId) {
            await handleRemoveEntry(entryId);
            await handleAddSongToSection(project.id, songId, targetSectionId);
          }
        }
      }
    },
    [project, handleAddSongToSection, handleRemoveEntry]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error ?? 'Project not found'}</p>
          <Link to="/projects" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const projectType = project.type ?? 'other';

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleWorkspaceDragStart}
      onDragEnd={handleWorkspaceDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and project title, styled like main page header */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-music-electric to-music-cosmic rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  MashHub Project Workspace
                </p>
              </div>
            </div>
            {/* Back to Projects action */}
            <div className="flex items-center space-x-2">
              <Link
                to="/projects"
                className="px-3 py-2.5 min-h-[44px] text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Projects
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Created: {project.createdAt instanceof Date ? project.createdAt.toLocaleDateString() : new Date(project.createdAt).toLocaleDateString()} ·{' '}
              {project.sections.reduce((sum, s) => sum + s.songs.length, 0)} songs
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddSectionModal(true)}
              className="btn-primary text-sm min-h-[44px] flex items-center gap-1"
            >
              <Plus size={16} /> Add Section
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsName(project.name);
                setSettingsType(project.type);
                setSettingsYear(project.year != null ? String(project.year) : '');
                setSettingsSeason(project.season ?? '');
                setShowProjectSettingsModal(true);
              }}
              className="btn-secondary text-sm min-h-[44px] flex items-center gap-1"
              aria-label="Project settings"
            >
              <Settings size={16} /> Settings
            </button>
            <button
              type="button"
              onClick={() => setSuggestionDrawerOpen(true)}
              className="btn-secondary text-sm min-h-[44px] flex items-center gap-1"
            >
              <Sparkles size={16} /> Suggest Songs
            </button>
            <button
              type="button"
              onClick={() => setCompactMode((c) => !c)}
              className="btn-secondary text-sm min-h-[44px] flex items-center gap-1"
              title={compactMode ? 'Normal view' : 'Compact view'}
            >
              {compactMode ? <LayoutList size={16} /> : <LayoutGrid size={16} />}
              {compactMode ? ' Normal' : ' Compact'}
            </button>
            <ProjectOptionsMenu project={project} />
          </div>
        </div>

        {projectType === 'song-megamix' ? (
          <MegamixTimeline
            project={project}
            onRequestAddSong={handleAddSongToSectionClick}
            onAddSong={handleAddSongToSection}
            onRemoveEntry={handleRemoveEntry}
            onReorderEntries={handleReorderEntries}
            onEditSong={undefined}
          />
        ) : (
          <KanbanBoard
            project={project}
            onRequestAddSong={handleAddSongToSectionClick}
            onAddSong={handleAddSongToSection}
            onRemoveEntry={handleRemoveEntry}
            onReorderEntries={handleReorderEntries}
            onEditSong={undefined}
            onNotesChange={handleNotesChange}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onMoveToSection={handleMoveToSection}
            onToggleLock={handleToggleLock}
            compactMode={compactMode}
            projectType={projectType}
          />
        )}
      </main>

      <SuggestionDrawer
        isOpen={suggestionDrawerOpen}
        onClose={() => setSuggestionDrawerOpen(false)}
        targetSectionId={project.sections?.[0]?.id ?? null}
        project={project}
        allSongs={songs}
        onAddSong={async (pid, songId, sectionId) => {
          await handleAddSongToSection(pid, songId, sectionId);
        }}
      />

      {showAddSongModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Song to Section</h3>
              <button type="button" onClick={() => setShowAddSongModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  placeholder="Search songs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredSongs().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Music size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No songs found</p>
                  </div>
                ) : (
                  getFilteredSongs().map((song) => (
                    <div
                      key={song.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSongSelect(song)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSongSelect(song)}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-shadow hover:shadow-md"
                      style={getKeyGradientStyle(song.primaryKey ?? song.keys?.[0], isDark)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{song.title}</p>
                          <p className="text-sm text-gray-500">{song.artist}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {song.primaryBpm ?? song.bpms?.[0] ?? '—'} BPM · {song.primaryKey ?? song.keys?.[0] ?? '—'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Section</h3>
              <button type="button" onClick={() => setShowAddSectionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Section name</label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleAddCustomSection()}
                  placeholder="e.g. Pre-Chorus, Interlude"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key</label>
                <select
                  value={newSectionKey}
                  onChange={(e) => setNewSectionKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Any</option>
                  {KEY_OPTIONS_ORDERED.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BPM</label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={newSectionBpm}
                  onChange={(e) => setNewSectionBpm(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BPM Range min</label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={newSectionBpmMin}
                    onChange={(e) => setNewSectionBpmMin(e.target.value)}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BPM Range max</label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={newSectionBpmMax}
                    onChange={(e) => setNewSectionBpmMax(e.target.value)}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Range</label>
                <div className="flex flex-wrap gap-2">
                  {KEY_OPTIONS_ORDERED.map((k) => (
                    <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSectionKeyRange.includes(k)}
                        onChange={(e) => {
                          if (e.target.checked) setNewSectionKeyRange((prev) => [...prev, k]);
                          else setNewSectionKeyRange((prev) => prev.filter((x) => x !== k));
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{k}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddSectionModal(false)} className="btn-secondary">Cancel</button>
                <button type="button" onClick={() => void handleAddCustomSection()} disabled={!newSectionName.trim()} className="btn-primary">Add Section</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit project</h3>
              <button type="button" onClick={() => setShowProjectSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project name</label>
              <input
                type="text"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleSaveProjectSettings()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              />
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</span>
              <div className="flex flex-wrap gap-3 mb-4">
                {(['seasonal', 'year-end', 'song-megamix', 'other'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="settingsType" checked={settingsType === t} onChange={() => setSettingsType(t)} />
                    <span className="text-sm capitalize">{t.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
              {settingsType === 'year-end' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={settingsYear}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      setSettingsYear(v);
                    }}
                    placeholder="e.g. 2024"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              {settingsType === 'seasonal' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={settingsYear}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '');
                        setSettingsYear(v);
                      }}
                      placeholder="e.g. 2024"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Season</label>
                    <select
                      value={settingsSeason}
                      onChange={(e) => setSettingsSeason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select season</option>
                      {(['Winter', 'Spring', 'Summer', 'Fall'] as const).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowProjectSettingsModal(false)} className="btn-secondary">Cancel</button>
                <button type="button" onClick={() => void handleSaveProjectSettings()} disabled={!settingsName.trim()} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <DragOverlay>
        {draggedSuggestionSong ? (
          <div className="p-3 rounded-lg border-2 border-primary-500 bg-white dark:bg-gray-800 shadow-lg opacity-95 w-72">
            <p className="font-medium text-gray-900 dark:text-white truncate">{draggedSuggestionSong.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{draggedSuggestionSong.artist}</p>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              BPM: {draggedSuggestionSong.primaryBpm ?? draggedSuggestionSong.bpms?.[0] ?? '—'} | Key: {draggedSuggestionSong.primaryKey ?? draggedSuggestionSong.keys?.[0] ?? '—'}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
}
