import { useState, useEffect } from 'react';
import { spotifyMappingService } from '../services/spotifyMappingService';
import type { Song, SpotifyMapping } from '../types';

export function useSpotifyData(song: Song | null) {
  const [mapping, setMapping] = useState<SpotifyMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!song) {
      setMapping(null);
      return;
    }

    const loadMapping = async () => {
      setLoading(true);
      setError(null);
      try {
        const cachedMapping = await spotifyMappingService.getMapping(song.id);
        if (cachedMapping) {
          setMapping(cachedMapping);
        } else {
          setMapping(null);
        }
      } catch (err) {
        console.error('Error loading Spotify mapping:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Spotify data');
        setMapping(null);
      } finally {
        setLoading(false);
      }
    };

    loadMapping();
  }, [song?.id]);

  const refreshMapping = async () => {
    if (!song) return;
    
    setLoading(true);
    setError(null);
    try {
      const newMapping = await spotifyMappingService.searchAndMap(song);
      setMapping(newMapping);
    } catch (err) {
      console.error('Error refreshing Spotify mapping:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh Spotify data');
    } finally {
      setLoading(false);
    }
  };

  return { mapping, loading, error, refreshMapping };
}

export function useSpotifyDataForSongs(songs: Song[]) {
  const [mappings, setMappings] = useState<Map<string, SpotifyMapping>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMappings = async () => {
      setLoading(true);
      const newMappings = new Map<string, SpotifyMapping>();
      
      try {
        const mappingPromises = songs.map(async (song) => {
          try {
            const mapping = await spotifyMappingService.getMapping(song.id);
            if (mapping) {
              newMappings.set(song.id, mapping);
            }
          } catch (err) {
            console.error(`Error loading mapping for song ${song.id}:`, err);
          }
        });

        await Promise.all(mappingPromises);
        setMappings(newMappings);
      } catch (err) {
        console.error('Error loading Spotify mappings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (songs.length > 0) {
      loadMappings();
    } else {
      setMappings(new Map());
    }
  }, [songs.map(s => s.id).join(',')]);

  const getMapping = (songId: string): SpotifyMapping | null => {
    return mappings.get(songId) || null;
  };

  return { mappings, loading, getMapping };
}
