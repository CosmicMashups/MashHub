/**
 * Supabase database types for public schema.
 * Generate with: npm run gen:types
 * (Run after schema migrations; do not hand-edit.)
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectTypeDb = 'seasonal' | 'year-end' | 'song-megamix' | 'other';

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string;
          title: string;
          artist: string;
          type: string;
          origin: string;
          season: string;
          year: number | null;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          artist?: string;
          type?: string;
          origin?: string;
          season?: string;
          year?: number | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string;
          type?: string;
          origin?: string;
          season?: string;
          year?: number | null;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      song_sections: {
        Row: {
          section_id: string;
          song_id: string;
          part: string;
          bpm: number | null;
          key: string;
          section_order: number;
          created_at: string;
        };
        Insert: {
          section_id: string;
          song_id: string;
          part?: string;
          bpm?: number | null;
          key?: string;
          section_order?: number;
          created_at?: string;
        };
        Update: {
          section_id?: string;
          song_id?: string;
          part?: string;
          bpm?: number | null;
          key?: string;
          section_order?: number;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: ProjectTypeDb;
          created_at: string;
          updated_at: string;
          year: number | null;
          season: string | null;
          year_range_min: number | null;
          year_range_max: number | null;
          cover_image: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          type?: ProjectTypeDb;
          created_at?: string;
          updated_at?: string;
          year?: number | null;
          season?: string | null;
          year_range_min?: number | null;
          year_range_max?: number | null;
          cover_image?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          type?: ProjectTypeDb;
          created_at?: string;
          updated_at?: string;
          year?: number | null;
          season?: string | null;
          year_range_min?: number | null;
          year_range_max?: number | null;
          cover_image?: string | null;
        };
      };
      project_sections: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          order_index: number;
          target_bpm: number | null;
          bpm_range_min: number | null;
          bpm_range_max: number | null;
          target_key: string | null;
          key_range_camelot: number | null;
          key_range: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          order_index?: number;
          target_bpm?: number | null;
          bpm_range_min?: number | null;
          bpm_range_max?: number | null;
          target_key?: string | null;
          key_range_camelot?: number | null;
          key_range?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          order_index?: number;
          target_bpm?: number | null;
          bpm_range_min?: number | null;
          bpm_range_max?: number | null;
          target_key?: string | null;
          key_range_camelot?: number | null;
          key_range?: string[] | null;
          created_at?: string;
        };
      };
      project_entries: {
        Row: {
          id: string;
          project_id: string;
          song_id: string;
          section_id: string | null;
          order_index: number;
          locked: boolean;
          notes: string;
          performance_role: 'vocal' | 'instrumental' | 'both';
          used_in_mashup: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          song_id: string;
          section_id?: string | null;
          order_index?: number;
          locked?: boolean;
          notes?: string;
          performance_role?: 'vocal' | 'instrumental' | 'both';
          used_in_mashup?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          song_id?: string;
          section_id?: string | null;
          order_index?: number;
          locked?: boolean;
          notes?: string;
          performance_role?: 'vocal' | 'instrumental' | 'both';
          used_in_mashup?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_type: ProjectTypeDb;
    };
  };
}
