import Dexie, { type Table } from 'dexie';
import type { Song, SongSection, Project, ProjectEntry, ProjectSection, SpotifyMapping, VocalPhrase } from '../types';
import { SONG_BULK_INSERT_BATCH_SIZE } from '../constants';
import type { ProjectWithSections } from '../types';
import { invalidateSong, invalidateAll } from './sectionRepository';
import { getBackendMode } from '../lib/withFallback';

/** Expected table names — verified in the schema integrity check on open(). */
const EXPECTED_TABLES = ['songs', 'songSections', 'projects', 'projectSections', 'projectEntries', 'spotifyMappings', 'vocalPhrases'] as const;

export class MashupDatabase extends Dexie {
  songs!: Table<Song, string>;
  songSections!: Table<SongSection, string>;
  projects!: Table<Project, string>;
  projectSections!: Table<ProjectSection, string>;
  projectEntries!: Table<ProjectEntry, string>;
  spotifyMappings!: Table<SpotifyMapping, string>;
  vocalPhrases!: Table<VocalPhrase, number>;

  constructor() {
    super('MashupDatabase');
    
    this.version(1).stores({
      songs: 'id, title, artist, type, year, primaryBpm, primaryKey, origin, season, part, bpms, keys',
      projects: 'id, name, createdAt',
      projectEntries: 'id, projectId, songId, sectionName, orderIndex'
    });

    // Add indexes for better query performance
    this.version(2).stores({
      songs: 'id, title, artist, type, year, primaryBpm, primaryKey, origin, season, part, bpms, keys, [artist+type], [year+season]',
      projects: 'id, name, createdAt',
      projectEntries: 'id, projectId, songId, sectionName, orderIndex, [projectId+orderIndex]'
    }).upgrade(() => {
      // Migration logic if needed
    });

    // Version 3: Section-based architecture
    this.version(3).stores({
      songs: 'id, title, artist, type, year, origin, season, [artist+type], [year+season]',
      songSections: 'sectionId, songId, bpm, key, [songId+bpm], [songId+key], [songId+sectionOrder]',
      projects: 'id, name, createdAt',
      projectEntries: 'id, projectId, songId, sectionId, sectionName, orderIndex, [projectId+orderIndex]'
    }).upgrade(async (tx) => {
      // Migration from version 2 to version 3
      const oldSongs = await tx.table('songs').toArray();
      const newSongs: Song[] = [];
      const newSections: SongSection[] = [];
      let sectionIdCounter = 1;

      for (const oldSong of oldSongs) {
        // Create new song record without bpms, keys, part, primaryBpm, primaryKey
        const newSong: Song = {
          id: oldSong.id,
          title: oldSong.title,
          artist: oldSong.artist,
          type: oldSong.type,
          origin: oldSong.origin,
          year: oldSong.year,
          season: oldSong.season,
          notes: (oldSong as { notes?: string }).notes || '',
          bpms: [],
          keys: [],
        };
        newSongs.push(newSong);

        // Create section records from old song data
        const bpms = oldSong.bpms || [];
        const keys = oldSong.keys || [];
        const part = oldSong.part || 'Main';
        
        // Handle multiple BPMs/keys/parts
        const parts = part.includes(',') ? part.split(',').map((p: string) => p.trim()) : [part];
        const maxLength = Math.max(bpms.length, keys.length, parts.length, 1);
        
        for (let i = 0; i < maxLength; i++) {
          const section: SongSection = {
            sectionId: `section_${sectionIdCounter++}`,
            songId: oldSong.id,
            part: parts[i] || parts[0] || 'Main',
            bpm: bpms[i] || bpms[0] || 0,
            key: keys[i] || keys[0] || 'C Major',
            sectionOrder: i + 1
          };
          newSections.push(section);
        }
      }

      // Bulk insert new data
      await tx.table('songs').clear();
      await tx.table('songs').bulkAdd(newSongs);
      await tx.table('songSections').bulkAdd(newSections);

      // Update projectEntries to add sectionId field (null for backward compatibility)
      const entries = await tx.table('projectEntries').toArray();
      for (const entry of entries) {
        await tx.table('projectEntries').update(entry.id, { sectionId: null });
      }
    });

    // Version 4: Spotify integration
    this.version(4).stores({
      songs: 'id, title, artist, type, year, origin, season, [artist+type], [year+season]',
      songSections: 'sectionId, songId, bpm, key, [songId+bpm], [songId+key], [songId+sectionOrder]',
      projects: 'id, name, createdAt',
      projectEntries: 'id, projectId, songId, sectionId, sectionName, orderIndex, [projectId+orderIndex]',
      spotifyMappings: 'songId, spotifyTrackId, confidenceScore'
    }).upgrade(async () => {
      // No migration needed - new table
    });

    // Version 5: Performance optimization - additional compound indexes
    this.version(5).stores({
      songs: 'id, title, artist, type, year, origin, season, [artist+type], [year+season], [title+artist]',
      songSections: 'sectionId, songId, bpm, key, [songId+bpm], [songId+key], [songId+sectionOrder]',
      projects: 'id, name, createdAt',
      projectEntries: 'id, projectId, songId, sectionId, sectionName, orderIndex, [projectId+orderIndex]',
      spotifyMappings: 'songId, spotifyTrackId, confidenceScore'
    }).upgrade(async () => {
      // No migration needed - just adding indexes
    });

    // Version 6: Project type, ProjectEntry notes, vocal phrases
    this.version(6).stores({
      songs: 'id, title, artist, type, year, origin, season, [artist+type], [year+season], [title+artist]',
      songSections: 'sectionId, songId, bpm, key, [songId+bpm], [songId+key], [songId+sectionOrder]',
      projects: 'id, name, createdAt, type',
      projectEntries: 'id, projectId, songId, sectionId, sectionName, orderIndex, notes, [projectId+orderIndex]',
      spotifyMappings: 'songId, spotifyTrackId, confidenceScore',
      vocalPhrases: '++id, phrase, songId'
    }).upgrade(async (tx) => {
      await tx.table('projects').toCollection().modify((p: Project) => {
        (p as Project).type = (p as Project).type ?? 'dj-set';
      });
    });

    // Version 7: First-class project sections (ProjectSection table, entries by sectionId, locked)
    this.version(7).stores({
      songs: 'id, title, artist, type, year, origin, season, [artist+type], [year+season], [title+artist]',
      songSections: 'sectionId, songId, bpm, key, [songId+bpm], [songId+key], [songId+sectionOrder]',
      projects: 'id, name, createdAt, type',
      projectSections: 'id, projectId, orderIndex, [projectId+orderIndex]',
      projectEntries: 'id, projectId, songId, sectionId, orderIndex, [projectId+sectionId+orderIndex]',
      spotifyMappings: 'songId, spotifyTrackId, confidenceScore',
      vocalPhrases: '++id, phrase, songId'
    }).upgrade(async (tx) => {
      type LegacyEntry = { id: string; projectId: string; songId: string; sectionId?: string | null; sectionName?: string; orderIndex: number; notes?: string | null };
      await tx.table('projects').toCollection().modify((p: { type?: string }) => {
        const t = p.type;
        if (t !== 'seasonal' && t !== 'year-end' && t !== 'song-megamix') (p as { type: string }).type = 'other';
      });
      const entries = await tx.table('projectEntries').toArray() as LegacyEntry[];
      const sectionMap = new Map<string, string>();
      let sectionOrderCounter = 0;
      for (const entry of entries) {
        const sectionName = entry.sectionName ?? 'Default';
        const key = `${entry.projectId}|${sectionName}`;
        if (!sectionMap.has(key)) {
          const sectionId = crypto.randomUUID();
          sectionMap.set(key, sectionId);
          await tx.table('projectSections').add({
            id: sectionId,
            projectId: entry.projectId,
            name: sectionName,
            orderIndex: sectionOrderCounter++,
          });
        }
        const sectionId = sectionMap.get(key)!;
        await tx.table('projectEntries').update(entry.id, {
          sectionId,
          locked: false,
          notes: entry.notes ?? '',
        } as Partial<ProjectEntry>);
      }
    });
  }
}

