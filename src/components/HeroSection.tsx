import { useMemo } from 'react';
import { Sparkles, Music2, ArrowRight, Library, Waves, Gauge, KeyRound } from 'lucide-react';
import type { Song } from '../types';

interface HeroSectionProps {
  songsCount: number;
  projectsCount: number;
  songs: Song[];
  onStartMatching?: () => void;
}

export function HeroSection({ songsCount, projectsCount, songs, onStartMatching }: HeroSectionProps) {
  const supportedYears = useMemo(() => {
    const years = new Set<number>();
    songs.forEach(song => {
      if (song.year && typeof song.year === 'number') {
        years.add(song.year);
      } else if (song.year && typeof song.year === 'string') {
        const yearNum = parseInt(song.year, 10);
        if (!isNaN(yearNum)) {
          years.add(yearNum);
        }
      }
    });
    return years.size;
  }, [songs]);

  // Open Advanced Filtering dialog or scroll to search section
  const handleStartMatching = () => {
    if (onStartMatching) {
      onStartMatching();
    } else {
      // Fallback: scroll to search section if no handler provided
      const searchSection = document.querySelector('[data-hero-scroll-target="search"]');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Scroll to song list
  const handleExploreLibrary = () => {
    const songList = document.querySelector('[data-hero-scroll-target="songs"]');
    if (songList) {
      songList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-theme-border-default/70 bg-gradient-to-br from-theme-surface-base via-theme-surface-elevated to-theme-bg-secondary shadow-[var(--theme-shadow-modal)]">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-theme-accent-primary/20 blur-3xl" />

      <div className="relative z-10 px-5 py-7 sm:px-8 sm:py-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-theme-border-default bg-theme-surface-base/80 px-3 py-1 text-xs font-semibold tracking-wide text-theme-text-secondary">
              <Sparkles size={13} className="text-theme-accent-primary" />
              Professional Matching Workspace
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight text-theme-text-primary sm:text-4xl md:text-5xl">
                Create mashups that actually sound right.
              </h1>
              <p className="max-w-2xl text-sm text-theme-text-secondary sm:text-base">
                MashHub gives you a fast production view of compatibility signals so you can shortlist tracks, compare sections, and move from idea to arrangement with less friction.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-theme-border-default bg-theme-accent-soft/45 px-3 py-1 text-xs font-medium text-theme-text-secondary">
                <Gauge size={12} className="text-theme-accent-primary" />
                BPM intelligence
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-theme-border-default bg-theme-accent-soft/45 px-3 py-1 text-xs font-medium text-theme-text-secondary">
                <KeyRound size={12} className="text-theme-accent-primary" />
                Key-aware sections
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-theme-border-default bg-theme-accent-soft/45 px-3 py-1 text-xs font-medium text-theme-text-secondary">
                <Waves size={12} className="text-theme-accent-primary" />
                Fast filtering
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleStartMatching}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-theme-accent-primary px-5 py-2.5 text-sm font-semibold text-theme-text-inverse transition-colors hover:bg-theme-accent-hover"
                aria-label="Start matching songs"
              >
                <Sparkles size={15} />
                Start Matching
                <ArrowRight size={14} />
              </button>
              <button
                onClick={handleExploreLibrary}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-theme-border-default bg-theme-surface-base/75 px-5 py-2.5 text-sm font-semibold text-theme-text-primary transition-colors hover:bg-theme-state-hover"
                aria-label="Explore music library"
              >
                <Library size={15} />
                Explore Library
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            <article className="rounded-2xl border border-theme-border-default bg-theme-surface-base/80 p-4">
              <p className="text-xs uppercase tracking-wide text-theme-text-muted">Library</p>
              <p className="mt-1 text-2xl font-bold text-theme-text-primary">{songsCount.toLocaleString()}</p>
              <p className="text-xs text-theme-text-secondary">Tracks ready for discovery</p>
            </article>
            <article className="rounded-2xl border border-theme-border-default bg-theme-surface-base/80 p-4">
              <p className="text-xs uppercase tracking-wide text-theme-text-muted">Projects</p>
              <p className="mt-1 text-2xl font-bold text-theme-text-primary">{projectsCount.toLocaleString()}</p>
              <p className="text-xs text-theme-text-secondary">Active arrangement workspaces</p>
            </article>
            <article className="rounded-2xl border border-theme-border-default bg-theme-surface-base/80 p-4">
              <p className="text-xs uppercase tracking-wide text-theme-text-muted">Coverage</p>
              <p className="mt-1 text-2xl font-bold text-theme-text-primary">{supportedYears}</p>
              <p className="text-xs text-theme-text-secondary">Distinct release years indexed</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

