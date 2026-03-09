import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSongs } from '../hooks/useSongs';
import { projectService } from '../services/projectService';
import { dexieProjectService } from '../services/database';
import { supabase } from '../lib/supabase';
import { getBackendMode } from '../lib/withFallback';
import type { ProjectWithSections, ProjectSection, Song } from '../types';
import type { ProjectType } from '../types';
import { KanbanBoard } from '../components/KanbanBoard';
import { MegamixTimeline } from '../components/MegamixTimeline';
import { SuggestionDrawer } from '../components/SuggestionDrawer';
import { ProjectOptionsMenu } from '../components/ProjectOptionsMenu';
import { SongDetailsModal } from '../components/SongDetailsModal';
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Settings, Sparkles, LayoutGrid, LayoutList, Music, X, ArrowLeft, Tag, Gauge, RotateCcw, Type, Calendar, Folder, Save, ChevronDown, ImagePlus } from 'lucide-react';
import { KEY_OPTIONS_MAJOR } from '../constants';
import { SeasonSelect, type SeasonValue } from '../components/SeasonSelect';
import { getSuggestions, getSongsForYearSeason } from '../services/smartSectionBuilder';
import { getKeyGradientStyle } from '../utils/keyColors';
import { keyToSharpDisplay } from '../utils/keyNormalization';
import { useTheme } from '../hooks/useTheme';
import { useDarkMode } from '../hooks/useTheme';
import { Footer } from '../components/Footer';
import { UserMenu } from '../components/UserMenu';
import { FloatingSelect, FloatingInput } from '../components/inputs';

const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'song-megamix', label: 'Song' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'year-end', label: 'Year-End' },
  { value: 'decade', label: 'Decade' },
  { value: 'other', label: 'Other' },
];

