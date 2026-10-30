// HOOK SAFETY: All hooks must remain at top-level and unconditionally executed.
// Do not add hooks inside conditions or loops.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SongList } from './components/SongList';
import { SongModal } from './components/SongModal';
import { AdvancedFiltersDialog } from './components/AdvancedFiltersDialog';
import { ImportExportModal } from './components/ImportExportModal';
import { EnhancedExportModal } from './components/EnhancedExportModal';
import { UtilityDialog } from './components/UtilityDialog';
import { AddToProjectModal } from './components/AddToProjectModal';
import { SongDetailsModal } from './components/SongDetailsModal';
import { useSongs } from './hooks/useSongs';
import { useProjects } from './hooks/useProjects';
import { useAuthContext } from './contexts/AuthContext';
import { useBackendContext } from './contexts/BackendContext';
import type { ProjectType, ProjectWithSections, Song } from './types';
import type { MegamixConfig } from './utils/megamixScoring';
import { Filter, AlertCircle, Menu } from 'lucide-react';
import { MatchingService, type MatchCriteria } from './services/matchingService';
import type { FilterState } from './types';
import { filterStateToMatchCriteria, createDefaultFilterState } from './utils/filterState';
import { canonicalizeKeyString } from './utils/keyNormalization';
import type { FuseResult } from 'fuse.js';
import { InlineFilters } from './components/InlineFilters';
import { projectService } from './services/projectService';
import { DragDropProvider } from './contexts/DragDropContext';
import { AdvancedSearchBar } from './components/AdvancedSearchBar';
import { search } from './services/searchService';
import { SearchResults } from './components/SearchResults';
import { HeroSection } from './components/HeroSection';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from './content/legalContent';
import { LoadingScreen } from './components/loading/LoadingScreen';
import { SkeletonSongList } from './components/loading/SkeletonSongList';
import { EqualizerLoader } from './components/loading/EqualizerLoader';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import { ConnectionStatusDialog } from './components/ConnectionStatusDialog';
import { AppHeader } from './components/layout/AppHeader';
import { useTheme } from './hooks/useTheme';
import { useSnackbar } from './contexts/SnackbarContext';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  useTheme(); // Apply theme (default dark) at root so document.documentElement has .dark immediately
  const { showSuccess, showError } = useSnackbar();
  const { loading: authLoading } = useAuthContext();
  const { isChecking: backendChecking } = useBackendContext();
  const { songs, songPage, loading: songsLoading, error, addSong, addMultipleSongs, updateSong, deleteSong, searchSongs, loadSongPage, forceReloadFromCsv, refresh: refreshSongs } = useSongs();
  const { projects, loading: projectsLoading, addProject } = useProjects();

  // Unified startup loading phases on the single dynamic loader page
  const [initStage, setInitStage] = useState<'auth' | 'songs' | 'utilities' | 'ready'>('auth');

  useEffect(() => {
    if (authLoading || backendChecking) {
      setInitStage('auth');
    } else if (songsLoading) {
      setInitStage('songs');
    } else {
      setInitStage('utilities');
      const timer = setTimeout(() => {
        setInitStage('ready');
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [authLoading, backendChecking, songsLoading]);
  
  const [showSongModal, setShowSongModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showEnhancedExport, setShowEnhancedExport] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [activeFilters, setActiveFilters] = useState<MatchCriteria>({});
  const [filterState, setFilterState] = useState<FilterState>(createDefaultFilterState());
  const [searchResults, setSearchResults] = useState<Array<Song & { score?: number; matches?: ReadonlyArray<unknown> }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showAddToProjectModal, setShowAddToProjectModal] = useState(false);
  const [selectedSongForProject, setSelectedSongForProject] = useState<Song | null>(null);
  const [showSongDetailsModal, setShowSongDetailsModal] = useState(false);
  const [selectedSongForDetails, setSelectedSongForDetails] = useState<Song | null>(null);
  const [showUtilityDialog, setShowUtilityDialog] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryPageSize] = useState(25);
  const [searchPending, setSearchPending] = useState(false);
  // Track pending edit to prevent hook order issues when switching between lazy-loaded modals
  const pendingEditSongRef = React.useRef<Song | null>(null);

  // GSAP transition from dynamic loader page to main page
  const loaderOverlayRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLElement>(null);
  const [isLoaderOverlayMounted, setIsLoaderOverlayMounted] = useState(true);
  const hasAnimatedEntranceRef = useRef(false);

  useEffect(() => {
    if (initStage === 'ready' && !hasAnimatedEntranceRef.current) {
      hasAnimatedEntranceRef.current = true;
      const tl = gsap.timeline({
        onComplete: () => {
          setIsLoaderOverlayMounted(false);
          if (mainContentRef.current) {
            gsap.set(mainContentRef.current, { clearProps: 'all' });
          }
          const appHeader = document.getElementById('app-header');
          if (appHeader) {
            gsap.set(appHeader, { clearProps: 'transform,opacity' });
          }
        },
      });

      // 1. Dynamic loader blooms outward and dissolves
      if (loaderOverlayRef.current) {
        tl.to(loaderOverlayRef.current, {
          opacity: 0,
          scale: 1.04,
          y: -16,
          duration: 0.5,
          ease: 'power2.inOut',
        });
      }

      // 2. Sticky top navigation bar glides down into sticky position
      tl.fromTo(
        '#app-header',
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' },
        '-=0.35'
      );

      // 3. Main content rises smoothly into view
      if (mainContentRef.current) {
        tl.fromTo(
          mainContentRef.current,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' },
          '-=0.4'
        );
      }
    }
  }, [initStage]);

  // Handle search - now handled directly in useEffect

  // Handle applying filters
  const handleApplyFilters = async (filters: MatchCriteria) => {
    setActiveFilters(filters);
    const matches = await MatchingService.findMatches(songs, filters);
    setFilteredSongs(matches);
  };

  // Handle filter state change from inline (always apply immediately)
  const handleInlineFilterStateChange = (newState: FilterState) => {
    setFilterState(newState);
    const criteria = filterStateToMatchCriteria(newState);
    void handleApplyFilters(criteria);
  };

  // Handle filter state change from Advanced Filters dialog (state only)
  // Wrapped in useCallback to ensure stable reference for lazy-loaded component
  const handleAdvancedFilterStateChange = useCallback((newState: FilterState) => {
    setFilterState(newState);
  }, []);

  // Handle "Apply Filters" from Advanced Filters dialog
  // Wrapped in useCallback to ensure stable reference for lazy-loaded component
  const handleAdvancedApplyFilters = useCallback((state: FilterState) => {
    const criteria = filterStateToMatchCriteria(state);
    setActiveFilters(criteria);
    MatchingService.findMatches(songs, criteria).then(matches => {
      setFilteredSongs(matches);
    });
  }, [songs]);

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({});
    setFilterState(createDefaultFilterState());
    setFilteredSongs(songs);
    setSearchText('');
    setIsSearching(false);
    setSearchResults([]);
  };

  // Fuse-driven search callback must stay referentially stable: AdvancedSearchBar's effect
  // depends on `onSearch`; an inline function there re-runs the effect every parent render
  // and can freeze the tab (keys/BPM never paint, modals won't close).
  const handleSearchResults = useCallback((results: Array<FuseResult<Song>>) => {
    const songResults = results.map((result) => ({
      ...result.item,
      score: result.score,
      matches: result.matches,
    }));
    setSearchResults(songResults);
    setIsSearching(true);
    setSearchPending(false);
  }, []);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
    setFilteredSongs(songs);
    setSearchPending(false);
  }, [songs]);

  useEffect(() => {
    if (searchText.trim() !== '') return;
    setIsSearching(false);
    setSearchResults([]);
  }, [searchText]);

  // Handle adding a new song
  const handleAddSong = async (songData: Omit<Song, 'id'>): Promise<Song> => {
    try {
      const newSong = await addSong(songData);
      setShowSongModal(false);
      showSuccess(`"${newSong.title}" added to catalog.`);
      return newSong;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to add song';
      showError(msg);
      console.error('Failed to add song:', error);
      throw error;
    }
  };

  // Handle updating a song
  const handleUpdateSong = async (song: Song): Promise<Song> => {
    try {
      await updateSong(song);
      setShowSongModal(false);
      setEditingSong(null);
      showSuccess(`Saved changes to "${song.title}".`);
      return song;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update song';
      showError(msg);
      console.error('Failed to update song:', error);
      throw error;
    }
  };

  // Handle deleting a song
  const handleDeleteSong = async (songId: string) => {
    const targetSong = songs.find((s) => s.id === songId);
    try {
      await deleteSong(songId);
      showSuccess(`Deleted "${targetSong?.title || 'Song'}".`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete song';
      showError(`Could not delete song: ${msg}`);
      console.error('Failed to delete song:', error);
    }
  };

  // Handle editing a song
  const handleEditSong = (song: Song) => {
    // If details modal is open, close it first and queue the edit
    if (showSongDetailsModal) {
      pendingEditSongRef.current = song;
      setShowSongDetailsModal(false);
    } else {
      // If details modal is not open, open edit modal directly
      setEditingSong(song);
      setShowSongModal(true);
    }
  };

  // Effect to open edit modal after details modal is fully closed
  useEffect(() => {
    if (pendingEditSongRef.current && !showSongDetailsModal) {
      const songToEdit = pendingEditSongRef.current;
      pendingEditSongRef.current = null;
      // Use setTimeout to ensure the previous modal is fully unmounted
      const timeoutId = setTimeout(() => {
        setEditingSong(songToEdit);
        setShowSongModal(true);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [showSongDetailsModal]);

  // Handle opening add song modal
  const handleOpenAddSong = () => {
    setEditingSong(null);
    setShowSongModal(true);
  };

  // Handle closing song modal
  const handleCloseSongModal = () => {
    setShowSongModal(false);
    setEditingSong(null);
  };

  // Handle importing multiple songs
  const handleImportSongs = async (importedSongs: Song[]) => {
    try {
      await addMultipleSongs(importedSongs);
      setShowImportExport(false);
      showSuccess(`Successfully imported ${importedSongs.length} song${importedSongs.length === 1 ? '' : 's'}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Batch import failed';
      showError(`Import failed: ${msg}`);
      console.error('Failed to import songs:', error);
      throw error; // Re-throw to show error in modal
    }
  };

  const handleCreateProject = async (name: string, type?: ProjectType, megamixConfig?: MegamixConfig) => {
    try {
      const t = type ?? 'other';
      const created = await addProject({
        name: name.trim(),
        type: t,
        ...(megamixConfig?.mainInstrumentalSongId !== undefined && {
          mainInstrumentalSongId: megamixConfig.mainInstrumentalSongId,
        }),
        ...(megamixConfig?.mainInstrumentalSongName !== undefined && {
          mainInstrumentalSongName: megamixConfig.mainInstrumentalSongName,
        }),
        ...(megamixConfig?.acceptedKeys !== undefined && { acceptedKeys: megamixConfig.acceptedKeys }),
        ...(megamixConfig?.bpmRangeMin !== undefined && { bpmRangeMin: megamixConfig.bpmRangeMin }),
        ...(megamixConfig?.bpmRangeMax !== undefined && { bpmRangeMax: megamixConfig.bpmRangeMax }),
      });
      showSuccess(`Project "${name}" created.`, {
        action: {
          label: 'Open Workspace',
          onClick: () => navigate(`/projects/${created.id}`),
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create project';
      showError(msg);
      console.error('Failed to create project:', error);
    }
  };

  // Handle adding song to a section (sectionId required)
  const handleAddSongToSection = async (projectId: string, songId: string, sectionId: string) => {
    try {
      await projectService.addSongToSection(projectId, songId, sectionId);
      await refreshProjectsWithSections();
      const song = songs.find((s) => s.id === songId);
      showSuccess(`Added "${song?.title || 'Song'}" to project.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to add song to section';
      showError(msg);
      console.error('Failed to add song to section:', error);
      throw error;
    }
  };

  // Handle adding song to project
  const handleAddToProject = (song: Song) => {
    setSelectedSongForProject(song);
    setShowAddToProjectModal(true);
  };

  // Handle song click for details
  const handleSongClick = (song: Song) => {
    setSelectedSongForDetails(song);
    setShowSongDetailsModal(true);
  };

  // Handle filtering track library by key from Top Harmonic Keys in Hero
  const handleKeyFilterFromHero = (key: string) => {
    setIsSearching(false);
    setSearchResults([]);
    setSearchText('');
    setFilterState((prev) => {
      const next: FilterState = { ...prev, key: [key] };
      const criteria = filterStateToMatchCriteria(next);
      setActiveFilters(criteria);
      void MatchingService.findMatches(songs, criteria).then((matches) => {
        setFilteredSongs(matches);
      });
      return next;
    });

    const el = document.querySelector('[data-hero-scroll-target="songs"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Get projects with sections (includes entries for notes)
  const [projectsWithSections, setProjectsWithSections] = useState<ProjectWithSections[]>([]);
  const latestProjectsLoadRequestRef = React.useRef(0);

  // Add loading timeout - use constant from constants/index.ts
  React.useEffect(() => {
    // Import LOADING_TIMEOUT_MS constant for consistency
    const LOADING_TIMEOUT_MS = 60_000; // 60 seconds to accommodate large datasets (20k+ rows)
    
    const timeout = setTimeout(() => {
      if (songsLoading) {
        setLoadingTimeout(true);
      }
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [songsLoading]);

  // Function to load projects with sections
  const loadProjectsWithSections = React.useCallback(async () => {
    const requestId = latestProjectsLoadRequestRef.current + 1;
    latestProjectsLoadRequestRef.current = requestId;
    const projectsData = await Promise.all(
      projects.map(async (project) => {
        try {
          return await projectService.getProjectWithSections(project.id);
        } catch {
          return { ...project, sections: [] };
        }
      })
    );
    if (requestId !== latestProjectsLoadRequestRef.current) {
      return;
    }
    setProjectsWithSections(projectsData);
  }, [projects]);

  // Function to refresh projects with sections
  const refreshProjectsWithSections = React.useCallback(async () => {
    if (projects.length > 0) {
      await loadProjectsWithSections();
    }
  }, [projects.length, loadProjectsWithSections]);

  React.useEffect(() => {
    if (projects.length > 0) {
      void loadProjectsWithSections();
    }
  }, [projects.length, loadProjectsWithSections]);

  // Update filtered songs when songs change (memoized to avoid expensive recalculations)
  React.useEffect(() => {
    // Keep library list at full dataset unless explicit filters are active.
    if (Object.keys(activeFilters).length === 0) {
      setFilteredSongs(songs);
      return;
    }

    const processFiltering = async () => {
      const matches = await MatchingService.findMatches(songs, activeFilters);
      setFilteredSongs(matches);
    };

    const timeoutId = setTimeout(processFiltering, 100);
    return () => clearTimeout(timeoutId);
  }, [songs, activeFilters]);

  useEffect(() => {
    if (isSearching) return;
    void loadSongPage(libraryPage, libraryPageSize);
  }, [isSearching, libraryPage, libraryPageSize, loadSongPage]);

  useEffect(() => {
    // Contract: /?applyKey=<URL-encoded canonical key> applies that key to the library filter once, then removes the param.
    const raw = searchParams.get('applyKey');
    if (!raw?.trim() || songs.length === 0) return;
    const decoded = decodeURIComponent(raw.trim());
    const keyToApply = canonicalizeKeyString(decoded) ?? decoded;
    setSearchParams(
      (p) => {
        const n = new URLSearchParams(p);
        n.delete('applyKey');
        return n;
      },
      { replace: true }
    );
    setFilterState((prev) => {
      const next = { ...prev, key: [keyToApply] };
      const criteria = filterStateToMatchCriteria(next);
      void MatchingService.findMatches(songs, criteria).then((matches) => {
        setFilteredSongs(matches);
        setActiveFilters(criteria);
      });
      return next;
    });
  }, [searchParams, songs, setSearchParams]);

  // Handle URL search parameter (?search=... or ?q=...)
  useEffect(() => {
    const rawSearch = searchParams.get('search') || searchParams.get('q');
    if (!rawSearch?.trim() || songs.length === 0) return;
    const query = decodeURIComponent(rawSearch.trim());

    const results = search(query);
    const songResults = results.map((result) => ({
      ...result.item,
      score: result.score,
      matches: result.matches,
    }));
    setSearchResults(songResults);
    setIsSearching(true);
    setSearchText(query);
    setSearchPending(false);

    requestAnimationFrame(() => {
      const el = document.querySelector('[data-hero-scroll-target="search"]') || document.querySelector('[data-hero-scroll-target="songs"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [searchParams, songs]);

  const handleHeaderSearchSubmit = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      handleClearSearch();
      setSearchParams((p) => {
        const n = new URLSearchParams(p);
        n.delete('search');
        n.delete('q');
        return n;
      }, { replace: true });
      return;
    }

    const results = search(trimmed);
    const songResults = results.map((result) => ({
      ...result.item,
      score: result.score,
      matches: result.matches,
    }));
    setSearchResults(songResults);
    setIsSearching(true);
    setSearchText(trimmed);
    setSearchPending(false);

    setSearchParams((p) => {
      const n = new URLSearchParams(p);
      n.set('search', trimmed);
      return n;
    }, { replace: true });

    requestAnimationFrame(() => {
      const el = document.querySelector('[data-hero-scroll-target="search"]') || document.querySelector('[data-hero-scroll-target="songs"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [handleClearSearch, setSearchParams]);

  const isAppInitializing = initStage !== 'ready' && !loadingTimeout;
  if (isAppInitializing && !hasAnimatedEntranceRef.current) {
    let loadingLabel = 'Preparing music library...';
    if (initStage === 'auth') {
      loadingLabel = 'Syncing session and audio cloud...';
    } else if (initStage === 'songs') {
      loadingLabel = 'Preparing music library...';
    } else if (initStage === 'utilities') {
      loadingLabel = 'Initializing utilities and audio workspace...';
    }
    return <LoadingScreen label={loadingLabel} />;
  }

  if (loadingTimeout) {
    return (
      <div className="min-h-screen bg-theme-background-primary flex items-center justify-center px-4">
        <div className="text-center animate-fade-in-up max-w-md w-full">
          <div className="bg-theme-surface-elevated rounded-2xl p-8 border border-theme-border-default shadow-[var(--theme-shadow-modal)]">
            <div className="w-16 h-16 bg-theme-accent-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-theme-state-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-3">Loading Large Dataset</h2>
            <div className="mb-5 flex justify-center">
              <EqualizerLoader />
            </div>
            <p className="text-theme-text-secondary mb-6">The application is loading a large dataset (20,000+ songs). This may take up to a minute. Please wait or try reloading if this persists.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-theme-accent-primary hover:bg-theme-accent-hover text-theme-text-inverse font-bold py-2 px-4 rounded w-full transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && songs.length === 0) {
    return (
      <div className="min-h-screen bg-theme-background-primary flex items-center justify-center">
        <div className="text-center animate-fade-in-up max-w-md mx-4">
          <div className="bg-theme-surface-elevated rounded-2xl p-8 border border-theme-border-default shadow-[var(--theme-shadow-modal)]">
            <div className="w-16 h-16 bg-theme-accent-soft rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-theme-state-danger" />
            </div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-2">Oops! Something went wrong</h2>
            <p className="text-theme-text-secondary mb-6">Error loading songs: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DragDropProvider songs={songs}>
      {/* GSAP Transition Overlay from Loader to Main Page */}
      {isLoaderOverlayMounted && (
        <div
          ref={loaderOverlayRef}
          className="fixed inset-0 z-50 pointer-events-none bg-theme-background-primary flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          <LoadingScreen label="Initializing utilities and audio workspace..." />
        </div>
      )}

      <div className="min-h-screen bg-theme-background-primary text-theme-text-primary relative overflow-x-clip transition-all duration-300">
        {/* Atmospheric soundstage ambient gradient glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] overflow-hidden -z-0 opacity-40 dark:opacity-20 select-none" aria-hidden="true">
          <div className="absolute -top-32 left-1/4 h-[28rem] w-[28rem] rounded-full bg-sky-400/20 blur-3xl" />
          <div className="absolute -top-20 right-1/4 h-[32rem] w-[32rem] rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute top-72 left-1/3 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl" />
        </div>
        <AppHeader
          onAddTrack={handleOpenAddSong}
          onSearchSubmit={handleHeaderSearchSubmit}
          initialSearchQuery={searchText}
          mobileActions={
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2.5 text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          }
        />

        <main ref={mainContentRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Hero Section */}
          <div data-hero-scroll-target="hero">
            <HeroSection 
              songsCount={songs.length} 
              projectsCount={projects.length}
              songs={songs}
              onStartMatching={() => setShowFilterPanel(true)}
              onSelectSong={handleSongClick}
              onSelectKey={handleKeyFilterFromHero}
            />
          </div>

          {/* Search Section */}
          <div className="space-y-6" data-hero-scroll-target="search">
            {/* Advanced Search Bar */}
            <div className="animate-fade-in-up">
              <AdvancedSearchBar
                songs={songs}
                onSearch={handleSearchResults}
                onClear={handleClearSearch}
                placeholder="Search songs, artists, and albums..."
                onQueryChange={setSearchText}
                initialQuery={searchText}
              />
            </div>

            {/* Inline Filters */}
            <div className="animate-fade-in-up">
              <InlineFilters
                filterState={filterState}
              onFilterChange={handleInlineFilterStateChange}
                onAdvancedFiltersClick={() => setShowFilterPanel(true)}
                onApplyFilters={handleApplyFilters}
              />
            </div>

            {/* Active Filters Display */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="animate-slide-down">
                <div className="p-4 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-sky-50/40 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-slate-900/90 border border-indigo-200/70 dark:border-indigo-900/50 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center">
                      <Filter size={14} className="mr-2 text-indigo-600 dark:text-indigo-400" />
                      Active Filters
                    </h3>
                    <button
                      onClick={handleClearFilters}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 text-xs font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.targetBpm && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300/70 dark:border-sky-800 shadow-2xs">
                        BPM: {activeFilters.targetBpm} ±{activeFilters.bpmTolerance}
                      </span>
                    )}
                    {activeFilters.bpmRange && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300/70 dark:border-sky-800 shadow-2xs">
                        BPM: {activeFilters.bpmRange[0]}–{activeFilters.bpmRange[1]}
                      </span>
                    )}
                    {activeFilters.selectedKeys && activeFilters.selectedKeys.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800 shadow-2xs">
                        Key: {activeFilters.selectedKeys.length === 1 
                          ? activeFilters.selectedKeys[0] 
                          : `${activeFilters.selectedKeys.length} keys`}
                      </span>
                    )}
                    {activeFilters.targetKey && !activeFilters.selectedKeys && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800 shadow-2xs">
                        Key: {activeFilters.targetKey} ±{activeFilters.keyTolerance}
                      </span>
                    )}
                    {activeFilters.type && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/70 dark:border-rose-800 shadow-2xs">
                        Type: {activeFilters.type}
                      </span>
                    )}
                    {activeFilters.origin && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300/70 dark:border-purple-800 shadow-2xs">
                        Origin: {activeFilters.origin}
                      </span>
                    )}
                    {activeFilters.season && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300/70 dark:border-purple-800 shadow-2xs">
                        Season: {activeFilters.season}
                      </span>
                    )}
                    {activeFilters.artist && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300/70 dark:border-indigo-800 shadow-2xs">
                        Artist: {activeFilters.artist}
                      </span>
                    )}
                    {activeFilters.yearRange && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800 shadow-2xs">
                        Year: {activeFilters.yearRange[0]}–{activeFilters.yearRange[1]}
                      </span>
                    )}
                    {activeFilters.searchText && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                        Search: {activeFilters.searchText}
                      </span>
                    )}
                    {activeFilters.partSpecificKey && activeFilters.partSpecificKey.section && activeFilters.partSpecificKey.key && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300/70 dark:border-teal-800 shadow-2xs">
                        {activeFilters.partSpecificKey.section}: {activeFilters.partSpecificKey.key}
                      </span>
                    )}
                    {activeFilters.partSpecificFilters && activeFilters.partSpecificFilters.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-300/70 dark:border-cyan-800 shadow-2xs">
                        Part Filters: {activeFilters.partSpecificFilters.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Search Results or Song List */}
          {isSearching && searchResults.length > 0 ? (
            <div className="animate-fade-in-up">
              <SearchResults
                results={searchResults}
                onEditSong={handleEditSong}
                onDeleteSong={handleDeleteSong}
                onAddToProject={handleAddToProject}
                onSongClick={handleSongClick}
              />
            </div>
          ) : (
            <div className="space-y-6" data-hero-scroll-target="songs">
              {/* Song List */}
              <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                {songsLoading ? <SkeletonSongList rows={8} /> : <SongList 
                  songs={filteredSongs} 
                  onEditSong={handleEditSong}
                  onDeleteSong={handleDeleteSong}
                  onAddToProject={handleAddToProject}
                  onSongClick={handleSongClick}
                />}
              </div>
            </div>
          )}
          {searchPending && (
            <div className="fixed bottom-6 right-6 z-40 bg-theme-surface-elevated border border-theme-border-default rounded-2xl px-3 py-2 shadow-lg">
              <EqualizerLoader bars={5} height={18} barWidth={3} compact />
            </div>
          )}
        </main>

        {/* Modals - Directly mounted when active with zero separate loading popups */}
        {showSongModal && (
          <SongModal
            isOpen={showSongModal}
            onClose={handleCloseSongModal}
            onSave={handleAddSong}
            onUpdate={handleUpdateSong}
            song={editingSong}
            title={editingSong ? "Edit Song" : "Add New Song"}
            onSaved={refreshSongs}
          />
        )}

        {showFilterPanel && (
          <AdvancedFiltersDialog
            isOpen={showFilterPanel}
            onClose={() => setShowFilterPanel(false)}
            songs={songs}
            filterState={filterState}
            onFilterStateChange={handleAdvancedFilterStateChange}
            onApplyFilters={handleAdvancedApplyFilters}
            onSongClick={handleSongClick}
          />
        )}

        {showImportExport && (
          <ImportExportModal
            isOpen={showImportExport}
            onClose={() => setShowImportExport(false)}
            onImport={handleImportSongs}
            songs={songs}
          />
        )}

        {showEnhancedExport && (
          <EnhancedExportModal
            isOpen={showEnhancedExport}
            onClose={() => setShowEnhancedExport(false)}
            songs={songs}
            projects={projectsWithSections}
          />
        )}

        {showAddToProjectModal && (
          <AddToProjectModal
            isOpen={showAddToProjectModal}
            onClose={() => setShowAddToProjectModal(false)}
            song={selectedSongForProject}
            projects={projectsWithSections}
            onCreateProject={handleCreateProject}
            onAddSongToSection={handleAddSongToSection}
          />
        )}

        {showSongDetailsModal && (
          <SongDetailsModal
            isOpen={showSongDetailsModal}
            onClose={() => setShowSongDetailsModal(false)}
            song={selectedSongForDetails}
            onEditSong={handleEditSong}
            onAddToProject={handleAddToProject}
            onDeleteSong={handleDeleteSong}
          />
        )}

        {showUtilityDialog && (
          <UtilityDialog
            isOpen={showUtilityDialog}
            onClose={() => setShowUtilityDialog(false)}
            songsCount={songs.length}
            projectsCount={projects.length}
            onImport={() => setShowImportExport(true)}
            onExport={() => setShowEnhancedExport(true)}
            onReloadCsv={forceReloadFromCsv}
          />
        )}

        {/* Mobile Menu Drawer */}
        <MobileMenuDrawer
          open={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          onProjectsClick={() => navigate('/projects')}
          onAnalysisClick={() => navigate('/analysis')}
          onAddSongClick={handleOpenAddSong}
          onUtilitiesClick={() => setShowUtilityDialog(true)}
          onFiltersClick={() => setShowFilterPanel(true)}
        />

        {/* Footer */}
        <Footer onPrivacyClick={() => setShowPrivacyModal(true)} onTermsClick={() => setShowTermsModal(true)} />

        <LegalModal
          isOpen={showPrivacyModal}
          title="Privacy Policy"
          content={PRIVACY_POLICY_CONTENT}
          onClose={() => setShowPrivacyModal(false)}
        />
        <LegalModal
          isOpen={showTermsModal}
          title="Terms of Service"
          content={TERMS_OF_SERVICE_CONTENT}
          onClose={() => setShowTermsModal(false)}
        />

        <ConnectionStatusDialog />
      </div>
    </DragDropProvider>
  );
}

export default App;