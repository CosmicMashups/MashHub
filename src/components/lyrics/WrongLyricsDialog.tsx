import React, { useState } from 'react';
import type { LyricCandidate } from '../../types/lyrics';
import { Search, Loader2, Music, Check, X } from 'lucide-react';

interface WrongLyricsDialogProps {
  isOpen: boolean;
  songTitle: string;
  songArtist: string;
  candidates: LyricCandidate[];
  isLoading: boolean;
  onSelectCandidate: (candidateId: string | number) => void;
  onClose: () => void;
}

export const WrongLyricsDialog: React.FC<WrongLyricsDialogProps> = ({
  isOpen,
  songTitle,
  songArtist,
  candidates,
  isLoading,
  onSelectCandidate,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-overlay backdrop-blur-sm animate-fade-in">
      <div className="bg-theme-surface-elevated border border-theme-border-default rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border-default bg-theme-background-secondary/70">
          <div>
            <h3 className="text-base font-semibold text-theme-text-primary">Select Correct Lyrics Candidate</h3>
            <p className="text-xs text-theme-text-muted mt-0.5">
              Matching for <span className="text-theme-text-primary font-medium">{songTitle}</span> by{' '}
              <span className="text-theme-text-primary font-medium">{songArtist}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-theme-text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              <p className="text-xs">Searching LRCLIB for candidate versions...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12 text-theme-text-muted">
              <p className="text-sm">No alternative candidates found in LRCLIB.</p>
              <p className="text-xs text-theme-text-muted mt-1">You can paste the plain lyric text directly using "Paste Lyrics".</p>
            </div>
          ) : (
            candidates.map((cand) => (
              <div
                key={cand.id}
                onClick={() => onSelectCandidate(cand.id)}
                className="group flex items-center justify-between p-3 rounded-xl border border-theme-border-default hover:border-primary-500/50 bg-theme-surface-base hover:bg-primary-500/5 cursor-pointer transition-all shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-theme-background-secondary text-theme-text-muted group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-medium text-theme-text-primary group-hover:text-primary-600 dark:group-hover:text-primary-300 truncate">
                      {cand.trackName}
                    </div>
                    <div className="text-xs text-theme-text-muted truncate">
                      {cand.artistName} {cand.albumName ? `• ${cand.albumName}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {cand.syncedLyrics && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-medium">
                      Synced
                    </span>
                  )}
                  {cand.instrumental && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 font-medium">
                      Instrumental
                    </span>
                  )}
                  <button
                    type="button"
                    className="p-1.5 rounded-lg bg-theme-background-secondary group-hover:bg-primary-500 text-theme-text-muted group-hover:text-white transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-border-default bg-theme-background-secondary/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-text-secondary hover:bg-theme-surface-hover border border-theme-border-default transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
