// HOOK SAFETY: hooks at top level only.
import { useCallback, useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import {
  fetchSubmissionById,
  updateOwnSubmission,
  resubmitSubmission,
  type NewSongRow,
} from '../../services/moderationService';
import { validateAnalysisSubmission, type SongAnalysisPayload } from '../../services/validateAnalysisSubmission';
import { ButtonLoader } from '../loading/ButtonLoader';

interface SubmissionEditorDialogProps {
  submissionId: string | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export function SubmissionEditorDialog({ submissionId, onClose, onSaved }: SubmissionEditorDialogProps) {
  const [row, setRow] = useState<NewSongRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [type, setType] = useState('');
  const [origin, setOrigin] = useState('');
  const [season, setSeason] = useState('');
  const [year, setYear] = useState(2020);
  const [sections, setSections] = useState<Array<{ part: string; bpm: string; key: string }>>([]);

  useEffect(() => {
    if (!submissionId) {
      setRow(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const r = await fetchSubmissionById(submissionId);
        if (cancelled || !r) return;
        setRow(r);
        setTitle(r.title);
        setArtist(r.artist);
        setType(r.type);
        setOrigin(r.origin);
        setSeason(r.season);
        setYear(r.year ?? new Date().getFullYear());
        const secs = (r.new_song_sections ?? []).sort((a, b) => a.section_order - b.section_order);
        setSections(
          secs.map((s) => ({
            part: s.part,
            bpm: String(s.bpm ?? ''),
            key: s.key,
          }))
        );
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load submission');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const buildPayload = useCallback((): SongAnalysisPayload | null => {
    const sectionsInput = sections
      .map((s, idx) => {
        const bpm = parseFloat(s.bpm);
        return {
          part: s.part.trim(),
          bpm,
          key: s.key.trim(),
          sectionOrder: idx + 1,
        };
      })
      .filter((s) => s.part && !Number.isNaN(s.bpm) && s.bpm > 0 && s.key);

    return {
      title: title.trim(),
      artist: artist.trim(),
      type: type || 'Anime',
      origin: origin.trim() || 'Japan',
      season,
      year,
      notes: '',
      sections: sectionsInput.map((s, i) => ({ ...s, sectionOrder: i + 1 })),
    };
  }, [sections, title, artist, type, origin, season, year]);

  const handleSave = useCallback(async () => {
    if (!submissionId) return;
    const payload = buildPayload();
    if (!payload) return;
    const v = validateAnalysisSubmission(payload);
    if (!v.ok) {
      setError(v.errors.join(' '));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateOwnSubmission(submissionId, payload);
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [submissionId, buildPayload, onClose, onSaved]);

  const handleResubmit = useCallback(async () => {
    if (!submissionId) return;
    setSaving(true);
    setError(null);
    try {
      await resubmitSubmission(submissionId);
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resubmit failed');
    } finally {
      setSaving(false);
    }
  }, [submissionId, onClose, onSaved]);

  if (!submissionId) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal-overlay)] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-theme-border-default bg-theme-surface-base shadow-[var(--theme-shadow-card)]">
        <div className="flex items-center justify-between border-b border-theme-border-default px-4 py-3">
          <h2 className="text-lg font-semibold text-theme-text-primary">Edit submission</h2>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-theme-text-muted hover:bg-theme-state-hover" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 p-4">
          {loading && <p className="text-sm text-theme-text-muted">Loading…</p>}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {row && row.status === 'rejected' && row.rejection_reason && (
            <div className="rounded-md border border-theme-border-default bg-theme-background-secondary p-3 text-sm text-theme-text-secondary">
              <p className="font-medium text-theme-text-primary">Previous feedback</p>
              <p className="mt-1 whitespace-pre-wrap">{row.rejection_reason}</p>
            </div>
          )}
          {row && row.status === 'needs_revision' && row.revision_notes && (
            <div className="rounded-md border border-theme-border-default bg-theme-background-secondary p-3 text-sm text-theme-text-secondary">
              <p className="font-medium text-theme-text-primary">Revision notes</p>
              <p className="mt-1 whitespace-pre-wrap">{row.revision_notes}</p>
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
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-theme-text-primary">Sections</p>
                {sections.map((s, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <input className="rounded border border-theme-border-default px-2 py-1 text-sm" value={s.part} onChange={(e) => setSections((prev) => prev.map((p, j) => (j === i ? { ...p, part: e.target.value } : p)))} placeholder="Part" />
                    <input className="rounded border border-theme-border-default px-2 py-1 text-sm" value={s.bpm} onChange={(e) => setSections((prev) => prev.map((p, j) => (j === i ? { ...p, bpm: e.target.value } : p)))} placeholder="BPM" />
                    <input className="rounded border border-theme-border-default px-2 py-1 text-sm" value={s.key} onChange={(e) => setSections((prev) => prev.map((p, j) => (j === i ? { ...p, key: e.target.value } : p)))} placeholder="Key" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-theme-border-default pt-4">
                <button type="button" className="btn-secondary min-h-[44px]" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn-primary min-h-[44px]" onClick={() => void handleSave()} disabled={saving}>
                  <ButtonLoader state={saving ? 'loading' : 'idle'} label="Save changes" />
                </button>
                {(row.status === 'rejected' || row.status === 'needs_revision') && (
                  <button type="button" className="btn-primary min-h-[44px]" onClick={() => void handleResubmit()} disabled={saving}>
                    Resubmit for review
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
