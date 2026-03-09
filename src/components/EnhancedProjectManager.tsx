import { useState, useEffect } from 'react';
import { KanbanBoard } from './KanbanBoard';
import { MegamixTimeline } from './MegamixTimeline';
import { SuggestionDrawer } from './SuggestionDrawer';
import { ProjectOptionsMenu } from './ProjectOptionsMenu';
import type { Song, ProjectType, ProjectWithSections } from '../types';
import { Plus, Folder, Music, Trash2, X, Settings, Search, Sparkles, LayoutGrid, LayoutList } from 'lucide-react';
import { getSuggestions, getSongsForYearSeason } from '../services/smartSectionBuilder';
import { useIsMobile } from '../hooks/useMediaQuery';
import { getKeyGradientStyle } from '../utils/keyColors';
import { useDarkMode } from '../hooks/useTheme';
import { FloatingInput } from './inputs/FloatingInput';

interface EnhancedProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectWithSections[];
  allSongs: Song[];
  onCreateProject: (name: string, type?: ProjectType) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddSongToSection: (projectId: string, songId: string, sectionId: string) => Promise<void>;
  onRemoveSongFromProject?: (projectId: string, songId: string) => Promise<void>;
  onRemoveEntry: (entryId: string) => Promise<void>;
  onReorderEntries: (sectionId: string, entryIds: string[]) => Promise<void>;
  onNotesChange?: (entryId: string, notes: string) => void;
  onEditSong?: (song: Song) => void;
  onRefresh?: () => void;
  onUpdateProject?: (project: { id: string; name: string; type: ProjectType; createdAt: Date }) => Promise<void>;
}