export const db = new MashupDatabase();

// ─── Schema integrity check ───────────────────────────────────────────────────
db.open().then(() => {
  const existingTables = new Set(db.tables.map((t) => t.name));
  for (const expected of EXPECTED_TABLES) {
    if (!existingTables.has(expected)) {
      console.warn(`Schema integrity: missing table "${expected}". Some features may be unavailable.`);
    }
  }
}).catch((err: unknown) => {
  console.error('Failed to open database:', err);
});

// Helper functions for computing song properties from sections
function computePrimaryBpm(sections: SongSection[]): number | undefined {
  if (sections.length === 0) return undefined;
  const firstSection = sections.find(s => s.sectionOrder === 1) || sections[0];
  return firstSection.bpm;
}

function computePrimaryKey(sections: SongSection[]): string | undefined {
  if (sections.length === 0) return undefined;
  const firstSection = sections.find(s => s.sectionOrder === 1) || sections[0];
  return firstSection.key;
}

function computeBpms(sections: SongSection[]): number[] {
  const bpms = sections
    .sort((a, b) => a.sectionOrder - b.sectionOrder)
    .map(s => s.bpm);
  // Return unique values while preserving order
  return Array.from(new Set(bpms));
}

function computeKeys(sections: SongSection[]): string[] {
  const keys = sections
    .sort((a, b) => a.sectionOrder - b.sectionOrder)
    .map(s => s.key);
  // Return unique values while preserving order
  return Array.from(new Set(keys));
}

