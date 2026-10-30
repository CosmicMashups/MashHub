import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { normalizeTitleArtist } from '../_shared/lyrics/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LRCLIB_BASE = 'https://lrclib.net/api';
const USER_AGENT = 'MashHub/1.0 (https://github.com/mashhub; contact@mashhub.app)';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

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
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { songId } = body;
    if (!songId || typeof songId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing songId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: song, error: songErr } = await authClient
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

    const normTitle = normalizeTitleArtist(song.title);
    const normArtist = normalizeTitleArtist(song.artist);
    const searchUrl = `${LRCLIB_BASE}/search?q=${encodeURIComponent(normTitle + ' ' + normArtist)}`;

    const res = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      return new Response(JSON.stringify({ candidates: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const items = await res.json();
    const candidates = Array.isArray(items)
      ? items.slice(0, 10).map((c) => ({
          id: c.id,
          track: c.trackName,
          artist: c.artistName,
          album: c.albumName,
          duration: c.duration,
          hasSynced: !!c.syncedLyrics,
          instrumental: !!c.instrumental,
        }))
      : [];

    return new Response(JSON.stringify({ candidates }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
