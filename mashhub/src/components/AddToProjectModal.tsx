import { useState } from 'react';
import type { Song } from '../types';
import { X, Plus, Folder, Music, Search } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  sections: {
    [sectionName: string]: Song[];
  };
}

interface AddToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  projects: Project[];
  onCreateProject: (name: string) => Promise<void>;
  onAddSongToProject: (projectId: string, songId: string, sectionName: string) => Promise<void>;
}

const defaultSections = ['Intro', 'Main', 'Outro', 'Bridge', 'Chorus', 'Verse', 'Break', 'Drop', 'Build', 'Ending'];

export function AddToProjectModal({
  isOpen,
  onClose,
  song,
  projects,
  onCreateProject,
  onAddSongToProject
}: AddToProjectModalProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  if (!isOpen || !song) return null;

  const handleAddToProject = async () => {
    if (selectedProject && selectedSection) {
      try {
        await onAddSongToProject(selectedProject.id, song.id, selectedSection);
        onClose();
        resetForm();
      } catch (error) {
        console.error('Failed to add song to project:', error);
        alert('Failed to add song to project. Please try again.');
      }
    }
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        await onCreateProject(newProjectName.trim());
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
    setSelectedSection('');
    setNewProjectName('');
    setShowCreateProject(false);
    setProjectSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Song to Project</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
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
                          {Object.values(project.sections).flat().length} songs
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
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Choose a section...</option>
                    {defaultSections.map((section) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="btn-secondary"
                >
                  <Plus size={16} className="mr-1" />
                  Create New Project
                </button>
                <button
                  onClick={handleAddToProject}
                  disabled={!selectedProject || !selectedSection}
                  className="btn-primary"
                >
                  Add to Project
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter project name"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setShowCreateProject(false)}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className="btn-primary"
                >
                  Create Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
