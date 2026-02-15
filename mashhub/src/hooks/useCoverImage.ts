import { useState, useEffect, useRef } from 'react';
import type { Song } from '../types';
import { resolveCoverImage } from '../utils/coverImageResolver';
import { coverImageCache } from '../utils/coverImageCache';

/**
 * Hook to fetch and cache cover images for songs.
 * 
 * Automatically routes to Jikan API for anime songs or Spotify API for non-anime songs.
 * Uses in-memory caching to prevent duplicate API calls.
 * 
 * @param song - The song to fetch cover image for (null when dialog is closed)
 * @param isOpen - Whether the dialog is open (used to trigger fetch)
 * @returns Object with coverImageUrl and coverLoading state
 */
export function useCoverImage(song: Song | null, isOpen: boolean) {
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Reset state when dialog closes or song is null
    if (!isOpen || !song) {
      setCoverImageUrl(null);
      setCoverLoading(false);
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    // Check cache first
    const cachedUrl = coverImageCache.get(song.id);
    if (cachedUrl !== undefined) {
      // Cache hit - use cached value (could be null if previous fetch failed)
      setCoverImageUrl(cachedUrl);
      setCoverLoading(false);
      return;
    }

    // Cache miss - fetch cover image
    setCoverLoading(true);
    setCoverImageUrl(null); // Clear any previous image
    
    // Create abort controller for this fetch
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchCover = async () => {
      try {
        const imageUrl = await resolveCoverImage(song);
        
        // Check if fetch was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Store in cache
        coverImageCache.set(song.id, imageUrl);
        
        // Update state
        setCoverImageUrl(imageUrl);
        setCoverLoading(false);
      } catch (error) {
        // Handle errors silently (fail gracefully)
        if (!abortController.signal.aborted) {
          console.error('Error fetching cover image:', error);
          // Cache null to prevent retrying immediately
          coverImageCache.set(song.id, null);
          setCoverImageUrl(null);
          setCoverLoading(false);
        }
      } finally {
        // Clean up abort controller
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    };

    fetchCover();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [song?.id, isOpen]);

  return { coverImageUrl, coverLoading };
}
