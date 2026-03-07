import { useState } from 'react';
import type { Song, ProjectType, ProjectWithSections } from '../types';
import { X, Plus, Folder, Music, Search } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Sheet, SheetContent } from './ui/Sheet';

interface AddToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  projects: ProjectWithSections[];
  onCreateProject: (name: string, type?: ProjectType) => Promise<void>;
  onAddSongToSection: (projectId: string, songId: string, sectionId: string) => Promise<void>;
}

export function AddToProjectModal({
  isOpen,
  onClose,
  song,
  projects,
  onCreateProject,
  onAddSongToSection
}: AddToProjectModalProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectWithSections | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('other');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  const isMobile = useIsMobile();

  if (!isOpen || !song) return null;

  const handleAddToProject = async () => {
    if (selectedProject && selectedSectionId && song) {
      try {
        await onAddSongToSection(selectedProject.id, song.id, selectedSectionId);
        onClose();
        resetForm();
      } catch (error) {
        console.error('Failed to add song to section:', error);
        alert('Failed to add song to section. Please try again.');
      }
    }
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        await onCreateProject(newProjectName.trim(), newProjectType);
        setNewProjectName('');
        setShowCreateProject(false);
      } catch (error) {
        console.error('Failed to create project:', error);
        alert('Failed to create project. Please try again.');
      }
    }
  };

  const getFilteredProjects = () => {
    if (!projectSearchQuery.trim()) return projects;
    
    const query = projectSearchQuery.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(query)
    );
  };

  const resetForm = () => {
    setSelectedProject(null);
    setSelectedSectionId('');
    setNewProjectName('');
    setNewProjectType('other');
    setShowCreateProject(false);
    setProjectSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Content component (shared between mobile and desktop)
  const ModalContent = () => (
    <>
      <div className="flex items-center justify-between p-4 md:p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Add Song to Section</h3>
        <button
          onClick={handleClose}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          aria-label="Close"
        >
          <X size={20} className="md:w-6 md:h-6" />
        </button>
      </div>

        <div className="p-6">
          {/* Song Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Music size={20} className="text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{song.title}</p>
                <p className="text-sm text-gray-500">{song.artist}</p>
              </div>
            </div>
          </div>

          {!showCreateProject ? (
            <div>
              {/* Project Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project
                </label>
                <div className="relative mb-2">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Search projects..."
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {getFilteredProjects().length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Folder size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No projects found</p>
                    </div>
                  ) : (
                    getFilteredProjects().map((project) => (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedProject?.id === project.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Folder size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-900">{project.name}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-6">
                          {project.sections.reduce((sum, s) => sum + s.songs.length, 0)} songs
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section Selection */}
              {selectedProject && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Section
                  </label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Choose a section...</option>
                    {selectedProject.sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="btn-secondary w-full sm:w-auto min-h-[44px]"
                >
                  <Plus size={16} className="mr-1" />
                  Create New Project
                </button>
                <button
                  onClick={handleAddToProject}
                  disabled={!selectedProject || !selectedSectionId}
                  className="btn-primary w-full sm:w-auto min-h-[44px]"
                >
                  Add to Section
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Create New Project */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                  placeholder="Enter project name"
                />
              </div>
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-2">Project type</span>
                <div className="flex flex-wrap gap-3">
                  {(['seasonal', 'year-end', 'song-megamix', 'other'] as const).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="newProjectType"
                        checked={newProjectType === t}
                        onChange={() => setNewProjectType(t)}
                        className="rounded-full"
                      />
                      <span className="text-sm">{t === 'seasonal' ? 'Seasonal' : t === 'year-end' ? 'Year-End' : t === 'song-megamix' ? 'Song Megamix' : 'Other'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <button
                  onClick={() => setShowCreateProject(false)}
                  className="btn-secondary w-full sm:w-auto min-h-[44px]"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="btn-primary w-full sm:w-auto min-h-[44px]"
                >
                  Create Project
                </button>
              </div>
            </div>
          )}
        </div>
    </>
  );

  // Mobile: Use Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[85vh] p-0 flex flex-col"
          showDragHandle
        >
          <div className="flex-1 overflow-y-auto bg-white">
            <ModalContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use centered dialog
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <ModalContent />
      </div>
    </div>
  );
}
