import { useEffect, useState } from 'react';
import type { Song, ProjectType, ProjectWithSections } from '../types';
import { X, Plus, Folder, Music, Type, LayoutList, ArrowLeft, FolderPlus } from 'lucide-react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Sheet, SheetContent } from './ui/Sheet';
import { FloatingInput } from './inputs';
import { ButtonLoader } from './loading/ButtonLoader';

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
  const [pendingCreatedProjectName, setPendingCreatedProjectName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const isMobile = useIsMobile();

  const handleAddToProject = async () => {
    if (selectedProject && selectedSectionId && song) {
      try {
        setIsAdding(true);
        await onAddSongToSection(selectedProject.id, song.id, selectedSectionId);
        onClose();
        resetForm();
      } catch (error) {
        console.error('Failed to add song to section:', error);
        setFormError('Failed to add song to section. Please try again.');
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        setIsCreatingProject(true);
        await onCreateProject(newProjectName.trim(), newProjectType);
        setPendingCreatedProjectName(newProjectName.trim());
        setNewProjectName('');
        setShowCreateProject(false);
      } catch (error) {
        console.error('Failed to create project:', error);
        setFormError('Failed to create project. Please try again.');
      } finally {
        setIsCreatingProject(false);
      }
    }
  };

  useEffect(() => {
    if (!pendingCreatedProjectName) return;
    const created = projects.find(
      (project) => project.name.toLowerCase() === pendingCreatedProjectName.toLowerCase()
    );
    if (!created) return;
    setSelectedProject(created);
    setSelectedSectionId(created.sections[0]?.id ?? '');
    setProjectSearchQuery(created.name);
    setPendingCreatedProjectName(null);
  }, [pendingCreatedProjectName, projects]);

  if (!isOpen || !song) return null;

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
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Content component (shared between mobile and desktop)
  const ModalContent = () => (
    <div className="bg-theme-surface-base text-theme-text-primary">
      <div className="flex items-center justify-between p-4 md:p-6 border-b">
        <h3 className="text-lg font-semibold text-theme-text-primary">Add Song to Section</h3>
        <button
          onClick={handleClose}
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-theme-text-muted hover:text-theme-text-secondary rounded-md transition-colors"
          aria-label="Close"
        >
          <X size={20} className="md:w-6 md:h-6" />
        </button>
      </div>

        <div className="p-6">
          {/* Song Info */}
          <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
            <div className="flex items-center space-x-3">
              <Music size={20} className="text-theme-text-muted" />
              <div>
                <p className="text-sm text-theme-text-primary">
                  <span className="font-semibold">{song.title}</span>{' '}
                  <span className="font-normal text-theme-text-secondary">by {song.artist || 'Unknown Artist'}</span>
          {formError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{formError}</p>}
                </p>
              </div>
            </div>
          </div>

          {!showCreateProject ? (
            <div>
              {/* Project Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Select Project
                </label>
                <div className="mb-2">
                  <FloatingInput
                    label="Search Projects"
                    type="text"
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-theme-border-default rounded-md">
                  {getFilteredProjects().length === 0 ? (
                    <div className="p-4 text-center text-theme-text-muted">
                      <Folder size={32} className="mx-auto mb-2 text-theme-text-muted" />
                      <p className="text-sm">No projects found</p>
                    </div>
                  ) : (
                    getFilteredProjects().map((project) => (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`p-3 cursor-pointer hover:bg-theme-bg-secondary transition-colors ${
                          selectedProject?.id === project.id ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Folder size={16} className="text-theme-text-muted" />
                          <span className="font-medium text-theme-text-primary">{project.name}</span>
                        </div>
                        <p className="text-sm text-theme-text-secondary ml-6">
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
                <label className="block text-sm font-medium text-theme-text-secondary mb-2 flex items-center gap-2">
                    <LayoutList size={16} className="text-violet-500" />
                    Select Section
                  </label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-theme-border-default bg-theme-surface-base rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  disabled={isAdding || isCreatingProject}
                  className="btn-secondary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Plus size={16} className="text-primary-600" />
                  Create New Project
                </button>
                <button
                  onClick={handleAddToProject}
                  disabled={!selectedProject || !selectedSectionId || isAdding || isCreatingProject}
                  className="btn-primary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Music size={16} />
                  <ButtonLoader state={isAdding ? 'loading' : 'idle'} label={isAdding ? 'Adding...' : 'Add to Section'} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Create New Project */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-theme-text-secondary mb-2 flex items-center gap-2">
                  <Type size={16} className="text-amber-500" />
                  Project Name
                </label>
                <FloatingInput
                  label="Project Name"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  placeholder="Enter project name"
                />
              </div>
              <div className="mb-4">
                <span className="block text-sm font-medium text-theme-text-secondary mb-2 flex items-center gap-2">
                  <Folder size={16} className="text-blue-500" />
                  Project type
                </span>
                <div className="flex flex-wrap gap-3">
                  {(['seasonal', 'year-end', 'song-megamix', 'other'] as const).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="newProjectType"
                        checked={newProjectType === t}
                        onChange={() => setNewProjectType(t)}
                        className="rounded-full text-primary-600"
                      />
                      <span className="text-sm text-theme-text-primary">{t === 'seasonal' ? 'Seasonal' : t === 'year-end' ? 'Year-End' : t === 'song-megamix' ? 'Song Megamix' : 'Other'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <button
                  onClick={() => setShowCreateProject(false)}
                  disabled={isCreatingProject}
                  className="btn-secondary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <ArrowLeft size={16} className="text-theme-text-muted" />
                  Back
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || isCreatingProject}
                  className="btn-primary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <FolderPlus size={16} />
                  <ButtonLoader state={isCreatingProject ? 'loading' : 'idle'} label={isCreatingProject ? 'Creating...' : 'Create Project'} />
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
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
          <div className="flex-1 overflow-y-auto bg-theme-surface-base">
            <ModalContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use centered dialog
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[var(--z-modal-overlay)]">
      <div className="bg-theme-surface-base rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden z-[var(--z-modal-content)]">
        <ModalContent />
      </div>
    </div>
  );
}
