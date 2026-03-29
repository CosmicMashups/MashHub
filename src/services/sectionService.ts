/**
 * Section service with Supabase fallback support
 * Queries Supabase first when available, falls back to IndexedDB
 */
import type { SongSection } from '../types';
import { supabase } from '../lib/supabase';
import { withFallback, getBackendMode } from '../lib/withFallback';
import { sectionService as dexieSectionService } from './database';

type SupabaseSectionRow = {
  section_id: string;
  song_id: string;
  part: string;
  bpm: number | null;
  key: string;
  section_order: number;
};

function supabaseRowToSection(row: SupabaseSectionRow): SongSection {
  return {
    sectionId: row.section_id,
    songId: row.song_id,
    part: row.part ?? '',
    bpm: row.bpm ?? 0,
    key: row.key ?? 'C Major',
    sectionOrder: row.section_order,
  };
}

async function getBySongIdFromSupabase(songId: string): Promise<SongSection[]> {
  const { data, error } = await supabase
    .from('song_sections')
    .select('*')
    .eq('song_id', songId)
    .order('section_order');
  
  if (error) throw error;
  
  const rows = (data ?? []) as SupabaseSectionRow[];
  return rows.map(supabaseRowToSection);
}

async function getAllFromSupabase(): Promise<SongSection[]> {
  const { data, error } = await supabase
    .from('song_sections')
    .select('*')
    .order('song_id, section_order');
  
  if (error) throw error;
  
  const rows = (data ?? []) as SupabaseSectionRow[];
  return rows.map(supabaseRowToSection);
}

export const sectionServiceWithFallback = {
  /**
   * Get sections for a specific song
   * Queries Supabase first, falls back to IndexedDB
   */
  async getBySongId(songId: string): Promise<SongSection[]> {
    return withFallback(
      () => getBySongIdFromSupabase(songId),
      () => dexieSectionService.getBySongId(songId)
    );
  },

  /**
   * Get all sections
   * Queries Supabase first, falls back to IndexedDB
   */
  async getAll(): Promise<SongSection[]> {
    return withFallback(
      () => getAllFromSupabase(),
      () => dexieSectionService.getAll()
    );
  },

  /**
   * Get section by ID
   */
  async getById(sectionId: string): Promise<SongSection | undefined> {
    return dexieSectionService.getById(sectionId);
  },

  /**
   * Add a section
   */
  async add(section: SongSection): Promise<string> {
    return dexieSectionService.add(section);
  },

  /**
   * Bulk add sections
   */
  async bulkAdd(sections: SongSection[]): Promise<void> {
    return dexieSectionService.bulkAdd(sections);
  },

  /**
   * Update a section
   */
  async update(section: SongSection): Promise<number> {
    return dexieSectionService.update(section);
  },

  /**
   * Delete a section
   */
  async delete(sectionId: string): Promise<void> {
    return dexieSectionService.delete(sectionId);
  },

  /**
   * Delete all sections for a song
   */
  async deleteBySongId(songId: string): Promise<void> {
    return dexieSectionService.deleteBySongId(songId);
  },

  /**
   * Get unique part names
   */
  async getUniqueParts(): Promise<string[]> {
    return dexieSectionService.getUniqueParts();
  },
};
