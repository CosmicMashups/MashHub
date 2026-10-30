import { memo, useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { initSearchService, search, getSuggestions, updateSongs } from '../services/searchService';
import type { Song } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import type { FuseResult } from 'fuse.js';
import { FloatingInput } from './inputs/FloatingInput';

interface AdvancedSearchBarProps {
  songs: Song[];
  onSearch: (results: Array<FuseResult<Song>>) => void;
  onClear: () => void;
  placeholder?: string;
  onQueryChange?: (query: string) => void;
  initialQuery?: string;
}

export const AdvancedSearchBar = memo(function AdvancedSearchBar({
  songs,
  onSearch,
  onClear,
  placeholder = "Search songs...",
  onQueryChange,
  initialQuery = '',
}: AdvancedSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (initialQuery !== undefined && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query]);
  const [, setSuggestions] = useState<string[]>([]);
  const [, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [lastResults, setLastResults] = useState<FuseResult<Song>[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  /** Always call latest handler without listing `onSearch` in effect deps (unstable props would retrigger search every render). */
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
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
    onQueryChange?.(value);
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
      onSearchRef.current(results);
      const newSuggestions = getSuggestions(debouncedQuery);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    }
  }, [debouncedQuery]);

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
    onQueryChange?.('');
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

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group rounded-2xl p-1 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 border border-slate-200/80 dark:border-slate-800 shadow-xs focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
          <FloatingInput
            ref={inputRef}
            label="Search songs"
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search songs"
            icon={<Search size={17} className="text-theme-text-muted group-focus-within:text-theme-accent-primary transition-colors" aria-hidden />}
            trailing={
              <div className="flex items-center space-x-2">
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-surface-hover rounded-md transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Search
                </button>
              </div>
            }
          />
        </div>
      </form>

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
