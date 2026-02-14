import { useState, useEffect, useCallback } from 'react';
import { sectionService } from '../services/database';
import type { SongSection } from '../types';

export function useSections(songId: string | null) {
  const [sections, setSections] = useState<SongSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSections = useCallback(async () => {
    if (!songId) {
      setSections([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const loadedSections = await sectionService.getBySongId(songId);
      // Sort by sectionOrder to ensure correct order
      const sortedSections = loadedSections.sort((a, b) => a.sectionOrder - b.sectionOrder);
      setSections(sortedSections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sections');
      console.error('Error loading sections:', err);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  return {
    sections,
    loading,
    error,
    reload: loadSections
  };
}
