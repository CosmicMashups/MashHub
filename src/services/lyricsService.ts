import { supabase } from '../lib/supabase';
import type { LyricCandidate } from '../types/lyrics';
import { LYRIC_RATE_LIMIT_PER_HOUR } from '../constants/lyrics';

export interface IngestResponse {
  status: 'found' | 'not_found' | 'instrumental' | 'error' | 'manual';
  lineCount?: number;
  languages?: string[];
  source?: string;
  confidence?: number;
  embeddingPending?: boolean;
  cached?: boolean;
  error?: string;
  retryAfterSeconds?: number;
}

export interface CandidatesResponse {
  candidates: {
    id: number | string;
    track: string;
    artist: string;
    album?: string;
    duration?: number;
    hasSynced: boolean;
    instrumental: boolean;
  }[];
  error?: string;
}

class LyricsService {
  private backendMode: 'auto' | 'edge' | 'vercel' =
    (import.meta.env.VITE_LYRICS_BACKEND as any) || 'auto';

  /**
   * Calls lyrics-ingest via Edge Function with automatic failover to Vercel if configured.
   */
  async ingestSong(
    songId: string,
    options?: { force?: boolean; candidateId?: string | number; manualLyrics?: string }
  ): Promise<IngestResponse> {
    const payload = {
      songId,
      force: options?.force,
      candidateId: options?.candidateId,
      manualLyrics: options?.manualLyrics,
    };

    // If configured for Edge or Auto, try Edge function first
    if (this.backendMode !== 'vercel' && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('lyrics-ingest', {
          body: payload,
        });

        if (!error && data) {
          return data as IngestResponse;
        }

        // On rate limit error (429), do not failover, return rate limit
        if (error && (error as any).status === 429) {
          return {
            status: 'error',
            error: 'Rate limit exceeded (150 songs/hour)',
            retryAfterSeconds: 3600,
          };
        }

        // On unauthorized (401), prompt login instead of generic failover
        if (error && (error as any).status === 401) {
          return {
            status: 'error',
            error: 'Please sign in to fetch lyrics.',
          };
        }

        // Failover if auto
        if (this.backendMode === 'auto') {
          console.warn('Edge ingest failed, failing over to Vercel api/lyrics-ingest', error);
          return await this.ingestViaVercel(payload);
        }

        return {
          status: 'error',
          error: error?.message || 'Ingestion failed',
        };
      } catch (err: any) {
        if (this.backendMode === 'auto') {
          return await this.ingestViaVercel(payload);
        }
        return { status: 'error', error: err.message || 'Ingestion failed' };
      }
    }

    return await this.ingestViaVercel(payload);
  }

  private async ingestViaVercel(payload: any): Promise<IngestResponse> {
    try {
      const session = (await supabase?.auth.getSession())?.data.session;
      const res = await fetch('/api/lyrics-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          status: 'error',
          error: data.error || 'Vercel ingest failed',
          retryAfterSeconds: data.retryAfterSeconds,
        };
      }
      return data;
    } catch (err: any) {
      return { status: 'error', error: err.message || 'Vercel route unavailable' };
    }
  }

  /**
   * Fetches candidates from LRCLIB for the "Not the right lyrics?" flow.
   */
  async getCandidates(songId: string): Promise<CandidatesResponse> {
    if (this.backendMode !== 'vercel' && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('lyrics-candidates', {
          body: { songId },
        });
        if (!error && data) {
          return data as CandidatesResponse;
        }
      } catch (err) {
        console.warn('Edge lyrics-candidates error, falling back:', err);
      }
    }

    // Vercel fallback
    try {
      const session = (await supabase?.auth.getSession())?.data.session;
      const res = await fetch('/api/lyrics-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ songId }),
      });
      return await res.json();
    } catch (err: any) {
      return { candidates: [], error: err.message };
    }
  }

  /**
   * Embeds un-embedded lines for a song using Edge Function / Vercel mirror.
   */
  async embedSong(songId: string, limit = 16): Promise<{ embedded: number; remaining: number }> {
    if (this.backendMode !== 'vercel' && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('lyrics-embed', {
          body: { songId, limit },
        });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Edge lyrics-embed failed:', err);
      }
    }
    return { embedded: 0, remaining: 0 };
  }

  /**
   * Fetches cross-song semantic pairs above similarity threshold.
   */
  async getSemanticPairs(songIds: string[], threshold = 0.82, limit = 100) {
    if (!supabase || songIds.length < 2) return [];
    const { data, error } = await supabase.rpc('lyric_semantic_pairs', {
      p_song_ids: songIds,
      p_threshold: threshold,
      p_limit: limit,
    });
    if (error) {
      console.warn('Semantic pairs RPC warning/timeout:', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      lineId1: Number(row.line_id_1),
      songId1: String(row.song_id_1),
      text1: String(row.text_1),
      lineId2: Number(row.line_id_2),
      songId2: String(row.song_id_2),
      text2: String(row.text_2),
      lang: row.lang,
      similarity: Number(row.similarity),
    }));
  }

  /**
   * Gets indexed lines for a list of song IDs.
   */
  async getLinesForSongs(songIds: string[]) {
    if (!supabase || songIds.length === 0) return [];
    const { data, error } = await supabase.rpc('lyric_lines_for_songs', {
      p_song_ids: songIds,
    });
    if (error) {
      console.error('Error fetching lyric lines for songs:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Gets candidate lines across the library sharing tokens with the target song.
   */
  async getCandidatesForSong(songId: string, limit = 500) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc('lyric_candidates_for_song', {
      p_song_id: songId,
      p_limit: limit,
    });
    if (error) {
      console.error('Error fetching lyric candidates for song:', error);
      return [];
    }
    return data || [];
  }

  /**
   * Gets current indexed lyric coverage.
   */
  async getCoverage(): Promise<{ songsWithLyrics: number; totalSongs: number }> {
    if (!supabase) return { songsWithLyrics: 0, totalSongs: 0 };
    const { data, error } = await supabase.rpc('lyric_coverage');
    if (error || !data || data.length === 0) {
      return { songsWithLyrics: 0, totalSongs: 0 };
    }
    return {
      songsWithLyrics: Number(data[0].songs_with_lyrics || 0),
      totalSongs: Number(data[0].total_songs || 0),
    };
  }
}

export const lyricsService = new LyricsService();
