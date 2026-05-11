import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader2 } from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { MainNavLinks } from '../components/layout/MainNavLinks';
import { useAuthContext } from '../contexts/AuthContext';
import { useBackendContext } from '../contexts/BackendContext';
import { PrimaryLoader } from '../components/loading/PrimaryLoader';
import { SkeletonLoader } from '../components/loading/SkeletonLoader';
import { listMySubmissions, listModerationQueue, fetchSubmissionById, type NewSongRow } from '../services/moderationService';
import { songService } from '../services/songService';
import type { Song } from '../types';
import { AnalysisReviewDialog } from '../components/moderation/AnalysisReviewDialog';
import { SubmissionEditorDialog } from '../components/moderation/SubmissionEditorDialog';

const PAGE_SIZE = 15;

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AnalysisPage() {
  const { isLocal } = useBackendContext();
  const { session, loading: authLoading, isEvaluator } = useAuthContext();
  const [tab, setTab] = useState<'mine' | 'queue'>('mine');
  const [rows, setRows] = useState<NewSongRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [librarySongs, setLibrarySongs] = useState<Song[]>([]);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'needs_revision'>('pending');
  const [queueSearch, setQueueSearch] = useState('');

  const loadLibrary = useCallback(async () => {
    try {
      const all = await songService.getAll();
      setLibrarySongs(all);
    } catch {
      setLibrarySongs([]);
    }
  }, []);

  const refreshList = useCallback(async () => {
    if (isLocal || !session) {
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (tab === 'mine') {
        const r = await listMySubmissions({ page, pageSize: PAGE_SIZE, sortField: 'submitted_at', sortDir: 'desc' });
        setRows(r.rows);
        setTotal(r.total);
      } else if (isEvaluator) {
        const r = await listModerationQueue({
          page,
          pageSize: PAGE_SIZE,
          sortField: 'submitted_at',
          sortDir: 'desc',
          statusFilter: queueStatus === 'all' ? 'all' : queueStatus,
          search: queueSearch || undefined,
        });
        setRows(r.rows);
        setTotal(r.total);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [isLocal, session, tab, page, isEvaluator, queueStatus, queueSearch]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (isEvaluator && tab === 'queue') return;
    if (!isEvaluator && tab === 'queue') setTab('mine');
  }, [isEvaluator, tab]);

  if (authLoading) {
    return <PrimaryLoader label="Loading" />;
  }

  if (isLocal) {
    return (
      <div className="min-h-screen bg-theme-background-primary">
        <AppHeader
          actions={
            <Link to="/" className="text-sm text-theme-text-secondary hover:text-theme-text-primary">
              Back to library
            </Link>
          }
        />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold text-theme-text-primary">Analysis</h1>
          <p className="mt-4 text-theme-text-secondary">
            Moderation is available when connected to Supabase. In offline mode, songs are saved locally only.
          </p>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-theme-background-primary">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-bold text-theme-text-primary">Analysis</h1>
          <p className="mt-4 text-theme-text-secondary">Sign in to view your submissions and the moderation queue.</p>
          <Link to={`/login?redirect=${encodeURIComponent('/analysis')}`} className="btn-primary mt-6 inline-block">
            Sign in
          </Link>
        </main>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-theme-background-primary">
      <AppHeader
        actions={<MainNavLinks showLibrary libraryLabel="Library" libraryTo="/" />}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-theme-text-primary">
              <ClipboardList className="h-7 w-7 text-theme-accent-primary" />
              Analysis
            </h1>
            <p className="mt-1 text-sm text-theme-text-secondary">Track submissions and review the moderation queue.</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 border-b border-theme-border-default pb-2">
          <button
            type="button"
            onClick={() => {
              setTab('mine');
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'mine' ? 'bg-theme-accent-primary text-theme-text-inverse' : 'text-theme-text-secondary hover:bg-theme-state-hover'}`}
          >
            My submissions
          </button>
          {isEvaluator && (
            <button
              type="button"
              onClick={() => {
                setTab('queue');
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'queue' ? 'bg-theme-accent-primary text-theme-text-inverse' : 'text-theme-text-secondary hover:bg-theme-state-hover'}`}
            >
              All submissions
            </button>
          )}
        </div>

        {tab === 'queue' && isEvaluator && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="text-sm text-theme-text-secondary">
              Status
              <select
                className="ml-2 rounded-md border border-theme-border-default bg-theme-background-primary px-2 py-1.5 text-theme-text-primary"
                value={queueStatus}
                onChange={(e) => {
                  setQueueStatus(e.target.value as typeof queueStatus);
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="needs_revision">Needs revision</option>
                <option value="rejected">Rejected</option>
                <option value="approved">Approved</option>
              </select>
            </label>
            <label className="text-sm text-theme-text-secondary">
              Search
              <input
                className="ml-2 rounded-md border border-theme-border-default bg-theme-background-primary px-2 py-1.5 text-theme-text-primary"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void refreshList();
                }}
                placeholder="Title, artist, submitter"
              />
            </label>
            <button type="button" className="btn-secondary text-sm" onClick={() => void refreshList()}>
              Apply
            </button>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {loading ? (
          <div className="space-y-2">
            <SkeletonLoader className="h-10 w-full" />
            <SkeletonLoader className="h-10 w-full" />
            <SkeletonLoader className="h-10 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-theme-border-default bg-theme-surface-base p-8 text-center text-theme-text-secondary">
            No rows to display.
          </p>
        ) : tab === 'mine' ? (
          <div className="overflow-x-auto rounded-xl border border-theme-border-default bg-theme-surface-base shadow-[var(--theme-shadow-card)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-theme-border-default bg-theme-background-secondary text-theme-text-secondary">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Artist</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Reviewer</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-theme-border-default">
                    <td className="px-3 py-2 font-medium text-theme-text-primary">{r.title}</td>
                    <td className="px-3 py-2 text-theme-text-secondary">{r.artist}</td>
                    <td className="px-3 py-2 text-theme-text-secondary">{r.type}</td>
                    <td className="px-3 py-2 text-theme-text-muted">{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2">{formatStatus(r.status)}</td>
                    <td className="px-3 py-2 text-theme-text-muted">{r.reviewed_by_username ?? '—'}</td>
                    <td className="px-3 py-2 text-theme-text-muted">{r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className="text-theme-accent-primary hover:underline" onClick={() => setReviewId(r.id)}>
                          View
                        </button>
                        {(r.status === 'rejected' || r.status === 'needs_revision') && (
                          <button type="button" className="text-theme-accent-primary hover:underline" onClick={() => setEditId(r.id)}>
                            Edit / resubmit
                          </button>
                        )}
                        {r.status === 'rejected' && r.rejection_reason && (
                          <span className="text-xs text-theme-text-muted" title={r.rejection_reason}>
                            Reason
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-theme-border-default bg-theme-surface-base shadow-[var(--theme-shadow-card)]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-theme-border-default bg-theme-background-secondary text-theme-text-secondary">
                <tr>
                  <th className="px-3 py-2">Song</th>
                  <th className="px-3 py-2">Artist</th>
                  <th className="px-3 py-2">Submitter</th>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Sections</th>
                  <th className="px-3 py-2">BPM</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const secs = r.new_song_sections ?? [];
                  const bpms = Array.from(new Set(secs.map((s) => s.bpm).filter((b): b is number => b != null)));
                  const keys = Array.from(new Set(secs.map((s) => s.key).filter(Boolean)));
                  return (
                    <tr key={r.id} className="border-t border-theme-border-default">
                      <td className="px-3 py-2 font-medium text-theme-text-primary">{r.title}</td>
                      <td className="px-3 py-2 text-theme-text-secondary">{r.artist}</td>
                      <td className="px-3 py-2 text-theme-text-muted">{r.submitted_by_username}</td>
                      <td className="px-3 py-2 text-theme-text-muted">{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</td>
                      <td className="px-3 py-2">{formatStatus(r.status)}</td>
                      <td className="px-3 py-2 tabular-nums">{secs.length}</td>
                      <td className="max-w-[120px] truncate px-3 py-2 text-theme-text-muted">{bpms.join(', ') || '—'}</td>
                      <td className="max-w-[140px] truncate px-3 py-2 text-theme-text-muted">{keys.join(', ') || '—'}</td>
                      <td className="px-3 py-2">
                        <button type="button" className="text-theme-accent-primary hover:underline" onClick={() => setReviewId(r.id)}>
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </button>
            <span className="text-sm text-theme-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button type="button" className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        )}
      </main>

      {reviewId && isEvaluator && tab === 'queue' && (
        <AnalysisReviewDialog
          submissionId={reviewId}
          librarySongs={librarySongs}
          onClose={() => setReviewId(null)}
          onApproved={async () => {
            await refreshList();
            await loadLibrary();
          }}
        />
      )}

      {reviewId && (!isEvaluator || tab === 'mine') && (
        <div className="fixed inset-0 z-[var(--z-modal-overlay)] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-theme-border-default bg-theme-surface-base p-4">
            <SubmissionViewOnly submissionId={reviewId} onClose={() => setReviewId(null)} />
          </div>
        </div>
      )}

      <SubmissionEditorDialog submissionId={editId} onClose={() => setEditId(null)} onSaved={refreshList} />
    </div>
  );
}

function SubmissionViewOnly({ submissionId, onClose }: { submissionId: string; onClose: () => void }) {
  const [row, setRow] = useState<NewSongRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const r = await fetchSubmissionById(submissionId);
        if (!c) setRow(r);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-theme-accent-primary" />
      </div>
    );
  }
  if (!row) return <p className="text-theme-text-secondary">Not found</p>;

  return (
    <>
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold text-theme-text-primary">{row.title}</h2>
        <button type="button" onClick={onClose} className="text-theme-text-muted hover:text-theme-text-primary">
          Close
        </button>
      </div>
      <p className="text-sm text-theme-text-secondary">{row.artist}</p>
      <p className="mt-2 text-sm text-theme-text-muted">Status: {formatStatus(row.status)}</p>
      {row.rejection_reason && (
        <div className="mt-4 rounded border border-theme-border-default p-3 text-sm">
          <p className="font-medium text-theme-text-primary">Rejection reason</p>
          <p className="mt-1 whitespace-pre-wrap text-theme-text-secondary">{row.rejection_reason}</p>
        </div>
      )}
      {row.revision_notes && (
        <div className="mt-4 rounded border border-theme-border-default p-3 text-sm">
          <p className="font-medium text-theme-text-primary">Revision notes</p>
          <p className="mt-1 whitespace-pre-wrap text-theme-text-secondary">{row.revision_notes}</p>
        </div>
      )}
      <ul className="mt-4 space-y-1 text-sm">
        {(row.new_song_sections ?? [])
          .sort((a, b) => a.section_order - b.section_order)
          .map((s) => (
            <li key={s.section_id}>
              {s.section_order}. {s.part} — {s.bpm} BPM — {s.key}
            </li>
          ))}
      </ul>
    </>
  );
}
