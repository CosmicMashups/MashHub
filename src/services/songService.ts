/**
 * Song service facade: Supabase first, fallback to Dexie (database.ts).
 * All methods use withFallback so components need no changes.
 * When loading from Supabase, song_sections are synced to Dexie so Quick Match
 * and other section-based features have access to part-specific BPM/key data.
 */
import type { Song, SongSection } from '../types';
import { supabase } from '../lib/supabase';
import { withFallback, getBackendMode } from '../lib/withFallback';
import { db, dexieSongService, sectionService } from './database';

type EnrichedSong = Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string };

/** Supabase song_sections row (snake_case). */
type SupabaseSectionRow = {
  section_id: string;
  song_id: string;
  part: string;
  bpm: number | null;
  key: string;
  section_order: number;
};

function sectionsToEnriched(sections: { bpm: number | null; key: string; section_order: number }[]): { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string } {
  const sorted = [...sections].sort((a, b) => a.section_order - b.section_order);
  const bpms = Array.from(new Set(sorted.map((s) => s.bpm ?? 0)));
  const keys = Array.from(new Set(sorted.map((s) => s.key || 'C Major')));
  const first = sorted.find((s) => s.section_order === 1) ?? sorted[0];
  return {
    bpms,
    keys,
    primaryBpm: first != null && first.bpm != null ? first.bpm : undefined,
    primaryKey: first?.key || undefined,
  };
}

function rowToSong(
  row: { id: string; title: string; artist: string; type: string; origin: string; season: string; year: number | null; notes: string },
  sections: { bpm: number | null; key: string; section_order: number }[]
): EnrichedSong {
  const { bpms, keys, primaryBpm, primaryKey } = sectionsToEnriched(sections);
  return {
    id: row.id,
    title: row.title,
    artist: row.artist ?? '',
    type: row.type ?? '',
    origin: row.origin ?? '',
    season: row.season ?? '',
    year: row.year ?? 0,
    notes: row.notes ?? '',
    bpms,
    keys,
    primaryBpm,
    primaryKey,
  };
}

function supabaseSectionToSongSection(row: SupabaseSectionRow): SongSection {
  return {
    sectionId: row.section_id,
    songId: row.song_id,
    part: row.part ?? '',
    bpm: row.bpm ?? 0,
    key: row.key ?? 'C Major',
    sectionOrder: row.section_order,
  };
}

async function fetchAllFromSupabase(): Promise<EnrichedSong[]> {
  const pageSize = 1000;
  let from = 0;
  type SongRow = {
    id: string;
    title: string;
    artist: string;
    type: string;
    origin: string;
    season: string;
    year: number | null;
    notes: string;
    song_sections: SupabaseSectionRow[];
  };
  const allRows: SongRow[] = [];
  while (true) {
    const { data: songsData, error } = await supabase
      .from('songs')
      .select('*, song_sections(*)')
      .order('title')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const list = (songsData ?? []) as SongRow[];
    allRows.push(...list);
    if (list.length < pageSize) break;
    from += pageSize;
  }

  const songs = allRows.map((row) => rowToSong(row, row.song_sections ?? []));

  // Sync sections to Dexie so Quick Match and part-specific matching can read them
  const allSections: SongSection[] = [];
  for (const row of allRows) {
    const secs = row.song_sections ?? [];
    for (const s of secs) {
      allSections.push(supabaseSectionToSongSection(s));
    }
  }
  if (allSections.length > 0) {
    await db.songSections.clear();
    await sectionService.bulkAdd(allSections);
  }

  return songs;
}

async function fetchByIdFromSupabase(id: string): Promise<EnrichedSong | undefined> {
  const { data: row, error } = await supabase.from('songs').select('*, song_sections(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) return undefined;
  const r = row as { id: string; title: string; artist: string; type: string; origin: string; season: string; year: number | null; notes: string; song_sections: SupabaseSectionRow[] };
  return rowToSong(r, r.song_sections ?? []);
}

type SongRow = {
  id: string;
  title: string;
  artist: string;
  type: string;
  origin: string;
  season: string;
  year: number | null;
  notes: string;
  song_sections: SupabaseSectionRow[];
};

/** Fetch multiple songs from Supabase by ID. Returns a map; IDs not found are omitted. */
async function fetchByIdsFromSupabase(ids: string[]): Promise<Map<string, EnrichedSong>> {
  const map = new Map<string, EnrichedSong>();
  if (ids.length === 0) return map;
  const batchSize = 200;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { data: rows, error } = await supabase.from('songs').select('*, song_sections(*)').in('id', batch);
    if (error) throw error;
    const list = (rows ?? []) as SongRow[];
    for (const row of list) {
      map.set(row.id, rowToSong(row, row.song_sections ?? []));
    }
  }
  return map;
}

