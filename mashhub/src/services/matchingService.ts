import type { Song } from '../types';
import { matchesKeyRange, areKeysCompatible } from '../utils/keyNormalization';
import { isKeyInLinkedRange } from '../utils/keyRange';
import { matchesBpmRange, getBpmCompatibilityScore, areBpmsHarmonicallyRelated } from '../utils/bpmMatching';

export interface MatchCriteria {
  targetBpm?: number;
  bpmTolerance?: number;
  bpmRange?: [number, number];
  targetKey?: string;
  keyTolerance?: number;
  keyRangeStart?: string;
  keyRangeEnd?: string;
  vocalStatus?: string;
  type?: string;
  yearRange?: [number, number];
  searchText?: string;
  artist?: string;
  part?: string;
  origin?: string;
  season?: string;
}

export interface MatchResult extends Song {
  matchScore: number;
  bpmScore: number;
  keyScore: number;
  reasons: string[];
}

export class MatchingService {
  // Find songs that match the given criteria
  static findMatches(songs: Song[], criteria: MatchCriteria): MatchResult[] {
    // First, apply hard filters
    const filtered = songs.filter(song => {
      // Text search by title (required if provided)
      if (criteria.searchText) {
        const q = criteria.searchText.toLowerCase();
        if (!song.title.toLowerCase().includes(q)) return false;
      }

      if (criteria.artist) {
        const q = criteria.artist.toLowerCase();
        if (!song.artist.toLowerCase().includes(q)) return false;
      }

      if (criteria.part) {
        const q = criteria.part.toLowerCase();
        if (!song.part?.toLowerCase().includes(q)) return false;
      }

      if (criteria.origin) {
        const q = criteria.origin.toLowerCase();
        if (!song.origin?.toLowerCase().includes(q)) return false;
      }

      if (criteria.season) {
        const q = criteria.season.toLowerCase();
        if (!song.season?.toLowerCase().includes(q)) return false;
      }

      if (criteria.type) {
        if (!song.type.toLowerCase().includes(criteria.type.toLowerCase())) return false;
      }

      if (criteria.vocalStatus) {
        if (song.vocalStatus !== criteria.vocalStatus) return false;
      }

      if (criteria.yearRange) {
        const [minY, maxY] = criteria.yearRange;
        if (song.year < minY || song.year > maxY) return false;
      }

      if (criteria.bpmRange) {
        const [minB, maxB] = criteria.bpmRange;
        if (!song.bpms.some(b => b >= minB && b <= maxB)) return false;
      }

      // Key filters: linked range or tolerance
      if (criteria.keyRangeStart && criteria.keyRangeEnd) {
        const ok = song.keys.some(k => isKeyInLinkedRange(criteria.keyRangeStart!, criteria.keyRangeEnd!, k));
        if (!ok) return false;
      } else if (criteria.targetKey && criteria.keyTolerance !== undefined) {
        if (!matchesKeyRange(song.keys, criteria.targetKey, criteria.keyTolerance)) return false;
      }

      // Passed all filters
      return true;
    });

    // Then score remaining for sorting
    const results: MatchResult[] = filtered.map(song => this.evaluateMatch(song, criteria));
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
  
  // Evaluate how well a song matches the criteria
  private static evaluateMatch(song: Song, criteria: MatchCriteria): MatchResult {
    let matchScore = 0;
    let bpmScore = 0;
    let keyScore = 0;
    const reasons: string[] = [];
    
    // BPM matching (tolerance or range)
    if (criteria.targetBpm && criteria.bpmTolerance !== undefined) {
      if (matchesBpmRange(song.bpms, criteria.targetBpm, criteria.bpmTolerance)) {
        bpmScore = getBpmCompatibilityScore(song.bpms, criteria.targetBpm, criteria.bpmTolerance);
        matchScore += bpmScore * 0.4; // 40% weight for BPM
        reasons.push(`BPM match: ${song.bpms.join(', ')} within ±${criteria.bpmTolerance} of ${criteria.targetBpm}`);
      }
    } else if (criteria.bpmRange) {
      const [minB, maxB] = criteria.bpmRange;
      if (song.bpms.some(b => b >= minB && b <= maxB)) {
        bpmScore = 0.8;
        matchScore += bpmScore * 0.4;
        reasons.push(`BPM in range: ${minB}-${maxB}`);
      }
    }
    
    // Key matching
    if (criteria.keyRangeStart && criteria.keyRangeEnd) {
      if (song.keys.some(k => isKeyInLinkedRange(criteria.keyRangeStart!, criteria.keyRangeEnd!, k))) {
        keyScore = 1;
        matchScore += keyScore * 0.3;
        reasons.push(`Key in range: ${criteria.keyRangeStart} → ${criteria.keyRangeEnd}`);
      }
    } else if (criteria.targetKey && criteria.keyTolerance !== undefined) {
      if (matchesKeyRange(song.keys, criteria.targetKey, criteria.keyTolerance)) {
        keyScore = 1; // Perfect key match
        matchScore += keyScore * 0.3; // 30% weight for key
        reasons.push(`Key match: ${song.keys.join(', ')} compatible with ${criteria.targetKey}`);
      }
    }
    
    // Vocal status matching
    if (criteria.vocalStatus) {
      if (song.vocalStatus === criteria.vocalStatus) {
        matchScore += 0.1; // 10% weight for vocal status
        reasons.push(`Vocal status match: ${song.vocalStatus}`);
      }
    }
    
    // Type matching
    if (criteria.type) {
      if (song.type.toLowerCase().includes(criteria.type.toLowerCase())) {
        matchScore += 0.1; // 10% weight for type
        reasons.push(`Type match: ${song.type}`);
      }
    }
    
    // Year range matching
    if (criteria.yearRange) {
      const [minYear, maxYear] = criteria.yearRange;
      if (song.year >= minYear && song.year <= maxYear) {
        matchScore += 0.05; // 5% weight for year
        reasons.push(`Year match: ${song.year}`);
      }
    }
    
    // Text search matching (title)
    if (criteria.searchText) {
      const searchLower = criteria.searchText.toLowerCase();
      const titleMatch = song.title.toLowerCase().includes(searchLower);
      
      if (titleMatch) {
        matchScore += 0.05; // 5% weight for text search
        reasons.push(`Title contains: "${criteria.searchText}"`);
      }
    }
    
    return {
      ...song,
      matchScore,
      bpmScore,
      keyScore,
      reasons
    };
  }
  
  // Find songs that are harmonically compatible with a target song
  static findHarmonicMatches(songs: Song[], targetSong: Song, tolerance: { bpm: number; key: number }): MatchResult[] {
    const results: MatchResult[] = [];
    
    for (const song of songs) {
      if (song.id === targetSong.id) continue; // Skip the target song itself
      
      let matchScore = 0;
      const reasons: string[] = [];
      
      // Check BPM harmonic relationships
      const hasHarmonicBpm = song.bpms.some(songBpm => 
        targetSong.bpms.some(targetBpm => 
          areBpmsHarmonicallyRelated(songBpm, targetBpm, tolerance.bpm)
        )
      );
      
      if (hasHarmonicBpm) {
        matchScore += 0.5;
        reasons.push('Harmonic BPM relationship detected');
      }
      
      // Check key compatibility
      const hasCompatibleKey = song.keys.some(songKey => 
        targetSong.keys.some(targetKey => 
          areKeysCompatible(songKey, targetKey, tolerance.key)
        )
      );
      
      if (hasCompatibleKey) {
        matchScore += 0.3;
        reasons.push('Compatible key detected');
      }
      
      // Bonus for same vocal status
      if (song.vocalStatus === targetSong.vocalStatus) {
        matchScore += 0.1;
        reasons.push('Same vocal status');
      }
      
      // Bonus for same type
      if (song.type === targetSong.type) {
        matchScore += 0.1;
        reasons.push('Same type');
      }
      
      if (matchScore > 0) {
        results.push({
          ...song,
          matchScore,
          bpmScore: hasHarmonicBpm ? 0.5 : 0,
          keyScore: hasCompatibleKey ? 0.3 : 0,
          reasons
        });
      }
    }
    
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
  
  // Get quick match suggestions for a song
  static getQuickMatches(songs: Song[], targetSong: Song): MatchResult[] {
    return this.findHarmonicMatches(songs, targetSong, { bpm: 10, key: 2 });
  }
}