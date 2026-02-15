import { useState } from 'react';
import { DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent, closestCenter } from '@dnd-kit/core';
import { ProjectSection } from './ProjectSection';
import type { Song } from '../types';
import { Plus, Folder, Music, Trash2, X, Settings, Search } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Sheet, SheetContent } from './ui/Sheet';

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  sections: {
    [sectionName: string]: Song[];
  };
}

interface EnhancedProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  allSongs: Song[];
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddSongToProject: (projectId: string, songId: string, sectionName: string) => Promise<void>;
  onRemoveSongFromProject: (projectId: string, songId: string) => Promise<void>;
  onReorderSongs: (projectId: string, sectionName: string, songIds: string[]) => Promise<void>;
  onEditSong?: (song: Song) => void;
  onRefresh?: () => void;
}

export function EnhancedProjectManager({
  isOpen,
  onClose,
  projects,
  allSongs,
  onCreateProject,
  onDeleteProject,
  onAddSongToProject,
  onRemoveSongFromProject,
  onReorderSongs,
  onEditSong,
  onRefresh
}: EnhancedProjectManagerProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [targetSection, setTargetSection] = useState<{ projectId: string; sectionName: string } | null>(null);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  const isMobile = useIsMobile();

  if (!isOpen) return null;

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        await onCreateProject(newProjectName.trim());
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

  const handleAddSongToSection = (projectId: string, sectionName: string) => {
    setTargetSection({ projectId, sectionName });
    setShowAddSongModal(true);
  };

  const handleSongSelect = async (song: Song) => {
    if (targetSection) {
      try {
        await onAddSongToProject(targetSection.projectId, song.id, targetSection.sectionName);
        setShowAddSongModal(false);
        setTargetSection(null);
        setSongSearchQuery('');
        // Refresh the project data to show the new song
        onRefresh?.();
      } catch (error) {
        console.error('Failed to add song to project:', error);
        alert('Failed to add song to project. Please try again.');
      }
    }
  };

  const getFilteredSongs = () => {
    if (!songSearchQuery.trim()) return allSongs;
    
    const query = songSearchQuery.toLowerCase();
    return allSongs.filter(song => 
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
      // Add the new section to the project
      const updatedProject = {
        ...selectedProject,
        sections: {
          ...selectedProject.sections,
          [newSectionName.trim()]: []
        }
      };
      setSelectedProject(updatedProject);
      setNewSectionName('');
      setShowAddSectionModal(false);
    }
  };

  const getProjectSections = () => {
    if (!selectedProject) return defaultSections;
    
    const existingSections = Object.keys(selectedProject.sections);
    const allSections = [...new Set([...defaultSections, ...existingSections])];
    return allSections;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const song = allSongs.find(s => s.id === active.id);
    setActiveSong(song || null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over logic if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    
    if (!over) {
      setActiveSong(null);
      return;
    }

    // Handle dropping on project sections
    if (over.id.toString().startsWith('section-')) {
      const [projectId, sectionName] = over.id.toString().replace('section-', '').split('-');
      if (activeSong) {
        onAddSongToProject(projectId, activeSong.id, sectionName);
      }
    }

    setActiveSong(null);
  };

  const defaultSections = ['Intro', 'Main', 'Outro', 'Bridge', 'Chorus', 'Verse', 'Break', 'Drop', 'Build', 'Ending'];

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
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Project name"
              />
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
                    {Object.values(project.sections).flat().length} songs
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
                      <button className="btn-secondary text-sm min-h-[44px]">
                        <Settings size={16} className="mr-1" />
                        Settings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Created: {selectedProject.createdAt.toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Songs: {Object.values(selectedProject.sections).flat().length}
                  </p>
                </div>

                <DndContext
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                >
                  <div className="space-y-4">
                    {getProjectSections().map((sectionName) => (
                      <ProjectSection
                        key={sectionName}
                        sectionName={sectionName}
                        songs={selectedProject.sections[sectionName] || []}
                        projectId={selectedProject.id}
                        onAddSong={handleAddSongToSection}
                        onEditSong={onEditSong}
                        onRemoveSong={onRemoveSongFromProject}
                        onReorderSongs={onReorderSongs}
                      />
                    ))}
                  </div>
                </DndContext>
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

      {/* Add Song Modal */}
      {showAddSongModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Add Song to Project</h3>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Search songs by title, artist, type, origin, season, key, or BPM..."
                  />
                </div>
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
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Music size={16} className="text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{song.title}</p>
                          <p className="text-sm text-gray-500">{song.artist}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Name
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSection()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
    </div>
  );
}