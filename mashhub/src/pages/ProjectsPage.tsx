import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { projectService } from '../services/database';
import type { ProjectWithSections, ProjectType } from '../types';
import { Folder, Plus, Trash2, Music } from 'lucide-react';
import { Footer } from '../components/Footer';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading, error, addProject, deleteProject } = useProjects();
  const [projectsWithSections, setProjectsWithSections] = useState<ProjectWithSections[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('other');

  const loadProjectsWithSections = useCallback(async () => {
    if (projects.length === 0) {
      setProjectsWithSections([]);
      return;
    }
    const data = await Promise.all(
      projects.map(async (p) => {
        try {
          return await projectService.getProjectWithSections(p.id);
        } catch {
          return { ...p, sections: [] } as ProjectWithSections;
        }
      })
    );
    setProjectsWithSections(data);
  }, [projects]);

  useEffect(() => {
    void loadProjectsWithSections();
  }, [loadProjectsWithSections]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const project = await addProject(newProjectName.trim(), newProjectType);
      setNewProjectName('');
      await loadProjectsWithSections();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project? All songs will be removed.')) return;
    try {
      await deleteProject(projectId);
      await loadProjectsWithSections();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and title, matching main page header */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-music-electric to-music-cosmic rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  MashHub
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Projects
                </p>
              </div>
            </div>
            {/* Simple navigation back to library */}
            <div className="flex items-center space-x-2">
              <Link
                to="/"
                className="px-3 py-2.5 min-h-[44px] text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center"
              >
                Back to Library
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Projects</h1>

        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">New project</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleCreateProject()}
              placeholder="Project name"
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="flex flex-wrap gap-2 items-center">
              {(['seasonal', 'year-end', 'song-megamix', 'other'] as const).map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="radio"
                    name="newProjectType"
                    checked={newProjectType === t}
                    onChange={() => setNewProjectType(t)}
                    className="rounded-full"
                  />
                  {t === 'seasonal' ? 'Seasonal' : t === 'year-end' ? 'Year-End' : t === 'song-megamix' ? 'Song Megamix' : 'Other'}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleCreateProject()}
              disabled={!newProjectName.trim()}
              className="btn-primary flex items-center gap-1"
            >
              <Plus size={16} /> Create
            </button>
          </div>
        </div>

        <ul className="space-y-2">
          {projectsWithSections.length === 0 ? (
            <li className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Folder size={48} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No projects yet. Create one above.</p>
            </li>
          ) : (
            projectsWithSections.map((project) => {
              const songCount = project.sections.reduce((sum, s) => sum + s.songs.length, 0);
              return (
                <li key={project.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Folder size={20} className="text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {project.sections.length} section(s), {songCount} song(s)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      aria-label="Delete project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </main>

      <Footer />
    </div>
  );
}