export function EnhancedProjectManager({
  isOpen,
  onClose,
  projects,
  allSongs,
  onCreateProject,
  onDeleteProject,
  onAddSongToSection,
  onRemoveEntry,
  onReorderEntries,
  onNotesChange,
  onEditSong,
  onRefresh,
  onUpdateProject,
}: EnhancedProjectManagerProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectWithSections | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('other');
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [targetSection, setTargetSection] = useState<{ projectId: string; sectionId: string } | null>(null);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [showProjectSettingsModal, setShowProjectSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsType, setSettingsType] = useState<ProjectType>('other');
  const [suggestionDrawerOpen, setSuggestionDrawerOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(() => {
    try {
      return localStorage.getItem('mashhub_compact_mode') === 'true';
    } catch { return false; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mashhub_compact_mode', String(compactMode));
    } catch { /* ignore */ }
  }, [compactMode]);

  const isMobile = useIsMobile();
  const isDark = useDarkMode();

  if (!isOpen) return null;

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        await onCreateProject(newProjectName.trim(), newProjectType);
        setNewProjectName('');
      } catch (error) {
        console.error('Failed to create project:', error);
        alert('Failed to create project. Please try again.');
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? All songs will be removed.')) {
      try {
        await onDeleteProject(projectId);
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleSaveProjectSettings = async () => {
    if (!selectedProject || !onUpdateProject || !settingsName.trim()) return;
    try {
      await onUpdateProject({ ...selectedProject, name: settingsName.trim(), type: settingsType });
      setSelectedProject(prev => prev ? { ...prev, name: settingsName.trim(), type: settingsType } : null);
      onRefresh?.();
      setShowProjectSettingsModal(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleAddSongToSectionClick = (projectId: string, sectionId: string) => {
    setTargetSection({ projectId, sectionId });
    setShowAddSongModal(true);
  };

  const handleSongSelect = async (song: Song) => {
    if (targetSection) {
      try {
        await onAddSongToSection(targetSection.projectId, song.id, targetSection.sectionId);
        setShowAddSongModal(false);
        setTargetSection(null);
        setSongSearchQuery('');
        onRefresh?.();
      } catch (error) {
        console.error('Failed to add song to section:', error);
        alert('Failed to add song to section. Please try again.');
      }
    }
  };

  const getFilteredSongs = () => {
    if (!selectedProject || !targetSection) return [];

    const projectTypeForFilter = selectedProject.type ?? 'other';

    // Base candidates: respect project season/year if applicable
    let base = allSongs;
    if (projectTypeForFilter === 'seasonal' || projectTypeForFilter === 'year-end') {
      base = getSongsForYearSeason(selectedProject, allSongs);
    }

    // Then apply section-specific harmonic constraints (BPM/key)
    const section = selectedProject.sections.find((s) => s.id === targetSection.sectionId);
    if (section && (section.targetBpm != null || (section.bpmRangeMin != null && section.bpmRangeMax != null) || section.targetKey != null || (section.keyRange != null && section.keyRange.length > 0))) {
      const suggested = getSuggestions(selectedProject, section.id, base, projectTypeForFilter, 10000);
      base = suggested.map((s) => s.song);
    }

    if (!songSearchQuery.trim()) return base;

    const query = songSearchQuery.toLowerCase();
    return base.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.type.toLowerCase().includes(query) ||
      song.origin.toLowerCase().includes(query) ||
      song.season.toLowerCase().includes(query) ||
      song.keys.some(key => key.toLowerCase().includes(query)) ||
      song.bpms.some(bpm => bpm.toString().includes(query))
    );
  };

  const handleAddCustomSection = () => {
    if (newSectionName.trim() && selectedProject) {
      const updatedProject = {
        ...selectedProject,
        sections: [
          ...selectedProject.sections,
          { id: '', projectId: selectedProject.id, name: newSectionName.trim(), orderIndex: selectedProject.sections.length, songs: [] },
        ],
      };
      setSelectedProject(updatedProject);
      setNewSectionName('');
      setShowAddSectionModal(false);
    }
  };

  const projectType = selectedProject?.type ?? 'other';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Project Manager</h2>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            aria-label="Close"
          >
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[600px] md:h-[600px]">
          {/* Projects List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-medium text-gray-900">Projects</h3>
              <button
                onClick={handleCreateProject}
                className={`btn-primary text-sm ${isMobile ? 'p-2 min-w-[44px] min-h-[44px]' : ''}`}
                title={isMobile ? 'New Project' : undefined}
              >
                <Plus size={16} className={isMobile ? '' : 'mr-1'} />
                {!isMobile && 'New'}
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <FloatingInput
                label="Project name"
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                placeholder="Project name"
              />
              <div className="flex flex-wrap gap-3 items-center">
                <span className="text-sm text-gray-600">Type:</span>
                {(['seasonal', 'year-end', 'song-megamix', 'other'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="projectType"
                      checked={newProjectType === t}
                      onChange={() => setNewProjectType(t)}
                      className="rounded-full"
                    />
                    <span className="text-sm">{t === 'seasonal' ? 'Seasonal' : t === 'year-end' ? 'Year-End' : t === 'song-megamix' ? 'Song Megamix' : 'Other'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Folder size={16} className="text-gray-500" />
                      <span className="font-medium text-gray-900">{project.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {project.sections.reduce((sum, s) => sum + s.songs.length, 0)} songs
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div className="flex-1 p-4 md:p-4 overflow-y-auto">
            {selectedProject ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedProject.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => setShowAddSectionModal(true)}
                        className="btn-primary text-sm min-h-[44px]"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Section
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedProject) {
                            setSettingsName(selectedProject.name);
                            setSettingsType(selectedProject.type);
                            setShowProjectSettingsModal(true);
                          }
                        }}
                        className="btn-secondary text-sm min-h-[44px]"
                        aria-label="Project settings"
                      >
                        <Settings size={16} className="mr-1" />
                        Settings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Created: {selectedProject.createdAt instanceof Date ? selectedProject.createdAt.toLocaleDateString() : new Date(selectedProject.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Songs: {selectedProject.sections.reduce((sum, s) => sum + s.songs.length, 0)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
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
                  <ProjectOptionsMenu project={selectedProject} />
                </div>

                {projectType === 'song-megamix' ? (
                  <MegamixTimeline
                    project={selectedProject}
                    onRequestAddSong={handleAddSongToSectionClick}
                    onAddSong={onAddSongToSection}
                    onRemoveEntry={onRemoveEntry}
                    onReorderEntries={onReorderEntries}
                    onEditSong={onEditSong ?? (() => {})}
                  />
                ) : (
                  <KanbanBoard
                    project={selectedProject}
                    onRequestAddSong={handleAddSongToSectionClick}
                    onAddSong={onAddSongToSection}
                    onRemoveEntry={onRemoveEntry}
                    onReorderEntries={onReorderEntries}
                    onEditSong={undefined}
                    onNotesChange={onNotesChange ?? (() => {})}
                    compactMode={compactMode}
                    projectType={projectType}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Folder size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Select a project to view details</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-4 md:p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary w-full md:w-auto min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>

      <SuggestionDrawer
        isOpen={suggestionDrawerOpen}
        onClose={() => setSuggestionDrawerOpen(false)}
        targetSectionId={selectedProject?.sections?.[0]?.id ?? null}
        project={selectedProject}
        allSongs={allSongs}
        onAddSong={async (projectId, songId, sectionId) => {
          await onAddSongToSection(projectId, songId, sectionId);
          onRefresh?.();
        }}
      />

      {/* Add Song Modal */}
      {showAddSongModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Song to Section</h3>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <FloatingInput
                  label="Search songs by title, artist, type, origin, season, key, or BPM"
                  type="text"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  placeholder="Search songs..."
                  icon={<Search size={16} className="text-gray-400" />}
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredSongs().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Music size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No songs found matching your search</p>
                  </div>
                ) : (
                  getFilteredSongs().map((song) => (
                    <div
                      key={song.id}
                      onClick={() => handleSongSelect(song)}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer transition-shadow hover:shadow-md"
                      style={getKeyGradientStyle(song.primaryKey ?? song.keys?.[0], isDark)}
                    >
                      <div className="flex items-center space-x-3">
                        <Music size={16} className="text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-semibold">{song.title}</span>{' '}
                            <span className="font-normal text-gray-500">by {song.artist}</span>
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {song.primaryBpm || song.bpms[0]} BPM, {song.primaryKey || song.keys[0]}
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

      {/* Add Custom Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Custom Section</h3>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <FloatingInput
                  label="Section Name"
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSection()}
                  placeholder="Enter section name (e.g., 'Pre-Chorus', 'Interlude')"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddSectionModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomSection}
                  className="btn-primary"
                  disabled={!newSectionName.trim()}
                >
                  Add Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Settings Modal */}
      {showProjectSettingsModal && selectedProject && onUpdateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Edit project</h3>
              <button
                onClick={() => setShowProjectSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <FloatingInput
                  label="Project name"
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && void handleSaveProjectSettings()}
                  placeholder="Project name"
                />
              </div>
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-2">Type</span>
                <div className="flex flex-wrap gap-3">
                  {(['seasonal', 'year-end', 'song-megamix', 'other'] as const).map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="settingsType"
                        checked={settingsType === t}
                        onChange={() => setSettingsType(t)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm capitalize">{t.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowProjectSettingsModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleSaveProjectSettings()}
                  className="btn-primary"
                  disabled={!settingsName.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}