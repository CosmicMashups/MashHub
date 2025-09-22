import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';
import type { Song } from '../types';

// Fuse.js configuration for songs
const fuseOptions: IFuseOptions<Song> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'artist', weight: 0.3 },
    { name: 'type', weight: 0.15 },
    { name: 'origin', weight: 0.1 },
    { name: 'part', weight: 0.05 }
  ],
  threshold: 0.6, // Higher threshold = more lenient matching
  distance: 100, // Maximum distance for a match
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  shouldSort: true,
  findAllMatches: true,
  ignoreLocation: true,
  useExtendedSearch: true
};

export class SearchService {
  private fuse: Fuse<Song>;

  constructor(songs: Song[]) {
    console.log('SearchService constructor called with', songs.length, 'songs');
    this.fuse = new Fuse(songs, fuseOptions);
    console.log('Fuse instance created');
  }

  // Update the search index when songs change
  updateSongs(songs: Song[]) {
    this.fuse = new Fuse(songs, fuseOptions);
  }

  // Basic fuzzy search
  search(query: string, limit?: number): FuseResult<Song>[] {
    if (!query.trim()) return [];
    
    console.log('SearchService.search called with query:', query);
    const results = this.fuse.search(query);
    console.log('Fuse search returned:', results.length, 'results');
    return limit ? results.slice(0, limit) : results;
  }

  // Advanced search with filters
  searchAdvanced(query: string, filters: {
    vocalStatus?: string;
    type?: string;
    yearRange?: [number, number];
    bpmRange?: [number, number];
    keyTolerance?: number;
    targetKey?: string;
  }): FuseResult<Song>[] {
    let results = this.search(query);
    
    // Apply filters
    if (filters.vocalStatus) {
      results = results.filter(result => 
        result.item.vocalStatus === filters.vocalStatus
      );
    }
    
    if (filters.type) {
      results = results.filter(result => 
        result.item.type.toLowerCase().includes(filters.type!.toLowerCase())
      );
    }
    
    if (filters.yearRange) {
      const [minYear, maxYear] = filters.yearRange;
      results = results.filter(result => 
        result.item.year >= minYear && result.item.year <= maxYear
      );
    }
    
    if (filters.bpmRange) {
      const [minBpm, maxBpm] = filters.bpmRange;
      results = results.filter(result => 
        result.item.bpms.some((bpm: number) => bpm >= minBpm && bpm <= maxBpm)
      );
    }
    
    if (filters.targetKey && filters.keyTolerance !== undefined) {
      // Note: keyNormalization utility would need to be implemented
      // For now, we'll do basic key matching
      results = results.filter(result => 
        result.item.keys.some(key => 
          key.toLowerCase().includes(filters.targetKey!.toLowerCase())
        )
      );
    }
    
    return results;
  }

  // Search with extended syntax
  searchExtended(query: string): FuseResult<Song>[] {
    if (!query.trim()) return [];
    
    // Parse extended search syntax
    const extendedQuery = this.parseExtendedQuery(query);
    return this.fuse.search(extendedQuery);
  }

  // Parse extended search syntax (e.g., "title:anime artist:japan")
  private parseExtendedQuery(query: string): string {
    const parts = query.split(' ');
    const extendedParts: string[] = [];
    
    for (const part of parts) {
      if (part.includes(':')) {
        const [field, value] = part.split(':', 2);
        switch (field.toLowerCase()) {
          case 'title':
            extendedParts.push(`title:"${value}"`);
            break;
          case 'artist':
            extendedParts.push(`artist:"${value}"`);
            break;
          case 'type':
            extendedParts.push(`type:"${value}"`);
            break;
          case 'origin':
            extendedParts.push(`origin:"${value}"`);
            break;
          case 'part':
            extendedParts.push(`part:"${value}"`);
            break;
          default:
            extendedParts.push(part);
        }
      } else {
        extendedParts.push(part);
      }
    }
    
    return extendedParts.join(' ');
  }

  // Get search suggestions
  getSuggestions(query: string, limit: number = 5): string[] {
    if (query.length < 2) return [];
    
    const results = this.search(query, limit);
    const suggestions = new Set<string>();
    
    results.forEach(result => {
      // Add title suggestions
      if (result.item.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(result.item.title);
      }
      
      // Add artist suggestions
      if (result.item.artist.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(result.item.artist);
      }
      
      // Add type suggestions
      if (result.item.type.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(result.item.type);
      }
    });
    
    return Array.from(suggestions).slice(0, limit);
  }

  // Get search statistics
  getSearchStats(query: string): {
    totalResults: number;
    averageScore: number;
    bestMatch: FuseResult<Song> | null;
    categories: {
      [key: string]: number;
    };
  } {
    const results = this.search(query);
    
    if (results.length === 0) {
      return {
        totalResults: 0,
        averageScore: 0,
        bestMatch: null,
        categories: {}
      };
    }
    
    const averageScore = results.reduce((sum, result) => sum + (result.score || 0), 0) / results.length;
    const bestMatch = results[0];
    
    const categories: { [key: string]: number } = {};
    results.forEach(result => {
      const type = result.item.type;
      categories[type] = (categories[type] || 0) + 1;
    });
    
    return {
      totalResults: results.length,
      averageScore,
      bestMatch,
      categories
    };
  }
}