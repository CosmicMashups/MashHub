// HOOK SAFETY: All hooks must remain at top-level and unconditionally executed.
// Do not add hooks inside conditions or loops.

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Globe,
  Sun,
  Tag,
  Award,
  Layers,
  User,
  UserCheck,
  Music,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import type { Song } from '../../types';
import {
  fetchSubmissionById,
  type NewSongRow,
  type SubmissionStatus,
} from '../../services/moderationService';
import { useCoverImage } from '../../hooks/useCoverImage';
import { useImageColors } from '../../hooks/useImageColors';
import { AlbumArtwork } from '../AlbumArtwork';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sheet, SheetContent } from '../ui/Sheet';

interface SubmissionDetailsModalProps {
  isOpen: boolean;
  submissionId: string | null;
  onClose: () => void;
  onEdit?: (submissionId: string) => void;
}

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderStatusBadge(status: SubmissionStatus | string) {
  const formatted = formatStatus(status);
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {formatted}
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          {formatted}
        </span>
      );
    case 'needs_revision':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/25">
          <AlertCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          {formatted}
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25">
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
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

export function SubmissionDetailsModal({
  isOpen,
  submissionId,
  onClose,
  onEdit,
}: SubmissionDetailsModalProps) {
  const [row, setRow] = useState<NewSongRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch submission details when opened
  useEffect(() => {
    if (!isOpen || !submissionId) {
      setRow(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const data = await fetchSubmissionById(submissionId);
        if (isMounted) {
          if (!data) {
            setError('Submission not found.');
          } else {
            setRow(data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load submission.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, submissionId]);

  // Adapt submission row to Song interface for useCoverImage and AlbumArtwork
  const songAdapter = useMemo<Song | null>(() => {
    if (!row) return null;
    const secs = row.new_song_sections ?? [];
    const sortedSecs = [...secs].sort((a, b) => a.section_order - b.section_order);
    const bpms = Array.from(
      new Set(sortedSecs.map((s) => s.bpm).filter((b): b is number => b != null))
    );
    const keys = Array.from(new Set(sortedSecs.map((s) => s.key).filter(Boolean)));

    return {
      id: row.id,
      title: row.title,
      artist: row.artist,
      type: row.type,
      origin: row.origin,
      year: row.year ?? new Date().getFullYear(),
      season: row.season,
      notes: row.notes,
      bpms,
      keys,
      primaryBpm: sortedSecs[0]?.bpm ?? undefined,
      primaryKey: sortedSecs[0]?.key ?? undefined,
      analysisByUsername: row.submitted_by_username,
      confirmedByUsername: row.reviewed_by_username,
    };
  }, [row]);

  // Hook safety: execute all hooks unconditionally at the top level
  const { coverImageUrl } = useCoverImage(isOpen && songAdapter ? songAdapter : null, isOpen && !!songAdapter);

  const { gradient } = useImageColors(
    coverImageUrl,
    isOpen && !!coverImageUrl
  );

  const modalRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen, loading]);

  if (!isOpen || !submissionId) return null;

  const sortedSections = [...(row?.new_song_sections ?? [])].sort(
    (a, b) => a.section_order - b.section_order
  );

  const canEdit = (row?.status === 'rejected' || row?.status === 'needs_revision') && Boolean(onEdit);

  const SongContent = () => (
    <>
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 id="song-details-title" className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
          Song Details
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md transition-colors"
          aria-label="Close song details"
        >
          <X size={18} className="md:w-5 md:h-5" />
        </button>
      </div>

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-theme-accent-primary mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading submission details...</p>
          </div>
        ) : error || !row ? (
          <div className="text-center py-16">
            <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-3" />
            <p className="text-base font-medium text-gray-900 dark:text-white">{error || 'Submission not found'}</p>
            <div className="mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Two-Column Layout */
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Album Cover & Origin */}
            <div className="flex-shrink-0">
              <div className="w-full md:w-64 space-y-4">
                <div className="w-full">
                  <AlbumArtwork
                    imageUrl={coverImageUrl ?? undefined}
                    alt={`${row.title} by ${row.artist || 'Unknown Artist'}`}
                    size="large"
                    lazy={false}
                    className="w-full h-full"
                    aspectRatio={row.type?.toLowerCase() === 'anime' ? 'portrait' : 'square'}
                  />
                </div>
                {/* Origin Field */}
                <div className="flex items-center space-x-3">
                  <Globe size={16} className="text-music-sonic flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Origin</label>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">{row.origin || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Metadata & Details */}
            <div className="flex-1 min-w-0">
              {/* Song Header */}
              <div className="mb-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 break-words">
                      {row.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      by {row.artist || 'Unknown Artist'}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {renderStatusBadge(row.status)}
                  </div>
                </div>
              </div>

              {/* Metadata Section */}
              <div className="space-y-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Award size={18} className="mr-2 text-music-pulse" />
                  Metadata
                </h4>
                <div className="flex justify-between items-start max-w-2xl">
                  <div className="flex items-center space-x-3 flex-1 justify-center">
                    <Tag size={16} className="text-music-beat flex-shrink-0" />
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Type</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.type || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-1 justify-center">
                    <Sun size={16} className="text-music-wave flex-shrink-0" />
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Season</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.season || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-1 justify-center">
                    <Calendar size={16} className="text-music-pulse flex-shrink-0" />
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block">Year</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.year ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Submitter & Reviewer info */}
                {(row.submitted_by_username || row.reviewed_by_username) && (
                  <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                    {row.submitted_by_username && (
                      <div className="flex items-start space-x-3">
                        <User size={16} className="mt-0.5 text-music-electric flex-shrink-0" />
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block">Submitted By</label>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {row.submitted_by_username}
                            {row.submitted_at && (
                              <span className="font-normal text-xs text-gray-500 dark:text-gray-400 ml-2">
                                on {new Date(row.submitted_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    {row.reviewed_by_username && (
                      <div className="flex items-start space-x-3">
                        <UserCheck size={16} className="mt-0.5 text-music-pulse flex-shrink-0" />
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block">Confirmed / Reviewed By</label>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {row.reviewed_by_username}
                            {row.reviewed_at && (
                              <span className="font-normal text-xs text-gray-500 dark:text-gray-400 ml-2">
                                on {new Date(row.reviewed_at).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Alert Banners: Rejection Reason / Revision Notes */}
              {row.rejection_reason && (
                <div className="mb-6 rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 text-xs space-y-1">
                  <p className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Rejection Reason
                  </p>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed pl-5">
                    {row.rejection_reason}
                  </p>
                </div>
              )}

              {row.revision_notes && (
                <div className="mb-6 rounded-xl border border-sky-500/25 bg-sky-500/10 p-4 text-xs space-y-1">
                  <p className="font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Revision Notes
                  </p>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed pl-5">
                    {row.revision_notes}
                  </p>
                </div>
              )}

              {/* Submitter Notes if present */}
              {row.notes && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-800/40 text-xs">
                  <label className="font-medium text-gray-500 dark:text-gray-400 block mb-1">Submitter Notes</label>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{row.notes}</p>
                </div>
              )}

              {/* Song Structure Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <Layers size={18} className="mr-2 text-music-electric" />
                  Song Structure
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200/60 dark:border-gray-700/60">
                  {sortedSections.length === 0 ? (
                    <div className="text-center py-6">
                      <Music className="mx-auto text-gray-400" size={30} />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No sections defined for this song</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table" aria-label="Song structure">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Order
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Part
                            </th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              BPM
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Key
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {sortedSections.map((section) => (
                            <tr
                              key={section.section_id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              role="row"
                              aria-label={`Section ${section.section_order}: ${section.part}, ${section.bpm} BPM, ${section.key}`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {section.section_order}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                <span className="px-2 py-1 bg-music-cosmic/10 text-music-cosmic rounded-md text-sm font-medium">
                                  {section.part}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className="px-3 py-1 bg-music-wave/10 text-music-wave rounded-full text-sm font-bold font-mono">
                                  {section.bpm ?? '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                <span className="px-3 py-1 bg-music-cosmic/10 text-music-cosmic rounded-full text-sm font-medium">
                                  {section.key || '—'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-2 pt-6 border-t border-gray-200 dark:border-gray-700">
                {canEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit?.(row.id);
                    }}
                    className="flex-shrink-0 px-4 py-2.5 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-xs"
                  >
                    Edit / Resubmit
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 px-4 py-2.5 min-h-[44px] bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Mobile: Sheet presentation matching SongDetailsModal
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[85vh] p-0 flex flex-col"
          showDragHandle
        >
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            <SongContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Centered modal matching SongDetailsModal with dynamic gradient background
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[var(--z-modal-overlay)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="song-details-title"
    >
      <div
        ref={modalRef}
        className={`rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col relative overflow-hidden z-[var(--z-modal-content)] ${
          gradient ? '' : 'bg-white dark:bg-gray-800'
        }`}
        style={gradient ? { background: gradient } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Readability overlay */}
        {gradient && (
          <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/50 pointer-events-none" />
        )}

        {/* Inner scroll container */}
        <div className="relative z-10 overflow-y-auto flex-1 min-h-0">
          <SongContent />
        </div>
      </div>
    </div>
  );
}
