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
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 dark:from-indigo-950 dark:via-blue-950 dark:to-purple-950"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 dark:hidden"></div>
      
      {/* Radial Glow Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 dark:bg-purple-400/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 dark:bg-blue-400/30 rounded-full blur-3xl"></div>
      
      {/* Floating Decorative Shapes - Reduced on mobile for performance */}
      <div className="hidden md:block absolute top-20 right-20 w-32 h-32 bg-cyan-400/10 dark:bg-cyan-300/20 rounded-full blur-2xl animate-pulse"></div>
      <div className="hidden md:block absolute bottom-20 left-20 w-40 h-40 bg-indigo-400/10 dark:bg-indigo-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      {/* Single smaller shape on mobile */}
      <div className="md:hidden absolute top-10 right-10 w-24 h-24 bg-cyan-400/10 dark:bg-cyan-300/20 rounded-full blur-2xl animate-pulse"></div>

      {/* Content Container */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
            {/* Left Column - Content */}
            <div className="flex-1 space-y-3 animate-fade-in-up">
              {/* Glassmorphism Card */}
              <div className="backdrop-blur-md bg-white/20 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl">
                {/* Title - Reduced font size */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                  MashHub: Intelligent Music Matching
                </h1>
                
                {/* Slogan - Reduced sizing */}
                <p className="text-base sm:text-lg md:text-xl text-white font-medium mb-2 md:mb-3">
                  Craft The Perfect Mashups
                </p>
                
                {/* Description - Reduced sizing */}
                <p className="text-xs md:text-sm text-white/95 mb-3 md:mb-4 leading-relaxed">
                  Discover seamless musical connections with section-based key detection, 
                  BPM compatibility analysis, and advanced harmonic matching. Organize your 
                  library with smart filtering and project management tools.
                </p>

                {/* Feature Badges - Stack vertically on mobile, horizontal on sm+ */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3 md:mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-full border border-white/40 dark:border-white/30">
                    <Music size={14} className="text-white" />
                    <span className="text-xs font-medium text-white">Harmonic Matching</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-full border border-white/40 dark:border-white/30">
                    <TrendingUp size={14} className="text-white" />
                    <span className="text-xs font-medium text-white">Part-Specific Keys</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-full border border-white/40 dark:border-white/30">
                    <Filter size={14} className="text-white" />
                    <span className="text-xs font-medium text-white">Smart Filtering</span>
                  </div>
                </div>

                {/* CTA Buttons - Full width on mobile, auto width on sm+ */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleStartMatching}
                    className="w-full sm:w-auto min-w-[180px] h-10 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm"
                    aria-label="Start matching songs"
                  >
                    <Sparkles size={16} />
                    Start Matching
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleExploreLibrary}
                    className="w-full sm:w-auto min-w-[180px] h-10 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/25 dark:bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/40 dark:border-white/30 hover:bg-white/35 dark:hover:bg-white/20 transition-all duration-200 text-sm"
                    aria-label="Explore music library"
                  >
                    <BookOpen size={16} />
                    Explore Library
                  </button>
                </div>
              </div>

              {/* Statistics Strip - 2-column mobile, 3-column md+ */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <div className="backdrop-blur-md bg-white/25 dark:bg-white/10 border border-white/40 dark:border-white/20 rounded-xl p-2 md:p-3 text-center">
                  <div className="text-xl md:text-2xl font-bold text-white mb-1">
                    {songsCount.toLocaleString()}
                  </div>
                  <div className="text-xs md:text-sm text-white/90">Total Songs</div>
                </div>
                <div className="backdrop-blur-md bg-white/25 dark:bg-white/10 border border-white/40 dark:border-white/20 rounded-xl p-2 md:p-3 text-center">
                  <div className="text-xl md:text-2xl font-bold text-white mb-1">
                    {projectsCount.toLocaleString()}
                  </div>
                  <div className="text-xs md:text-sm text-white/90">Projects</div>
                </div>
                <div className="col-span-2 md:col-span-1 backdrop-blur-md bg-white/25 dark:bg-white/10 border border-white/40 dark:border-white/20 rounded-xl p-2 md:p-3 text-center">
                  <div className="text-xl md:text-2xl font-bold text-white mb-1">
                    {supportedYears}
                  </div>
                  <div className="text-xs md:text-sm text-white/90">Supported Years</div>
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
                    <div className="absolute inset-0 rounded-full border-4 border-white/30 dark:border-white/10 animate-spin-slow"></div>
                    <div className="absolute inset-3 rounded-full border-4 border-white/25 dark:border-indigo-400/20 animate-spin-slow-reverse"></div>
                    <div className="absolute inset-6 rounded-full border-4 border-white/20 dark:border-purple-400/20 animate-spin-slow"></div>
                    
                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-white/30 dark:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40 dark:border-white/30">
                        <Music size={40} className="text-white" />
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
