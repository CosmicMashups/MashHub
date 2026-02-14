import type { SpotifyTrack, SpotifyImage } from '../types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';
  }

  /**
   * Authenticate using Client Credentials Flow
   */
  private async authenticate(): Promise<string> {
    // Check if token is still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify API credentials not configured. Please set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET environment variables.');
    }

    try {
      const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Spotify authentication failed: ${error}`);
      }

      const data: SpotifyTokenResponse = await response.json();
      this.accessToken = data.access_token;
      // Set expiry with 5 minute buffer
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request with retry logic
   */
  private async apiRequest<T>(endpoint: string, retries = 3): Promise<T> {
    const token = await this.authenticate();
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Spotify API error (${response.status}): ${error}`);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    
    throw new Error('Spotify API request failed after retries');
  }

  /**
   * Search for tracks using field filters
   */
  async searchTrack(title: string, artist?: string, year?: number, market = 'US'): Promise<SpotifyTrack[]> {
    if (!title.trim()) {
      return [];
    }

    // Build query with field filters
    const queryParts: string[] = [];
    
    // Normalize and escape special characters
    const normalizedTitle = this.normalizeQuery(title);
    queryParts.push(`track:${normalizedTitle}`);
    
    if (artist && artist.trim()) {
      const normalizedArtist = this.normalizeQuery(artist);
      queryParts.push(`artist:${normalizedArtist}`);
    }
    
    if (year) {
      queryParts.push(`year:${year}`);
    }

    const query = queryParts.join(' ');
    const encodedQuery = encodeURIComponent(query);
    
    try {
      const response = await this.apiRequest<SpotifySearchResponse>(
        `/search?q=${encodedQuery}&type=track&limit=20&market=${market}`
      );
      
      return response.tracks.items;
    } catch (error) {
      console.error('Spotify search error:', error);
      return [];
    }
  }

  /**
   * Get track details by ID
   */
  async getTrack(trackId: string, market = 'US'): Promise<SpotifyTrack | null> {
    try {
      return await this.apiRequest<SpotifyTrack>(`/tracks/${trackId}?market=${market}`);
    } catch (error) {
      console.error('Spotify getTrack error:', error);
      return null;
    }
  }

  /**
   * Get album details by ID
   */
  async getAlbum(albumId: string, market = 'US'): Promise<{ images: SpotifyImage[] } | null> {
    try {
      return await this.apiRequest<{ images: SpotifyImage[] }>(`/albums/${albumId}?market=${market}`);
    } catch (error) {
      console.error('Spotify getAlbum error:', error);
      return null;
    }
  }

  /**
   * Normalize query string for Spotify search
   * Removes special characters that might interfere with search
   */
  private normalizeQuery(query: string): string {
    return query
      .trim()
      .replace(/[()\[\]]/g, '') // Remove brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Check if Spotify credentials are configured
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }
}

export const spotifyService = new SpotifyService();
