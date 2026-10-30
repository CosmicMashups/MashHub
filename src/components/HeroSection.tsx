import { useMemo, useRef } from 'react';
import { Sparkles, Filter, Disc, ChevronRight, Database, Activity } from 'lucide-react';
import type { Song } from '../types';
import { useDarkMode } from '../hooks/useTheme';
import { getKeyChipStyle } from '../utils/keyColors';

interface HeroSectionProps {
  songsCount: number;
  projectsCount: number;
  songs: Song[];
  onStartMatching?: () => void;
  onSelectSong?: (song: Song) => void;
  onSelectKey?: (key: string) => void;
}

export function HeroSection({
  songsCount,
  projectsCount,
  songs,
  onStartMatching,
  onSelectSong,
  onSelectKey,
}: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const isDark = useDarkMode();

  // Exact real-world metrics derived purely from the catalog array
  const { avgBpm, minBpm, maxBpm, yearSpan, topKeys, recentAdditions } = useMemo(() => {
    let bpmSum = 0;
    let bpmCount = 0;
    let min = Infinity;
    let max = -Infinity;
    const years: number[] = [];
    const keyMap: Record<string, number> = {};

    songs.forEach((s) => {
      const bpm = s.primaryBpm || s.bpms?.[0];
      if (typeof bpm === 'number' && !isNaN(bpm) && bpm > 0) {
        bpmSum += bpm;
        bpmCount++;
        if (bpm < min) min = bpm;
        if (bpm > max) max = bpm;
      }

      const y = typeof s.year === 'number' ? s.year : parseInt(String(s.year), 10);
      if (!isNaN(y) && y > 1950) {
        years.push(y);
      }

      // Exact musical key from database (e.g. "C Major", "G Major", "A Minor")
      const actualKey = s.primaryKey || s.keys?.[0];
      if (actualKey && typeof actualKey === 'string' && actualKey.trim()) {
        const keyName = actualKey.trim();
        keyMap[keyName] = (keyMap[keyName] || 0) + 1;
      }
    });

    years.sort((a, b) => a - b);
    const yearSpanStr = years.length > 0 ? `${years[0]} – ${years[years.length - 1]}` : 'Catalog Archive';

    // Top 3 most represented database musical keys
    const sortedKeys = Object.entries(keyMap)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Deterministic O(k) daily shuffle: selects 4 unique entries rotated per calendar day without mutating or cloning the full array
    let dailyFeatured: Song[] = [];
    if (songs.length <= 4) {
      dailyFeatured = songs;
    } else {
      const now = new Date();
      // Integer date seed (e.g., 20261028)
      let seed = (now.getFullYear() * 10000) + ((now.getMonth() + 1) * 100) + now.getDate();
      
      // Mulberry32 PRNG - fast, zero overhead, 32-bit state generator
      const rand = () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

      const selected: Song[] = [];
      const chosenIndices = new Set<number>();
      let attempts = 0;
      while (selected.length < 4 && attempts < 20) {
        const idx = Math.floor(rand() * songs.length);
        if (!chosenIndices.has(idx)) {
          chosenIndices.add(idx);
          selected.push(songs[idx]);
        }
        attempts++;
      }
      dailyFeatured = selected.length > 0 ? selected : songs.slice(0, 4);
    }

    return {
      avgBpm: bpmCount > 0 ? Math.round(bpmSum / bpmCount) : 126,
      minBpm: min === Infinity ? 0 : Math.round(min),
      maxBpm: max === -Infinity ? 0 : Math.round(max),
      yearSpan: yearSpanStr,
      topKeys: sortedKeys,
      recentAdditions: dailyFeatured,
    };
  }, [songs]);

  const handleScrollToSearch = () => {
    const el = document.querySelector('[data-hero-scroll-target="search"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToSongs = () => {
    const el = document.querySelector('[data-hero-scroll-target="songs"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      ref={containerRef}
      aria-label="Audio Registry Overview"
      className="space-y-4 font-sans"
    >
      {/* Primary Hero Header Banner */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/80 to-blue-50/30 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/30 p-5 sm:p-6 lg:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="text-xs font-mono text-theme-text-muted">
              {yearSpan}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-text-primary">
              Discover, match, and catalog music by harmonic key & tempo.
            </h1>

            <p className="text-xs sm:text-sm text-theme-text-secondary leading-relaxed max-w-xl">
              An archival audio registry indexing{' '}
              <span className="font-mono font-bold text-theme-accent-primary tabular-nums">
                {songsCount.toLocaleString()}
              </span>{' '}
              songs, acapellas, and instrumentals with strict Camelot wheel and BPM compatibility scoring.
            </p>

            {/* Quick-action buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onStartMatching || handleScrollToSearch}
                className="inline-flex items-center gap-1.5 rounded-lg bg-theme-accent-primary hover:bg-theme-accent-hover text-theme-accent-contrast px-4 py-2 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                aria-label="Filter database by key and tempo"
              >
                <Filter size={14} />
                <span>Filter by Key & BPM</span>
              </button>

              <button
                type="button"
                onClick={handleScrollToSongs}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-theme-text-primary px-4 py-2 text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                aria-label="Explore master track table"
              >
                <Database size={14} className="text-theme-accent-primary" />
                <span>Explore Master Index</span>
              </button>
            </div>
          </div>

          {/* Database Vital Statistics Ledger - Dark Hardware Audio Console Chassis */}
          <div className="w-full lg:w-80 shrink-0 rounded-xl border border-slate-800/90 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 p-4 shadow-md relative z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-[11px] font-mono text-slate-400">
              <span className="uppercase tracking-wider font-bold flex items-center gap-1.5 text-slate-300">
                <Activity size={12} className="text-cyan-400 animate-pulse" />
                DATABASE METRICS
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px] bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>

            <dl className="divide-y divide-slate-800/80 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-400 font-medium">Total Entries</dt>
                <dd className="font-mono font-bold text-white tabular-nums text-sm">
                  {songsCount.toLocaleString()}
                </dd>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-400 font-medium">Active Workspaces</dt>
                <dd className="font-mono font-bold text-sky-400 tabular-nums text-sm">
                  {projectsCount}
                </dd>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-400 font-medium">Average Tempo</dt>
                <dd className="font-mono font-bold text-amber-400 tabular-nums text-sm">
                  {avgBpm} <span className="text-xs text-amber-400/70 font-normal">BPM</span>
                </dd>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-400 font-medium">Tempo Range</dt>
                <dd className="font-mono font-bold text-cyan-300 tabular-nums text-sm">
                  {minBpm}–{maxBpm} <span className="text-xs text-cyan-300/70 font-normal">BPM</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Secondary Row: Explore / Top Harmonic Nodes Discovery Shelf */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Shelf 1: Top Harmonic Keys - Harmonic Violet / Indigo Aura */}
        <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900/90 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Disc size={14} className="text-indigo-600 dark:text-indigo-400" />
                Top Harmonic Keys
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-100/90 dark:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold">
                DATABASE
              </span>
            </div>
            <p className="text-[11px] text-indigo-900/70 dark:text-indigo-300/70 mb-3">
              Most represented musical keys in the catalog.
            </p>
            <div className="space-y-2 font-mono text-xs">
              {topKeys.map((k) => {
                const chipStyle = getKeyChipStyle(k.key, isDark);
                return (
                  <div
                    key={k.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`Filter catalog tracks in ${k.key} (${k.count.toLocaleString()} tracks)`}
                    onClick={() => {
                      if (onSelectKey) {
                        onSelectKey(k.key);
                      } else {
                        handleScrollToSongs();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onSelectKey) {
                          onSelectKey(k.key);
                        } else {
                          handleScrollToSongs();
                        }
                      }
                    }}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg bg-white/95 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/70 dark:hover:bg-slate-800/90 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <span
                      className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md font-mono text-xs font-bold border shadow-xs tabular-nums group-hover:scale-105 transition-transform"
                      style={chipStyle}
                    >
                      {k.key}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold tabular-nums group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {k.count.toLocaleString()} tracks
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Shelf 2: Catalog Spotlight Releases - Vinyl Archive / Warm Sunset Aura */}
        <div className="md:col-span-2 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-white dark:from-amber-950/30 dark:via-orange-950/15 dark:to-slate-900/90 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Featured Catalog Entries
              </span>
              <button
                type="button"
                onClick={handleScrollToSongs}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight size={13} />
              </button>
            </div>
            <p className="text-[11px] text-amber-900/70 dark:text-amber-300/70 mb-3">
              Sample recordings rotated daily with verified BPM and key signatures.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recentAdditions.map((s) => {
                const key = s.primaryKey || s.keys?.[0] || '';
                const bpm = s.primaryBpm || s.bpms?.[0];
                const chipStyle = key ? getKeyChipStyle(key, isDark) : undefined;
                return (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${s.title}${s.artist ? ` by ${s.artist}` : ''}`}
                    onClick={() => {
                      if (onSelectSong) {
                        onSelectSong(s);
                      } else {
                        handleScrollToSongs();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onSelectSong) {
                          onSelectSong(s);
                        } else {
                          handleScrollToSongs();
                        }
                      }
                    }}
                    className="group flex items-center justify-between p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-white/95 dark:bg-slate-900/80 hover:bg-amber-50/60 dark:hover:bg-slate-800/90 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {s.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {s.artist || 'Unknown Artist'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
                      {key && (
                        <span
                          className="px-2 py-0.5 rounded-md border font-bold tabular-nums"
                          style={chipStyle}
                        >
                          {key}
                        </span>
                      )}
                      {bpm && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold tabular-nums">
                          {bpm} BPM
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