// ─── Batch enrichment helper ──────────────────────────────────────────────────

/**
 * Enrich a list of songs with their sections in ONE batch Dexie query.
 * Replaces the N+1 pattern of calling enrichSongWithSections per song.
 */
async function enrichSongsWithSections(
  songs: Song[]
): Promise<(Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string })[]> {
  if (songs.length === 0) return [];

  // Single anyOf query — one IndexedDB cursor open regardless of song count
  const ids = songs.map((s) => s.id);
  const allSections = await db.songSections.where('songId').anyOf(ids).toArray();

  // Group sections by songId
  const sectionMap = new Map<string, SongSection[]>();
  for (const section of allSections) {
    const arr = sectionMap.get(section.songId) ?? [];
    arr.push(section);
    sectionMap.set(section.songId, arr);
  }

  return songs.map((song) => {
    const sections = (sectionMap.get(song.id) ?? []).sort(
      (a, b) => a.sectionOrder - b.sectionOrder
    );
    return {
      ...song,
      bpms: computeBpms(sections),
      keys: computeKeys(sections),
      primaryBpm: computePrimaryBpm(sections),
      primaryKey: computePrimaryKey(sections),
    };
  });
}

// Database helper functions (exported as dexieSongService for Supabase facade)
const songService = {
  async getAll(): Promise<(Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string })[]> {
    const songs = await db.songs.orderBy('title').toArray();
    return enrichSongsWithSections(songs);
  },

  // Get paginated songs — batch-enriched
  async getPaginated(page: number, itemsPerPage = 25): Promise<{
    songs: (Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string })[];
    total: number;
  }> {
    const total = await db.songs.count();
    const offset = (page - 1) * itemsPerPage;
    const songs = await db.songs
      .orderBy('title')
      .offset(offset)
      .limit(itemsPerPage)
      .toArray();
    const enrichedSongs = await enrichSongsWithSections(songs);
    return { songs: enrichedSongs, total };
  },

  async getById(id: string): Promise<(Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string }) | undefined> {
    const song = await db.songs.get(id);
    if (!song) return undefined;
    const [enriched] = await enrichSongsWithSections([song]);
    return enriched;
  },

  async getByIds(ids: string[]): Promise<Map<string, Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string }>> {
    const map = new Map<string, Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string }>();
    if (ids.length === 0) return map;
    const songs = await db.songs.where('id').anyOf(ids).toArray();
    const enriched = await enrichSongsWithSections(songs);
    for (const s of enriched) {
      map.set(s.id, s);
    }
    return map;
  },

  /**
   * Ensure a song from the UI library exists in Dexie (songs + songSections) so
   * draft project entries can be rendered immediately while editing.
   */
  async ensureSongWithSections(song: Song): Promise<void> {
    const safeBpms = song.bpms?.length ? song.bpms : [song.primaryBpm ?? 0];
    const safeKeys = song.keys?.length ? song.keys : [song.primaryKey ?? 'C Major'];
    const maxLen = Math.max(safeBpms.length, safeKeys.length, 1);
    const sections: SongSection[] = [];
    for (let i = 0; i < maxLen; i++) {
      sections.push({
        sectionId: `${song.id}__auto_${i + 1}`,
        songId: song.id,
        part: 'Main',
        bpm: safeBpms[i] ?? safeBpms[0] ?? 0,
        key: safeKeys[i] ?? safeKeys[0] ?? 'C Major',
        sectionOrder: i + 1,
      });
    }
    await db.transaction('rw', [db.songs, db.songSections], async () => {
      await db.songs.put({
        id: song.id,
        title: song.title,
        artist: song.artist ?? '',
        type: song.type ?? '',
        origin: song.origin ?? '',
        season: song.season ?? '',
        year: song.year ?? 0,
        notes: song.notes ?? '',
        bpms: song.bpms ?? [],
        keys: song.keys ?? [],
      });
      const existingCount = await db.songSections.where('songId').equals(song.id).count();
      if (existingCount === 0) {
        await db.songSections.bulkPut(sections);
      }
    });
  },

  async add(song: Song): Promise<string> {
    return await db.songs.add(song);
  },

  async bulkAdd(songs: Song[]): Promise<void> {
    // Use bulkPut to handle duplicates gracefully (upsert behavior)
    for (let i = 0; i < songs.length; i += SONG_BULK_INSERT_BATCH_SIZE) {
      const batch = songs.slice(i, i + SONG_BULK_INSERT_BATCH_SIZE);
      await db.songs.bulkPut(batch);
      if (i + SONG_BULK_INSERT_BATCH_SIZE < songs.length) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
    invalidateAll();
  },

  async clearAll(): Promise<void> {
    await db.transaction('rw', [db.songs, db.songSections], async () => {
      await db.songs.clear();
      await db.songSections.clear();
    });
    invalidateAll();
  },

  async update(song: Song): Promise<number> {
    const { id, ...updateData } = song;
    return await db.songs.update(id, updateData);
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.songs, db.songSections], async () => {
      await db.songSections.where('songId').equals(id).delete();
      await db.songs.delete(id);
    });
    invalidateSong(id);
  },

  async search(query: string): Promise<(Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string })[]> {
    const lowerQuery = query.toLowerCase();
    const songs = await db.songs
      .filter((song) =>
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery) ||
        song.type.toLowerCase().includes(lowerQuery) ||
        song.origin.toLowerCase().includes(lowerQuery)
      )
      .toArray();
    return enrichSongsWithSections(songs);
  },

  // Search with pagination — batch-enriched
  async searchPaginated(query: string, page: number, itemsPerPage = 25): Promise<{
    songs: (Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string })[];
    total: number;
  }> {
    const lowerQuery = query.toLowerCase();
    const allSongs = await db.songs
      .filter((song) =>
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery) ||
        song.type.toLowerCase().includes(lowerQuery) ||
        song.origin.toLowerCase().includes(lowerQuery)
      )
      .toArray();
    const total = allSongs.length;
    const offset = (page - 1) * itemsPerPage;
    const paginatedSongs = allSongs.slice(offset, offset + itemsPerPage);
    const enrichedSongs = await enrichSongsWithSections(paginatedSongs);
    return { songs: enrichedSongs, total };
  },

  async filterByBpm(minBpm: number, maxBpm: number): Promise<(Song & { bpms: number[]; keys: string[]; primaryBpm?: number; primaryKey?: string })[]> {
    // Query sections first, then get unique songs
    const matchingSections = await db.songSections
      .where('bpm')
      .between(minBpm, maxBpm, true, true)
      .toArray();
    
    const uniqueSongIds = Array.from(new Set(matchingSections.map((s) => s.songId)));
    const songs = await db.songs.where('id').anyOf(uniqueSongIds).toArray();
    return enrichSongsWithSections(songs);
  },

};

