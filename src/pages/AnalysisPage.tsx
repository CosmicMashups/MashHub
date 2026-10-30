import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Loader2,
  ChevronDown,
  User,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Search,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { Footer } from '../components/Footer';
import { LegalModal } from '../components/LegalModal';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from '../content/legalContent';
import { useAuthContext } from '../contexts/AuthContext';
import { useBackendContext } from '../contexts/BackendContext';
import { useTheme } from '../hooks/useTheme';
import { PrimaryLoader } from '../components/loading/PrimaryLoader';
import { SkeletonLoader } from '../components/loading/SkeletonLoader';
import { listMySubmissions, listModerationQueue, type NewSongRow } from '../services/moderationService';
import { songService } from '../services/songService';
import type { Song } from '../types';
import { AnalysisReviewDialog } from '../components/moderation/AnalysisReviewDialog';
import { SubmissionEditorDialog } from '../components/moderation/SubmissionEditorDialog';
import { SubmissionDetailsModal } from '../components/moderation/SubmissionDetailsModal';

const PAGE_SIZE = 15;

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderStatusBadge(status: string) {
  const formatted = formatStatus(status);
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          {formatted}
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          {formatted}
        </span>
      );
    case 'needs_revision':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/25">
          <AlertCircle className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          {formatted}
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25">
          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          {formatted}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-background-secondary text-theme-text-muted border border-theme-border-default">
          {formatted}
        </span>
      );
  }
}

