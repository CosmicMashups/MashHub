/**
 * Seed songs and song_sections from CSV files into Supabase.
 * Run with: npx tsx scripts/seed.ts
 * Loads .env from project root. Requires VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * Idempotent: upsert by id/section_id so running twice does not duplicate.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { parseSongsCSV, parseSongSectionsCSV } from '../src/data/csvParsers';

const BATCH_SIZE = 100;
const __dirname = fileURLToPath(new URL('.', import.meta.url));

function loadEnv(): void {
  const projectRoot = join(__dirname, '..');
  const envPath = join(projectRoot, '.env');
  try {
    const raw = readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
        value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env optional if vars set in shell
  }
}

loadEnv();

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`);
  return v;
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(url, serviceRoleKey);

  const projectRoot = join(__dirname, '..');
  const songsPath = join(projectRoot, 'data', 'songs.csv');
  const sectionsPath = join(projectRoot, 'data', 'song_sections.csv');

  let songsText: string;
  let sectionsText: string;
  try {
    songsText = readFileSync(songsPath, 'utf-8');
    sectionsText = readFileSync(sectionsPath, 'utf-8');
  } catch (e) {
    console.error('Read CSV failed. Ensure data/songs.csv and data/song_sections.csv exist.', e);
    process.exit(1);
  }

  const songs = parseSongsCSV(songsText);
  const sections = parseSongSectionsCSV(sectionsText);
  const songIds = new Set(songs.map((s) => s.id));
  const validSections = sections.filter((s) => songIds.has(s.songId));

  console.log('Songs:', songs.length, 'Sections (valid):', validSections.length);

  for (let i = 0; i < songs.length; i += BATCH_SIZE) {
    const batch = songs.slice(i, i + BATCH_SIZE).map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist ?? '',
      type: s.type ?? '',
      origin: s.origin ?? '',
      season: s.season ?? '',
      year: s.year ?? null,
      notes: s.notes ?? '',
    }));
    const { error } = await supabase.from('songs').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error('Songs upsert error:', error);
      throw error;
    }
  }

  for (let i = 0; i < validSections.length; i += BATCH_SIZE) {
    const batch = validSections.slice(i, i + BATCH_SIZE).map((s) => ({
      section_id: s.sectionId,
      song_id: s.songId,
      part: s.part ?? '',
      bpm: s.bpm ?? null,
      key: s.key ?? '',
      section_order: s.sectionOrder ?? 1,
    }));
    const { error } = await supabase.from('song_sections').upsert(batch, { onConflict: 'section_id' });
    if (error) {
      console.error('Sections upsert error:', error);
      throw error;
    }
  }

  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
