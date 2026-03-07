import { useState, useEffect, useCallback } from 'react';
import type { Project, ProjectType } from '../types';
import { projectService } from '../services/database';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await projectService.getAll();
      setProjects(projectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProject = useCallback(async (name: string, type: ProjectType = 'other') => {
    try {
      setError(null);
      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
        type,
        createdAt: new Date(),
      };
      await projectService.add(newProject);
      await projectService.addSection({
        projectId: newProject.id,
        name: 'Main',
        orderIndex: 0,
      });
      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project');
      console.error('Error adding project:', err);
      throw err;
    }
  }, []);

  const updateProject = useCallback(async (project: Project) => {
    try {
      setError(null);
      await projectService.update(project);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      console.error('Error updating project:', err);
      throw err;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      setError(null);
      await projectService.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      console.error('Error deleting project:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    refresh: loadProjects,
  };
}
