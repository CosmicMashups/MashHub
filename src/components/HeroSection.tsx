import { useMemo } from 'react';
import { Sparkles, Music, Filter, TrendingUp, ArrowRight, BookOpen } from 'lucide-react';
import type { Song } from '../types';

interface HeroSectionProps {
  songsCount: number;
  projectsCount: number;
  songs: Song[];
  onStartMatching?: () => void;
}

export function HeroSection({ songsCount, projectsCount, songs, onStartMatching }: HeroSectionProps) {
  // Calculate supported years from songs data
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
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-theme-background-secondary via-theme-surface-base to-theme-accent-soft"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-theme-accent-primary/15 via-transparent to-theme-accent-hover/20"></div>
      
      {/* Radial Glow Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-theme-accent-hover/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-theme-accent-primary/20 rounded-full blur-3xl"></div>
      
      {/* Floating Decorative Shapes - Reduced on mobile for performance */}
      <div className="hidden md:block absolute top-20 right-20 w-32 h-32 bg-theme-accent-hover/15 rounded-full blur-2xl animate-pulse"></div>
      <div className="hidden md:block absolute bottom-20 left-20 w-40 h-40 bg-theme-accent-primary/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      {/* Single smaller shape on mobile */}
      <div className="md:hidden absolute top-10 right-10 w-24 h-24 bg-theme-accent-hover/15 rounded-full blur-2xl animate-pulse"></div>

      {/* Content Container */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
            {/* Left Column - Content */}
            <div className="flex-1 space-y-3 animate-fade-in-up">
              {/* Glassmorphism Card */}
              <div className="backdrop-blur-md bg-theme-surface-base/80 border border-theme-border-default rounded-2xl p-4 md:p-5 shadow-[var(--theme-shadow-modal)]">
                {/* Title - Reduced font size */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-theme-text-primary mb-2 leading-tight">
                  MashHub: Intelligent Music Matching
                </h1>
                
                {/* Slogan - Reduced sizing */}
                <p className="text-base sm:text-lg md:text-xl text-theme-accent-primary font-medium mb-2 md:mb-3">
                  Craft The Perfect Mashups
                </p>
                
                {/* Description - Reduced sizing */}
                <p className="text-xs md:text-sm text-theme-text-secondary mb-3 md:mb-4 leading-relaxed">
                  Discover seamless musical connections with section-based key detection, 
                  BPM compatibility analysis, and advanced harmonic matching. Organize your 
                  library with smart filtering and project management tools.
                </p>

                {/* Feature Badges - Stack vertically on mobile, horizontal on sm+ */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3 md:mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-theme-accent-soft rounded-full border border-theme-border-default">
                    <Music size={14} className="text-theme-accent-primary" />
                    <span className="text-xs font-medium text-theme-text-primary">Harmonic Matching</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-theme-accent-soft rounded-full border border-theme-border-default">
                    <TrendingUp size={14} className="text-theme-accent-primary" />
                    <span className="text-xs font-medium text-theme-text-primary">Part-Specific Keys</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-theme-accent-soft rounded-full border border-theme-border-default">
                    <Filter size={14} className="text-theme-accent-primary" />
                    <span className="text-xs font-medium text-theme-text-primary">Smart Filtering</span>
                  </div>
                </div>

                {/* CTA Buttons - Full width on mobile, auto width on sm+ */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleStartMatching}
                    className="w-full sm:w-auto min-w-[180px] h-10 inline-flex items-center justify-center gap-2 px-4 py-2 bg-theme-accent-primary text-theme-text-inverse font-semibold rounded-lg hover:bg-theme-accent-hover transition-all duration-300 shadow-[var(--theme-shadow-card)] hover:shadow-[var(--theme-shadow-card),var(--theme-glow-accent)] transform hover:-translate-y-0.5 text-sm"
                    aria-label="Start matching songs"
                  >
                    <Sparkles size={16} />
                    Start Matching
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleExploreLibrary}
                    className="w-full sm:w-auto min-w-[180px] h-10 inline-flex items-center justify-center gap-2 px-4 py-2 bg-theme-surface-base/70 backdrop-blur-sm text-theme-text-primary font-semibold rounded-lg border border-theme-border-default hover:bg-theme-surface-hover transition-all duration-300 text-sm"
                    aria-label="Explore music library"
                  >
                    <BookOpen size={16} />
                    Explore Library
                  </button>
                </div>
              </div>

              {/* Statistics Strip - 2-column mobile, 3-column md+ */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <div className="backdrop-blur-md bg-theme-surface-base/75 border border-theme-border-default rounded-xl p-2 md:p-3 text-center">
                  <div className="text-xl md:text-2xl font-bold text-theme-text-primary mb-1">
                    {songsCount.toLocaleString()}
                  </div>
                  <div className="text-xs md:text-sm text-theme-text-secondary">Total Songs</div>
                </div>
                <div className="backdrop-blur-md bg-theme-surface-base/75 border border-theme-border-default rounded-xl p-2 md:p-3 text-center">
                  <div className="text-xl md:text-2xl font-bold text-theme-text-primary mb-1">
                    {projectsCount.toLocaleString()}
                  </div>
                  <div className="text-xs md:text-sm text-theme-text-secondary">Projects</div>
                </div>
                <div className="col-span-2 md:col-span-1 backdrop-blur-md bg-theme-surface-base/75 border border-theme-border-default rounded-xl p-2 md:p-3 text-center">
                  <div className="text-xl md:text-2xl font-bold text-theme-text-primary mb-1">
                    {supportedYears}
                  </div>
                  <div className="text-xs md:text-sm text-theme-text-secondary">Supported Years</div>
                </div>
              </div>
            </div>

            {/* Right Column - Decorative Visual */}
            <div className="hidden md:flex flex-shrink-0 w-full md:w-64 lg:w-80 items-center justify-center">
              <div className="relative w-full aspect-square">
                {/* Abstract Music Visual */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {/* Circular Waveform */}
                    <div className="absolute inset-0 rounded-full border-4 border-theme-border-default animate-spin-slow"></div>
                    <div className="absolute inset-3 rounded-full border-4 border-theme-accent-primary/35 animate-spin-slow-reverse"></div>
                    <div className="absolute inset-6 rounded-full border-4 border-theme-accent-hover/30 animate-spin-slow"></div>
                    
                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-theme-accent-soft backdrop-blur-sm rounded-full flex items-center justify-center border border-theme-border-default">
                        <Music size={40} className="text-theme-accent-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

