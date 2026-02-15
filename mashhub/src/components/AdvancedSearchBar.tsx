import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { SearchSuggestions } from './SearchSuggestions';
import { SearchService } from '../services/searchService';
import type { Song } from '../types';

interface AdvancedSearchBarProps {
  songs: Song[];
  onSearch: (results: any[]) => void;
  onClear: () => void;
  placeholder?: string;
}

export function AdvancedSearchBar({
  songs,
  onSearch,
  onClear,
  placeholder = "Search songs..."
}: AdvancedSearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchService, setSearchService] = useState<SearchService | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize search service
  useEffect(() => {
    if (songs.length > 0) {
      console.log('Initializing SearchService with', songs.length, 'songs');
      const service = new SearchService(songs);
      setSearchService(service);
      console.log('SearchService initialized');
    }
  }, [songs]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Handle search input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length >= 2) {
      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        if (searchService) {
          console.log('Searching for:', value);
          const results = searchService.search(value);
          console.log('Search results:', results);
          onSearch(results);
          
          // Get suggestions
          const newSuggestions = searchService.getSuggestions(value);
          setSuggestions(newSuggestions);
          setShowSuggestions(true);
          
          // Get search stats
          const stats = searchService.getSearchStats(value);
          setSearchStats(stats);
        } else {
          console.log('SearchService not initialized');
        }
      }, 300);
    } else {
      onClear();
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchStats(null);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    saveRecentSearch(suggestion);
    
    if (searchService) {
      const results = searchService.search(suggestion);
      onSearch(results);
    }
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      setShowSuggestions(false);
      
      if (searchService) {
        const results = searchService.search(query);
        onSearch(results);
      }
    }
  };

  // Handle clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchStats(null);
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

  // Get display suggestions (recent + current)
  const displaySuggestions = showSuggestions 
    ? suggestions 
    : recentSearches.filter(s => s.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors duration-200" size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className="search-input"
            placeholder={placeholder}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
            
            <button
              type="submit"
              className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200"
              title="Search"
              aria-label="Search"
            >
              <Search size={16} />
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
      {searchStats && searchStats.totalResults > 0 && (
        <div className="mt-4 animate-slide-down">
          <div className="card p-4 bg-gradient-to-r from-primary-50 to-accent-purple-50 dark:from-primary-900/20 dark:to-accent-purple-900/20 border-primary-200 dark:border-primary-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp size={18} className="text-primary-600 dark:text-primary-400" />
                  <span className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                    {searchStats.totalResults} results found
                  </span>
                </div>
                
                {searchStats.bestMatch && (
                  <div className="text-sm text-primary-700 dark:text-primary-300">
                    Best match: <span className="font-medium">{searchStats.bestMatch.item.title}</span>
                    <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 px-2 py-1 rounded-full">
                      {Math.round((1 - (searchStats.bestMatch.score || 0)) * 100)}% match
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {Object.entries(searchStats.categories).map(([type, count]) => (
                  <span key={type} className="badge badge-primary">
                    {type}: {count as number}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}