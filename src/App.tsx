// HOOK SAFETY: All hooks must remain at top-level and unconditionally executed.
// Do not add hooks inside conditions or loops.

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SongList } from './components/SongList';
// Lazy load heavy modal components for better performance
const SongModal = lazy(() => import('./components/SongModal').then(m => ({ default: m.SongModal })));
const AdvancedFiltersDialog = lazy(() => import('./components/AdvancedFiltersDialog').then(m => ({ default: m.AdvancedFiltersDialog })));
const ImportExportModal = lazy(() => import('./components/ImportExportModal').then(m => ({ default: m.ImportExportModal })));
const EnhancedExportModal = lazy(() => import('./components/EnhancedExportModal').then(m => ({ default: m.EnhancedExportModal })));
const UtilityDialog = lazy(() => import('./components/UtilityDialog').then(m => ({ default: m.UtilityDialog })));
const VocalPhraseIndex = lazy(() => import('./components/VocalPhraseIndex').then(m => ({ default: m.VocalPhraseIndex })));
import { useSongs } from './hooks/useSongs';
import { useProjects } from './hooks/useProjects';
import type { ProjectType, ProjectWithSections, Song } from './types';
import { Plus, Filter, Folder, AlertCircle, X, Menu, MoreVertical, Info } from 'lucide-react';
import { MatchingService, type MatchCriteria } from './services/matchingService';
import type { FilterState } from './types';
import { filterStateToMatchCriteria, createDefaultFilterState } from './utils/filterState';
import type { FuseResult } from 'fuse.js';
import { InlineFilters } from './components/InlineFilters';
import { projectService } from './services/projectService';
import { DragDropProvider } from './contexts/DragDropContext';
import { AdvancedSearchBar } from './components/AdvancedSearchBar';
import { SearchResults } from './components/SearchResults';
const AddToProjectModal = lazy(() => import('./components/AddToProjectModal').then(m => ({ default: m.AddToProjectModal })));
const SongDetailsModal = lazy(() => import('./components/SongDetailsModal').then(m => ({ default: m.SongDetailsModal })));
import { HeroSection } from './components/HeroSection';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { PRIVACY_POLICY_CONTENT, TERMS_OF_SERVICE_CONTENT } from './content/legalContent';
import { LoadingScreen } from './components/loading/LoadingScreen';
import { SkeletonSongList } from './components/loading/SkeletonSongList';
import { PrimaryLoader } from './components/loading/PrimaryLoader';
import { EqualizerLoader } from './components/loading/EqualizerLoader';
import { ModalLoader } from './components/loading/ModalLoader';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import { ConnectionStatusDialog } from './components/ConnectionStatusDialog';
import { AppHeader } from './components/layout/AppHeader';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const navigate = useNavigate();
  useTheme(); // Apply theme (default dark) at root so document.documentElement has .dark immediately
  const { songs, songPage, loading, error, addSong, addMultipleSongs, updateSong, deleteSong, searchSongs, loadSongPage, forceReloadFromCsv, refresh: refreshSongs } = useSongs();
  const { projects, addProject } = useProjects();
  
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
  const [showVocalPhraseIndex, setShowVocalPhraseIndex] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryPageSize] = useState(25);
  const [searchPending, setSearchPending] = useState(false);
  // Track pending edit to prevent hook order issues when switching between lazy-loaded modals
  const pendingEditSongRef = React.useRef<Song | null>(null);

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

  // Handle search results
  const handleSearchResults = (results: Array<FuseResult<Song>>) => {
    // Convert Fuse results to Song objects for display
    const songResults = results.map((result) => ({
      ...result.item,
      score: result.score,
      matches: result.matches
    }));
    setSearchResults(songResults);
    setIsSearching(true);
    setSearchPending(false);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
    setFilteredSongs(songs);
    setSearchPending(false);
  };

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
      return newSong;
    } catch (error) {
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
      return song;
    } catch (error) {
      console.error('Failed to update song:', error);
      throw error;
    }
  };

  // Handle deleting a song
  const handleDeleteSong = async (songId: string) => {
    try {
      await deleteSong(songId);
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to import songs:', error);
      throw error; // Re-throw to show error in modal
    }
  };

  const handleCreateProject = async (name: string, type?: ProjectType) => {
    try {
      await addProject({ name: name.trim(), type: type ?? 'other' });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Handle adding song to a section (sectionId required)
  const handleAddSongToSection = async (projectId: string, songId: string, sectionId: string) => {
    try {
      await projectService.addSongToSection(projectId, songId, sectionId);
      await refreshProjectsWithSections();
    } catch (error) {
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

  // Get projects with sections (includes entries for notes)
  const [projectsWithSections, setProjectsWithSections] = useState<ProjectWithSections[]>([]);
  const latestProjectsLoadRequestRef = React.useRef(0);

  // Add loading timeout - use constant from constants/index.ts
  React.useEffect(() => {
    // Import LOADING_TIMEOUT_MS constant for consistency
    const LOADING_TIMEOUT_MS = 60_000; // 60 seconds to accommodate large datasets (20k+ rows)
    
    const timeout = setTimeout(() => {
      if (loading) {
        setLoadingTimeout(true);
      }
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [loading]);

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

  if (loading && !loadingTimeout) {
    return <LoadingScreen label="Preparing music library" />;
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

  if (error) {
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
      <div className="min-h-screen bg-theme-background-primary transition-all duration-300">
        <AppHeader
          actions={
            <>
              <button
                onClick={() => setShowUtilityDialog(true)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2.5 text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary"
                title="Utilities"
                aria-label="Open utilities menu"
              >
                <MoreVertical size={20} />
              </button>
              <Link
                to="/projects"
                className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary"
                title="Manage Projects"
              >
                <Folder size={16} className="mr-1 inline" />
                Projects
              </Link>
              <Link
                to="/about"
                className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm text-theme-text-secondary transition-colors hover:bg-theme-state-hover hover:text-theme-text-primary"
                title="About MashHub"
              >
                <Info size={16} className="mr-1 inline" />
                About
              </Link>
              <button
                onClick={handleOpenAddSong}
                className="min-h-[44px] rounded-lg bg-theme-accent-primary px-4 py-2.5 text-sm font-medium text-theme-text-inverse transition-colors hover:bg-theme-accent-hover"
                title="Add New Song"
              >
                <Plus size={16} className="mr-1 inline" />
                Add Song
              </button>
            </>
          }
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Hero Section */}
          <div data-hero-scroll-target="hero">
            <HeroSection 
              songsCount={songs.length} 
              projectsCount={projects.length}
              songs={songs}
              onStartMatching={() => setShowFilterPanel(true)}
            />
          </div>

          {/* Search Section */}
          <div className="space-y-6" data-hero-scroll-target="search">
            {/* Advanced Search Bar */}
            <div className="animate-fade-in-up">
              <AdvancedSearchBar
                songs={songs}
                onSearch={(results) => {
                  setSearchPending(true);
                  handleSearchResults(results);
                }}
                onClear={handleClearSearch}
                placeholder="Search songs, artists, and albums..."
                onQueryChange={setSearchText}
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
                <div className="card p-4 bg-gradient-to-r from-primary-50 to-accent-purple-50 dark:from-primary-900/20 dark:to-accent-purple-900/20 border-primary-200 dark:border-primary-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 flex items-center">
                      <Filter size={16} className="mr-2" />
                      Active Filters
                    </h3>
                    <button
                      onClick={handleClearFilters}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 text-xs font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.targetBpm && (
                      <span className="filter-tag">
                        BPM: {activeFilters.targetBpm} ±{activeFilters.bpmTolerance}
                      </span>
                    )}
                    {activeFilters.bpmRange && (
                      <span className="filter-tag">
                        BPM Range: {activeFilters.bpmRange[0]}-{activeFilters.bpmRange[1]}
                      </span>
                    )}
                    {activeFilters.selectedKeys && activeFilters.selectedKeys.length > 0 && (
                      <span className="filter-tag">
                        Key: {activeFilters.selectedKeys.length === 1 
                          ? activeFilters.selectedKeys[0] 
                          : `${activeFilters.selectedKeys.length} keys`}
                      </span>
                    )}
                    {activeFilters.targetKey && !activeFilters.selectedKeys && (
                      <span className="filter-tag">
                        Key: {activeFilters.targetKey} ±{activeFilters.keyTolerance}
                      </span>
                    )}
                    {activeFilters.type && (
                      <span className="filter-tag">
                        Type: {activeFilters.type}
                      </span>
                    )}
                    {activeFilters.origin && (
                      <span className="filter-tag">
                        Origin: {activeFilters.origin}
                      </span>
                    )}
                    {activeFilters.season && (
                      <span className="filter-tag">
                        Season: {activeFilters.season}
                      </span>
                    )}
                    {activeFilters.artist && (
                      <span className="filter-tag">
                        Artist: {activeFilters.artist}
                      </span>
                    )}
                    {activeFilters.yearRange && (
                      <span className="filter-tag">
                        Year: {activeFilters.yearRange[0]}-{activeFilters.yearRange[1]}
                      </span>
                    )}
                    {activeFilters.searchText && (
                      <span className="filter-tag">
                        Search: {activeFilters.searchText}
                      </span>
                    )}
                    {activeFilters.partSpecificKey && activeFilters.partSpecificKey.section && activeFilters.partSpecificKey.key && (
                      <span className="filter-tag">
                        {activeFilters.partSpecificKey.section}: {activeFilters.partSpecificKey.key}
                      </span>
                    )}
                    {activeFilters.partSpecificFilters && activeFilters.partSpecificFilters.length > 0 && (
                      <span className="filter-tag">
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
                {loading ? <SkeletonSongList rows={8} /> : <SongList 
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

        {/* Modals - Lazy loaded for performance */}
        {/* Separate Suspense boundaries to prevent hook order issues when switching modals */}
        <Suspense fallback={<ModalLoader label="Loading song editor" />}>
          <SongModal
            isOpen={showSongModal}
            onClose={handleCloseSongModal}
            onSave={handleAddSong}
            onUpdate={handleUpdateSong}
            song={editingSong}
            title={editingSong ? "Edit Song" : "Add New Song"}
            onSaved={refreshSongs}
          />
        </Suspense>

        {/* Separate Suspense boundaries for each lazy-loaded modal to prevent hook order violations */}
        <Suspense fallback={<ModalLoader label="Loading filters" />}>
          <AdvancedFiltersDialog
            isOpen={showFilterPanel}
            onClose={() => setShowFilterPanel(false)}
            songs={songs}
            filterState={filterState}
            onFilterStateChange={handleAdvancedFilterStateChange}
            onApplyFilters={handleAdvancedApplyFilters}
            onSongClick={handleSongClick}
          />
        </Suspense>

        <Suspense fallback={<ModalLoader label="Loading import tools" />}>
          <ImportExportModal
            isOpen={showImportExport}
            onClose={() => setShowImportExport(false)}
            onImport={handleImportSongs}
            songs={songs}
          />
        </Suspense>

        <Suspense fallback={<ModalLoader label="Loading export tools" />}>
          <EnhancedExportModal
            isOpen={showEnhancedExport}
            onClose={() => setShowEnhancedExport(false)}
            songs={songs}
            projects={projectsWithSections}
          />
        </Suspense>

        <Suspense fallback={<ModalLoader label="Loading project dialog" />}>
          <AddToProjectModal
            isOpen={showAddToProjectModal}
            onClose={() => setShowAddToProjectModal(false)}
            song={selectedSongForProject}
            projects={projectsWithSections}
            onCreateProject={handleCreateProject}
            onAddSongToSection={handleAddSongToSection}
          />
        </Suspense>

        <Suspense fallback={<ModalLoader label="Loading song details" />}>
          <SongDetailsModal
            isOpen={showSongDetailsModal}
            onClose={() => setShowSongDetailsModal(false)}
            song={selectedSongForDetails}
            onEditSong={handleEditSong}
            onAddToProject={handleAddToProject}
            onDeleteSong={handleDeleteSong}
          />
        </Suspense>

        <Suspense fallback={<ModalLoader label="Loading utilities" />}>
          <UtilityDialog
            isOpen={showUtilityDialog}
            onClose={() => setShowUtilityDialog(false)}
            songsCount={songs.length}
            projectsCount={projects.length}
            onImport={() => setShowImportExport(true)}
            onExport={() => setShowEnhancedExport(true)}
            onReloadCsv={forceReloadFromCsv}
          />
        </Suspense>

        <Suspense fallback={<ModalLoader label="Loading phrase index" />}>
          <VocalPhraseIndex
            isOpen={showVocalPhraseIndex}
            onClose={() => setShowVocalPhraseIndex(false)}
            allSongs={songs}
          />
        </Suspense>

        {/* Mobile Menu Drawer */}
        <MobileMenuDrawer
          open={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          onProjectsClick={() => navigate('/projects')}
          onPhrasesClick={() => setShowVocalPhraseIndex(true)}
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