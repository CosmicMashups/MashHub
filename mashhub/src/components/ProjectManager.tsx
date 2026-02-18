import { useState } from 'react';
import { Plus, Folder, Music, Trash2, Edit3, X } from 'lucide-react';
import type { Project } from '../types';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onCreateProject: (name: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export function ProjectManager({ 
  isOpen, 
  onClose, 
  projects, 
  onCreateProject, 
  onDeleteProject 
}: ProjectManagerProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

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
    if (window.confirm('Are you sure you want to delete this project?')) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Project Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex h-96">
          {/* Projects List */}
          <div className="w-1/3 border-r border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Projects</h3>
              <button
                onClick={handleCreateProject}
                className="btn-primary text-sm"
              >
                <Plus size={16} className="mr-1" />
                New
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
                    Created {project.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div className="flex-1 p-4">
            {selectedProject ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedProject.name}
                  </h3>
                  <button className="btn-secondary text-sm">
                    <Edit3 size={16} className="mr-1" />
                    Edit
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Created: {selectedProject.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Project Details</h4>
                  <div className="text-center py-8 text-gray-500">
                    <Music size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>Song management coming soon</p>
                    <p className="text-sm">This feature will be implemented in a future update</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Folder size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Select a project to view details</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}