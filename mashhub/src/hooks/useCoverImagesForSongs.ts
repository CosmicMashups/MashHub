// HOOK SAFETY: All hooks must remain at top-level and unconditionally executed.
// Do not add hooks inside conditions or loops.

import { useState, useEffect, useRef } from 'react';
import type { Song } from '../types';
import { resolveCoverImage } from '../utils/coverImageResolver';
import { coverImageCache } from '../utils/coverImageCache';

/**
 * Hook to fetch cover images for multiple songs.
 *
 * Automatically routes to Jikan API for anime songs or Spotify API for non-anime songs.
 * Uses shared in-memory caching to prevent duplicate API calls.
 *
 * ## Dependency-array safety
 * The effect depends only on `songIds` (a stable string primitive computed from song IDs).
 * The `songs` array reference is stored in a ref so the effect always reads the latest
 * value without adding the unstable array itself to the dependency list.  This prevents
 * the "Maximum update depth exceeded" loop that occurs when callers pass a new array
 * reference on every render.
 *
 * @param songs - Array of songs to fetch cover images for
 * @returns Object with getCoverImage function to retrieve cover URLs
 */
export function useCoverImagesForSongs(songs: Song[]) {
  const [coverImages, setCoverImages] = useState<Map<string, string | null>>(new Map());
  const [loading, setLoading] = useState(false);

  // Keep a stable ref so the effect closure always reads the current songs list
  // without triggering re-runs when the parent passes a new array reference.
  const songsRef = useRef<Song[]>(songs);
  songsRef.current = songs;

  // Stable primitive that changes only when the set of song IDs changes.
  const songIds = songs.map((s) => s.id).join(',');

  useEffect(() => {
    const loadCoverImages = async () => {
      // Read the latest songs from the ref (not from the closure over the prop)
      const currentSongs = songsRef.current;

      if (currentSongs.length === 0) {
        setCoverImages(new Map());
        return;
      }

      // If every song is already in the shared cache, skip the async work entirely.
      const allCached = currentSongs.every((s) => coverImageCache.has(s.id));
      if (allCached) {
        return;
      }

      setLoading(true);
      const newCoverImages = new Map<string, string | null>();

      try {
        // Fetch cover images for all songs in parallel
        const coverPromises = currentSongs.map(async (song) => {
          try {
            // Check shared cache first
            const cachedUrl = coverImageCache.get(song.id);
            if (cachedUrl !== undefined) {
              newCoverImages.set(song.id, cachedUrl);
              return;
            }

            // Cache miss — fetch cover image
            const imageUrl = await resolveCoverImage(song);

            // Store in both local map and shared cache
            newCoverImages.set(song.id, imageUrl);
            coverImageCache.set(song.id, imageUrl);
          } catch (err) {
            console.error(`Error loading cover image for song ${song.id}:`, err);
            newCoverImages.set(song.id, null);
            coverImageCache.set(song.id, null);
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

    void loadCoverImages();
    // Intentionally omit `songs` from deps — we use songsRef.current instead.
    // Only re-run when the set of song IDs actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songIds]);

  const getCoverImage = (songId: string): string | null => {
    // Check shared cache first, then local state
    return coverImageCache.get(songId) ?? coverImages.get(songId) ?? null;
  };

  return { coverImages, loading, getCoverImage };
}
