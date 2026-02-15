import { useState, useEffect } from 'react';
import type { Song } from '../types';
import { resolveCoverImage } from '../utils/coverImageResolver';
import { coverImageCache } from '../utils/coverImageCache';

/**
 * Hook to fetch cover images for multiple songs.
 * 
 * Automatically routes to Jikan API for anime songs or Spotify API for non-anime songs.
 * Uses shared in-memory caching to prevent duplicate API calls.
 * 
 * @param songs - Array of songs to fetch cover images for
 * @returns Object with getCoverImage function to retrieve cover URLs
 */
export function useCoverImagesForSongs(songs: Song[]) {
  const [coverImages, setCoverImages] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCoverImages = async () => {
      if (songs.length === 0) {
        setCoverImages(new Map());
        return;
      }

      setLoading(true);
      const newCoverImages = new Map<string, string | null>();

      try {
        // Fetch cover images for all songs in parallel
        const coverPromises = songs.map(async (song) => {
          try {
            // Check shared cache first
            const cachedUrl = coverImageCache.get(song.id);
            if (cachedUrl !== undefined) {
              newCoverImages.set(song.id, cachedUrl);
              return;
            }

            // Cache miss - fetch cover image
            const imageUrl = await resolveCoverImage(song);
            
            // Store in both local state and shared cache
            newCoverImages.set(song.id, imageUrl);
            coverImageCache.set(song.id, imageUrl);
          } catch (err) {
            console.error(`Error loading cover image for song ${song.id}:`, err);
            const nullValue = null;
            newCoverImages.set(song.id, nullValue);
            coverImageCache.set(song.id, nullValue);
          }
        });

        await Promise.all(coverPromises);
        setCoverImages(newCoverImages);
      } catch (err) {
        console.error('Error loading cover images:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only load if songs array has changed
    const songIds = songs.map(s => s.id).join(',');
    loadCoverImages();
  }, [songs.map(s => s.id).join(',')]);

  const getCoverImage = (songId: string): string | null => {
    // Check shared cache first, then local state
    return coverImageCache.get(songId) ?? coverImages.get(songId) ?? null;
  };

  return { coverImages, loading, getCoverImage };
}
