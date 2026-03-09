/**
 * Supabase Edge Function: import songs and sections (service role).
 * POST body: { songs: Array<SongRow>, sections: Array<SongSectionRow> }
 * Returns: { inserted: number, errors: string[] }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(url, key);

  const errors: string[] = [];
  let inserted = 0;
  try {
    const body = await req.json();
    const songs = body.songs ?? [];
    const sections = body.sections ?? [];
    const BATCH = 100;
    for (let i = 0; i < songs.length; i += BATCH) {
      const { error } = await supabase.from('songs').upsert(songs.slice(i, i + BATCH), { onConflict: 'id' });
      if (error) errors.push(`songs: ${error.message}`);
      else inserted += Math.min(BATCH, songs.length - i);
    }
    for (let i = 0; i < sections.length; i += BATCH) {
      const { error } = await supabase.from('song_sections').upsert(sections.slice(i, i + BATCH), { onConflict: 'section_id' });
      if (error) errors.push(`sections: ${error.message}`);
      else inserted += Math.min(BATCH, sections.length - i);
    }
  } catch (e) {
    errors.push(String(e));
  }
  return new Response(JSON.stringify({ inserted, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
