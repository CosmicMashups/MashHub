import Dexie, { type Table } from 'dexie';
import type { Song, SongSection, Project, ProjectEntry, SpotifyMapping } from '../types';
import { SONG_BULK_INSERT_BATCH_SIZE } from '../constants';
import { invalidateSong, invalidateAll } from './sectionRepository';

/** Expected table names — verified in the schema integrity check on open(). */
const EXPECTED_TABLES = ['songs', 'songSections', 'projects', 'projectEntries', 'spotifyMappings'] as const;

export class MashupDatabase extends Dexie {
  songs!: Table<Song, string>;
  songSections!: Table<SongSection, string>;
  projects!: Table<Project, string>;
  projectEntries!: Table<ProjectEntry, string>;
  spotifyMappings!: Table<SpotifyMapping, string>;

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

// Database helper functions
export const songService = {
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

  async add(song: Song): Promise<string> {
    return await db.songs.add(song);
  },

  async bulkAdd(songs: Song[]): Promise<void> {
    for (let i = 0; i < songs.length; i += SONG_BULK_INSERT_BATCH_SIZE) {
      const batch = songs.slice(i, i + SONG_BULK_INSERT_BATCH_SIZE);
      await db.songs.bulkAdd(batch);
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

  async getById(sectionId: string): Promise<SongSection | undefined> {
    return await db.songSections.get(sectionId);
  },

  async add(section: SongSection): Promise<string> {
    return await db.songSections.add(section);
  },

  async bulkAdd(sections: SongSection[]): Promise<void> {
    await db.songSections.bulkAdd(sections);
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
   * Runs as a non-blocking background task scheduled after the initial render.
   * Safe to call multiple times (idempotent).
   */
  async cleanOrphanedSections(): Promise<number> {
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

export const projectService = {
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
    await db.transaction('rw', [db.projects, db.projectEntries], async () => {
      await db.projectEntries.where('projectId').equals(id).delete();
      await db.projects.delete(id);
    });
  },

  async getSongs(projectId: string): Promise<ProjectEntry[]> {
    return await db.projectEntries
      .where('projectId')
      .equals(projectId)
      .toArray()
      .then(entries => entries.sort((a, b) => a.orderIndex - b.orderIndex));
  },

  async addSongToProject(projectId: string, songId: string, sectionName: string = 'Main', sectionId?: string | null): Promise<string> {
    const existingEntries = await db.projectEntries
      .where('projectId')
      .equals(projectId)
      .toArray();
    
    const maxOrder = existingEntries.length > 0 
      ? Math.max(...existingEntries.map(e => e.orderIndex))
      : -1;

    const entry: ProjectEntry = {
      id: Date.now().toString(),
      projectId,
      songId,
      sectionId: sectionId ?? null,
      sectionName,
      orderIndex: maxOrder + 1
    };

    return await db.projectEntries.add(entry);
  },

  async removeSongFromProject(projectId: string, songId: string): Promise<void> {
    await db.projectEntries
      .where('projectId')
      .equals(projectId)
      .and(entry => entry.songId === songId)
      .delete();
  },

  async reorderSongs(projectId: string, songIds: string[]): Promise<void> {
    await db.transaction('rw', db.projectEntries, async () => {
      for (let i = 0; i < songIds.length; i++) {
        await db.projectEntries
          .where('projectId')
          .equals(projectId)
          .and(entry => entry.songId === songIds[i])
          .modify({ orderIndex: i });
      }
    });
  },

  async getProjectWithSections(projectId: string): Promise<Project & { sections: { [key: string]: Song[] } }> {
    const project = await this.getById(projectId);
    if (!project) throw new Error('Project not found');

    const entries = await this.getSongs(projectId);

    // Batch-load all songs in one query instead of N individual getById calls
    const songIds = [...new Set(entries.map((e) => e.songId))];
    const songsRaw = await db.songs.where('id').anyOf(songIds).toArray();
    const enrichedSongs = await enrichSongsWithSections(songsRaw);
    const songMap = new Map(enrichedSongs.map((s) => [s.id, s]));

    const sections: { [key: string]: Song[] } = {};

    for (const entry of entries) {
      if (!sections[entry.sectionName]) {
        sections[entry.sectionName] = [];
      }
      const song = songMap.get(entry.songId);
      if (song) sections[entry.sectionName].push(song);
    }

    // Sort songs within each section by orderIndex
    for (const sectionName of Object.keys(sections)) {
      sections[sectionName].sort((a, b) => {
        const aEntry = entries.find((e) => e.songId === a.id && e.sectionName === sectionName);
        const bEntry = entries.find((e) => e.songId === b.id && e.sectionName === sectionName);
        return (aEntry?.orderIndex ?? 0) - (bEntry?.orderIndex ?? 0);
      });
    }

    return { ...project, sections };
  },

  async reorderSongsInSection(projectId: string, _sectionName: string, songIds: string[]): Promise<void> {
    await db.transaction('rw', db.projectEntries, async () => {
      for (let i = 0; i < songIds.length; i++) {
        await db.projectEntries
          .where(['projectId', 'songId'])
          .equals([projectId, songIds[i]])
          .modify({ orderIndex: i });
      }
    });
  },

  async moveSongToSection(projectId: string, songId: string, newSectionName: string): Promise<void> {
    await db.projectEntries
      .where(['projectId', 'songId'])
      .equals([projectId, songId])
      .modify({ sectionName: newSectionName });
  }
};