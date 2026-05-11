/**
 * Supabase moderation queue: new_songs / new_song_sections + RPCs.
 */
import { supabase } from '../lib/supabase';
import type { Json } from '../lib/database.types';
import { validateAnalysisSubmission, type SongAnalysisPayload } from './validateAnalysisSubmission';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';
export type ModerationUserRole = 'user' | 'evaluator' | 'admin';

export interface NewSongSectionRow {
  section_id: string;
  song_id: string;
  part: string;
  bpm: number | null;
  key: string;
  section_order: number;
  created_at: string;
}

export interface NewSongRow {
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
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_by_user_id: string | null;
  reviewed_by_username: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  revision_notes: string | null;
  approved_song_id: string | null;
  new_song_sections?: NewSongSectionRow[];
}

function rpcPayloadFromSongAnalysis(p: SongAnalysisPayload): Json {
  return {
    title: p.title,
    artist: p.artist,
    type: p.type,
    origin: p.origin,
    season: p.season,
    year: p.year,
    notes: p.notes ?? '',
    sections: p.sections.map((s, idx) => ({
      part: s.part,
      bpm: s.bpm,
      key: s.key,
      section_order: s.sectionOrder ?? idx + 1,
    })),
  } as unknown as Json;
}

export async function fetchProfileRole(userId: string): Promise<{ username: string; role: ModerationUserRole } | null> {
  const { data, error } = await supabase.from('profiles').select('username, role').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return { username: data.username, role: data.role as ModerationUserRole };
}

export function isEvaluatorRole(role: ModerationUserRole | null | undefined): boolean {
  return role === 'evaluator' || role === 'admin';
}

export function isAdminRole(role: ModerationUserRole | null | undefined): boolean {
  return role === 'admin';
}

export async function submitNewSongAnalysis(payload: SongAnalysisPayload): Promise<{ submissionId: string }> {
  const v = validateAnalysisSubmission(payload);
  if (!v.ok) {
    throw new Error(v.errors.join(' '));
  }
  const { data, error } = await supabase.rpc('submit_new_song_analysis', {
    p_payload: rpcPayloadFromSongAnalysis(payload),
  });
  if (error) throw error;
  const sid = (data as { submission_id?: string } | null)?.submission_id;
  if (!sid) throw new Error('Submission failed: no id returned');
  return { submissionId: sid };
}

export async function updateOwnSubmission(submissionId: string, payload: SongAnalysisPayload): Promise<void> {
  const v = validateAnalysisSubmission(payload);
  if (!v.ok) throw new Error(v.errors.join(' '));
  const { error } = await supabase.rpc('update_own_submission', {
    p_submission_id: submissionId,
    p_payload: rpcPayloadFromSongAnalysis(payload),
  });
  if (error) throw error;
}

export async function resubmitSubmission(submissionId: string): Promise<void> {
  const { error } = await supabase.rpc('resubmit_new_song', { p_submission_id: submissionId });
  if (error) throw error;
}

export type ApproveOverrides = Partial<
  Pick<SongAnalysisPayload, 'title' | 'artist' | 'type' | 'origin' | 'season' | 'year' | 'notes'>
> & { sections?: SongAnalysisPayload['sections'] };

export async function approveSubmission(submissionId: string, overrides?: ApproveOverrides | null): Promise<{ songId: string }> {
  let pOverrides: Json | null = null;
  if (overrides && Object.keys(overrides).length > 0) {
    const base: Record<string, unknown> = {};
    if (overrides.title !== undefined) base.title = overrides.title;
    if (overrides.artist !== undefined) base.artist = overrides.artist;
    if (overrides.type !== undefined) base.type = overrides.type;
    if (overrides.origin !== undefined) base.origin = overrides.origin;
    if (overrides.season !== undefined) base.season = overrides.season;
    if (overrides.year !== undefined) base.year = overrides.year;
    if (overrides.notes !== undefined) base.notes = overrides.notes;
    if (overrides.sections?.length) {
      base.sections = overrides.sections.map((s, idx) => ({
        part: s.part,
        bpm: s.bpm,
        key: s.key,
        section_order: s.sectionOrder ?? idx + 1,
      }));
    }
    pOverrides = base as Json;
  }
  const { data, error } = await supabase.rpc('approve_new_song', {
    p_submission_id: submissionId,
    p_overrides: pOverrides,
  });
  if (error) throw error;
  const songId = (data as { song_id?: string } | null)?.song_id;
  if (!songId) throw new Error('Approve failed: no song id');
  return { songId };
}

export async function declineSubmission(
  submissionId: string,
  status: 'rejected' | 'needs_revision',
  message: string
): Promise<void> {
  const { error } = await supabase.rpc('moderator_decline_submission', {
    p_submission_id: submissionId,
    p_new_status: status,
    p_message: message,
  });
  if (error) throw error;
}

export interface ListMySubmissionsParams {
  page: number;
  pageSize: number;
  sortField?: 'submitted_at' | 'updated_at' | 'title' | 'status';
  sortDir?: 'asc' | 'desc';
}

export async function listMySubmissions(params: ListMySubmissionsParams): Promise<{ rows: NewSongRow[]; total: number }> {
  const { page, pageSize, sortField = 'submitted_at', sortDir = 'desc' } = params;
  const from = (page - 1) * pageSize;
  const ascending = sortDir === 'asc';

  const { data: session } = await supabase.auth.getSession();
  const uid = session.session?.user.id;
  if (!uid) return { rows: [], total: 0 };

  const { data, error, count } = await supabase
    .from('new_songs')
    .select('*, new_song_sections(*)', { count: 'exact' })
    .eq('submitted_by_user_id', uid)
    .order(sortField, { ascending })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  const rows = (data ?? []) as NewSongRow[];
  return { rows, total: count ?? 0 };
}

export interface ListQueueParams extends ListMySubmissionsParams {
  statusFilter?: SubmissionStatus | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listModerationQueue(params: ListQueueParams): Promise<{ rows: NewSongRow[]; total: number }> {
  const { page, pageSize, sortField = 'submitted_at', sortDir = 'desc', statusFilter = 'all', search, dateFrom, dateTo } = params;
  const from = (page - 1) * pageSize;
  const ascending = sortDir === 'asc';

  let q = supabase
    .from('new_songs')
    .select('*, new_song_sections(*)', { count: 'exact' })
    .order(sortField, { ascending });

  if (statusFilter !== 'all') {
    q = q.eq('status', statusFilter);
  }
  if (dateFrom) {
    q = q.gte('submitted_at', dateFrom);
  }
  if (dateTo) {
    q = q.lte('submitted_at', dateTo);
  }
  const raw = search?.trim();
  if (raw) {
    const safe = raw.replace(/%/g, '').replace(/,/g, '');
    const like = `%${safe}%`;
    q = q.or(`title.ilike.${like},artist.ilike.${like},submitted_by_username.ilike.${like}`);
  }

  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;
  return { rows: (data ?? []) as NewSongRow[], total: count ?? 0 };
}

export async function fetchSubmissionById(id: string): Promise<NewSongRow | null> {
  const { data, error } = await supabase.from('new_songs').select('*, new_song_sections(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as NewSongRow) ?? null;
}