export function AnalysisPage() {
  useTheme();
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
  const [viewSubmissionId, setViewSubmissionId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'needs_revision'>('pending');
  const [queueSearch, setQueueSearch] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen flex flex-col bg-theme-background-primary text-theme-text-primary selection:bg-primary-500/30 selection:text-primary-700 dark:selection:text-primary-200">
      <AppHeader />

      <main className="relative flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Ambient lighting glows */}
        <div className="pointer-events-none absolute -top-32 left-1/4 w-[600px] h-[350px] bg-primary-500/5 dark:bg-primary-600/10 blur-[140px] rounded-full" />
        <div className="pointer-events-none absolute top-48 right-10 w-[450px] h-[300px] bg-purple-500/5 dark:bg-purple-600/[0.07] blur-[130px] rounded-full" />

        {/* Hero Section */}
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-theme-border-default">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-theme-text-primary font-sans">
              Analysis & Moderation
            </h1>
            <p className="text-sm sm:text-base text-theme-text-muted font-normal leading-relaxed">
              Track your musical submissions, inspect BPM and key annotations, and review community-contributed songs.
            </p>
          </div>

          {/* Mode Switcher Pill */}
          {session && !isLocal && (
            <div className="p-1 rounded-2xl bg-theme-surface-base border border-theme-border-default shadow-xs dark:shadow-xl flex items-center self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTab('mine');
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  tab === 'mine'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 scale-[1.02]'
                    : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                My Submissions
              </button>
              {isEvaluator && (
                <button
                  type="button"
                  onClick={() => {
                    setTab('queue');
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                    tab === 'queue'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 scale-[1.02]'
                      : 'text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  All Submissions
                </button>
              )}
            </div>
          )}
        </div>

        {/* Offline Alert if Local Mode */}
        {isLocal && (
          <div className="relative overflow-hidden rounded-2xl p-0.5 bg-gradient-to-r from-amber-500/30 to-amber-500/10 shadow-[0_4px_24px_-4px_rgba(245,158,11,0.15)]">
            <div className="flex items-center gap-3.5 p-4 rounded-[calc(1rem-2px)] bg-theme-surface-base border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs sm:text-sm">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              </div>
              <div>
                <p className="font-semibold tracking-wide">Local mode active</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
                  Community analysis submission tracking and moderation require a cloud Supabase connection. In offline mode, songs are saved locally only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Not Signed In Card */}
        {!isLocal && !session && (
          <div className="relative group/console rounded-[1.75rem] p-1 bg-gradient-to-b from-theme-border-default/60 via-theme-border-subtle/30 to-transparent border border-theme-border-default shadow-xs dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]">
            <div className="rounded-[calc(1.75rem-4px)] p-8 sm:p-12 bg-theme-surface-base border border-theme-border-subtle text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-theme-text-primary">
                Authentication Required
              </h2>
              <p className="text-sm text-theme-text-muted max-w-md mx-auto">
                Sign in to view your submissions, check review status, and access the catalog moderation queue.
              </p>
              <div className="pt-2">
                <Link
                  to={`/login?redirect=${encodeURIComponent('/analysis')}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold tracking-wide bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white shadow-md shadow-primary-500/25 active:scale-[0.98] transition-all"
                >
                  <span>Sign In to Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Primary Interactive Console (Machined Double-Bezel Card) */}
        {!isLocal && session && (
          <div className="relative group/console rounded-[1.75rem] p-1 bg-gradient-to-b from-theme-border-default/60 via-theme-border-subtle/30 to-transparent border border-theme-border-default shadow-xs dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]">
            <div className="rounded-[calc(1.75rem-4px)] p-6 sm:p-8 bg-theme-surface-base border border-theme-border-subtle space-y-6">
              {/* Evaluator filter toolbar */}
              {tab === 'queue' && isEvaluator && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-theme-background-secondary/50 border border-theme-border-default rounded-xl text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs text-theme-text-muted font-medium flex items-center gap-2">
                      <span>Status:</span>
                      <div className="relative inline-flex items-center">
                        <select
                          className="appearance-none rounded-lg border border-theme-border-default bg-theme-surface-base pl-2.5 pr-7 py-1.5 text-xs text-theme-text-primary cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-theme-border-focus"
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
                        <ChevronDown size={13} className="pointer-events-none absolute right-2 text-theme-text-muted" aria-hidden />
                      </div>
                    </label>

                    <label className="text-xs text-theme-text-muted font-medium flex items-center gap-2">
                      <span>Search:</span>
                      <div className="relative inline-flex items-center">
                        <Search size={13} className="pointer-events-none absolute left-2.5 text-theme-text-muted" />
                        <input
                          className="pl-8 pr-3 py-1.5 rounded-lg border border-theme-border-default bg-theme-surface-base text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none focus:ring-1 focus:ring-theme-border-focus shadow-2xs"
                          value={queueSearch}
                          onChange={(e) => setQueueSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void refreshList();
                          }}
                          placeholder="Title, artist, submitter"
                        />
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg bg-theme-surface-elevated hover:bg-theme-surface-hover border border-theme-border-default text-theme-text-primary text-xs font-semibold shadow-2xs transition-colors"
                    onClick={() => void refreshList()}
                  >
                    Apply Filter
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="space-y-3 py-4">
                  <SkeletonLoader className="h-12 w-full rounded-xl" />
                  <SkeletonLoader className="h-12 w-full rounded-xl" />
                  <SkeletonLoader className="h-12 w-full rounded-xl" />
                </div>
              ) : rows.length === 0 ? (
                <div className="text-center py-16 px-4 bg-theme-background-secondary/30 border border-theme-border-default rounded-2xl">
                  <p className="text-sm font-medium text-theme-text-primary">No submissions found</p>
                  <p className="text-xs text-theme-text-muted mt-1 max-w-sm mx-auto">
                    {tab === 'mine'
                      ? 'You have not submitted any songs for community analysis yet.'
                      : 'No queue records match the active filter criteria.'}
                  </p>
                </div>
              ) : tab === 'mine' ? (
                <div className="overflow-x-auto rounded-xl border border-theme-border-default bg-theme-surface-base shadow-xs">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-theme-border-default bg-theme-background-secondary/80 text-theme-text-secondary font-semibold">
                      <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Artist</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Reviewer</th>
                        <th className="px-4 py-3">Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-subtle">
                      {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-theme-surface-hover transition-colors">
                          <td className="px-4 py-3 font-medium text-theme-text-primary">
                            <button
                              type="button"
                              onClick={() => setViewSubmissionId(r.id)}
                              className="text-left font-medium hover:text-theme-accent-primary hover:underline transition-colors"
                            >
                              {r.title}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-theme-text-secondary">{r.artist}</td>
                          <td className="px-4 py-3 text-theme-text-secondary">{r.type}</td>
                          <td className="px-4 py-3 text-theme-text-muted">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3">{renderStatusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-theme-text-muted">{r.reviewed_by_username ?? '—'}</td>
                          <td className="px-4 py-3 text-theme-text-muted">{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-md text-primary-600 dark:text-primary-400 hover:bg-primary-500/10 font-medium transition-colors"
                                onClick={() => setViewSubmissionId(r.id)}
                              >
                                View
                              </button>
                              {(r.status === 'rejected' || r.status === 'needs_revision') && (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium transition-colors"
                                  onClick={() => setEditId(r.id)}
                                >
                                  Edit / Resubmit
                                </button>
                              )}
                              {r.status === 'rejected' && r.rejection_reason && (
                                <span className="text-[11px] text-theme-text-muted" title={r.rejection_reason}>
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
                <div className="overflow-x-auto rounded-xl border border-theme-border-default bg-theme-surface-base shadow-xs">
                  <table className="min-w-full text-left text-xs">
                    <thead className="border-b border-theme-border-default bg-theme-background-secondary/80 text-theme-text-secondary font-semibold">
                      <tr>
                        <th className="px-4 py-3">Song</th>
                        <th className="px-4 py-3">Artist</th>
                        <th className="px-4 py-3">Submitter</th>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Sections</th>
                        <th className="px-4 py-3">BPM</th>
                        <th className="px-4 py-3">Key</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border-subtle">
                      {rows.map((r) => {
                        const secs = r.new_song_sections ?? [];
                        const bpms = Array.from(new Set(secs.map((s) => s.bpm).filter((b): b is number => b != null)));
                        const keys = Array.from(new Set(secs.map((s) => s.key).filter(Boolean)));
                        return (
                          <tr key={r.id} className="hover:bg-theme-surface-hover transition-colors">
                            <td className="px-4 py-3 font-medium text-theme-text-primary">
                              <button
                                type="button"
                                onClick={() => setViewSubmissionId(r.id)}
                                className="text-left font-medium hover:text-theme-accent-primary hover:underline transition-colors"
                              >
                                {r.title}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-theme-text-secondary">{r.artist}</td>
                            <td className="px-4 py-3 text-theme-text-muted">{r.submitted_by_username}</td>
                            <td className="px-4 py-3 text-theme-text-muted">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</td>
                            <td className="px-4 py-3">{renderStatusBadge(r.status)}</td>
                            <td className="px-4 py-3 tabular-nums text-theme-text-secondary">{secs.length}</td>
                            <td className="max-w-[120px] truncate px-4 py-3 text-theme-text-muted">{bpms.join(', ') || '—'}</td>
                            <td className="max-w-[140px] truncate px-4 py-3 text-theme-text-muted">{keys.join(', ') || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                className="px-3 py-1 rounded-md bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-medium transition-colors"
                                onClick={() => setReviewId(r.id)}
                              >
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-4 border-t border-theme-border-default flex items-center justify-between text-xs">
                  <span className="text-theme-text-muted font-mono">
                    Page {page} of {totalPages} ({total} total entries)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-theme-border-default bg-theme-surface-elevated hover:bg-theme-surface-hover disabled:opacity-40 text-theme-text-secondary font-medium transition-colors"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-theme-border-default bg-theme-surface-elevated hover:bg-theme-surface-hover disabled:opacity-40 text-theme-text-secondary font-medium transition-colors"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer
        onPrivacyClick={() => setShowPrivacyModal(true)}
        onTermsClick={() => setShowTermsModal(true)}
      />
      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
        content={PRIVACY_POLICY_CONTENT}
      />
      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
        content={TERMS_OF_SERVICE_CONTENT}
      />

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

      <SubmissionDetailsModal
        isOpen={Boolean(viewSubmissionId)}
        submissionId={viewSubmissionId}
        onClose={() => setViewSubmissionId(null)}
        onEdit={(id) => {
          setViewSubmissionId(null);
          setEditId(id);
        }}
      />

      <SubmissionEditorDialog submissionId={editId} onClose={() => setEditId(null)} onSaved={refreshList} />
    </div>
  );
}
