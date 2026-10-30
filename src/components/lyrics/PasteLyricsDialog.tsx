import React, { useState } from 'react';
import { X, FileText, Check } from 'lucide-react';

interface PasteLyricsDialogProps {
  isOpen: boolean;
  songTitle: string;
  songArtist: string;
  onSaveLyrics: (lyrics: string) => void;
  onClose: () => void;
}

export const PasteLyricsDialog: React.FC<PasteLyricsDialogProps> = ({
  isOpen,
  songTitle,
  songArtist,
  onSaveLyrics,
  onClose,
}) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSaveLyrics(text.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-overlay backdrop-blur-sm animate-fade-in">
      <div className="bg-theme-surface-elevated border border-theme-border-default rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border-default bg-theme-background-secondary/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-theme-text-primary">Paste Plain or Synced Lyrics</h3>
              <p className="text-xs text-theme-text-muted mt-0.5">
                For <span className="text-theme-text-primary font-medium">{songTitle}</span> by{' '}
                <span className="text-theme-text-primary font-medium">{songArtist}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <p className="text-xs text-theme-text-muted">
            Paste lyrics line-by-line. LRC timestamps like <code className="text-primary-600 dark:text-primary-300">[01:23.45]</code> or section headers like <code className="text-primary-600 dark:text-primary-300">[Chorus]</code> are automatically parsed and supported.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="[00:15.30] If you wanna get stronger&#10;[00:20.50] Every time I cry I get a little bit stronger"
            className="w-full bg-theme-background-primary border border-theme-border-default rounded-xl p-3 text-xs text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none focus:border-theme-border-focus focus:ring-1 focus:ring-theme-border-focus font-mono resize-none leading-relaxed transition-colors shadow-2xs"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-text-secondary hover:bg-theme-surface-hover border border-theme-border-default transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              Index Lyrics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
