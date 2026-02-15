import { useState, useEffect } from 'react';
import { Search, Filter, X, Music, Target, Plus } from 'lucide-react';
import { MatchingService, type MatchCriteria } from '../services/matchingService';
import type { FilterState, PartHarmonicFilterBlock } from '../types';
import { filterStateToMatchCriteria, isFilterBlockComplete } from '../utils/filterState';
import { PartHarmonicFilterBlock as PartHarmonicFilterBlockComponent } from './PartHarmonicFilterBlock';
import { sectionService } from '../services/database';

interface AdvancedFiltersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: MatchCriteria) => void;
  songs: any[];
  filterState: FilterState;
  onFilterStateChange: (state: FilterState) => void;
}

export function AdvancedFiltersDialog({
  isOpen,
  onClose,
  onApplyFilters,
  songs,
  filterState,
  onFilterStateChange
}: AdvancedFiltersDialogProps) {
  const [availableParts, setAvailableParts] = useState<string[]>([]);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<number>>(new Set());
  const [quickMatchSong, setQuickMatchSong] = useState<any>(null);
  const [quickMatches, setQuickMatches] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Load unique PART values
      sectionService.getUniqueParts().then(parts => {
        setAvailableParts(parts);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickMatch = async () => {
    if (quickMatchSong) {
      const matches = await MatchingService.getQuickMatches(songs, quickMatchSong);
      setQuickMatches(matches.slice(0, 5));
    }
  };

  const handleApplyFilters = () => {
    // Validate all filter blocks
    const validBlocks = (filterState.advanced.partSpecific || []).filter(isFilterBlockComplete);
    const updatedState = {
      ...filterState,
      advanced: {
        ...filterState.advanced,
        partSpecific: validBlocks
      }
    };
    onFilterStateChange(updatedState);
    const criteria = filterStateToMatchCriteria(updatedState);
    onApplyFilters(criteria);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedState = {
      ...filterState,
      advanced: {
        type: '',
        origin: '',
        season: '',
        artist: '',
        text: '',
        partSpecific: [],
        partSpecificKey: null
      }
    };
    onFilterStateChange(clearedState);
    setQuickMatchSong(null);
    setQuickMatches([]);
  };

  const handleAddPartFilter = () => {
    const newBlock: PartHarmonicFilterBlock = { part: undefined, bpm: { mode: null }, key: [] };
    const updated = {
      ...filterState,
      advanced: {
        ...filterState.advanced,
        partSpecific: [...(filterState.advanced.partSpecific || []), newBlock]
      }
    };
    onFilterStateChange(updated);
  };

  const handleUpdatePartFilter = (index: number, block: PartHarmonicFilterBlock) => {
    const updated = {
      ...filterState,
      advanced: {
        ...filterState.advanced,
        partSpecific: (filterState.advanced.partSpecific || []).map((b, i) => i === index ? block : b)
      }
    };
    onFilterStateChange(updated);
  };

  const handleDeletePartFilter = (index: number) => {
    const updated = {
      ...filterState,
      advanced: {
        ...filterState.advanced,
        partSpecific: (filterState.advanced.partSpecific || []).filter((_, i) => i !== index)
      }
    };
    onFilterStateChange(updated);
    // Remove from collapsed set if present
    const newCollapsed = new Set(collapsedBlocks);
    newCollapsed.delete(index);
    setCollapsedBlocks(newCollapsed);
  };

  const toggleBlockCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedBlocks);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedBlocks(newCollapsed);
  };

  const partFilters = filterState.advanced.partSpecific || [];
  const shouldCollapse = partFilters.length > 3;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Advanced Filters & Matching</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Match Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Target size={20} className="mr-2" />
              Quick Match
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select a song to find matches
                </label>
                <select
                  value={quickMatchSong?.id || ''}
                  onChange={(e) => {
                    const song = songs.find(s => s.id === e.target.value);
                    setQuickMatchSong(song);
                    setQuickMatches([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                >
                  <option value="">Choose a song...</option>
                  {songs.map(song => (
                    <option key={song.id} value={song.id}>
                      {song.title} - {song.artist} ({song.primaryBpm || song.bpms?.[0] || 'N/A'} BPM, {song.primaryKey || song.keys?.[0] || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              
              {quickMatchSong && (
                <div className="bg-white dark:bg-gray-700 p-3 rounded border dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Selected Song:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {quickMatchSong.title} - {quickMatchSong.artist}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    BPM: {quickMatchSong.bpms?.join(', ') || 'N/A'} | Key: {quickMatchSong.keys?.join(', ') || 'N/A'}
                  </p>
                </div>
              )}
              
              <button
                onClick={handleQuickMatch}
                disabled={!quickMatchSong}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Music size={16} />
                <span>Find Matches</span>
              </button>
              
              {quickMatches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Top Matches:</h4>
                  {quickMatches.map((match) => (
                    <div key={match.id} className="bg-white dark:bg-gray-700 p-3 rounded border dark:border-gray-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{match.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{match.artist}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            BPM: {match.bpms?.join(', ') || 'N/A'} | Key: {match.keys?.join(', ') || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {Math.round(match.matchScore * 100)}% match
                          </span>
                        </div>
                      </div>
                      <div className="mt-2">
                        {match.reasons?.map((reason: string, i: number) => (
                          <span key={i} className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded mr-1 mb-1">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Filter size={20} className="mr-2" />
              Advanced Filters
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Text Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Text
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={filterState.advanced.text || ''}
                    onChange={(e) => onFilterStateChange({
                      ...filterState,
                      advanced: { ...filterState.advanced, text: e.target.value }
                    })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                    placeholder="Search by title, artist, or type..."
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={filterState.advanced.type || ''}
                  onChange={(e) => onFilterStateChange({
                    ...filterState,
                    advanced: { ...filterState.advanced, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                >
                  <option value="">All Types</option>
                  <option value="Anime">Anime</option>
                  <option value="Game">Game</option>
                  <option value="J-Pop">J-Pop</option>
                  <option value="K-Pop">K-Pop</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Rock">Rock</option>
                  <option value="Pop">Pop</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Origin
                </label>
                <input
                  type="text"
                  value={filterState.advanced.origin || ''}
                  onChange={(e) => onFilterStateChange({
                    ...filterState,
                    advanced: { ...filterState.advanced, origin: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                  placeholder="Filter by origin..."
                />
              </div>

              {/* Season */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Season
                </label>
                <input
                  type="text"
                  value={filterState.advanced.season || ''}
                  onChange={(e) => onFilterStateChange({
                    ...filterState,
                    advanced: { ...filterState.advanced, season: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                  placeholder="Filter by season..."
                />
              </div>

              {/* Artist */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Artist
                </label>
                <input
                  type="text"
                  value={filterState.advanced.artist || ''}
                  onChange={(e) => onFilterStateChange({
                    ...filterState,
                    advanced: { ...filterState.advanced, artist: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                  placeholder="Filter by artist..."
                />
              </div>
            </div>
          </div>

          {/* Part-Specific Key Filter */}
          <div className="border-t dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Part-Specific Key Filter
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* Section Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Section
                </label>
                <select
                  value={filterState.advanced.partSpecificKey?.section || ''}
                  onChange={(e) => onFilterStateChange({
                    ...filterState,
                    advanced: {
                      ...filterState.advanced,
                      partSpecificKey: e.target.value
                        ? {
                            section: e.target.value,
                            key: filterState.advanced.partSpecificKey?.key || ''
                          }
                        : null
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300"
                >
                  <option value="">Select Section</option>
                  <option value="Intro">Intro</option>
                  <option value="Intro 1">Intro 1</option>
                  <option value="Intro 2">Intro 2</option>
                  <option value="Intro Drop">Intro Drop</option>
                  <option value="Intro Drop 1">Intro Drop 1</option>
                  <option value="Intro Drop 2">Intro Drop 2</option>
                  <option value="Verse">Verse</option>
                  <option value="Verse A">Verse A</option>
                  <option value="Verse B">Verse B</option>
                  <option value="Verse C">Verse C</option>
                  <option value="Verse 2">Verse 2</option>
                  <option value="Prechorus">Prechorus</option>
                  <option value="Prechorus A">Prechorus A</option>
                  <option value="Prechorus B">Prechorus B</option>
                  <option value="Prechorus C">Prechorus C</option>
                  <option value="Chorus">Chorus</option>
                  <option value="Chorus A">Chorus A</option>
                  <option value="Chorus B">Chorus B</option>
                  <option value="Chorus 2">Chorus 2</option>
                  <option value="Postchorus">Postchorus</option>
                  <option value="Bridge">Bridge</option>
                  <option value="Last Chorus">Last Chorus</option>
                  <option value="Last Postchorus">Last Postchorus</option>
                </select>
              </div>

              {/* Key Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key
                </label>
                <select
                  value={filterState.advanced.partSpecificKey?.key || ''}
                  onChange={(e) => onFilterStateChange({
                    ...filterState,
                    advanced: {
                      ...filterState.advanced,
                      partSpecificKey: filterState.advanced.partSpecificKey?.section && e.target.value
                        ? {
                            section: filterState.advanced.partSpecificKey.section,
                            key: e.target.value
                          }
                        : filterState.advanced.partSpecificKey?.section
                        ? {
                            section: filterState.advanced.partSpecificKey.section,
                            key: ''
                          }
                        : null
                    }
                  })}
                  disabled={!filterState.advanced.partSpecificKey?.section}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Key</option>
                  <option value="C Major">C Major</option>
                  <option value="C# Major">C# Major</option>
                  <option value="D Major">D Major</option>
                  <option value="D# Major">D# Major</option>
                  <option value="E Major">E Major</option>
                  <option value="F Major">F Major</option>
                  <option value="F# Major">F# Major</option>
                  <option value="G Major">G Major</option>
                  <option value="G# Major">G# Major</option>
                  <option value="A Major">A Major</option>
                  <option value="A# Major">A# Major</option>
                  <option value="B Major">B Major</option>
                </select>
              </div>

              {/* Clear Button */}
              <div>
                <button
                  type="button"
                  onClick={() => onFilterStateChange({
                    ...filterState,
                    advanced: {
                      ...filterState.advanced,
                      partSpecificKey: null
                    }
                  })}
                  disabled={!filterState.advanced.partSpecificKey}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* PART-Specific Harmonic Filtering */}
          <div className="border-t dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Filter by Harmonic at Specific PART
              </h3>
              <button
                type="button"
                onClick={handleAddPartFilter}
                className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 border border-primary-300 dark:border-primary-700 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                <Plus size={16} className="mr-2" />
                Add Part Filter
              </button>
            </div>

            {partFilters.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                No PART-specific filters added. Click "Add Part Filter" to filter songs by harmonic properties at specific sections.
              </p>
            ) : (
              <div className="space-y-4">
                {partFilters.map((block, index) => (
                  <PartHarmonicFilterBlockComponent
                    key={index}
                    block={block}
                    index={index}
                    availableParts={availableParts}
                    onChange={(updated) => handleUpdatePartFilter(index, updated)}
                    onDelete={() => handleDeletePartFilter(index)}
                    isCollapsed={shouldCollapse && index >= 3 && collapsedBlocks.has(index)}
                    onToggleCollapse={shouldCollapse && index >= 3 ? () => toggleBlockCollapse(index) : undefined}
                  />
                ))}
              </div>
            )}

            {/* Summary Preview */}
            {partFilters.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded border dark:border-gray-600">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Active PART Filters:</h4>
                <div className="space-y-1">
                  {partFilters.map((block, index) => {
                    if (!isFilterBlockComplete(block)) return null;
                    const bpmText = block.bpm?.mode === "target" 
                      ? `${block.bpm.target} ±${block.bpm.tolerance}`
                      : block.bpm?.mode === "range"
                      ? `${block.bpm.min}-${block.bpm.max}`
                      : '';
                    const keyText = Array.isArray(block.key) && block.key.length > 0
                      ? block.key.length === 1
                        ? block.key[0]
                        : `${block.key.length} keys`
                      : '';
                    return (
                      <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{block.part}</span>
                        {bpmText && <span className="ml-2">BPM: {bpmText}</span>}
                        {keyText && <span className="ml-2">Key: {keyText}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={handleClearFilters}
            className="btn-secondary"
          >
            Clear All
          </button>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="btn-primary"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
