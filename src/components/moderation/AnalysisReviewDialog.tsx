// HOOK SAFETY: hooks at top level only.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { Song } from '../../types';
import {
  approveSubmission,
  declineSubmission,
  fetchSubmissionById,
  type ApproveOverrides,
  type NewSongRow,
} from '../../services/moderationService';
import { validateAnalysisSubmission, type SongAnalysisPayload } from '../../services/validateAnalysisSubmission';
import { findSimilarLibrarySongs } from '../../services/searchService';
import type { FuseResult } from 'fuse.js';
import { ButtonLoader } from '../loading/ButtonLoader';

interface AnalysisReviewDialogProps {
  submissionId: string | null;
  librarySongs: Song[];
  onClose: () => void;
  onApproved: () => void | Promise<void>;
}

function statusBadge(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  switch (status) {
    case 'pending':
      return `${base} bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100`;
    case 'needs_revision':
      return `${base} bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100`;
    case 'rejected':
      return `${base} bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100`;
    default:
      return `${base} bg-theme-background-secondary text-theme-text-secondary`;
  }
}

export function AnalysisReviewDialog({ submissionId, librarySongs, onClose, onApproved }: AnalysisReviewDialogProps) {
  const [row, setRow] = useState<NewSongRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [type, setType] = useState('');
  const [origin, setOrigin] = useState('');
  const [season, setSeason] = useState('');
  const [year, setYear] = useState(2020);
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<Array<{ part: string; bpm: string; key: string; order: number }>>([]);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviseOpen, setReviseOpen] = useState(false);
  const [reviseNotes, setReviseNotes] = useState('');

  const reload = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetchSubmissionById(submissionId);
      if (!r) {
        setError('Submission not found');
        setRow(null);
        return;
      }
      setRow(r);
      setTitle(r.title);
      setArtist(r.artist);
      setType(r.type);
      setOrigin(r.origin);
      setSeason(r.season);
      setYear(r.year ?? new Date().getFullYear());
      setNotes(r.notes ?? '');
      const secs = (r.new_song_sections ?? []).sort((a, b) => a.section_order - b.section_order);
      setSections(
        secs.map((s) => ({
          part: s.part,
          bpm: String(s.bpm ?? ''),
          key: s.key,
          order: s.section_order,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const similar = useMemo((): FuseResult<Song>[] => {
    if (!title.trim() && !artist.trim()) return [];
    const official = librarySongs.filter((s) => !s.id.startsWith('ns_'));
    return findSimilarLibrarySongs({ title: title.trim(), artist: artist.trim(), type, origin }, official, 8);
  }, [librarySongs, title, artist, type, origin]);

  const buildApprovePayload = useCallback((): ApproveOverrides | null => {
    const secParsed = sections.map((s, idx) => {
      const bpm = parseFloat(s.bpm);
      return { part: s.part.trim(), bpm, key: s.key.trim(), sectionOrder: idx + 1 };
    });
    const payload: SongAnalysisPayload = {
      title: title.trim(),
      artist: artist.trim(),
      type: type || 'Anime',
      origin: origin.trim() || 'Japan',
      season,
      year,
      notes: notes.trim(),
      sections: secParsed,
    };
    const v = validateAnalysisSubmission(payload);
    if (!v.ok) {
      setError(v.errors.join(' '));
      return null;
    }
    return {
      title: payload.title,
      artist: payload.artist,
      type: payload.type,
      origin: payload.origin,
      season: payload.season,
      year: payload.year,
      notes: payload.notes,
      sections: secParsed,
    };
  }, [title, artist, type, origin, season, year, notes, sections]);

  const handleApprove = useCallback(async () => {
    if (!submissionId) return;
    const overrides = buildApprovePayload();
    if (!overrides) return;
    setBusy(true);
    setError(null);
    try {
      await approveSubmission(submissionId, overrides);
      await onApproved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  }, [submissionId, buildApprovePayload, onApproved, onClose]);

  const handleReject = useCallback(async () => {
    if (!submissionId || !rejectReason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await declineSubmission(submissionId, 'rejected', rejectReason.trim());
      setRejectOpen(false);
      await onApproved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setBusy(false);
    }
  }, [submissionId, rejectReason, onApproved, onClose]);

  const handleNeedsRevision = useCallback(async () => {
    if (!submissionId || !reviseNotes.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await declineSubmission(submissionId, 'needs_revision', reviseNotes.trim());
      setReviseOpen(false);
      await onApproved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }, [submissionId, reviseNotes, onApproved, onClose]);

  if (!submissionId) return null;

  return (
    <>
      <div className="fixed inset-0 z-[var(--z-modal-overlay)] flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-theme-border-default bg-theme-surface-base shadow-[var(--theme-shadow-card)]">
          <div className="flex items-center justify-between border-b border-theme-border-default px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-theme-text-primary">Review analysis</h2>
              {row && <span className={statusBadge(row.status)}>{row.status}</span>}
            </div>
            <button type="button" onClick={onClose} className="rounded-md p-2 text-theme-text-muted hover:bg-theme-state-hover" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4 p-4">
            {loading && <p className="text-sm text-theme-text-muted">Loading…</p>}
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            {similar.length > 0 && (
              <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-medium">Possible duplicates in library (informational)</p>
                  <ul className="mt-2 list-inside list-disc space-y-0.5">
                    {similar.map((m) => (
                      <li key={m.item.id}>
                        {m.item.title} — {m.item.artist}
                        {m.score != null ? ` (score ${m.score.toFixed(3)})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {!loading && row && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-theme-text-secondary">Title</span>
                    <input className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary px-3 py-2 text-theme-text-primary" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-theme-text-secondary">Artist</span>
                    <input className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary px-3 py-2 text-theme-text-primary" value={artist} onChange={(e) => setArtist(e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-theme-text-secondary">Type</span>
                    <input className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary px-3 py-2 text-theme-text-primary" value={type} onChange={(e) => setType(e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-theme-text-secondary">Origin</span>
                    <input className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary px-3 py-2 text-theme-text-primary" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-theme-text-secondary">Season</span>
                    <input className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary px-3 py-2 text-theme-text-primary" value={season} onChange={(e) => setSeason(e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-theme-text-secondary">Year</span>
                    <input type="number" className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary px-3 py-2 text-theme-text-primary" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-theme-text-secondary">Notes</span>
                    <input className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary px-3 py-2 text-theme-text-primary" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </label>
                </div>

                <div className="overflow-x-auto rounded-lg border border-theme-border-default">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-theme-background-secondary text-theme-text-secondary">
                      <tr>
                        <th className="px-3 py-2">Order</th>
                        <th className="px-3 py-2">Section</th>
                        <th className="px-3 py-2">BPM</th>
                        <th className="px-3 py-2">Key</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((s, i) => (
                        <tr key={i} className="border-t border-theme-border-default">
                          <td className="px-3 py-2 tabular-nums">{i + 1}</td>
                          <td className="px-3 py-2">
                            <input className="w-full min-w-[6rem] rounded border border-theme-border-default px-2 py-1" value={s.part} onChange={(e) => setSections((prev) => prev.map((p, j) => (j === i ? { ...p, part: e.target.value } : p)))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className="w-full min-w-[4rem] rounded border border-theme-border-default px-2 py-1" value={s.bpm} onChange={(e) => setSections((prev) => prev.map((p, j) => (j === i ? { ...p, bpm: e.target.value } : p)))} />
                          </td>
                          <td className="px-3 py-2">
                            <input className="w-full min-w-[6rem] rounded border border-theme-border-default px-2 py-1" value={s.key} onChange={(e) => setSections((prev) => prev.map((p, j) => (j === i ? { ...p, key: e.target.value } : p)))} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-theme-text-muted">
                  Submitted by {row.submitted_by_username}
                  {row.submitted_at ? ` on ${new Date(row.submitted_at).toLocaleString()}` : ''}
                </p>

                <div className="flex flex-wrap justify-end gap-2 border-t border-theme-border-default pt-4">
                  <button type="button" className="btn-secondary min-h-[44px]" onClick={onClose} disabled={busy}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn-secondary min-h-[44px]"
                    onClick={() => setReviseOpen(true)}
                    disabled={busy || (row.status !== 'pending' && row.status !== 'needs_revision')}
                  >
                    Needs revision
                  </button>
                  <button
                    type="button"
                    className="btn-secondary min-h-[44px] border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300"
                    onClick={() => setRejectOpen(true)}
                    disabled={busy || (row.status !== 'pending' && row.status !== 'needs_revision')}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn-primary min-h-[44px]"
                    onClick={() => void handleApprove()}
                    disabled={busy || (row.status !== 'pending' && row.status !== 'needs_revision')}
                  >
                    <ButtonLoader state={busy ? 'loading' : 'idle'} label="Approve" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-[calc(var(--z-modal-overlay)+1)] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-theme-border-default bg-theme-surface-base p-4 shadow-lg">
            <h3 className="text-lg font-semibold text-theme-text-primary">Reject submission</h3>
            <label className="mt-3 block text-sm">
              <span className="text-theme-text-secondary">Reason</span>
              <textarea className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary p-2 text-theme-text-primary" rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setRejectOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => void handleReject()} disabled={busy}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {reviseOpen && (
        <div className="fixed inset-0 z-[calc(var(--z-modal-overlay)+1)] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-theme-border-default bg-theme-surface-base p-4 shadow-lg">
            <h3 className="text-lg font-semibold text-theme-text-primary">Request revision</h3>
            <label className="mt-3 block text-sm">
              <span className="text-theme-text-secondary">Notes for submitter</span>
              <textarea className="mt-1 w-full rounded-md border border-theme-border-default bg-theme-background-primary p-2 text-theme-text-primary" rows={4} value={reviseNotes} onChange={(e) => setReviseNotes(e.target.value)} />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setReviseOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => void handleNeedsRevision()} disabled={busy}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
