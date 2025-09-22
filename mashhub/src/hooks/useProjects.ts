import { useState, useEffect, useCallback } from 'react';
import type { Project, ProjectEntry } from '../types';
import { projectService } from '../services/database';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from database
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

  // Add a new project
  const addProject = useCallback(async (name: string) => {
    try {
      setError(null);
      
      const newProject: Project = {
        id: Date.now().toString(),
        name,
        createdAt: new Date()
      };
      
      await projectService.add(newProject);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add project');
      console.error('Error adding project:', err);
      throw err;
    }
  }, []);

  // Update an existing project
  const updateProject = useCallback(async (project: Project) => {
    try {
      setError(null);
      await projectService.update(project);
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      console.error('Error updating project:', err);
      throw err;
    }
  }, []);

  // Delete a project
  const deleteProject = useCallback(async (id: string) => {
    try {
      setError(null);
      await projectService.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      console.error('Error deleting project:', err);
      throw err;
    }
  }, []);

  // Add song to project
  const addSongToProject = useCallback(async (projectId: string, songId: string, sectionName: string = 'Main') => {
    try {
      setError(null);
      await projectService.addSongToProject(projectId, songId, sectionName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add song to project');
      console.error('Error adding song to project:', err);
      throw err;
    }
  }, []);

  // Remove song from project
  const removeSongFromProject = useCallback(async (projectId: string, songId: string) => {
    try {
      setError(null);
      await projectService.removeSongFromProject(projectId, songId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove song from project');
      console.error('Error removing song from project:', err);
      throw err;
    }
  }, []);

  // Reorder songs in project
  const reorderSongs = useCallback(async (projectId: string, songIds: string[]) => {
    try {
      setError(null);
      await projectService.reorderSongs(projectId, songIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder songs');
      console.error('Error reordering songs:', err);
      throw err;
    }
  }, []);

  // Load projects on mount
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
    addSongToProject,
    removeSongFromProject,
    reorderSongs,
    refresh: loadProjects
  };
}