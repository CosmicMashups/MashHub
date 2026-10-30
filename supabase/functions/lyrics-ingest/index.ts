import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  parseLrc,
  cleanLyricLine,
  normalizeTitleArtist,
  stringSimilarity,
  detectLineLanguage,
  getLyricAdapter,
  processLineForIndex,
} from '../_shared/lyrics/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LRCLIB_BASE = 'https://lrclib.net/api';
const LYRICS_OVH_BASE = 'https://api.lyrics.ovh/v1';
const USER_AGENT = 'MashHub/1.0 (https://github.com/mashhub; contact@mashhub.app)';
const LYRIC_MIN_CONFIDENCE = 0.75;
const RATE_LIMIT_PER_HOUR = 150;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Auth check: require Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      console.warn('auth.getUser failed with token:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Hard Rule 5.4: Max 1 song per request, only songId from client
    const body = await req.json();
    const { songId, force, candidateId, manualLyrics } = body;

    if (!songId || typeof songId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid songId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting: count user's requests in past 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: fetchCount, error: countError } = await adminClient
      .from('lyrics_fetch_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('at', oneHourAgo);

    if (!countError && fetchCount !== null && fetchCount >= RATE_LIMIT_PER_HOUR) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded (150 songs/hour)', retryAfterSeconds: 3600 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the fetch attempt
    await adminClient.from('lyrics_fetch_log').insert({ user_id: user.id, song_id: songId });

    // Read song from database
    const { data: song, error: songErr } = await adminClient
      .from('songs')
      .select('id, title, artist')
      .eq('id', songId)
      .single();

    if (songErr || !song) {
      return new Response(JSON.stringify({ error: 'Song not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check existing lyrics unless force is true
    if (!force && !manualLyrics && !candidateId) {
      const { data: existing } = await adminClient
        .from('song_lyrics')
        .select('song_id, status, language_summary')
        .eq('song_id', songId)
        .maybeSingle();

      if (existing && (existing.status === 'found' || existing.status === 'instrumental' || existing.status === 'manual')) {
        return new Response(
          JSON.stringify({
            status: existing.status,
            cached: true,
            languages: existing.language_summary,
            embeddingPending: false,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let rawLyrics = '';
    let hasTimestamps = false;
    let source: 'lrclib' | 'lyricsovh' | 'manual' = 'lrclib';
    let sourceTrackId = '';
    let matchConfidence = 1.0;
    let isInstrumental = false;

    if (manualLyrics) {
      rawLyrics = manualLyrics;
      source = 'manual';
    } else {
      // 1. Fetch from LRCLIB
      const normTitle = normalizeTitleArtist(song.title);
      const normArtist = normalizeTitleArtist(song.artist);

      try {
        if (candidateId) {
          const res = await fetch(`${LRCLIB_BASE}/get/${candidateId}`, {
            headers: { 'User-Agent': USER_AGENT },
          });
          if (res.ok) {
            const data = await res.json();
            sourceTrackId = String(data.id);
            isInstrumental = !!data.instrumental;
            rawLyrics = data.syncedLyrics || data.plainLyrics || '';
            hasTimestamps = !!data.syncedLyrics;
          }
        } else {
          // Try /api/get first
          const getUrl = `${LRCLIB_BASE}/get?track_name=${encodeURIComponent(normTitle)}&artist_name=${encodeURIComponent(normArtist)}`;
          const getRes = await fetch(getUrl, { headers: { 'User-Agent': USER_AGENT } });

          if (getRes.ok) {
            const data = await getRes.json();
            sourceTrackId = String(data.id);
            isInstrumental = !!data.instrumental;
            rawLyrics = data.syncedLyrics || data.plainLyrics || '';
            hasTimestamps = !!data.syncedLyrics;
          } else {
            // Miss: try /api/search
            const searchUrl = `${LRCLIB_BASE}/search?q=${encodeURIComponent(normTitle + ' ' + normArtist)}`;
            const sRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
            if (sRes.ok) {
              const candidates = await sRes.json();
              if (Array.isArray(candidates) && candidates.length > 0) {
                // Find candidate with best similarity
                let bestCand = candidates[0];
                let bestSim = 0;
                for (const c of candidates) {
                  const tSim = stringSimilarity(normTitle, c.trackName || '');
                  const aSim = stringSimilarity(normArtist, c.artistName || '');
                  const totalSim = (tSim * 0.6) + (aSim * 0.4);
                  if (totalSim > bestSim) {
                    bestSim = totalSim;
                    bestCand = c;
                  }
                }
                matchConfidence = bestSim;
                if (bestSim >= LYRIC_MIN_CONFIDENCE) {
                  sourceTrackId = String(bestCand.id);
                  isInstrumental = !!bestCand.instrumental;
                  rawLyrics = bestCand.syncedLyrics || bestCand.plainLyrics || '';
                  hasTimestamps = !!bestCand.syncedLyrics;
                }
              }
            }
          }
        }
      } catch (upstreamErr) {
        console.warn('LRCLIB fetch error:', upstreamErr);
      }

      // Fallback to lyrics.ovh if not found
      if (!rawLyrics && !isInstrumental) {
        try {
          const ovhUrl = `${LYRICS_OVH_BASE}/${encodeURIComponent(song.artist)}/${encodeURIComponent(song.title)}`;
          const ovhRes = await fetch(ovhUrl);
          if (ovhRes.ok) {
            const ovhData = await ovhRes.json();
            if (ovhData.lyrics) {
              rawLyrics = ovhData.lyrics;
              source = 'lyricsovh';
              hasTimestamps = false;
              matchConfidence = 0.8;
            }
          }
        } catch {
          // ignore fallback error
        }
      }
    }

    if (isInstrumental) {
      await adminClient.from('song_lyrics').upsert({
        song_id: songId,
        status: 'instrumental',
        source,
        source_track_id: sourceTrackId,
        match_confidence: matchConfidence,
        has_timestamps: false,
        language_summary: [],
        embedding_status: 'skipped',
        fetched_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          status: 'instrumental',
          lineCount: 0,
          languages: [],
          source,
          confidence: matchConfidence,
          embeddingPending: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rawLyrics) {
      await adminClient.from('song_lyrics').upsert({
        song_id: songId,
        status: 'not_found',
        source,
        source_track_id: sourceTrackId,
        match_confidence: matchConfidence,
        has_timestamps: false,
        language_summary: [],
        embedding_status: 'skipped',
        fetched_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          status: 'not_found',
          lineCount: 0,
          languages: [],
          source,
          confidence: matchConfidence,
          embeddingPending: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse LRC lines
    const parsed = parseLrc(rawLyrics);
    const languagesSet = new Set<string>();

    const linesToInsert = [];
    const seenLines = new Map<string, number>();
    let lineIdx = 0;

    for (const l of parsed.lines) {
      const cleaned = cleanLyricLine(l.text);
      if (!cleaned || !cleaned.text) continue;

      const lang = detectLineLanguage(cleaned.text);
      languagesSet.add(lang);

      // Duplicate line de-duping within song
      const normText = cleaned.text.toLowerCase().trim();
      if (seenLines.has(normText)) {
        continue;
      }
      seenLines.set(normText, lineIdx);

      // Process tokens using language-specific adapter (en, ja, ko, tl)
      const adapter = getLyricAdapter(lang);
      const { tokens, surfaceTokens } = processLineForIndex(adapter, cleaned.text);
      if (tokens.length === 0) continue;

      linesToInsert.push({
        song_id: songId,
        line_index: lineIdx++,
        text: cleaned.text,
        start_ms: l.startMs ?? null,
        section_hint: cleaned.sectionHint ?? null,
        repeat_count: 1,
        lang,
        tokens,
        surface_tokens: surfaceTokens,
      });
    }

    // Persist to database in a clean transaction
    await adminClient.from('lyric_lines').delete().eq('song_id', songId);
    if (linesToInsert.length > 0) {
      await adminClient.from('lyric_lines').insert(linesToInsert);
    }

    const languageSummary = Array.from(languagesSet);
    await adminClient.from('song_lyrics').upsert({
      song_id: songId,
      status: 'found',
      source,
      source_track_id: sourceTrackId,
      match_confidence: matchConfidence,
      plain_lyrics: rawLyrics,
      has_timestamps: parsed.hasTimestamps,
      language_summary: languageSummary,
      processed_version: 1,
      embedding_status: 'pending',
      fetched_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        status: 'found',
        lineCount: linesToInsert.length,
        languages: languageSummary,
        source,
        confidence: matchConfidence,
        embeddingPending: true,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
