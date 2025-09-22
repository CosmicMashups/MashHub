import Dexie, { type Table } from 'dexie';
import type { Song, Project, ProjectEntry } from '../types';

export class MashupDatabase extends Dexie {
  songs!: Table<Song>;
  projects!: Table<Project>;
  projectEntries!: Table<ProjectEntry>;

  constructor() {
    super('MashupDatabase');
    
    this.version(1).stores({
      songs: 'id, title, artist, type, year, vocalStatus, primaryBpm, primaryKey, origin, season, part, bpms, keys',
      projects: 'id, name, createdAt',
      projectEntries: 'id, projectId, songId, sectionName, orderIndex'
    });

    // Add indexes for better query performance
    this.version(2).stores({
      songs: 'id, title, artist, type, year, vocalStatus, primaryBpm, primaryKey, origin, season, part, bpms, keys, [artist+type], [year+season]',
      projects: 'id, name, createdAt',
      projectEntries: 'id, projectId, songId, sectionName, orderIndex, [projectId+orderIndex]'
    }).upgrade(() => {
      // Migration logic if needed
    });
  }
}

export const db = new MashupDatabase();

// Database helper functions
export const songService = {
  async getAll(): Promise<Song[]> {
    return await db.songs.orderBy('title').toArray();
  },

  async getById(id: string): Promise<Song | undefined> {
    return await db.songs.get(id);
  },

  async add(song: Song): Promise<string> {
    return await db.songs.add(song);
  },

  async bulkAdd(songs: Song[]): Promise<void> {
    await db.songs.bulkAdd(songs);
  },

  async clearAll(): Promise<void> {
    await db.songs.clear();
  },

  async update(song: Song): Promise<number> {
    const { id, ...updateData } = song;
    return await db.songs.update(id, updateData);
  },

  async delete(id: string): Promise<void> {
    await db.songs.delete(id);
  },

  async search(query: string): Promise<Song[]> {
    const lowerQuery = query.toLowerCase();
    return await db.songs
      .filter(song => 
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery) ||
        song.type.toLowerCase().includes(lowerQuery) ||
        song.origin.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },

  async filterByBpm(minBpm: number, maxBpm: number): Promise<Song[]> {
    return await db.songs
      .filter(song => 
        song.bpms.some(bpm => bpm >= minBpm && bpm <= maxBpm)
      )
      .toArray();
  },

  async filterByVocalStatus(status: string): Promise<Song[]> {
    if (!status) return await this.getAll();
    return await db.songs
      .filter(song => song.vocalStatus === status)
      .toArray();
  }
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
    // Also delete all project entries
    await db.projectEntries.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  },

  async getSongs(projectId: string): Promise<ProjectEntry[]> {
    return await db.projectEntries
      .where('projectId')
      .equals(projectId)
      .toArray()
      .then(entries => entries.sort((a, b) => a.orderIndex - b.orderIndex));
  },

  async addSongToProject(projectId: string, songId: string, sectionName: string = 'Main'): Promise<string> {
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
    const sections: { [key: string]: Song[] } = {};

    // Group songs by section
    for (const entry of entries) {
      if (!sections[entry.sectionName]) {
        sections[entry.sectionName] = [];
      }
      const song = await songService.getById(entry.songId);
      if (song) {
        sections[entry.sectionName].push(song);
      }
    }

    // Sort songs within each section by orderIndex
    Object.keys(sections).forEach(sectionName => {
      sections[sectionName].sort((a, b) => {
        const aEntry = entries.find(e => e.songId === a.id && e.sectionName === sectionName);
        const bEntry = entries.find(e => e.songId === b.id && e.sectionName === sectionName);
        return (aEntry?.orderIndex || 0) - (bEntry?.orderIndex || 0);
      });
    });

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