import React from 'react';
import { Database, Sparkles } from 'lucide-react';

interface LyricCoverageBannerProps {
  songsWithLyrics: number;
  totalSongs: number;
  className?: string;
}

export const LyricCoverageBanner: React.FC<LyricCoverageBannerProps> = ({
  songsWithLyrics,
  totalSongs,
  className = '',
}) => {
  const pct = totalSongs > 0 ? Math.round((songsWithLyrics / totalSongs) * 100) : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-1 bg-gradient-to-r from-primary-500/15 via-purple-500/10 to-transparent border border-theme-border-default shadow-xs dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] ${className}`}
    >
      <div className="relative rounded-[calc(1rem-2px)] p-4 sm:p-5 bg-theme-surface-base border border-theme-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary-500/10 dark:bg-gradient-to-br dark:from-primary-500/20 dark:to-purple-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-xs">
            <Database className="w-5 h-5 text-primary-500 dark:text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-text-primary flex items-center gap-2">
              <span>Library Coverage:</span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-300">
                {songsWithLyrics.toLocaleString()}
              </span>
              <span className="text-theme-text-muted font-normal">of</span>
              <span className="text-theme-text-secondary font-medium">{totalSongs.toLocaleString()}</span>
              <span className="text-theme-text-muted font-normal">songs indexed</span>
            </p>
            <p className="text-xs text-theme-text-muted mt-0.5">
              Instant on-demand indexing only — zero background scraping or bulk library crawls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <div className="w-32 bg-theme-background-secondary rounded-full h-2 overflow-hidden border border-theme-border-default p-[1px]">
            <div
              className="bg-gradient-to-r from-primary-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
          <span className="text-xs font-bold text-theme-text-secondary font-mono min-w-[2.5rem] text-right">
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
};
