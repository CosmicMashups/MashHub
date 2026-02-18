import { spotifyMappingService } from './spotifyMappingService';
import type { Song } from '../types';

export interface BatchMappingProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  currentSong?: Song;
}

export interface BatchMappingOptions {
  onProgress?: (progress: BatchMappingProgress) => void;
  market?: string;
  delayBetweenRequests?: number; // ms
  maxConcurrent?: number;
}

class BatchSpotifyMapper {
  /**
   * Batch map multiple songs to Spotify tracks
   */
  async batchMapSongs(
    songs: Song[],
    options: BatchMappingOptions = {}
  ): Promise<{ successful: number; failed: number; skipped: number }> {
    const {
      onProgress,
      market = 'US',
      delayBetweenRequests = 100, // 100ms delay to avoid rate limits
      maxConcurrent = 3
    } = options;

    let completed = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    // Filter out songs that already have mappings
    const songsToMap: Song[] = [];
    for (const song of songs) {
      const existingMapping = await spotifyMappingService.getMapping(song.id);
      if (existingMapping && !existingMapping.manualOverride) {
        skipped++;
        completed++;
        continue;
      }
      songsToMap.push(song);
    }

    const total = songs.length;
    const unmappedSongs = songsToMap;

    // Process songs in batches to respect rate limits
    for (let i = 0; i < unmappedSongs.length; i += maxConcurrent) {
      const batch = unmappedSongs.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (song) => {
        try {
          // Check again if mapping exists (race condition protection)
          const existing = await spotifyMappingService.getMapping(song.id);
          if (existing) {
            skipped++;
            return { success: true, skipped: true };
          }

          const mapping = await spotifyMappingService.searchAndMap(song, market);
          
          if (mapping) {
            successful++;
            return { success: true, skipped: false };
          } else {
            failed++;
            return { success: false, skipped: false };
          }
        } catch (error) {
          console.error(`Error mapping song ${song.id}:`, error);
          failed++;
          return { success: false, skipped: false };
        } finally {
          completed++;
          
          if (onProgress) {
            onProgress({
              total,
              completed,
              successful,
              failed,
              currentSong: song
            });
          }
        }
      });

      await Promise.all(batchPromises);

      // Delay between batches to avoid rate limits
      if (i + maxConcurrent < unmappedSongs.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      }
    }

    return { successful, failed, skipped };
  }

  /**
   * Map all unmapped songs in the database
   */
  async mapAllUnmappedSongs(
    allSongs: Song[],
    options: BatchMappingOptions = {}
  ): Promise<{ successful: number; failed: number; skipped: number }> {
    return this.batchMapSongs(allSongs, options);
  }
}

export const batchSpotifyMapper = new BatchSpotifyMapper();
