import React, { useState } from 'react';
import { SongList } from './components/SongList';
import { SongModal } from './components/SongModal';
import { FilterPanel } from './components/FilterPanel';
import { ImportExportModal } from './components/ImportExportModal';
import { EnhancedExportModal } from './components/EnhancedExportModal';
import { ThemeToggle } from './components/ThemeToggle';
import { useSongs } from './hooks/useSongs';
import { useProjects } from './hooks/useProjects';
import type { Song } from './types';
import { Plus, Filter, Folder, AlertCircle, Music, Upload, Download, X, Menu, Activity, Database } from 'lucide-react';
import { MatchingService, type MatchCriteria } from './services/matchingService';
import { projectService } from './services/database';
import { EnhancedProjectManager } from './components/EnhancedProjectManager';
import { DragDropProvider } from './contexts/DragDropContext';
import { AdvancedSearchBar } from './components/AdvancedSearchBar';
import { SearchResults } from './components/SearchResults';
import { AddToProjectModal } from './components/AddToProjectModal';
import { SongDetailsModal } from './components/SongDetailsModal';
import './App.css';

function App() {
  console.log('App component rendering...');
  const { songs, loading, error, addSong, addMultipleSongs, updateSong, deleteSong, searchSongs, forceReloadFromCsv } = useSongs();
  const { projects, addProject, deleteProject } = useProjects();
  
  console.log('App state:', { songs: songs.length, loading, error, projects: projects.length });
  
  const [showSongModal, setShowSongModal] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showEnhancedExport, setShowEnhancedExport] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [activeFilters, setActiveFilters] = useState<MatchCriteria>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [showAddToProjectModal, setShowAddToProjectModal] = useState(false);
  const [selectedSongForProject, setSelectedSongForProject] = useState<Song | null>(null);
  const [showSongDetailsModal, setShowSongDetailsModal] = useState(false);
  const [selectedSongForDetails, setSelectedSongForDetails] = useState<Song | null>(null);

  // Handle search - now handled directly in useEffect

  // Handle applying filters
  const handleApplyFilters = (filters: MatchCriteria) => {
    setActiveFilters(filters);
    const matches = MatchingService.findMatches(songs, filters);
    setFilteredSongs(matches);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters({});
    setFilteredSongs(songs);
    setSearchText('');
    setIsSearching(false);
    setSearchResults([]);
  };

  // Handle search results
  const handleSearchResults = (results: any[]) => {
    console.log('handleSearchResults called with:', results.length, 'results');
    // Convert Fuse results to Song objects for display
    const songResults = results.map(result => ({
      ...result.item,
      score: result.score,
      matches: result.matches
    }));
    console.log('Converted to song results:', songResults.length);
    setSearchResults(songResults);
    setIsSearching(true);
    console.log('Set isSearching to true');
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
    setFilteredSongs(songs);
  };

  // Handle adding a new song
  const handleAddSong = async (songData: Omit<Song, 'id'>) => {
    try {
      await addSong(songData);
      setShowSongModal(false);
    } catch (error) {
      console.error('Failed to add song:', error);
    }
  };

  // Handle updating a song
  const handleUpdateSong = async (song: Song) => {
    try {
      await updateSong(song);
      setShowSongModal(false);
      setEditingSong(null);
    } catch (error) {
      console.error('Failed to update song:', error);
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
    setEditingSong(song);
    setShowSongModal(true);
  };

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

  // Handle creating a new project
  const handleCreateProject = async (name: string) => {
    try {
      await addProject(name);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Handle adding song to project
  const handleAddSongToProject = async (projectId: string, songId: string, sectionName: string) => {
    try {
      await projectService.addSongToProject(projectId, songId, sectionName);
      // Refresh projects with sections to show the update
      await refreshProjectsWithSections();
    } catch (error) {
      console.error('Failed to add song to project:', error);
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

  // Handle removing song from project
  const handleRemoveSongFromProject = async (projectId: string, songId: string) => {
    try {
      await projectService.removeSongFromProject(projectId, songId);
      // Refresh projects with sections to show the update
      await refreshProjectsWithSections();
    } catch (error) {
      console.error('Failed to remove song from project:', error);
      throw error;
    }
  };

  // Handle reordering songs in project
  const handleReorderSongs = async (projectId: string, sectionName: string, songIds: string[]) => {
    try {
      await projectService.reorderSongsInSection(projectId, sectionName, songIds);
      // Refresh projects with sections to show the update
      await refreshProjectsWithSections();
    } catch (error) {
      console.error('Failed to reorder songs:', error);
      throw error;
    }
  };

  // Get projects with sections
  const [projectsWithSections, setProjectsWithSections] = useState<any[]>([]);

  // Add loading timeout
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, setting loadingTimeout to true');
        setLoadingTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Function to load projects with sections
  const loadProjectsWithSections = async () => {
    const projectsData = await Promise.all(
      projects.map(async (project) => {
        try {
          return await projectService.getProjectWithSections(project.id);
        } catch {
          return { ...project, sections: {} };
        }
      })
    );
    setProjectsWithSections(projectsData);
  };

  // Function to refresh projects with sections
  const refreshProjectsWithSections = async () => {
    if (projects.length > 0) {
      await loadProjectsWithSections();
    }
  };

  React.useEffect(() => {
    if (projects.length > 0) {
      loadProjectsWithSections();
    }
  }, [projects]);

  // Update filtered songs when songs change
  React.useEffect(() => {
    if (Object.keys(activeFilters).length > 0) {
      const matches = MatchingService.findMatches(songs, activeFilters);
      setFilteredSongs(matches);
    } else if (searchText.trim()) {
      // Call searchSongs directly instead of handleSearch to avoid dependency issues
      searchSongs(searchText).then(results => {
        setFilteredSongs(results);
      });
    } else {
      setFilteredSongs(songs);
    }
  }, [songs, searchText, activeFilters, searchSongs]);

  if (loading && !loadingTimeout) {
    console.log('App is in loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 mx-auto mb-6"></div>
            <div className="animate-pulse rounded-full h-16 w-16 border-4 border-primary-600 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading Mashup Manager</h2>
          <p className="text-gray-500 dark:text-gray-400">Preparing your music library...</p>
          <p className="text-sm text-gray-400 mt-2">Loading songs and projects...</p>
        </div>
      </div>
    );
  }

  if (loadingTimeout) {
    console.log('App loading timeout reached, showing fallback');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center animate-fade-in-up max-w-md mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-hard p-8">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Taking Too Long</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The application is taking longer than expected to load. This might be due to a large dataset or network issues.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center animate-fade-in-up max-w-md mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-hard p-8">
            <div className="w-16 h-16 bg-accent-red-100 dark:bg-accent-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-accent-red-600 dark:text-accent-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Error loading songs: {error}</p>
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

  console.log('App render: songs.length =', songs.length, 'loading =', loading, 'error =', error);
  console.log('App render: filteredSongs.length =', filteredSongs.length);
  console.log('App render: isSearching =', isSearching);
  
  return (
    <DragDropProvider songs={songs}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo and Title */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-music-electric to-music-cosmic rounded-lg flex items-center justify-center">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    MashFlow
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Music Library & Database
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                
                {/* Quick Stats - Simplified */}
                <div className="hidden md:flex items-center space-x-4 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <Database size={14} className="text-music-electric" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{songs.length}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">songs</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center space-x-1">
                    <Activity size={14} className="text-music-wave" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{projects.length}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">projects</span>
                  </div>
                </div>
                
                {/* Desktop Menu - Simplified */}
                <div className="hidden lg:flex items-center space-x-2">
                  <button
                    onClick={() => setShowImportExport(true)}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Import Songs"
                  >
                    <Upload size={16} className="inline mr-1" />
                    Import
                  </button>
                  <button
                    onClick={() => setShowEnhancedExport(true)}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Export Library"
                  >
                    <Download size={16} className="inline mr-1" />
                    Export
                  </button>
                  <button
                    onClick={forceReloadFromCsv}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Reload from anime.csv"
                  >
                    Reload CSV
                  </button>
                  <button
                    onClick={() => setShowProjectManager(true)}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Manage Projects"
                  >
                    <Folder size={16} className="inline mr-1" />
                    Projects
                  </button>
                  <button
                    onClick={handleOpenAddSong}
                    className="px-4 py-2 bg-music-electric text-white text-sm font-medium rounded-lg hover:bg-music-electric/90 transition-colors"
                    title="Add New Song"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Song
                  </button>
                </div>
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Menu size={20} />
                </button>
              </div>
            </div>
            
            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-2 mt-4">
                  <button
                    onClick={() => {
                      setShowImportExport(true);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Upload size={16} className="mr-2" />
                    Import
                  </button>
                  <button
                    onClick={() => {
                      setShowEnhancedExport(true);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Download size={16} className="mr-2" />
                    Export
                  </button>
                  <button
                    onClick={() => {
                      setShowProjectManager(true);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Folder size={16} className="mr-2" />
                    Projects
                  </button>
                  <button
                    onClick={() => {
                      setShowFilterPanel(true);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Filter size={16} className="mr-2" />
                    Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Search Section */}
          <div className="space-y-6">
            {/* Advanced Search Bar */}
            <div className="animate-fade-in-up">
              <AdvancedSearchBar
                songs={songs}
                onSearch={handleSearchResults}
                onClear={handleClearSearch}
                onToggleFilters={() => setShowFilterPanel(true)}
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
                    {activeFilters.targetKey && (
                      <span className="filter-tag">
                        Key: {activeFilters.targetKey} ±{activeFilters.keyTolerance}
                      </span>
                    )}
                    {activeFilters.vocalStatus && (
                      <span className="filter-tag">
                        Status: {activeFilters.vocalStatus}
                      </span>
                    )}
                    {activeFilters.type && (
                      <span className="filter-tag">
                        Type: {activeFilters.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Clear All Button */}
            {(Object.keys(activeFilters).length > 0 || searchText.trim() || isSearching) && (
              <div className="animate-slide-down">
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary"
                >
                  <X size={16} className="mr-2" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Search Results or Song List */}
          {isSearching ? (
            <div className="animate-fade-in-up">
              <SearchResults
                results={searchResults}
                onEditSong={handleEditSong}
                onDeleteSong={handleDeleteSong}
                onAddToProject={handleAddToProject}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Simple Stats Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Library Overview</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{songs.length} total songs</span>
                    <span>•</span>
                    <span>{projects.length} projects</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-music-beat">{songs.filter(s => s.vocalStatus === 'Vocal').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Vocal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-music-wave">{songs.filter(s => s.vocalStatus === 'Instrumental').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Instrumental</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-music-pulse">{songs.filter(s => s.vocalStatus === 'Both').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Both</div>
                  </div>
                </div>
              </div>

              {/* Song List */}
              <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <SongList 
                  songs={filteredSongs} 
                  onEditSong={handleEditSong}
                  onDeleteSong={handleDeleteSong}
                  onAddToProject={handleAddToProject}
                  onSongClick={handleSongClick}
                />
              </div>
            </div>
          )}
        </main>

        {/* Modals */}
        <SongModal
          isOpen={showSongModal}
          onClose={handleCloseSongModal}
          onSave={handleAddSong}
          onUpdate={handleUpdateSong}
          song={editingSong}
          title={editingSong ? "Edit Song" : "Add New Song"}
        />

        <FilterPanel
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          onApplyFilters={handleApplyFilters}
          songs={songs}
        />

        <EnhancedProjectManager
          isOpen={showProjectManager}
          onClose={() => setShowProjectManager(false)}
          projects={projectsWithSections}
          allSongs={songs}
          onCreateProject={handleCreateProject}
          onDeleteProject={deleteProject}
          onAddSongToProject={handleAddSongToProject}
          onRemoveSongFromProject={handleRemoveSongFromProject}
          onReorderSongs={handleReorderSongs}
          onEditSong={handleEditSong}
          onRefresh={refreshProjectsWithSections}
        />

        <ImportExportModal
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          onImport={handleImportSongs}
          songs={songs}
        />

        <EnhancedExportModal
          isOpen={showEnhancedExport}
          onClose={() => setShowEnhancedExport(false)}
          songs={songs}
          projects={projectsWithSections}
        />

        <AddToProjectModal
          isOpen={showAddToProjectModal}
          onClose={() => setShowAddToProjectModal(false)}
          song={selectedSongForProject}
          projects={projectsWithSections}
          onCreateProject={handleCreateProject}
          onAddSongToProject={handleAddSongToProject}
        />

        <SongDetailsModal
          isOpen={showSongDetailsModal}
          onClose={() => setShowSongDetailsModal(false)}
          song={selectedSongForDetails}
          onEditSong={handleEditSong}
          onAddToProject={handleAddToProject}
          onDeleteSong={handleDeleteSong}
        />
      </div>
    </DragDropProvider>
  );
}

export default App;