import React, { useState, useMemo } from 'react';
import type { Song } from '../../types';
import { Search, X, Music, AlertCircle } from 'lucide-react';
import { MAX_COMPARE_SONGS } from '../../constants/lyrics';

interface LyricSongPickerProps {
  songs: Song[];
  selectedSongIds: string[];
  onToggleSong: (songId: string) => void;
  onClear: () => void;
  maxSongs?: number;
}

export const LyricSongPicker: React.FC<LyricSongPickerProps> = ({
  songs,
  selectedSongIds,
  onToggleSong,
  onClear,
  maxSongs = MAX_COMPARE_SONGS,
}) => {
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selectedSongIds), [selectedSongIds]);

  const selectedSongs = useMemo(() => {
    return songs.filter((s) => selectedSet.has(s.id));
  }, [songs, selectedSet]);

  const filteredSongs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return songs
      .filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
      .slice(0, 10);
  }, [songs, query]);

  const isAtLimit = selectedSongIds.length >= maxSongs;

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-theme-text-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search song title or artist to add for lyric comparison..."
          className="w-full pl-9 pr-4 py-2.5 bg-theme-surface-base border border-theme-border-default rounded-xl text-sm text-theme-text-primary placeholder:text-theme-text-muted focus:outline-none focus:border-theme-border-focus focus:ring-1 focus:ring-theme-border-focus transition-colors shadow-2xs"
        />
      </div>

      {/* Search Results Dropdown */}
      {filteredSongs.length > 0 && (
        <div className="p-1.5 bg-theme-surface-elevated border border-theme-border-default rounded-xl shadow-xl space-y-1">
          {filteredSongs.map((s) => {
            const isSelected = selectedSet.has(s.id);
            const canSelect = isSelected || !isAtLimit;

            return (
              <button
                key={s.id}
                type="button"
                disabled={!canSelect}
                onClick={() => {
                  onToggleSong(s.id);
                  setQuery('');
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-primary-500/15 text-primary-700 dark:text-primary-300 font-medium'
                    : canSelect
                    ? 'hover:bg-theme-surface-hover text-theme-text-secondary'
                    : 'opacity-40 cursor-not-allowed text-theme-text-disabled'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Music className="w-3.5 h-3.5 text-theme-text-muted" />
                  <span className="font-medium truncate text-theme-text-primary">{s.title}</span>
                  <span className="text-theme-text-muted truncate">— {s.artist}</span>
                </div>
                {isSelected ? (
                  <span className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold">Selected</span>
                ) : (
                  <span className="text-[11px] text-theme-text-muted">+ Add</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Limit alert */}
      {isAtLimit && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Maximum {maxSongs} songs reached for Compare Selected mode.</span>
        </div>
      )}

      {/* Selected Chips */}
      {selectedSongs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="text-xs text-theme-text-muted font-medium mr-1">
            Selected ({selectedSongs.length}/{maxSongs}):
          </div>
          {selectedSongs.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-theme-surface-elevated border border-theme-border-default text-theme-text-secondary shadow-2xs"
            >
              <span className="font-medium truncate max-w-[140px] text-theme-text-primary">{s.title}</span>
              <button
                type="button"
                onClick={() => onToggleSong(s.id)}
                className="text-theme-text-muted hover:text-rose-500 transition-colors"
                title="Remove song"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {selectedSongs.length > 1 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-theme-text-muted hover:text-theme-text-primary underline ml-2 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};
