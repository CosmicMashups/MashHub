import { useState, useEffect, useCallback } from 'react';
import type { Song } from '../types';
import { songService, sectionService } from '../services/database';
import { loadSongsAndSectionsWithHash } from '../data/animeDataLoader';
import { ExportService } from '../services/exportService';

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load songs from database
  const loadSongs = useCallback(async () => {
    try {
      console.log('Starting to load songs...');
      setLoading(true);
      setError(null);
      let songsData = await songService.getAll();
      console.log('Retrieved songs from database:', songsData.length);
      
      // If database is empty, seed from CSV files
      if (songsData.length === 0) {
        console.log('Database is empty, loading songs and sections from CSV...');
        const { songs, sections, hash } = await loadSongsAndSectionsWithHash();
        console.log('Loaded songs:', songs.length, 'sections:', sections.length);
        localStorage.setItem('songsCsvHash', hash);
        
        if (songs.length > 0) {
          // Add songs and sections to database
          console.log('Adding songs and sections to database...');
          await songService.bulkAdd(songs);
          await sectionService.bulkAdd(sections);
          // Reload to get computed properties
          songsData = await songService.getAll();
          console.log(`Successfully loaded ${songs.length} songs with ${sections.length} sections`);
        }
      }
      // Auto-refresh disabled - CSV change detection removed to prevent user annoyance
      // Users can manually reload using the "Reload CSV" button in Utility Dialog if needed
      
      console.log('Setting songs state with:', songsData.length, 'songs');
      setSongs(songsData);
    } catch (err) {
      console.error('Error in loadSongs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, []);

  // Optional: force reload from CSV (for development when replacing CSV files)
  const forceReloadFromCsv = useCallback(async () => {
    try {
      setLoading(true);
      await songService.clearAll();
      const { songs, sections } = await loadSongsAndSectionsWithHash();
      if (songs.length > 0) {
        await songService.bulkAdd(songs);
        await sectionService.bulkAdd(sections);
        const songsWithSections = await songService.getAll();
        setSongs(songsWithSections);
      } else {
        setSongs([]);
      }
    } catch (err) {
      console.error('Error forcing reload from CSV:', err);
      setError(err instanceof Error ? err.message : 'Failed to reload from CSV');
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper to convert unknown DB errors to user-friendly messages
  const handleDbError = useCallback((err: unknown): string => {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return 'Storage quota exceeded. Please clear some data in Settings to free space.';
    }
    if (err instanceof Error) {
      if (err.name === 'VersionError' || err.name === 'InvalidStateError') {
        return 'Database version mismatch. Please reload the page to upgrade the database.';
      }
      return err.message;
    }
    return 'An unexpected database error occurred';
  }, []);

  // Add a new song
  const addSong = useCallback(async (song: Omit<Song, 'id'>) => {
    try {
      setError(null);
      
      // Generate new ID
      const existingSongs = await songService.getAll();
      const maxId = existingSongs.length > 0 
        ? Math.max(...existingSongs.map(s => parseInt(s.id)))
        : 0;
      const newId = (maxId + 1).toString().padStart(5, '0');
      
      const newSong: Song = {
        ...song,
        id: newId
      };
      
      await songService.add(newSong);
      setSongs(prev => [...prev, newSong]);
      return newSong;
    } catch (err) {
      const msg = handleDbError(err);
      setError(msg);
      console.error('Error adding song:', err);
      throw err;
    }
  }, [handleDbError]);

  const addMultipleSongs = useCallback(async (songsToAdd: Song[]) => {
    try {
      setError(null);
      
      // Generate IDs for songs that don't have them
      const existingSongs = await songService.getAll();
      const maxId = existingSongs.length > 0 
        ? Math.max(...existingSongs.map(s => parseInt(s.id)))
        : 0;
      
      const songsWithIds = songsToAdd.map((song, index) => ({
        ...song,
        id: song.id || (maxId + index + 1).toString().padStart(5, '0')
      }));
      
      // Add all songs to database
      await Promise.all(songsWithIds.map(song => songService.add(song)));
      
      // Update local state
      setSongs(prev => [...prev, ...songsWithIds]);
      
      return songsWithIds;
    } catch (err) {
      const msg = handleDbError(err);
      setError(msg);
      console.error('Error adding songs:', err);
      throw err;
    }
  }, [handleDbError]);

  // Export CSV files (helper function for use after updates)
  const exportCSVFiles = useCallback(async () => {
    try {
      const allSongs = await songService.getAll();
      await ExportService.exportSongsToCSV(allSongs, 'updated');
      console.log('CSV files exported successfully');
    } catch (exportError) {
      console.warn('Failed to export CSV files:', exportError);
      throw exportError;
    }
  }, []);

  // Update an existing song
  const updateSong = useCallback(async (song: Song) => {
    try {
      setError(null);
      await songService.update(song);
      setSongs((prev) => prev.map((s) => s.id === song.id ? song : s));
    } catch (err) {
      const msg = handleDbError(err);
      setError(msg);
      console.error('Error updating song:', err);
      throw err;
    }
  }, [handleDbError]);

  // Delete a song
  const deleteSong = useCallback(async (id: string) => {
    try {
      setError(null);
      await songService.delete(id);
      setSongs(prev => prev.filter(s => s.id !== id));
      
      // Automatically export updated CSV files after deleting song
      // This allows users to save the updated CSV files back to replace the source files
      try {
        const allSongs = await songService.getAll();
        await ExportService.exportSongsToCSV(allSongs, 'updated');
        console.log('CSV files exported after deleting song');
      } catch (exportError) {
        // Don't fail the delete if export fails, just log it
        console.warn('Failed to export CSV files after deleting song:', exportError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete song');
      console.error('Error deleting song:', err);
      throw err;
    }
  }, []);

  // Search songs
  const searchSongs = useCallback(async (query: string) => {
    try {
      setError(null);
      const results = await songService.search(query);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search songs');
      console.error('Error searching songs:', err);
      return [];
    }
  }, []);

  // Filter songs by BPM range
  const filterByBpm = useCallback(async (minBpm: number, maxBpm: number) => {
    try {
      setError(null);
      const results = await songService.filterByBpm(minBpm, maxBpm);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter songs by BPM');
      console.error('Error filtering songs by BPM:', err);
      return [];
    }
  }, []);

  // Load songs on mount
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  return {
    songs,
    loading,
    error,
    addSong,
    addMultipleSongs,
    updateSong,
    deleteSong,
    searchSongs,
    filterByBpm,
    forceReloadFromCsv,
    exportCSVFiles,
    refresh: loadSongs
  };
}