/** Same as fetchByIdsFromSupabase but also returns SongSection[] per song for writing to Dexie. */
export async function fetchByIdsFromSupabaseWithSections(
  ids: string[]
): Promise<Map<string, { song: EnrichedSong; sections: SongSection[] }>> {
  const map = new Map<string, { song: EnrichedSong; sections: SongSection[] }>();
  if (ids.length === 0) return map;
  const batchSize = 200;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { data: rows, error } = await supabase.from('songs').select('*, song_sections(*)').in('id', batch);
    if (error) throw error;
    const list = (rows ?? []) as SongRow[];
    for (const row of list) {
      const sections = (row.song_sections ?? []).map(supabaseSectionToSongSection);
      map.set(row.id, { song: rowToSong(row, row.song_sections ?? []), sections });
    }
  }
  return map;
}

async function addToSupabase(song: Song): Promise<string> {
  const { error } = await supabase.from('songs').insert({
    id: song.id,
    title: song.title,
    artist: song.artist ?? '',
    type: song.type ?? '',
    origin: song.origin ?? '',
    season: song.season ?? '',
    year: song.year ?? null,
    notes: song.notes ?? '',
  });
  if (error) throw error;
  return song.id;
}

async function updateInSupabase(song: Song): Promise<void> {
  const { error } = await supabase.from('songs').update({
    title: song.title,
    artist: song.artist ?? '',
    type: song.type ?? '',
    origin: song.origin ?? '',
    season: song.season ?? '',
    year: song.year ?? null,
    notes: song.notes ?? '',
  }).eq('id', song.id);
  if (error) throw error;
}

async function deleteFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from('songs').delete().eq('id', id);
  if (error) throw error;
}

