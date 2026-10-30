import React from 'react';
import type { LyricIngestStatus } from '../../types/lyrics';
import { CheckCircle2, AlertCircle, Music, Clock, Edit3, Loader2 } from 'lucide-react';

interface LyricSongStatusChipProps {
  status: LyricIngestStatus | 'idle' | 'queued' | 'fetching';
  lineCount?: number;
  onPasteClick?: () => void;
  onWrongLyricsClick?: () => void;
  className?: string;
}

export const LyricSongStatusChip: React.FC<LyricSongStatusChipProps> = ({
  status,
  lineCount,
  onPasteClick,
  onWrongLyricsClick,
  className = '',
}) => {
  switch (status) {
    case 'fetching':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 ${className}`}>
          <Loader2 className="w-3 h-3 animate-spin" />
          Fetching...
        </span>
      );

    case 'queued':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-theme-surface-elevated text-theme-text-muted border border-theme-border-default ${className}`}>
          <Clock className="w-3 h-3" />
          Queued
        </span>
      );

    case 'found':
    case 'manual':
      return (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 ${className}`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            {status === 'manual' ? 'Pasted lyrics' : 'Lyrics indexed'}
            {lineCount ? ` (${lineCount} lines)` : ''}
          </span>
          {onWrongLyricsClick && (
            <button
              onClick={onWrongLyricsClick}
              type="button"
              className="text-[11px] text-theme-text-muted hover:text-theme-text-primary underline transition-colors"
            >
              Wrong lyrics?
            </button>
          )}
        </div>
      );

    case 'instrumental':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 ${className}`}>
          <Music className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          Instrumental track
        </span>
      );

    case 'not_found':
    case 'error':
      return (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25 ${className}`}>
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            {status === 'not_found' ? 'No lyrics found' : 'Fetch error'}
          </span>
          {onPasteClick && (
            <button
              onClick={onPasteClick}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline transition-colors"
            >
              <Edit3 className="w-2.5 h-2.5" />
              Paste lyrics
            </button>
          )}
        </div>
      );

    default:
      return null;
  }
};
