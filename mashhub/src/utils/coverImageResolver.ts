/**
 * Cover Image Resolver
 * 
 * Unified function to resolve cover images from different sources based on song type.
 * Routes to Jikan API for anime songs, Spotify API for non-anime songs.
 */

import type { Song } from '../types';
import { fetchAnimeCover } from '../services/jikanService';
import { spotifyMappingService } from '../services/spotifyMappingService';

/**
 * Resolves cover image URL for a song based on its type.
 * 
 * Decision Logic:
 * - If song.type === "Anime" (case-insensitive) → Use Jikan API with song.origin
 * - Otherwise → Use Spotify API with song.title + song.artist
 * - If type is undefined/null → Fallback to Spotify
 * 
 * @param song - The song object to resolve cover image for
 * @returns Promise resolving to image URL string or null if not found/error
 */
export async function resolveCoverImage(song: Song | null): Promise<string | null> {
  if (!song) {
    return null;
  }

  // Check if song type is "Anime" (case-insensitive)
  const isAnime = song.type?.toLowerCase() === 'anime';

  if (isAnime) {
    // Route to Jikan API for anime songs
    // Use song.origin as the search query (anime title)
    if (!song.origin) {
      return null;
    }
    return await fetchAnimeCover(song.origin);
  } else {
    // Route to Spotify API for non-anime songs
    // Use existing Spotify mapping service
    try {
      // Check cache first (this is synchronous from IndexedDB)
      const cachedMapping = await spotifyMappingService.getMapping(song.id);
      if (cachedMapping) {
        // Return the best available image URL (prefer large, fallback to medium/small)
        return cachedMapping.imageUrlLarge || cachedMapping.imageUrlMedium || cachedMapping.imageUrlSmall || null;
      }

      // If not cached, trigger search and map (this is async)
      // This will search Spotify and cache the result
      const mapping = await spotifyMappingService.searchAndMap(song);
      if (mapping) {
        return mapping.imageUrlLarge || mapping.imageUrlMedium || mapping.imageUrlSmall || null;
      }

      return null;
    } catch (error) {
      console.error('Error resolving Spotify cover image:', error);
      return null;
    }
  }
}
