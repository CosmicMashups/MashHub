import { useEffect, useRef, useState } from 'react';
import type { Song } from '../types';
import { useInstrumentalSearch } from '../hooks/useInstrumentalSearch';
import { FloatingInput } from './inputs/FloatingInput';
import { Music, X } from 'lucide-react';

export interface InstrumentalSongSelectorProps {
  songs: Song[];
  selectedSongId?: string;
  selectedSongName?: string;
  onSelect: (songId: string, songName: string) => void;
  onClearSelection: () => void;
  onManualEntry: (name: string) => void;
  isManualMode: boolean;
  onToggleManualMode: () => void;
}

function formatSecondaryLine(song: Song): string {
  const bpm = song.primaryBpm ?? song.bpms?.[0];
  const key = song.primaryKey ?? song.keys?.[0];
  const type = song.type ?? '';
  const bpmPart = bpm != null ? `${bpm} BPM` : '— BPM';
  const keyPart = key && key.trim() ? key : '—';
  const typePart = type ? type : '—';
  return `${bpmPart} • ${keyPart} • ${typePart}`;
}

export function InstrumentalSongSelector({
  songs,
  selectedSongId,
  selectedSongName,
  onSelect,
  onClearSelection,
  onManualEntry,
  isManualMode,
  onToggleManualMode,
}: InstrumentalSongSelectorProps) {
  const { query, setQuery, results, isSearching, clearSearch } = useInstrumentalSearch(songs);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [manualValue, setManualValue] = useState(selectedSongName ?? '');

  useEffect(() => {
    if (isManualMode) {
      setManualValue(selectedSongName ?? '');
    }
  }, [isManualMode, selectedSongName]);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  useEffect(() => {
    if (results.length > 0) setDropdownOpen(true);
    else if (!isSearching) setDropdownOpen(false);
  }, [results.length, isSearching]);

  const hasLibrarySelection = Boolean(selectedSongId && selectedSongName);

  if (isManualMode) {
    return (
      <div className="space-y-3">
        <FloatingInput
          label="Instrumental song name (manual)"
          type="text"
          value={manualValue}
          onChange={(e) => {
            const v = e.target.value;
            setManualValue(v);
            onManualEntry(v);
          }}
          placeholder="Enter instrumental title…"
        />
        <button
          type="button"
          onClick={onToggleManualMode}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
        >
          Search library instead
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 relative" ref={rootRef}>
      {hasLibrarySelection ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
            <Music size={16} className="shrink-0 text-primary-500" aria-hidden />
            <span className="truncate max-w-[min(100%,28rem)]">{selectedSongName}</span>
            <button
              type="button"
              onClick={() => {
                clearSearch();
                onClearSelection();
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Clear instrumental selection"
            >
              <X size={16} />
            </button>
          </span>
        </div>
      ) : (
        <>
          <FloatingInput
            label="Search instrumental songs…"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search…"
            icon={<Music size={16} className="text-gray-400" />}
          />
          {dropdownOpen && results.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
              role="listbox"
            >
              {results.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  role="option"
                  onClick={() => {
                    onSelect(song.id, `${song.title} — ${song.artist}`);
                    clearSearch();
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/80 border-b border-gray-100 dark:border-gray-700 last:border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                >
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {song.title} — {song.artist}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatSecondaryLine(song)}</div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!hasLibrarySelection && (
        <button
          type="button"
          onClick={onToggleManualMode}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-1"
        >
          Enter manually instead
        </button>
      )}
    </div>
  );
}
