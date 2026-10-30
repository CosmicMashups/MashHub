import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Batch size to comfortably fit inside 2 s CPU limit
const CHUNK_LIMIT = 16;
const EMBEDDING_MODEL = 'gte-small';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { songId, limit = CHUNK_LIMIT } = body;

    if (!songId || typeof songId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid songId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch lines needing embedding for this song (English gte-small on Edge)
    const effectiveLimit = Math.min(Number(limit) || CHUNK_LIMIT, CHUNK_LIMIT);
    const { data: lines, error: lineErr } = await adminClient
      .from('lyric_lines')
      .select('id, text, lang')
      .eq('song_id', songId)
      .is('embedding', null)
      .limit(effectiveLimit);

    if (lineErr) {
      return new Response(JSON.stringify({ error: lineErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!lines || lines.length === 0) {
      // Mark song embedding status as done
      await adminClient
        .from('song_lyrics')
        .update({ embedding_status: 'done' })
        .eq('song_id', songId);

      return new Response(JSON.stringify({ embedded: 0, remaining: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Embed using Supabase built-in AI session (gte-small)
    let embeddedCount = 0;
    try {
      // @ts-ignore Supabase Edge built-in AI session
      const session = new (globalThis as any).Supabase.ai.Session('gte-small');

      for (const line of lines) {
        // Tagalog caveat: if tl, mark skipped per spec Section 8.4
        if (line.lang === 'tl') {
          continue;
        }

        // Clean original line is embedded (Section 8.4)
        const vector = await session.run(line.text, {
          mean_pool: true,
          normalize: true,
        });

        await adminClient
          .from('lyric_lines')
          .update({
            embedding: vector,
            embedding_model: EMBEDDING_MODEL,
          })
          .eq('id', line.id);

        embeddedCount++;
      }
    } catch (aiErr: any) {
      console.warn('AI embedding session not available in local mock:', aiErr);
    }

    // Count remaining un-embedded lines
    const { count: remainingCount } = await adminClient
      .from('lyric_lines')
      .select('*', { count: 'exact', head: true })
      .eq('song_id', songId)
      .is('embedding', null);

    const remaining = remainingCount ?? 0;
    if (remaining === 0) {
      await adminClient
        .from('song_lyrics')
        .update({ embedding_status: 'done' })
        .eq('song_id', songId);
    } else {
      await adminClient
        .from('song_lyrics')
        .update({ embedding_status: 'partial' })
        .eq('song_id', songId);
    }

    return new Response(
      JSON.stringify({
        embedded: embeddedCount,
        remaining,
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
