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

export type UserRoleDb = 'user' | 'evaluator' | 'admin';

export type SubmissionStatusDb = 'pending' | 'approved' | 'rejected' | 'needs_revision';

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
          analysis_by_user_id: string | null;
          analysis_by_username: string | null;
          confirmed_by_user_id: string | null;
          confirmed_by_username: string | null;
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
          analysis_by_user_id?: string | null;
          analysis_by_username?: string | null;
          confirmed_by_user_id?: string | null;
          confirmed_by_username?: string | null;
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
          analysis_by_user_id?: string | null;
          analysis_by_username?: string | null;
          confirmed_by_user_id?: string | null;
          confirmed_by_username?: string | null;
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
      profiles: {
        Row: {
          id: string;
          username: string;
          role: UserRoleDb;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          role?: UserRoleDb;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: UserRoleDb;
          created_at?: string;
          updated_at?: string;
        };
      };
      new_songs: {
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
          submitted_by_user_id: string | null;
          submitted_by_username: string;
          status: SubmissionStatusDb;
          submitted_at: string;
          reviewed_by_user_id: string | null;
          reviewed_by_username: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          revision_notes: string | null;
          approved_song_id: string | null;
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
          submitted_by_user_id?: string | null;
          submitted_by_username: string;
          status?: SubmissionStatusDb;
          submitted_at?: string;
          reviewed_by_user_id?: string | null;
          reviewed_by_username?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          revision_notes?: string | null;
          approved_song_id?: string | null;
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
          submitted_by_user_id?: string | null;
          submitted_by_username?: string;
          status?: SubmissionStatusDb;
          submitted_at?: string;
          reviewed_by_user_id?: string | null;
          reviewed_by_username?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          revision_notes?: string | null;
          approved_song_id?: string | null;
        };
      };
      new_song_sections: {
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
    };
    Views: Record<string, never>;
    Functions: {
      submit_new_song_analysis: {
        Args: { p_payload: Json };
        Returns: Json;
      };
      update_own_submission: {
        Args: { p_submission_id: string; p_payload: Json };
        Returns: Json;
      };
      resubmit_new_song: {
        Args: { p_submission_id: string };
        Returns: Json;
      };
      approve_new_song: {
        Args: { p_submission_id: string; p_overrides?: Json | null };
        Returns: Json;
      };
      moderator_decline_submission: {
        Args: {
          p_submission_id: string;
          p_new_status: SubmissionStatusDb;
          p_message: string;
        };
        Returns: Json;
      };
      admin_bulk_upsert_library: {
        Args: { p_songs: Json; p_sections: Json };
        Returns: Json;
      };
      admin_truncate_and_import_library: {
        Args: { p_songs: Json; p_sections: Json };
        Returns: Json;
      };
      admin_set_submission_status: {
        Args: { p_submission_id: string; p_status: SubmissionStatusDb };
        Returns: Json;
      };
    };
    Enums: {
      project_type: ProjectTypeDb;
      user_role: UserRoleDb;
      submission_status: SubmissionStatusDb;
    };
  };
}
