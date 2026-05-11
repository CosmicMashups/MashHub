import { useState, useEffect, useCallback, useRef } from 'react';
import type { Song } from '../types';
import { search } from '../services/searchService';
import { FUSE_MIN_MATCH_CHAR_LENGTH, SEARCH_DEBOUNCE_MS } from '../constants';

export interface UseInstrumentalSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: Song[];
  isSearching: boolean;
  clearSearch: () => void;
}

const MAX_RESULTS = 8;

export function useInstrumentalSearch(songs: Song[]): UseInstrumentalSearchReturn {
  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
    setIsSearching(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      setDebouncedQuery(q);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < FUSE_MIN_MATCH_CHAR_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    const fuseResults = search(trimmed, MAX_RESULTS);
    setResults(fuseResults.map((r) => r.item));
    setIsSearching(false);
  }, [debouncedQuery, songs]);

  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setQueryState('');
    setDebouncedQuery('');
    setResults([]);
    setIsSearching(false);
  }, []);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    },
    []
  );

  return { query, setQuery, results, isSearching, clearSearch };
}
