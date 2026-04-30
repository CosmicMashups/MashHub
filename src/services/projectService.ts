/**
 * Project service facade: Supabase first, fallback to Dexie (database.ts).
 * All methods use withFallback. user_id set from auth.getUser() on add when in Supabase mode.
 */
import type { Project, ProjectSection, ProjectEntry, ProjectWithSections, ProjectType } from '../types';
import { supabase } from '../lib/supabase';
import { withFallback, getBackendMode } from '../lib/withFallback';
import { dexieProjectService } from './database';
import { songService, fetchByIdsFromSupabaseWithSections } from './songService';

function mapProjectRow(row: {
  id: string;
  user_id: string | null;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  year?: number | null;
  season?: string | null;
  year_range_min?: number | null;
  year_range_max?: number | null;
  cover_image?: string | null;
}): Project {
  return {
    id: row.id,
    name: row.name,
    type: row.type as ProjectType,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ...(row.year != null && { year: row.year }),
    ...(row.season != null && row.season !== '' && { season: row.season }),
    ...(row.year_range_min != null && { yearRangeMin: row.year_range_min }),
    ...(row.year_range_max != null && { yearRangeMax: row.year_range_max }),
    ...(row.cover_image != null && row.cover_image !== '' && { coverImage: row.cover_image }),
  };
}

function mapSectionRow(row: { id: string; project_id: string; name: string; order_index: number; target_bpm: number | null; bpm_range_min: number | null; bpm_range_max: number | null; target_key: string | null; key_range_camelot: number | null; key_range: string[] | null }): ProjectSection {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    orderIndex: row.order_index,
    targetBpm: row.target_bpm ?? undefined,
    bpmRangeMin: row.bpm_range_min ?? undefined,
    bpmRangeMax: row.bpm_range_max ?? undefined,
    targetKey: row.target_key ?? undefined,
    keyRangeCamelot: row.key_range_camelot ?? undefined,
    keyRange: row.key_range ?? undefined,
  };
}

