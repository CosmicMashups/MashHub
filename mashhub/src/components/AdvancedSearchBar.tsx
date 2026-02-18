import { memo, useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { SearchSuggestions } from './SearchSuggestions';
import { initSearchService, search, getSuggestions, updateSongs } from '../services/searchService';
import type { Song } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import type { FuseResult } from 'fuse.js';

interface AdvancedSearchBarProps {
  songs: Song[];
  onSearch: (results: Array<FuseResult<Song>>) => void;
  onClear: () => void;
  placeholder?: string;
}

export const AdvancedSearchBar = memo(function AdvancedSearchBar({
  songs,
  onSearch,
  onClear,
  placeholder = "Search songs...",
}: AdvancedSearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [lastResults, setLastResults] = useState<FuseResult<Song>[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Keep the module-level Fuse index in sync with the songs list.
  // initSearchService only runs on first mount; subsequent updates use setCollection.
  const isInitialisedRef = useRef(false);
  useEffect(() => {
    if (songs.length === 0) return;
    if (!isInitialisedRef.current) {
      initSearchService(songs);
      isInitialisedRef.current = true;
    } else {
      updateSongs(songs);
    }
  }, [songs]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved) as string[]);
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Handle search input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim().length < 2) {
      onClear();
      setSuggestions([]);
      setShowSuggestions(false);
      setLastResults([]);
    }
  };

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      const results = search(debouncedQuery);
      setLastResults(results);
      onSearch(results);
      const newSuggestions = getSuggestions(debouncedQuery);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    }
  }, [debouncedQuery, onSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    saveRecentSearch(suggestion);
    const results = search(suggestion);
    setLastResults(results);
    onSearch(results);
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      setShowSuggestions(false);
      const results = search(query);
      setLastResults(results);
      onSearch(results);
    }
  };

  // Handle clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setLastResults([]);
    onClear();
    inputRef.current?.focus();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Compute stats from last results
  const statsVisible = lastResults.length > 0;
  const bestMatch = lastResults[0];
  const categories = lastResults.reduce<Record<string, number>>((acc, r) => {
    const type = r.item.type || 'Other';
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  const displaySuggestions = showSuggestions
    ? suggestions
    : recentSearches.filter((s) => s.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors duration-200"
            size={18}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className="search-input h-11 md:h-12 text-base"
            placeholder={placeholder}
            aria-label="Search songs"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={showSuggestions && displaySuggestions.length > 0}
          />

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                aria-label="Clear search"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}

            <button
              type="submit"
              className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
              aria-label="Submit search"
            >
              <Search size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      {/* Search Suggestions */}
      <SearchSuggestions
        query={query}
        suggestions={displaySuggestions}
        onSelect={handleSuggestionSelect}
        onClose={() => setShowSuggestions(false)}
        isVisible={showSuggestions}
      />

      {/* Search Stats */}
      {statsVisible && (
        <div className="mt-4 animate-slide-down" aria-live="polite" aria-atomic="true">
          <div className="card p-4 bg-gradient-to-r from-primary-50 to-accent-purple-50 dark:from-primary-900/20 dark:to-accent-purple-900/20 border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp size={18} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <span className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                    {lastResults.length} result{lastResults.length !== 1 ? 's' : ''} found
                  </span>
                </div>

                {bestMatch && (
                  <div className="text-sm text-primary-700 dark:text-primary-300">
                    Best match: <span className="font-medium">{bestMatch.item.title}</span>
                    <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-full">
                      {Math.round((1 - (bestMatch.score ?? 0)) * 100)}% match
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {Object.entries(categories).map(([type, count]) => (
                  <span key={type} className="badge badge-primary">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