export function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { songs } = useSongs();
  const [project, setProject] = useState<ProjectWithSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasUnsavedRef = useRef(false);
  hasUnsavedRef.current = hasUnsavedChanges;
  const isSupabaseMode = getBackendMode() === 'supabase';

  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [targetSection, setTargetSection] = useState<{ projectId: string; sectionId: string } | null>(null);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionKey, setNewSectionKey] = useState('');
  const [newSectionBpm, setNewSectionBpm] = useState('');
  const [newSectionBpmMin, setNewSectionBpmMin] = useState('');
  const [newSectionBpmMax, setNewSectionBpmMax] = useState('');
  const [newSectionKeyRange, setNewSectionKeyRange] = useState<string[]>([]);
  const [addSectionKeyRangeOpen, setAddSectionKeyRangeOpen] = useState(false);
  const addSectionKeyRangeRef = useRef<HTMLDivElement>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsType, setSettingsType] = useState<ProjectWithSections['type']>('other');
  const [settingsYear, setSettingsYear] = useState<string>('');
  const [settingsSeason, setSettingsSeason] = useState('');
  const [settingsCoverImage, setSettingsCoverImage] = useState<string | null>(null);
  const [suggestionDrawerOpen, setSuggestionDrawerOpen] = useState(false);
  const [draggedSuggestionSong, setDraggedSuggestionSong] = useState<Song | null>(null);
  const [selectedSongForDetails, setSelectedSongForDetails] = useState<Song | null>(null);
  const [showSongDetailsModal, setShowSongDetailsModal] = useState(false);
  const [addSongSelectedIds, setAddSongSelectedIds] = useState<Set<string>>(new Set());
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
      const data = isSupabaseMode
        ? await projectService.syncSupabaseProjectToDexie(projectId)
        : await projectService.getProjectWithSections(projectId);
      setProject(data);
      setSettingsName(data.name);
      setSettingsType(data.type);
      setSettingsYear(data.year != null ? String(data.year) : '');
      setSettingsSeason(data.season ?? '');
      setSettingsCoverImage(data.coverImage && data.coverImage !== '' ? data.coverImage : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, isSupabaseMode]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  // Realtime: subscribe to project_entries when Supabase is the backend; skip refresh if user has unsaved draft
  useEffect(() => {
    if (!projectId || getBackendMode() === 'local') return;
    const REALTIME_DEBOUNCE_MS = 300;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (hasUnsavedRef.current) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void loadProject();
      }, REALTIME_DEBOUNCE_MS);
    };
    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_entries', filter: `project_id=eq.${projectId}` },
        refresh
      )
      .subscribe();
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [projectId, loadProject]);

  useEffect(() => {
    try {
      localStorage.setItem('mashhub_compact_mode', String(compactMode));
    } catch { /* ignore */ }
  }, [compactMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addSectionKeyRangeRef.current && !addSectionKeyRangeRef.current.contains(event.target as Node)) {
        setAddSectionKeyRangeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isSupabaseMode) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isSupabaseMode, hasUnsavedChanges]);

  const handleBackToProjects = () => {
    if (isSupabaseMode && hasUnsavedChanges && !window.confirm('You have unsaved changes. Leave anyway?')) {
      return;
    }
    navigate('/projects');
  };

  const refreshProjectFromDexie = useCallback(async () => {
    if (!project?.id) return;
    const data = await projectService.getProjectWithSectionsFromDexie(project.id);
    setProject(data);
  }, [project?.id]);

  const handleAddSongToSection = async (pid: string, songId: string, sectionId: string) => {
    if (isSupabaseMode && project) {
      await dexieProjectService.addSongToSection(pid, songId, sectionId);
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.addSongToSection(pid, songId, sectionId);
    await loadProject();
  };

  const handleRemoveEntry = async (entryId: string) => {
    if (isSupabaseMode && project) {
      await dexieProjectService.removeSongFromSection(entryId);
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.removeSongFromSection(entryId);
    await loadProject();
  };

  const handleReorderEntries = async (sectionId: string, entryIds: string[]) => {
    if (isSupabaseMode && project) {
      await dexieProjectService.reorderEntriesInSection(sectionId, entryIds);
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.reorderEntriesInSection(sectionId, entryIds);
    await loadProject();
  };

  const handleNotesChange = async (entryId: string, notes: string) => {
    if (isSupabaseMode && project) {
      await dexieProjectService.updateEntryNotes(entryId, notes);
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.updateEntryNotes(entryId, notes);
    await loadProject();
  };

  const handleUpdateProject = async (p: { id: string; name: string; type: ProjectWithSections['type']; createdAt: Date; year?: number; season?: string; coverImage?: string }) => {
    if (isSupabaseMode && project && project.id === p.id) {
      await dexieProjectService.update({ ...project, name: p.name, type: p.type, year: p.year, season: p.season, coverImage: p.coverImage });
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.update(p);
    setProject((prev) => (prev && prev.id === p.id ? { ...prev, name: p.name, type: p.type, year: p.year, season: p.season, coverImage: p.coverImage } : prev));
  };

  const handleSaveProjectSettings = async () => {
    if (!project || !settingsName.trim()) return;
    try {
      const yearNum = settingsYear.trim() ? parseInt(settingsYear.trim(), 10) : undefined;
      const year = yearNum != null && !Number.isNaN(yearNum) ? yearNum : undefined;
      const season = settingsSeason.trim() || undefined;
      const coverImage = settingsCoverImage ?? '';
      await handleUpdateProject({ ...project, name: settingsName.trim(), type: settingsType, year, season, coverImage });
      setShowProjectSettingsModal(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Failed to update project. Please try again.');
    }
  };

  const isDark = useDarkMode();
  useTheme(); // Keep document theme in sync when this route is mounted (e.g. direct load or after refresh)

  const handleAddSongToSectionClick = (pid: string, sectionId: string) => {
    setTargetSection({ projectId: pid, sectionId });
    setAddSongSelectedIds(new Set());
    setShowAddSongModal(true);
  };

  const getFilteredSongs = useCallback(() => {
    if (!project) return [];
    const projectTypeForFilter = project.type ?? 'other';
    const alreadyInProject = new Set(project.sections.flatMap((s) => s.songs).map((s) => s.id));

    // Base candidates: respect project season/year if applicable
    let base = songs.filter((s) => !alreadyInProject.has(s.id));
    if (projectTypeForFilter === 'seasonal' || projectTypeForFilter === 'year-end') {
      base = getSongsForYearSeason(project, base);
    }

    // Then apply section-specific harmonic constraints (BPM/key)
    if (targetSection) {
      const section = project.sections.find((s) => s.id === targetSection.sectionId);
      if (section && (section.targetBpm != null || (section.bpmRangeMin != null && section.bpmRangeMax != null) || section.targetKey != null || (section.keyRange != null && section.keyRange.length > 0))) {
        const suggested = getSuggestions(project, targetSection.sectionId, base, projectTypeForFilter, 10000);
        base = suggested.map((s) => s.song).filter((s) => !alreadyInProject.has(s.id));
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
  }, [project, songs, targetSection, songSearchQuery]);

  const handleSongSelect = async (song: Song) => {
    if (targetSection) {
      try {
        await handleAddSongToSection(targetSection.projectId, song.id, targetSection.sectionId);
        setShowAddSongModal(false);
        setTargetSection(null);
        setSongSearchQuery('');
        setAddSongSelectedIds(new Set());
      } catch (err) {
        console.error('Failed to add song:', err);
        alert('Failed to add song to section. Please try again.');
      }
    }
  };

  const handleAddSelectedSongs = async () => {
    if (!targetSection || addSongSelectedIds.size === 0) return;
    try {
      for (const songId of addSongSelectedIds) {
        await handleAddSongToSection(targetSection.projectId, songId, targetSection.sectionId);
      }
      setAddSongSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to add songs:', err);
      alert('Failed to add songs to section. Please try again.');
    }
  };

  const filteredSongsForModal = getFilteredSongs();
  const allFilteredSelected = filteredSongsForModal.length > 0 && filteredSongsForModal.every((s) => addSongSelectedIds.has(s.id));
  const someFilteredSelected = filteredSongsForModal.some((s) => addSongSelectedIds.has(s.id));
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setAddSongSelectedIds((prev) => {
        const next = new Set(prev);
        filteredSongsForModal.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setAddSongSelectedIds((prev) => {
        const next = new Set(prev);
        filteredSongsForModal.forEach((s) => next.add(s.id));
        return next;
      });
    }
  };

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
  }, [someFilteredSelected, allFilteredSelected]);

  const handleAddCustomSection = async () => {
    if (!newSectionName.trim() || !project) return;
    if (isSupabaseMode) {
      try {
        const targetBpm = newSectionBpm.trim() ? Number(newSectionBpm) : undefined;
        const bpmRangeMin = newSectionBpmMin.trim() ? Number(newSectionBpmMin) : undefined;
        const bpmRangeMax = newSectionBpmMax.trim() ? Number(newSectionBpmMax) : undefined;
        const targetKey = newSectionKey.trim() || undefined;
        const keyRange = newSectionKeyRange.length > 0 ? [...newSectionKeyRange] : undefined;
        await dexieProjectService.addSection({
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
        await refreshProjectFromDexie();
        setHasUnsavedChanges(true);
      } catch (err) {
        console.error('Failed to add section:', err);
        alert('Failed to add section. Please try again.');
      }
      return;
    }
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
    if (isSupabaseMode && project) {
      await dexieProjectService.updateSection(section);
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.updateSection(section);
    await loadProject();
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (isSupabaseMode && project) {
      await dexieProjectService.deleteSection(sectionId);
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.deleteSection(sectionId);
    await loadProject();
  };

  const handleMoveToSection = async (entryId: string, targetSectionId: string) => {
    if (isSupabaseMode && project) {
      await dexieProjectService.moveSongToSection(entryId, targetSectionId);
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.moveSongToSection(entryId, targetSectionId);
    await loadProject();
  };

  const handleToggleLock = async (entryId: string) => {
    if (isSupabaseMode && project) {
      await dexieProjectService.toggleLock(entryId);
      await refreshProjectFromDexie();
      setHasUnsavedChanges(true);
      return;
    }
    await projectService.toggleLock(entryId);
    await loadProject();
  };

  const handleSave = useCallback(async () => {
    if (!isSupabaseMode || !project) return;
    try {
      setIsSaving(true);
      const updated = await projectService.syncProjectToSupabase(project);
      setProject(updated);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save project:', err);
      alert('Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isSupabaseMode, project]);

  const handleReorderSections = useCallback(
    async (sectionIds: string[]) => {
      if (isSupabaseMode && project) {
        await dexieProjectService.reorderSections(project.id, sectionIds);
        await refreshProjectFromDexie();
        setHasUnsavedChanges(true);
        return;
      }
      await projectService.reorderSections(project!.id, sectionIds);
      await loadProject();
    },
    [isSupabaseMode, project, loadProject, refreshProjectFromDexie]
  );

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
      const activeId = String(active.id);

      if (activeId.startsWith('section-') && overId.startsWith('section-')) {
        const sections = project.sections;
        const oldIndex = sections.findIndex((s) => `section-${s.id}` === activeId);
        const newIndex = sections.findIndex((s) => `section-${s.id}` === overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(sections, oldIndex, newIndex);
          await handleReorderSections(reordered.map((s) => s.id));
        }
        return;
      }

      if (!overId.startsWith('section-')) return;
      const targetSectionId = overId.replace('section-', '');

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
    [project, handleAddSongToSection, handleRemoveEntry, handleReorderSections]
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
            {/* Logo and title – same as main page */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-music-electric to-music-cosmic rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  MashHub
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Music Library & Database
                </p>
              </div>
            </div>
            {/* Back to Projects action */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleBackToProjects}
                className="px-3 py-2.5 min-h-[44px] text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Projects
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {project.name}
            </h2>
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
            {isSupabaseMode && (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!hasUnsavedChanges || isSaving}
                className="btn-primary text-sm min-h-[44px] flex items-center gap-1"
                title={hasUnsavedChanges ? 'Save project to cloud' : 'Saved'}
              >
                <Save size={16} />
                {isSaving ? ' Saving...' : hasUnsavedChanges ? ' Save' : ' Saved'}
              </button>
            )}
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
            onReorderSections={handleReorderSections}
            onEditSong={undefined}
            onViewSong={(song) => { setSelectedSongForDetails(song); setShowSongDetailsModal(true); }}
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-theme-surface-base rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-theme-border-default">
            <div className="flex items-center justify-between p-6 border-b border-theme-border-default">
              <h3 className="text-lg font-semibold text-theme-text-primary">Add Song to Section</h3>
              <button type="button" onClick={() => { setShowAddSongModal(false); setTargetSection(null); setAddSongSelectedIds(new Set()); }} className="text-theme-text-muted hover:text-theme-text-secondary p-1 rounded">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <FloatingInput
                  label="Search songs"
                  type="text"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  placeholder="Search songs..."
                />
              </div>
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-theme-text-primary">
                  <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-theme-border-default text-theme-accent-primary"
                  />
                  <span className="text-sm font-medium">Select All</span>
                </label>
                <button
                  type="button"
                  onClick={() => void handleAddSelectedSongs()}
                  disabled={addSongSelectedIds.size === 0}
                  className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
                >
                  Add selected ({addSongSelectedIds.size})
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredSongsForModal.length === 0 ? (
                  <div className="text-center py-8 text-theme-text-muted">
                    <Music size={32} className="mx-auto mb-2 text-theme-text-disabled" />
                    <p className="text-sm">No songs found</p>
                  </div>
                ) : (
                  filteredSongsForModal.map((song) => (
                    <div
                      key={song.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md flex items-center gap-3 ${
                        addSongSelectedIds.has(song.id) ? 'border-theme-accent-primary bg-theme-state-hover' : 'border-theme-border-default'
                      }`}
                      style={getKeyGradientStyle(song.primaryKey ?? song.keys?.[0], isDark)}
                    >
                      <input
                        type="checkbox"
                        checked={addSongSelectedIds.has(song.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setAddSongSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(song.id)) next.delete(song.id);
                            else next.add(song.id);
                            return next;
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-theme-border-default text-theme-accent-primary shrink-0"
                      />
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSongSelect(song)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSongSelect(song)}
                        className="flex-1 min-w-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-theme-text-primary">
                              <span className="font-semibold">{song.title}</span>{' '}
                              <span className="font-normal text-theme-text-secondary">by {song.artist}</span>
                            </p>
                          </div>
                          <span className="text-sm text-theme-text-secondary">
                            {song.primaryBpm ?? song.bpms?.[0] ?? '—'} BPM · {keyToSharpDisplay(song.primaryKey ?? song.keys?.[0]) || '—'}
                          </span>
                        </div>
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-violet-500" />
                Add Section
              </h3>
              <button type="button" onClick={() => setShowAddSectionModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <FloatingInput
                  label="Section name"
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleAddCustomSection()}
                  placeholder="e.g. Pre-Chorus, Interlude"
                  icon={<Tag size={14} className="text-amber-500" />}
                />
              </div>
              <div>
                <FloatingSelect
                  label="Key"
                  value={newSectionKey}
                  onChange={(e) => setNewSectionKey(e.target.value)}
                  icon={<Music size={14} className="text-emerald-500" />}
                >
                  <option value="">Any</option>
                  {KEY_OPTIONS_MAJOR.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </FloatingSelect>
              </div>
              <div>
                <FloatingInput
                  label="BPM"
                  type="number"
                  min={1}
                  max={300}
                  value={newSectionBpm}
                  onChange={(e) => setNewSectionBpm(e.target.value)}
                  placeholder="e.g. 120"
                  icon={<Gauge size={14} className="text-blue-500" />}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FloatingInput
                    label="BPM Range min"
                    type="number"
                    min={1}
                    max={300}
                    value={newSectionBpmMin}
                    onChange={(e) => setNewSectionBpmMin(e.target.value)}
                    placeholder="Min"
                    icon={<Gauge size={12} className="text-blue-400" />}
                  />
                </div>
                <div>
                  <FloatingInput
                    label="BPM Range max"
                    type="number"
                    min={1}
                    max={300}
                    value={newSectionBpmMax}
                    onChange={(e) => setNewSectionBpmMax(e.target.value)}
                    placeholder="Max"
                    icon={<Gauge size={12} className="text-blue-400" />}
                  />
                </div>
              </div>
              <div className="relative" ref={addSectionKeyRangeRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Key Range
                </label>
                <button
                  type="button"
                  onClick={() => setAddSectionKeyRangeOpen(!addSectionKeyRangeOpen)}
                  className={`flex items-center justify-between gap-2 w-full px-3 py-2 border rounded-md text-sm font-medium transition-colors text-left ${
                    newSectionKeyRange.length > 0
                      ? 'bg-primary-50 border-primary-300 text-primary-700 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  aria-expanded={addSectionKeyRangeOpen}
                  aria-haspopup="listbox"
                >
                  <span>
                    {newSectionKeyRange.length === 0
                      ? 'Select keys...'
                      : newSectionKeyRange.length === 1
                        ? newSectionKeyRange[0]
                        : `${newSectionKeyRange.length} keys selected`}
                  </span>
                  <ChevronDown size={16} className={`shrink-0 ${addSectionKeyRangeOpen ? 'rotate-180' : ''}`} />
                </button>
                {addSectionKeyRangeOpen && (
                  <div
                    className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3"
                    role="listbox"
                  >
                    <div className="space-y-1">
                      {KEY_OPTIONS_MAJOR.map((keyOption) => (
                        <label
                          key={keyOption}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={newSectionKeyRange.includes(keyOption)}
                            onChange={(e) => {
                              if (e.target.checked) setNewSectionKeyRange((prev) => [...prev, keyOption]);
                              else setNewSectionKeyRange((prev) => prev.filter((x) => x !== keyOption));
                            }}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{keyOption}</span>
                        </label>
                      ))}
                    </div>
                    {newSectionKeyRange.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => setNewSectionKeyRange([])}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddSectionModal(false)} className="btn-secondary inline-flex items-center gap-2">
                  <RotateCcw size={16} className="text-gray-500" />
                  Cancel
                </button>
                <button type="button" onClick={() => void handleAddCustomSection()} disabled={!newSectionName.trim()} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={16} />
                  Add Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProjectSettingsModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings size={20} className="text-violet-500" />
                Edit project
              </h3>
              <button type="button" onClick={() => setShowProjectSettingsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                <ImagePlus size={14} className="text-violet-500" />
                Cover art
              </label>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700/50 shrink-0">
                  {settingsCoverImage ? (
                    <img src={settingsCoverImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Folder size={24} className="text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    id="settings-cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const result = reader.result;
                        if (typeof result === 'string') setSettingsCoverImage(result);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-100 file:text-primary-700 dark:file:bg-primary-900/30 dark:file:text-primary-300"
                  />
                  {settingsCoverImage && (
                    <button
                      type="button"
                      onClick={() => setSettingsCoverImage(null)}
                      className="text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400 text-left"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <FloatingInput
                  label="Project name"
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleSaveProjectSettings()}
                  icon={<Type size={14} className="text-amber-500" />}
                />
              </div>
              <div className="mb-4">
                <FloatingSelect
                  label="Type"
                  value={settingsType}
                  onChange={(e) => setSettingsType(e.target.value as ProjectType)}
                  icon={<Folder size={14} className="text-blue-500" />}
                >
                  {PROJECT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </FloatingSelect>
              </div>
              {settingsType === 'year-end' && (
                <div className="mb-4">
                  <FloatingInput
                    label="Year"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={settingsYear}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      setSettingsYear(v);
                    }}
                    placeholder="e.g. 2024"
                    icon={<Calendar size={14} className="text-amber-500" />}
                  />
                </div>
              )}
              {settingsType === 'seasonal' && (
                <>
                  <div className="mb-4">
                    <FloatingInput
                      label="Year"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={settingsYear}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '');
                        setSettingsYear(v);
                      }}
                      placeholder="e.g. 2024"
                      icon={<Calendar size={14} className="text-amber-500" />}
                    />
                  </div>
                  <div className="mb-4">
                    <SeasonSelect
                      label="Season"
                      value={settingsSeason as SeasonValue}
                      onChange={(v) => setSettingsSeason(v)}
                      placeholder="Select season"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowProjectSettingsModal(false)} className="btn-secondary inline-flex items-center gap-2">
                  <RotateCcw size={16} className="text-gray-500" />
                  Cancel
                </button>
                <button type="button" onClick={() => void handleSaveProjectSettings()} disabled={!settingsName.trim()} className="btn-primary inline-flex items-center gap-2">
                  <Save size={16} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SongDetailsModal
        isOpen={showSongDetailsModal}
        onClose={() => { setShowSongDetailsModal(false); setSelectedSongForDetails(null); }}
        song={selectedSongForDetails}
      />

      <Footer />

      <DragOverlay>
        {draggedSuggestionSong ? (
          <div className="p-3 rounded-lg border-2 border-theme-accent-primary bg-theme-surface-base shadow-lg opacity-95 w-72">
            <p className="font-medium text-theme-text-primary truncate">{draggedSuggestionSong.title}</p>
            <p className="text-xs text-theme-text-secondary truncate">{draggedSuggestionSong.artist}</p>
            <div className="mt-1 text-xs text-theme-text-muted">
              BPM: {draggedSuggestionSong.primaryBpm ?? draggedSuggestionSong.bpms?.[0] ?? '—'} | Key: {keyToSharpDisplay(draggedSuggestionSong.primaryKey ?? draggedSuggestionSong.keys?.[0]) ?? '—'}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  );
}