function mapEntryRow(row: { id: string; project_id: string; song_id: string; section_id: string | null; order_index: number; locked: boolean; notes: string }): ProjectEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    songId: row.song_id,
    sectionId: row.section_id ?? '',
    orderIndex: row.order_index,
    locked: row.locked,
    notes: row.notes ?? '',
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export const projectService = {
  async getAll(): Promise<Project[]> {
    return withFallback(
      async () => {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map(mapProjectRow);
      },
      () => dexieProjectService.getAll()
    );
  },

  async getById(id: string): Promise<Project | undefined> {
    return withFallback(
      async () => {
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? mapProjectRow(data) : undefined;
      },
      () => dexieProjectService.getById(id)
    );
  },

  async add(project: Omit<Project, 'id' | 'createdAt'> & { id?: string; createdAt?: Date }): Promise<string> {
    return withFallback(
      async () => {
        const userId = await getCurrentUserId();
        const id = project.id ?? crypto.randomUUID();
        const { error } = await supabase.from('projects').insert({
          id,
          user_id: userId,
          name: project.name,
          type: project.type,
          ...(project.year != null && { year: project.year }),
          ...(project.season != null && project.season !== '' && { season: project.season }),
          ...(project.yearRangeMin != null && { year_range_min: project.yearRangeMin }),
          ...(project.yearRangeMax != null && { year_range_max: project.yearRangeMax }),
          ...(project.coverImage != null && project.coverImage !== '' && { cover_image: project.coverImage }),
        });
        if (error) throw error;
        return id;
      },
      () => dexieProjectService.add({ ...project, id: project.id ?? crypto.randomUUID(), createdAt: new Date() } as Project)
    );
  },

  async update(project: Project): Promise<void> {
    return withFallback(
      async () => {
        const { error } = await supabase.from('projects').update({
          name: project.name,
          type: project.type,
          ...(project.year !== undefined && { year: project.year ?? null }),
          ...(project.season !== undefined && { season: project.season ?? null }),
          ...(project.yearRangeMin !== undefined && { year_range_min: project.yearRangeMin ?? null }),
          ...(project.yearRangeMax !== undefined && { year_range_max: project.yearRangeMax ?? null }),
          ...(project.coverImage !== undefined && { cover_image: project.coverImage ?? null }),
        }).eq('id', project.id);
        if (error) throw error;
      },
      () => dexieProjectService.update(project)
    );
  },

  async delete(id: string): Promise<void> {
    return withFallback(
      () => supabase.from('projects').delete().eq('id', id).then(({ error }) => { if (error) throw error; }),
      () => dexieProjectService.delete(id)
    );
  },

  async getSectionsByProject(projectId: string): Promise<ProjectSection[]> {
    return withFallback(
      async () => {
        const { data, error } = await supabase.from('project_sections').select('*').eq('project_id', projectId).order('order_index');
        if (error) throw error;
        return (data ?? []).map(mapSectionRow);
      },
      () => dexieProjectService.getSectionsByProject(projectId)
    );
  },

  async addSection(section: Omit<ProjectSection, 'id'> & { id?: string }): Promise<string> {
    return withFallback(
      async () => {
        const id = section.id ?? crypto.randomUUID();
        const { data: sections } = await supabase
          .from('project_sections')
          .select('order_index')
          .eq('project_id', section.projectId)
          .order('order_index', { ascending: false })
          .limit(1);
        const nextOrderIndex = sections?.[0]?.order_index != null ? sections[0].order_index + 1 : 0;
        const { error } = await supabase.from('project_sections').insert({
          id,
          project_id: section.projectId,
          name: section.name,
          order_index: nextOrderIndex,
          target_bpm: section.targetBpm ?? null,
          bpm_range_min: section.bpmRangeMin ?? null,
          bpm_range_max: section.bpmRangeMax ?? null,
          target_key: section.targetKey ?? null,
          key_range_camelot: section.keyRangeCamelot ?? null,
          key_range: section.keyRange ?? null,
        });
        if (error) throw error;
        return id;
      },
      () => dexieProjectService.addSection(section as Omit<ProjectSection, 'id'>)
    );
  },

  async updateSection(section: ProjectSection): Promise<void> {
    return withFallback(
      async () => {
        const { error } = await supabase.from('project_sections').update({
          name: section.name,
          order_index: section.orderIndex,
          target_bpm: section.targetBpm ?? null,
          bpm_range_min: section.bpmRangeMin ?? null,
          bpm_range_max: section.bpmRangeMax ?? null,
          target_key: section.targetKey ?? null,
          key_range_camelot: section.keyRangeCamelot ?? null,
          key_range: section.keyRange ?? null,
        }).eq('id', section.id);
        if (error) throw error;
      },
      () => dexieProjectService.updateSection(section)
    );
  },

  async deleteSection(sectionId: string): Promise<void> {
    return withFallback(
      async () => {
        const { error } = await supabase.from('project_sections').delete().eq('id', sectionId);
        if (error) throw error;
      },
      () => dexieProjectService.deleteSection(sectionId)
    );
  },

  async reorderSections(_projectId: string, sectionIds: string[]): Promise<void> {
    return withFallback(
      async () => {
        console.log('[reorder][service][reorderSections][start]', { projectId: _projectId, sectionIds });
        const results = await Promise.all(
          sectionIds.map((id, i) =>
            supabase
              .from('project_sections')
              .update({ order_index: i })
              .eq('id', id)
              .eq('project_id', _projectId)
          )
        );
        const failed = results.find((r) => r.error != null);
        if (failed?.error) throw failed.error;
        console.log('[reorder][service][reorderSections][done]', { projectId: _projectId, count: results.length });
      },
      () => dexieProjectService.reorderSections(_projectId, sectionIds)
    );
  },

  async getEntriesForSection(sectionId: string): Promise<ProjectEntry[]> {
    return withFallback(
      async () => {
        const { data, error } = await supabase.from('project_entries').select('*').eq('section_id', sectionId).order('order_index');
        if (error) throw error;
        return (data ?? []).map(mapEntryRow);
      },
      () => dexieProjectService.getEntriesForSection(sectionId)
    );
  },

  async addSongToSection(projectId: string, songId: string, sectionId: string): Promise<string> {
    return withFallback(
      async () => {
        const { data: entries } = await supabase.from('project_entries').select('order_index').eq('section_id', sectionId).order('order_index', { ascending: false }).limit(1);
        const maxOrder = entries?.[0]?.order_index ?? -1;
        const { data: inserted, error } = await supabase.from('project_entries').insert({ project_id: projectId, song_id: songId, section_id: sectionId, order_index: maxOrder + 1 }).select('id').single();
        if (error) throw error;
        return inserted?.id ?? crypto.randomUUID();
      },
      () => dexieProjectService.addSongToSection(projectId, songId, sectionId)
    );
  },

  async removeSongFromSection(entryId: string): Promise<void> {
    return withFallback(
      () => supabase.from('project_entries').delete().eq('id', entryId).then(({ error }) => { if (error) throw error; }),
      () => dexieProjectService.removeSongFromSection(entryId)
    );
  },

  /** Remove all entries for a project (used when syncing draft to Supabase). */
  async removeAllEntriesFromProject(projectId: string): Promise<void> {
    return withFallback(
      () => supabase.from('project_entries').delete().eq('project_id', projectId).then(({ error }) => { if (error) throw error; }),
      () => dexieProjectService.removeAllEntriesFromProject(projectId)
    );
  },

  async moveSongToSection(entryId: string, targetSectionId: string): Promise<void> {
    return withFallback(
      async () => {
        const { data: entry } = await supabase.from('project_entries').select('*').eq('id', entryId).single();
        if (!entry) return;
        const { data: maxRow } = await supabase.from('project_entries').select('order_index').eq('section_id', targetSectionId).order('order_index', { ascending: false }).limit(1).single();
        const nextOrder = (maxRow?.order_index ?? -1) + 1;
        const { error } = await supabase.from('project_entries').update({ section_id: targetSectionId, order_index: nextOrder }).eq('id', entryId);
        if (error) throw error;
      },
      () => dexieProjectService.moveSongToSection(entryId, targetSectionId)
    );
  },

  async removeSongFromProject(projectId: string, songId: string): Promise<void> {
    return withFallback(
      () => supabase.from('project_entries').delete().eq('project_id', projectId).eq('song_id', songId).then(({ error }) => { if (error) throw error; }),
      () => dexieProjectService.removeSongFromProject(projectId, songId)
    );
  },

  async toggleLock(entryId: string): Promise<void> {
    return withFallback(
      async () => {
        const { data } = await supabase.from('project_entries').select('locked').eq('id', entryId).single();
        if (!data) return;
        const { error } = await supabase.from('project_entries').update({ locked: !data.locked }).eq('id', entryId);
        if (error) throw error;
      },
      () => dexieProjectService.toggleLock(entryId)
    );
  },

  async updateEntryNotes(entryId: string, notes: string): Promise<void> {
    return withFallback(
      () => supabase.from('project_entries').update({ notes }).eq('id', entryId).then(({ error }) => { if (error) throw error; }),
      () => dexieProjectService.updateEntryNotes(entryId, notes)
    );
  },

  async reorderEntriesInSection(_sectionId: string, entryIds: string[]): Promise<void> {
    return withFallback(
      async () => {
        console.log('[reorder][service][reorderEntries][start]', { sectionId: _sectionId, entryIds });
        const results = await Promise.all(
          entryIds.map((id, i) =>
            supabase
              .from('project_entries')
              .update({ order_index: i })
              .eq('id', id)
              .eq('section_id', _sectionId)
          )
        );
        const failed = results.find((r) => r.error != null);
        if (failed?.error) throw failed.error;
        console.log('[reorder][service][reorderEntries][done]', { sectionId: _sectionId, count: results.length });
      },
      () => dexieProjectService.reorderEntriesInSection(_sectionId, entryIds)
    );
  },

  /**
   * When Supabase is connected: fetch project, sections, and songs from Supabase only,
   * then write everything to Dexie. Returns the project with sections read from Dexie.
   * Call this on initial load of the project workspace.
   */
  async syncSupabaseProjectToDexie(projectId: string): Promise<ProjectWithSections> {
    if (getBackendMode() !== 'supabase') {
      return dexieProjectService.getProjectWithSections(projectId);
    }
    const project = await this.getById(projectId);
    if (!project) throw new Error('Project not found');
    const sections = await this.getSectionsByProject(projectId);
    const allEntries: ProjectEntry[] = [];
    for (const sec of sections) {
      const entries = await this.getEntriesForSection(sec.id);
      allEntries.push(...entries);
    }
    const songIds = [...new Set(allEntries.map((e) => e.songId))];
    const songsWithSections = await fetchByIdsFromSupabaseWithSections(songIds);
    const sectionsWithSongs: ProjectWithSections['sections'] = [];
    for (const sec of sections) {
      const entries = allEntries.filter((e) => e.sectionId === sec.id).sort((a, b) => a.orderIndex - b.orderIndex);
      const songs = entries
        .map((e) => {
          const item = songsWithSections.get(e.songId);
          if (!item) return null;
          return {
            ...item.song,
            entryId: e.id,
            locked: e.locked,
            notes: e.notes ?? '',
          };
        })
        .filter((s): s is NonNullable<typeof s> => s != null);
      sectionsWithSongs.push({ ...sec, songs });
    }
    const projectWithSections: ProjectWithSections = { ...project, sections: sectionsWithSongs };
    await dexieProjectService.writeProjectWithSectionsFromSupabase(projectWithSections, songsWithSections);
    return dexieProjectService.getProjectWithSections(projectId);
  },

  /** Read project with sections from Dexie only. Use after syncSupabaseProjectToDexie or when editing. */
  async getProjectWithSectionsFromDexie(projectId: string): Promise<ProjectWithSections> {
    return dexieProjectService.getProjectWithSections(projectId);
  },

  async getProjectWithSections(projectId: string): Promise<ProjectWithSections> {
    return withFallback(
      async () => {
        const project = await this.getById(projectId);
        if (!project) throw new Error('Project not found');
        const sections = await this.getSectionsByProject(projectId);
        const allEntries: ProjectEntry[] = [];
        for (const sec of sections) {
          const entries = await this.getEntriesForSection(sec.id);
          allEntries.push(...entries);
        }
        const songIds = [...new Set(allEntries.map((e) => e.songId))];
        const songMap = await songService.getByIds(songIds);
        const sectionsWithSongs: ProjectWithSections['sections'] = [];
        for (const sec of sections) {
          const entries = allEntries.filter((e) => e.sectionId === sec.id).sort((a, b) => a.orderIndex - b.orderIndex);
          const songs = entries
            .map((e) => {
              const song = songMap.get(e.songId);
              if (!song) return null;
              return { ...song, entryId: e.id, locked: e.locked, notes: e.notes ?? '' };
            })
            .filter((s): s is NonNullable<typeof s> => s != null);
          sectionsWithSongs.push({ ...sec, songs });
        }
        return { ...project, sections: sectionsWithSongs };
      },
      () => dexieProjectService.getProjectWithSections(projectId)
    );
  },

  /**
   * Push a full project (draft) to Supabase: update project row, sync sections, replace all entries.
   * Use when backend is Supabase and user clicks Save. Returns fresh project with sections from DB.
   */
  async syncProjectToSupabase(project: ProjectWithSections): Promise<ProjectWithSections> {
    if (getBackendMode() !== 'supabase') {
      return dexieProjectService.getProjectWithSections(project.id);
    }
    await this.update(project);
    const existingSections = await this.getSectionsByProject(project.id);
    const existingIds = new Set(existingSections.map((s) => s.id));
    const draftSectionIds = new Set(project.sections.map((s) => s.id));

    for (const section of project.sections) {
      if (existingIds.has(section.id)) {
        await this.updateSection(section);
      } else {
        await this.addSection({ ...section, id: section.id });
      }
    }
    for (const sec of existingSections) {
      if (!draftSectionIds.has(sec.id)) {
        await this.deleteSection(sec.id);
      }
    }

    await this.removeAllEntriesFromProject(project.id);
    for (const section of project.sections) {
      for (const song of section.songs) {
        await this.addSongToSection(project.id, song.id, section.id);
      }
    }

    const updated = await this.getProjectWithSections(project.id);
    await dexieProjectService.writeProjectDataToDexie(updated);
    return updated;
  },
};
