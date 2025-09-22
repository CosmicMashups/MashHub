import { useState, useEffect, useCallback } from 'react';
import type { Song } from '../types';
import { songService } from '../services/database';
import { loadAnimeData, loadAnimeDataWithHash } from '../data/animeDataLoader';

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
      
      // If database is empty, seed from CSV. If CSV replaced and you want to force refresh,
      // remove 'songs' table manually (or call the optional refresh function below).
      if (songsData.length === 0) {
        console.log('Database is empty, loading anime data...');
        const { songs: animeSongs, hash } = await loadAnimeDataWithHash();
        console.log('Loaded anime songs:', animeSongs.length);
        localStorage.setItem('animeCsvHash', hash);
        
        if (animeSongs.length > 0) {
          // Add anime songs to database
          console.log('Adding anime songs to database...');
          await songService.bulkAdd(animeSongs);
          songsData = animeSongs;
          console.log(`Successfully loaded ${animeSongs.length} anime songs`);
        }
      }
      else {
        // Detect CSV change and prompt/auto-refresh (dev convenience)
        try {
          const { songs: animeSongs, hash } = await loadAnimeDataWithHash();
          const prevHash = localStorage.getItem('animeCsvHash');
          if (hash && prevHash && hash !== prevHash && animeSongs.length > 0) {
            console.log('anime.csv changed, refreshing local DB');
            await songService.clearAll();
            await songService.bulkAdd(animeSongs);
            localStorage.setItem('animeCsvHash', hash);
            songsData = animeSongs;
          }
        } catch {}
      }
      
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

  // Optional: force reload from CSV (for development when replacing anime.csv)
  const forceReloadFromCsv = useCallback(async () => {
    try {
      setLoading(true);
      await songService.clearAll();
      const animeSongs = await loadAnimeData();
      if (animeSongs.length > 0) {
        await songService.bulkAdd(animeSongs);
        setSongs(animeSongs);
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
      setError(err instanceof Error ? err.message : 'Failed to add song');
      console.error('Error adding song:', err);
      throw err;
    }
  }, []);

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
      setError(err instanceof Error ? err.message : 'Failed to add songs');
      console.error('Error adding songs:', err);
      throw err;
    }
  }, []);

  // Update an existing song
  const updateSong = useCallback(async (song: Song) => {
    try {
      setError(null);
      await songService.update(song);
      setSongs(prev => prev.map(s => s.id === song.id ? song : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update song');
      console.error('Error updating song:', err);
      throw err;
    }
  }, []);

  // Delete a song
  const deleteSong = useCallback(async (id: string) => {
    try {
      setError(null);
      await songService.delete(id);
      setSongs(prev => prev.filter(s => s.id !== id));
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

  // Filter songs by vocal status
  const filterByVocalStatus = useCallback(async (status: string) => {
    try {
      setError(null);
      const results = await songService.filterByVocalStatus(status);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter songs by vocal status');
      console.error('Error filtering songs by vocal status:', err);
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
    filterByVocalStatus,
    forceReloadFromCsv,
    refresh: loadSongs
  };
}