async function bulkAddToSupabase(songs: Song[]): Promise<void> {
  const batchSize = 100;
  for (let i = 0; i < songs.length; i += batchSize) {
    const batch = songs.slice(i, i + batchSize).map((s) => ({
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
    if (error) throw error;
  }
}

async function clearAllSupabase(): Promise<void> {
  const { error: e2 } = await supabase.from('song_sections').delete().neq('section_id', '');
  if (e2) throw e2;
  const { error: e1 } = await supabase.from('songs').delete().neq('id', '');
  if (e1) throw e1;
}

export const songService = {
  async getAll(): Promise<EnrichedSong[]> {
    return withFallback(() => fetchAllFromSupabase(), () => dexieSongService.getAll());
  },

  async getPaginated(page: number, itemsPerPage = 25): Promise<{ songs: EnrichedSong[]; total: number }> {
    return withFallback(
      async () => {
        const { count } = await supabase.from('songs').select('id', { count: 'exact', head: true });
        const total = count ?? 0;
        const from = (page - 1) * itemsPerPage;
        const { data, error } = await supabase.from('songs').select('*, song_sections(*)').order('title').range(from, from + itemsPerPage - 1);
        if (error) throw error;
        const list = (data ?? []) as Array<{ id: string; title: string; artist: string; type: string; origin: string; season: string; year: number | null; notes: string; song_sections: Array<{ bpm: number | null; key: string; section_order: number }> }>;
        const songs = list.map((row) => rowToSong(row, row.song_sections ?? []));
        return { songs, total };
      },
      () => dexieSongService.getPaginated(page, itemsPerPage)
    );
  },

  async getById(id: string): Promise<EnrichedSong | undefined> {
    if (getBackendMode() === 'local') {
      return dexieSongService.getById(id);
    }
    try {
      const fromSupabase = await fetchByIdFromSupabase(id);
      if (fromSupabase !== undefined) return fromSupabase;
    } catch {
      // Supabase error: fall back to Dexie
      return dexieSongService.getById(id);
    }
    return dexieSongService.getById(id);
  },

  /**
   * Load songs by IDs: from Supabase first (batch), then from Dexie only for any IDs not found in Supabase.
   * When backend is local, loads only from Dexie.
   */
  async getByIds(ids: string[]): Promise<Map<string, EnrichedSong>> {
    const map = new Map<string, EnrichedSong>();
    if (ids.length === 0) return map;
    if (getBackendMode() === 'local') {
      const dexieMap = await dexieSongService.getByIds(ids);
      dexieMap.forEach((s, id) => map.set(id, s));
      return map;
    }
    try {
      const fromSupabase = await fetchByIdsFromSupabase(ids);
      fromSupabase.forEach((s, id) => map.set(id, s));
      const missingIds = ids.filter((id) => !map.has(id));
      if (missingIds.length > 0) {
        const fromDexie = await dexieSongService.getByIds(missingIds);
        fromDexie.forEach((s, id) => map.set(id, s));
      }
    } catch {
      const fromDexie = await dexieSongService.getByIds(ids);
      fromDexie.forEach((s, id) => map.set(id, s));
    }
    return map;
  },

  async add(song: Song): Promise<string> {
    return withFallback(() => addToSupabase(song), () => dexieSongService.add(song));
  },

  async bulkAdd(songs: Song[]): Promise<void> {
    return withFallback(
      () => bulkAddToSupabase(songs),
      () => dexieSongService.bulkAdd(songs)
    );
  },

  async clearAll(): Promise<void> {
    return withFallback(() => clearAllSupabase(), () => dexieSongService.clearAll());
  },

  async update(song: Song): Promise<number> {
    return withFallback(
      () => updateInSupabase(song).then(() => 1),
      () => dexieSongService.update(song)
    );
  },

  async delete(id: string): Promise<void> {
    return withFallback(() => deleteFromSupabase(id), () => dexieSongService.delete(id));
  },

  async search(query: string): Promise<EnrichedSong[]> {
    return withFallback(
      async () => {
        const q = query.toLowerCase();
        const { data, error } = await supabase.from('songs').select('*, song_sections(*)').or(`title.ilike.%${q}%,artist.ilike.%${q}%,type.ilike.%${q}%,origin.ilike.%${q}%`).order('title');
        if (error) throw error;
        const list = (data ?? []) as Array<{ id: string; title: string; artist: string; type: string; origin: string; season: string; year: number | null; notes: string; song_sections: Array<{ bpm: number | null; key: string; section_order: number }> }>;
        return list.map((row) => rowToSong(row, row.song_sections ?? []));
      },
      () => dexieSongService.search(query)
    );
  },

  async searchPaginated(query: string, page: number, itemsPerPage = 25): Promise<{ songs: EnrichedSong[]; total: number }> {
    return withFallback(
      async () => {
        const q = query.toLowerCase();
        const { data: allData, error: e1 } = await supabase.from('songs').select('id').or(`title.ilike.%${q}%,artist.ilike.%${q}%,type.ilike.%${q}%,origin.ilike.%${q}%`);
        if (e1) throw e1;
        const total = (allData ?? []).length;
        const from = (page - 1) * itemsPerPage;
        const { data, error } = await supabase.from('songs').select('*, song_sections(*)').or(`title.ilike.%${q}%,artist.ilike.%${q}%,type.ilike.%${q}%,origin.ilike.%${q}%`).order('title').range(from, from + itemsPerPage - 1);
        if (error) throw error;
        const list = (data ?? []) as Array<{ id: string; title: string; artist: string; type: string; origin: string; season: string; year: number | null; notes: string; song_sections: Array<{ bpm: number | null; key: string; section_order: number }> }>;
        const songs = list.map((row) => rowToSong(row, row.song_sections ?? []));
        return { songs, total };
      },
      () => dexieSongService.searchPaginated(query, page, itemsPerPage)
    );
  },

  async filterByBpm(minBpm: number, maxBpm: number): Promise<EnrichedSong[]> {
    return withFallback(
      async () => {
        const { data: sections, error: e1 } = await supabase.from('song_sections').select('song_id').gte('bpm', minBpm).lte('bpm', maxBpm);
        if (e1) throw e1;
        const songIds = Array.from(new Set((sections ?? []).map((s) => s.song_id)));
        if (songIds.length === 0) return [];
        const { data: songsData, error } = await supabase.from('songs').select('*, song_sections(*)').in('id', songIds).order('title');
        if (error) throw error;
        const list = (songsData ?? []) as Array<{ id: string; title: string; artist: string; type: string; origin: string; season: string; year: number | null; notes: string; song_sections: Array<{ bpm: number | null; key: string; section_order: number }> }>;
        return list.map((row) => rowToSong(row, row.song_sections ?? []));
      },
      () => dexieSongService.filterByBpm(minBpm, maxBpm)
    );
  },
};