// Section service
export const sectionService = {
  async getBySongId(songId: string): Promise<SongSection[]> {
    return await db.songSections
      .where('songId')
      .equals(songId)
      .sortBy('sectionOrder');
  },

  async getAll(): Promise<SongSection[]> {
    return await db.songSections.toArray();
  },

  async getById(sectionId: string): Promise<SongSection | undefined> {
    return await db.songSections.get(sectionId);
  },

  async add(section: SongSection): Promise<string> {
    return await db.songSections.add(section);
  },

  async bulkAdd(sections: SongSection[]): Promise<void> {
    // Use bulkPut instead of bulkAdd to handle duplicates (upsert behavior)
    // This prevents "Key already exists" errors if sections are already in DB
    const BATCH_SIZE = 1000;
    for (let i = 0; i < sections.length; i += BATCH_SIZE) {
      const batch = sections.slice(i, i + BATCH_SIZE);
      await db.songSections.bulkPut(batch);
      // Yield to event loop between batches
      if (i + BATCH_SIZE < sections.length) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
  },

  async update(section: SongSection): Promise<number> {
    const { sectionId, ...updateData } = section;
    return await db.songSections.update(sectionId, updateData);
  },

  async delete(sectionId: string): Promise<void> {
    await db.songSections.delete(sectionId);
  },

  async deleteBySongId(songId: string): Promise<void> {
    await db.songSections.where('songId').equals(songId).delete();
  },

  async getUniqueParts(): Promise<string[]> {
    const sections = await db.songSections.toArray();
    const parts = new Set(sections.map((s) => s.part).filter(Boolean));
    return Array.from(parts).sort();
  },

  /**
   * Delete any `songSections` rows whose `songId` does not exist in the `songs` table.
   * Skips when backend is Supabase (Dexie sections are a cache; songs live only in Supabase).
   * Runs as a non-blocking background task scheduled after the initial render.
   * Safe to call multiple times (idempotent).
   */
  async cleanOrphanedSections(): Promise<number> {
    if (getBackendMode() === 'supabase') return 0;
    const [allSongIds, allSections] = await Promise.all([
      db.songs.toCollection().primaryKeys() as Promise<string[]>,
      db.songSections.toArray(),
    ]);
    const songIdSet = new Set(allSongIds);
    const orphanIds = allSections
      .filter((s) => !songIdSet.has(s.songId))
      .map((s) => s.sectionId);
    if (orphanIds.length > 0) {
      await db.songSections.bulkDelete(orphanIds);
    }
    return orphanIds.length;
  },
};

// Project service (exported as dexieProjectService for Supabase facade)
const projectService = {
  async getAll(): Promise<Project[]> {
    return await db.projects.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: string): Promise<Project | undefined> {
    return await db.projects.get(id);
  },

  async add(project: Project): Promise<string> {
    return await db.projects.add(project);
  },

  async update(project: Project): Promise<number> {
    const { id, ...updateData } = project;
    return await db.projects.update(id, updateData);
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.projects, db.projectSections, db.projectEntries], async () => {
      const sections = await db.projectSections.where('projectId').equals(id).toArray();
      for (const sec of sections) {
        await db.projectEntries.where('sectionId').equals(sec.id).delete();
      }
      await db.projectSections.where('projectId').equals(id).delete();
      await db.projectEntries.where('projectId').equals(id).delete();
      await db.projects.delete(id);
    });
  },

  // Sections
  async getSectionsByProject(projectId: string): Promise<ProjectSection[]> {
    return await db.projectSections.where('projectId').equals(projectId).sortBy('orderIndex');
  },

  async addSection(section: Omit<ProjectSection, 'id'>): Promise<string> {
    const id = crypto.randomUUID();
    const existing = await db.projectSections.where('projectId').equals(section.projectId).toArray();
    const nextOrderIndex = existing.length > 0 ? Math.max(...existing.map((s) => s.orderIndex)) + 1 : 0;
    await db.projectSections.add({ ...section, orderIndex: nextOrderIndex, id });
    return id;
  },

  async updateSection(section: ProjectSection): Promise<void> {
    await db.projectSections.update(section.id, section);
  },

  async deleteSection(sectionId: string): Promise<void> {
    await db.transaction('rw', [db.projectSections, db.projectEntries], async () => {
      const section = await db.projectSections.get(sectionId);
      if (!section) return;
      await db.projectEntries.where('sectionId').equals(sectionId).delete();
      await db.projectSections.delete(sectionId);
      const remainingSections = await db.projectSections.where('projectId').equals(section.projectId).sortBy('orderIndex');
      for (let index = 0; index < remainingSections.length; index += 1) {
        await db.projectSections.update(remainingSections[index].id, { orderIndex: index });
      }
    });
  },

  async reorderSections(_projectId: string, sectionIds: string[]): Promise<void> {
    await db.transaction('rw', db.projectSections, async () => {
      for (let i = 0; i < sectionIds.length; i++) {
        await db.projectSections.update(sectionIds[i], { orderIndex: i });
      }
    });
  },

  // Entries
  async getEntriesForSection(sectionId: string): Promise<ProjectEntry[]> {
    return await db.projectEntries.where('sectionId').equals(sectionId).sortBy('orderIndex');
  },

  async addSongToSection(projectId: string, songId: string, sectionId: string): Promise<string> {
    const entries = await db.projectEntries.where('sectionId').equals(sectionId).toArray();
    const maxOrder = entries.length > 0 ? Math.max(...entries.map((e) => e.orderIndex)) : -1;
    const id = crypto.randomUUID();
    await db.projectEntries.add({
      id,
      projectId,
      songId,
      sectionId,
      orderIndex: maxOrder + 1,
      locked: false,
    });
    return id;
  },

  async removeSongFromSection(entryId: string): Promise<void> {
    await db.projectEntries.delete(entryId);
  },

  /** Remove all entries for a project (used when syncing draft). */
  async removeAllEntriesFromProject(projectId: string): Promise<void> {
    await db.projectEntries.where('projectId').equals(projectId).delete();
  },

  /** Move an entry to another section (append to target section). */
  async moveSongToSection(entryId: string, targetSectionId: string): Promise<void> {
    const entry = await db.projectEntries.get(entryId);
    if (!entry) return;
    const targetEntries = await db.projectEntries.where('sectionId').equals(targetSectionId).toArray();
    const maxOrder = targetEntries.length > 0 ? Math.max(...targetEntries.map((e) => e.orderIndex)) : -1;
    await db.projectEntries.update(entryId, { sectionId: targetSectionId, orderIndex: maxOrder + 1 });
  },

  /** Remove every entry for a given song in a project (all sections). */
  async removeSongFromProject(projectId: string, songId: string): Promise<void> {
    const entries = await db.projectEntries
      .where('projectId')
      .equals(projectId)
      .filter((e) => e.songId === songId)
      .toArray();
    for (const e of entries) await db.projectEntries.delete(e.id);
  },

  async toggleLock(entryId: string): Promise<void> {
    const entry = await db.projectEntries.get(entryId);
    if (entry) await db.projectEntries.update(entryId, { locked: !entry.locked });
  },

  async updateEntryNotes(entryId: string, notes: string): Promise<void> {
    await db.projectEntries.update(entryId, { notes });
  },

  async reorderEntriesInSection(_sectionId: string, entryIds: string[]): Promise<void> {
    await db.transaction('rw', db.projectEntries, async () => {
      for (let i = 0; i < entryIds.length; i++) {
        await db.projectEntries.update(entryIds[i], { orderIndex: i });
      }
    });
  },

  async getProjectWithSections(projectId: string): Promise<ProjectWithSections> {
    const project = await this.getById(projectId);
    if (!project) throw new Error('Project not found');
    const sections = await this.getSectionsByProject(projectId);
    const songIds = new Set<string>();
    for (const sec of sections) {
      const entries = await this.getEntriesForSection(sec.id);
      entries.forEach((e) => songIds.add(e.songId));
    }
    const songsRaw = await db.songs.where('id').anyOf([...songIds]).toArray();
    const enrichedSongs = await enrichSongsWithSections(songsRaw);
    const songMap = new Map(enrichedSongs.map((s) => [s.id, s]));

    const sectionsWithSongs: ProjectWithSections['sections'] = [];
    for (const sec of sections) {
      const entries = await this.getEntriesForSection(sec.id);
      const songs = entries
        .map((e) => {
          const song = songMap.get(e.songId);
          if (!song) return null;
          return {
            ...song,
            entryId: e.id,
            locked: e.locked,
            notes: e.notes ?? '',
          };
        })
        .filter((s): s is NonNullable<typeof s> => s != null);
      sectionsWithSongs.push({ ...sec, songs });
    }

    return { ...project, sections: sectionsWithSongs };
  },

  /**
   * Replace project, sections, and entries in Dexie with data from Supabase sync.
   * Also upserts the given songs and their song_sections into Dexie.
   */
  async writeProjectWithSectionsFromSupabase(
    projectWithSections: ProjectWithSections,
    songsWithSections: Map<string, { song: Song & { bpms: number[]; keys: string[] }; sections: SongSection[] }>
  ): Promise<void> {
    const { id: projectId, sections, ...projectMeta } = projectWithSections;
    const projectRow: Project = { ...projectMeta, id: projectId };
    await db.transaction('rw', [db.projects, db.projectSections, db.projectEntries, db.songs, db.songSections], async () => {
      await db.projects.put(projectRow);
      const existingSections = await db.projectSections.where('projectId').equals(projectId).toArray();
      for (const sec of existingSections) {
        await db.projectEntries.where('sectionId').equals(sec.id).delete();
      }
      await db.projectSections.where('projectId').equals(projectId).delete();
      await db.projectEntries.where('projectId').equals(projectId).delete();

      for (const sec of sections) {
        await db.projectSections.put(sec);
      }
      const entries: ProjectEntry[] = [];
      for (const sec of sections) {
        sec.songs.forEach((s, idx) => {
          entries.push({
            id: s.entryId,
            projectId,
            songId: s.id,
            sectionId: sec.id,
            orderIndex: idx,
            locked: s.locked,
            notes: s.notes ?? '',
          });
        });
      }
      if (entries.length > 0) {
        await db.projectEntries.bulkPut(entries);
      }

      for (const [, { song, sections: songSections }] of songsWithSections) {
        const basicSong: Song = {
          id: song.id,
          title: song.title,
          artist: song.artist,
          type: song.type,
          origin: song.origin,
          year: song.year,
          season: song.season,
          notes: song.notes ?? '',
          bpms: song.bpms ?? [],
          keys: song.keys ?? [],
        };
        await db.songs.put(basicSong);
        await db.songSections.where('songId').equals(song.id).delete();
        if (songSections.length > 0) {
          await db.songSections.bulkPut(songSections);
        }
      }
    });
  },

  /**
   * Write only project, sections, and entries to Dexie (e.g. after Save to Supabase).
   * Does not modify songs/songSections.
   */
  async writeProjectDataToDexie(projectWithSections: ProjectWithSections): Promise<void> {
    const { id: projectId, sections, ...projectMeta } = projectWithSections;
    const projectRow: Project = { ...projectMeta, id: projectId };
    await db.transaction('rw', [db.projects, db.projectSections, db.projectEntries], async () => {
      await db.projects.put(projectRow);
      const existingSections = await db.projectSections.where('projectId').equals(projectId).toArray();
      for (const sec of existingSections) {
        await db.projectEntries.where('sectionId').equals(sec.id).delete();
      }
      await db.projectSections.where('projectId').equals(projectId).delete();
      await db.projectEntries.where('projectId').equals(projectId).delete();

      for (const sec of sections) {
        await db.projectSections.put(sec);
      }
      const entries: ProjectEntry[] = [];
      for (const sec of sections) {
        sec.songs.forEach((s, idx) => {
          entries.push({
            id: s.entryId,
            projectId,
            songId: s.id,
            sectionId: sec.id,
            orderIndex: idx,
            locked: s.locked,
            notes: s.notes ?? '',
          });
        });
      }
      if (entries.length > 0) {
        await db.projectEntries.bulkPut(entries);
      }
    });
  },
};

export { songService as dexieSongService, projectService as dexieProjectService };