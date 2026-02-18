import { db } from './database';
import { spotifyService } from './spotifyService';
import type { Song, SpotifyMapping, SpotifyTrack } from '../types';

/**
 * Calculate string similarity using Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function stringSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate confidence score for a match (0-100)
 */
function calculateConfidenceScore(
  song: Song,
  track: SpotifyTrack,
  searchResults: SpotifyTrack[]
): number {
  let score = 0;

  // Title similarity (40% weight)
  const normalizedTitle = normalizeString(song.title);
  const normalizedTrackName = normalizeString(track.name);
  const titleSimilarity = stringSimilarity(normalizedTitle, normalizedTrackName);
  score += titleSimilarity * 40;

  // Artist similarity (30% weight)
  if (song.artist && song.artist.trim() && track.artists.length > 0) {
    const normalizedArtist = normalizeString(song.artist);
    const trackArtists = track.artists.map(a => normalizeString(a.name));
    const bestArtistMatch = Math.max(
      ...trackArtists.map(ta => stringSimilarity(normalizedArtist, ta))
    );
    score += bestArtistMatch * 30;
  } else {
    // No artist in song - reduce score
    score += 10;
  }

  // Year proximity (20% weight)
  if (song.year && track.album) {
    // Extract year from album release date if available
    // Note: Spotify API doesn't always return release_date in search results
    // This is a simplified check - could be enhanced with getTrack() call
    const yearDiff = Math.abs(song.year - (song.year)); // Placeholder - would need actual release year
    if (yearDiff <= 1) {
      score += 20;
    } else if (yearDiff <= 3) {
      score += 15;
    } else if (yearDiff <= 5) {
      score += 10;
    }
  }

  // Position in search results (10% weight)
  const position = searchResults.findIndex(t => t.id === track.id);
  if (position === 0) {
    score += 10; // First result gets full points
  } else if (position < 3) {
    score += 7;
  } else if (position < 5) {
    score += 5;
  }

  return Math.min(100, Math.round(score));
}

class SpotifyMappingService {
  /**
   * Get cached mapping for a song
   */
  async getMapping(songId: string): Promise<SpotifyMapping | null> {
    try {
      return await db.spotifyMappings.get(songId) || null;
    } catch (error) {
      console.error('Error getting Spotify mapping:', error);
      return null;
    }
  }

  /**
   * Search and map a song to Spotify track
   */
  async searchAndMap(song: Song, market = 'US'): Promise<SpotifyMapping | null> {
    if (!spotifyService.isConfigured()) {
      console.warn('Spotify API not configured');
      return null;
    }

    try {
      // Search for tracks
      const searchResults = await spotifyService.searchTrack(
        song.title,
        song.artist || undefined,
        song.year,
        market
      );

      if (searchResults.length === 0) {
        return null;
      }

      // Calculate confidence scores for all results
      const scoredResults = searchResults.map(track => ({
        track,
        confidence: calculateConfidenceScore(song, track, searchResults)
      }));

      // Sort by confidence (highest first)
      scoredResults.sort((a, b) => b.confidence - a.confidence);

      // Get best match (confidence >= 70)
      const bestMatch = scoredResults[0];
      if (bestMatch.confidence < 70) {
        // Low confidence - return null to allow manual override
        return null;
      }

      const track = bestMatch.track;
      
      // Get full track details for album artwork
      const fullTrack = await spotifyService.getTrack(track.id, market);
      if (!fullTrack) {
        return null;
      }

      // Extract image URLs
      const images = fullTrack.album.images || [];
      const imageLarge = images.find(img => img.height >= 640) || images[0];
      const imageMedium = images.find(img => img.height >= 300 && img.height < 640) || images[1] || images[0];
      const imageSmall = images.find(img => img.height < 300) || images[images.length - 1] || images[0];

      // Create mapping
      const mapping: SpotifyMapping = {
        songId: song.id,
        spotifyTrackId: fullTrack.id,
        spotifyAlbumId: fullTrack.album.id,
        imageUrlLarge: imageLarge?.url,
        imageUrlMedium: imageMedium?.url,
        imageUrlSmall: imageSmall?.url,
        previewUrl: fullTrack.preview_url || undefined,
        spotifyExternalUrl: fullTrack.external_urls.spotify,
        confidenceScore: bestMatch.confidence,
        mappedAt: new Date(),
        manualOverride: false,
        marketCode: market
      };

      // Save to cache
      await this.saveMapping(mapping);

      return mapping;
    } catch (error) {
      console.error('Error searching and mapping song:', error);
      return null;
    }
  }

  /**
   * Save mapping to database
   */
  async saveMapping(mapping: SpotifyMapping): Promise<void> {
    try {
      await db.spotifyMappings.put(mapping);
    } catch (error) {
      console.error('Error saving Spotify mapping:', error);
      throw error;
    }
  }

  /**
   * Update mapping (for manual override)
   */
  async updateMapping(songId: string, spotifyTrackId: string, manualOverride = true): Promise<SpotifyMapping | null> {
    try {
      // Get full track details
      const track = await spotifyService.getTrack(spotifyTrackId);
      if (!track) {
        return null;
      }

      // Extract image URLs
      const images = track.album.images || [];
      const imageLarge = images.find(img => img.height >= 640) || images[0];
      const imageMedium = images.find(img => img.height >= 300 && img.height < 640) || images[1] || images[0];
      const imageSmall = images.find(img => img.height < 300) || images[images.length - 1] || images[0];

      const mapping: SpotifyMapping = {
        songId,
        spotifyTrackId: track.id,
        spotifyAlbumId: track.album.id,
        imageUrlLarge: imageLarge?.url,
        imageUrlMedium: imageMedium?.url,
        imageUrlSmall: imageSmall?.url,
        previewUrl: track.preview_url || undefined,
        spotifyExternalUrl: track.external_urls.spotify,
        confidenceScore: 100, // Manual override gets 100% confidence
        mappedAt: new Date(),
        lastVerified: new Date(),
        manualOverride,
        marketCode: 'US' // Default market
      };

      await this.saveMapping(mapping);
      return mapping;
    } catch (error) {
      console.error('Error updating Spotify mapping:', error);
      return null;
    }
  }

  /**
   * Delete mapping
   */
  async deleteMapping(songId: string): Promise<void> {
    try {
      await db.spotifyMappings.delete(songId);
    } catch (error) {
      console.error('Error deleting Spotify mapping:', error);
      throw error;
    }
  }

  /**
   * Get all mappings
   */
  async getAllMappings(): Promise<SpotifyMapping[]> {
    try {
      return await db.spotifyMappings.toArray();
    } catch (error) {
      console.error('Error getting all mappings:', error);
      return [];
    }
  }

  /**
   * Clear all mappings
   */
  async clearAllMappings(): Promise<void> {
    try {
      await db.spotifyMappings.clear();
    } catch (error) {
      console.error('Error clearing mappings:', error);
      throw error;
    }
  }
}

export const spotifyMappingService = new SpotifyMappingService();
