import type { Song, PartHarmonicFilterBlock, SongSection } from '../types';
import { matchesKeyRange, areKeysCompatible, calculateKeyDistance } from '../utils/keyNormalization';
import { isKeyInLinkedRange } from '../utils/keyRange';
import { matchesBpmRange, getBpmCompatibilityScore, areBpmsHarmonicallyRelated } from '../utils/bpmMatching';
import { normalizeSectionName } from '../utils/sectionNormalization';
import { db } from './database';
import {
  MATCH_WEIGHT_BPM,
  MATCH_WEIGHT_KEY,
  MATCH_WEIGHT_TYPE,
  MATCH_WEIGHT_YEAR,
  MATCH_WEIGHT_TEXT,
  QUICK_MATCH_WEIGHT_KEY,
  QUICK_MATCH_WEIGHT_BPM,
  QUICK_MATCH_WEIGHT_ARTIST,
  QUICK_MATCH_WEIGHT_ORIGIN,
  DEFAULT_BPM_TOLERANCE,
} from '../constants';

export interface MatchCriteria {
  targetBpm?: number;
  bpmTolerance?: number;
  bpmRange?: [number, number];
  targetKey?: string;
  keyTolerance?: number;
  keyRangeStart?: string;
  keyRangeEnd?: string;
  selectedKeys?: string[]; // Array of selected keys from checkboxes
  type?: string;
  yearRange?: [number, number];
  searchText?: string;
  artist?: string;
  part?: string;
  origin?: string;
  season?: string;
  partSpecificFilters?: PartHarmonicFilterBlock[];
  partSpecificKey?: {
    section: string;
    key: string;
  } | null;
}

export interface MatchResult extends Song {
  matchScore: number;
  bpmScore: number;
  keyScore: number;
  reasons: string[];
  bestMatchingSection?: {
    sectionId: string;
    part: string;
    bpm: number;
    key: string;
  };
}

export class MatchingService {
  // Helper to check if a section matches PART-specific filter block
  // Uses normalized section names to enable logical matching (e.g., "Verse A" matches "Verse")
  private static sectionMatchesPartFilter(section: SongSection, block: PartHarmonicFilterBlock): boolean {
    // Check PART match using normalized section names
    // This enables matching between related section variations (e.g., "Verse" matches "Verse A")
    if (block.part) {
      const normalizedSectionPart = normalizeSectionName(section.part);
      const normalizedBlockPart = normalizeSectionName(block.part);
      if (normalizedSectionPart !== normalizedBlockPart) {
        return false;
      }
    }

    // Check BPM filter
    if (block.bpm) {
      if (block.bpm.mode === "target" && block.bpm.target !== undefined && block.bpm.tolerance !== undefined) {
        const target = typeof block.bpm.target === "number" ? block.bpm.target : undefined;
        if (target === undefined) return false;
        const min = target - block.bpm.tolerance;
        const max = target + block.bpm.tolerance;
        if (section.bpm < min || section.bpm > max) return false;
      } else if (block.bpm.mode === "range") {
        const min = block.bpm.min ?? 0;
        const max = block.bpm.max ?? 999;
        if (section.bpm < min || section.bpm > max) return false;
      }
    }

    // Check Key filter (array of selected keys)
    if (block.key && Array.isArray(block.key) && block.key.length > 0) {
      // Check if section key matches any of the selected keys
      if (!block.key.includes(section.key)) return false;
    }

    return true;
  }

  // Check if a song matches all PART-specific filter blocks
  // Accepts pre-loaded sections to avoid per-song DB queries (caller must provide).
  private static songMatchesPartFiltersSync(sections: SongSection[], blocks: PartHarmonicFilterBlock[]): boolean {
    if (!blocks || blocks.length === 0) return true;

    // For each filter block, check if at least one section matches
    for (const block of blocks) {
      const hasMatchingSection = sections.some((section) => this.sectionMatchesPartFilter(section, block));
      if (!hasMatchingSection) {
        return false; // This block doesn't match, song is excluded
      }
    }

    return true; // All blocks matched
  }

  // Find songs that match the given criteria
  static async findMatches(songs: Song[], criteria: MatchCriteria): Promise<MatchResult[]> {
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

      // Part filter removed - sections now have parts, not songs
      // Part filtering would need to check sections, which is deferred for now

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

      if (criteria.yearRange) {
        const [minY, maxY] = criteria.yearRange;
        if (song.year < minY || song.year > maxY) return false;
      }

      if (criteria.bpmRange) {
        const [minB, maxB] = criteria.bpmRange;
        if (!song.bpms.some(b => b >= minB && b <= maxB)) return false;
      }

      // Key filters: selected keys (checkboxes) or legacy target/tolerance/range
      if (criteria.selectedKeys && criteria.selectedKeys.length > 0) {
        // Check if song has any key matching the selected keys
        const hasMatchingKey = song.keys.some(songKey => 
          criteria.selectedKeys!.some(selectedKey => songKey === selectedKey)
        );
        if (!hasMatchingKey) return false;
      } else if (criteria.keyRangeStart && criteria.keyRangeEnd) {
        const ok = song.keys.some(k => isKeyInLinkedRange(criteria.keyRangeStart!, criteria.keyRangeEnd!, k));
        if (!ok) return false;
      } else if (criteria.targetKey && criteria.keyTolerance !== undefined) {
        if (!matchesKeyRange(song.keys, criteria.targetKey, criteria.keyTolerance)) return false;
      }

      // Passed all filters
      return true;
    });

    // Apply PART-specific filters if present (batch section load)
    let finalFiltered = filtered;
    if (criteria.partSpecificFilters && criteria.partSpecificFilters.length > 0) {
      const idsToFilter = filtered.map((s) => s.id);
      const allSections = await db.songSections.where('songId').anyOf(idsToFilter).toArray();
      const sectionsMap = new Map<string, SongSection[]>();
      for (const sec of allSections) {
        const arr = sectionsMap.get(sec.songId) ?? [];
        arr.push(sec);
        sectionsMap.set(sec.songId, arr);
      }
      finalFiltered = filtered.filter((song) =>
        this.songMatchesPartFiltersSync(sectionsMap.get(song.id) ?? [], criteria.partSpecificFilters!)
      );
    }

    // Apply Part-Specific Key Filter if present (batch section load)
    if (criteria.partSpecificKey && criteria.partSpecificKey.section && criteria.partSpecificKey.key) {
      const normalizedFilterSection = normalizeSectionName(criteria.partSpecificKey.section);
      const idsToFilter2 = finalFiltered.map((s) => s.id);
      const allSections2 = await db.songSections.where('songId').anyOf(idsToFilter2).toArray();
      const sectionsMap2 = new Map<string, SongSection[]>();
      for (const sec of allSections2) {
        const arr = sectionsMap2.get(sec.songId) ?? [];
        arr.push(sec);
        sectionsMap2.set(sec.songId, arr);
      }

      finalFiltered = finalFiltered.filter((song) => {
        const sections = sectionsMap2.get(song.id) ?? [];
        const matchingSection = sections.find(
          (section) => normalizeSectionName(section.part) === normalizedFilterSection
        );
        if (!matchingSection) return false;

        const sectionKeys = matchingSection.key.includes(',')
          ? matchingSection.key.split(',').map((k) => k.trim()).filter(Boolean)
          : [matchingSection.key.trim()];

        return sectionKeys.some((sectionKey) => sectionKey === criteria.partSpecificKey!.key);
      });
    }

    // Then score remaining for sorting
    const results: MatchResult[] = finalFiltered.map(song => this.evaluateMatch(song, criteria));
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
        matchScore += bpmScore * MATCH_WEIGHT_BPM;
        reasons.push(`BPM match: ${song.bpms.join(', ')} within ±${criteria.bpmTolerance} of ${criteria.targetBpm}`);
      }
    } else if (criteria.bpmRange) {
      const [minB, maxB] = criteria.bpmRange;
      if (song.bpms.some((b) => b >= minB && b <= maxB)) {
        bpmScore = 0.8;
        matchScore += bpmScore * MATCH_WEIGHT_BPM;
        reasons.push(`BPM in range: ${minB}-${maxB}`);
      }
    }

    // Key matching
    if (criteria.selectedKeys && criteria.selectedKeys.length > 0) {
      const hasMatchingKey = song.keys.some((songKey) =>
        criteria.selectedKeys!.some((selectedKey) => songKey === selectedKey)
      );
      if (hasMatchingKey) {
        keyScore = 1;
        matchScore += keyScore * MATCH_WEIGHT_KEY;
        reasons.push(`Key match: ${song.keys.join(', ')} matches selected keys`);
      }
    } else if (criteria.keyRangeStart && criteria.keyRangeEnd) {
      if (song.keys.some((k) => isKeyInLinkedRange(criteria.keyRangeStart!, criteria.keyRangeEnd!, k))) {
        keyScore = 1;
        matchScore += keyScore * MATCH_WEIGHT_KEY;
        reasons.push(`Key in range: ${criteria.keyRangeStart} → ${criteria.keyRangeEnd}`);
      }
    } else if (criteria.targetKey && criteria.keyTolerance !== undefined) {
      if (matchesKeyRange(song.keys, criteria.targetKey, criteria.keyTolerance)) {
        keyScore = 1;
        matchScore += keyScore * MATCH_WEIGHT_KEY;
        reasons.push(`Key match: ${song.keys.join(', ')} compatible with ${criteria.targetKey}`);
      }
    }

    // Type matching
    if (criteria.type) {
      if (song.type.toLowerCase().includes(criteria.type.toLowerCase())) {
        matchScore += MATCH_WEIGHT_TYPE;
        reasons.push(`Type match: ${song.type}`);
      }
    }

    // Year range matching
    if (criteria.yearRange) {
      const [minYear, maxYear] = criteria.yearRange;
      if (song.year >= minYear && song.year <= maxYear) {
        matchScore += MATCH_WEIGHT_YEAR;
        reasons.push(`Year match: ${song.year}`);
      }
    }

    // Text search matching (title)
    if (criteria.searchText) {
      const searchLower = criteria.searchText.toLowerCase();
      if (song.title.toLowerCase().includes(searchLower)) {
        matchScore += MATCH_WEIGHT_TEXT;
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
  
  /**
   * Calculate part-specific key similarity score between two songs.
   * Uses distance-based harmonic scoring with mathematical precision.
   * 
   * Algorithm:
   * 1. For each section in Song A, find matching section in Song B by part name (case-insensitive)
   * 2. Calculate key similarity score for each matching section using circular semitone distance
   * 3. Handle multiple keys per section (pairwise comparison, use MAX similarity)
   * 4. Handle full-song key fallback (compare against all sections in Song A)
   * 5. Average all section scores from Song A
   * 
   * @param songA - Target song (Song A)
   * @param songB - Candidate song (Song B)
   * @param sectionsA - Sections for Song A (if not provided, will be loaded from DB)
   * @param sectionsB - Sections for Song B (if not provided, will be loaded from DB)
   * @returns Score between 0 and 1, where 1.0 = perfect match, 0.0 = no match
   */
  private static async calculatePartSpecificKeyScore(
    songA: Song,
    songB: Song,
    sectionsA: SongSection[],
    sectionsB: SongSection[]
  ): Promise<number> {
    // Load sections if not provided
    let targetSections = sectionsA;
    let candidateSections = sectionsB;
    
    if (!targetSections || targetSections.length === 0) {
      targetSections = await db.songSections.where('songId').equals(songA.id).toArray();
    }
    if (!candidateSections || candidateSections.length === 0) {
      candidateSections = await db.songSections.where('songId').equals(songB.id).toArray();
    }

    // If no sections, return 0
    if (targetSections.length === 0) {
      return 0;
    }

    // Check if candidate has only "Full Song" key (no section-specific keys)
    // A section is considered "Full Song" if part name is "Full Song" or similar variations
    const hasOnlyFullSongKey = candidateSections.length === 0 || 
      (candidateSections.length === 1 && 
       (candidateSections[0].part.toLowerCase().includes('full song') ||
        candidateSections[0].part.toLowerCase() === 'full' ||
        candidateSections[0].part.toLowerCase().trim() === ''));

    const sectionScores: number[] = [];

    // Process each section in Song A
    for (const targetSection of targetSections) {
      let sectionScore = 0;

      // Handle missing key data
      if (!targetSection.key || targetSection.key.trim() === '') {
        sectionScores.push(0);
        continue;
      }

      if (hasOnlyFullSongKey && candidateSections.length === 1) {
        // Full-song key fallback: compare against each section in Song A independently
        const fullSongKey = candidateSections[0].key;
        if (fullSongKey && fullSongKey.trim() !== '') {
          sectionScore = calculateKeyDistance(targetSection.key, fullSongKey);
        }
      } else {
        // Find matching section in Song B by normalized part name
        // Uses section normalization to enable logical matching (e.g., "Verse A" matches "Verse")
        const normalizedTargetPart = normalizeSectionName(targetSection.part);
        const matchingSection = candidateSections.find(
          cs => normalizeSectionName(cs.part) === normalizedTargetPart
        );

        if (matchingSection && matchingSection.key && matchingSection.key.trim() !== '') {
          // Both sections have keys - calculate similarity using distance-based scoring
          const targetKey = targetSection.key.trim();
          const candidateKey = matchingSection.key.trim();

          // Handle potential multiple keys per section (comma-separated or array)
          // For now, assume single key per section, but calculate pairwise if needed
          // If key contains commas, treat as multiple keys and use MAX similarity
          const targetKeys = targetKey.includes(',') 
            ? targetKey.split(',').map(k => k.trim()).filter(k => k)
            : [targetKey];
          const candidateKeys = candidateKey.includes(',')
            ? candidateKey.split(',').map(k => k.trim()).filter(k => k)
            : [candidateKey];

          // Pairwise comparison: compute similarity between all key combinations, use MAX
          let maxSimilarity = 0;
          for (const tKey of targetKeys) {
            for (const cKey of candidateKeys) {
              const similarity = calculateKeyDistance(tKey, cKey);
              maxSimilarity = Math.max(maxSimilarity, similarity);
            }
          }
          sectionScore = maxSimilarity;
        }
        // If no matching section found, sectionScore remains 0
      }

      sectionScores.push(sectionScore);
    }

    // Average all section scores from Song A
    if (sectionScores.length === 0) {
      return 0;
    }

    const averageScore = sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length;
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, averageScore));
  }

  /**
   * Get quick match suggestions for a song using fuzzy logic with part-specific matching.
   *
   * Optimization: all candidate sections are loaded in ONE batch anyOf query before the
   * scoring loop, eliminating the previous N+1 pattern.
   */
  static async getQuickMatches(songs: Song[], targetSong: Song): Promise<MatchResult[]> {
    // Load target song sections
    const targetSections = await db.songSections.where('songId').equals(targetSong.id).toArray();

    if (targetSections.length === 0) {
      // Fallback to old method if no sections
      return this.findHarmonicMatches(songs, targetSong, { bpm: DEFAULT_BPM_TOLERANCE, key: 2 });
    }

    // ── Batch-load ALL candidate sections in one query ──────────────────────────
    const candidateIds = songs.map((s) => s.id).filter((id) => id !== targetSong.id);
    const allCandidateSections = await db.songSections
      .where('songId')
      .anyOf(candidateIds)
      .toArray();

    // Group by songId
    const sectionsBySong = new Map<string, SongSection[]>();
    for (const section of allCandidateSections) {
      const arr = sectionsBySong.get(section.songId) ?? [];
      arr.push(section);
      sectionsBySong.set(section.songId, arr);
    }

    const results: MatchResult[] = [];

    for (const song of songs) {
      if (song.id === targetSong.id) continue;

      const candidateSections = sectionsBySong.get(song.id) ?? [];

      let matchScore = 0;
      let bpmScore = 0;
      let keyScore = 0;
      const reasons: string[] = [];

      // Part-Specific Key Matching (QUICK_MATCH_WEIGHT_KEY weight)
      const partSpecificKeyScore = await this.calculatePartSpecificKeyScore(
        targetSong,
        song,
        targetSections,
        candidateSections
      );

      if (partSpecificKeyScore > 0) {
        matchScore += partSpecificKeyScore * QUICK_MATCH_WEIGHT_KEY;
        keyScore = partSpecificKeyScore;

        const keyMatchDetails: string[] = [];
        for (const targetSection of targetSections) {
          const matchingSection = candidateSections.find(
            (cs) => cs.part.toLowerCase() === targetSection.part.toLowerCase()
          );
          if (matchingSection) {
            const similarity = calculateKeyDistance(targetSection.key, matchingSection.key);
            if (similarity > 0) {
              const percentMatch = Math.round(similarity * 100);
              keyMatchDetails.push(
                `${targetSection.part}: ${percentMatch}% match (${targetSection.key} vs ${matchingSection.key})`
              );
            }
          }
        }

        reasons.push(
          keyMatchDetails.length > 0
            ? `Part-specific key match: ${keyMatchDetails.join(', ')}`
            : `Part-specific key match: ${Math.round(partSpecificKeyScore * 100)}% similarity`
        );
      }

      // Part-Specific BPM Matching (QUICK_MATCH_WEIGHT_BPM weight)
      let partSpecificBpmScore = 0;
      const bpmMatches: string[] = [];

      for (const targetSection of targetSections) {
        const normalizedTargetPart = normalizeSectionName(targetSection.part);
        const matchingSection = candidateSections.find(
          (cs) => normalizeSectionName(cs.part) === normalizedTargetPart
        );
        if (matchingSection) {
          const isHarmonic = areBpmsHarmonicallyRelated(
            matchingSection.bpm,
            targetSection.bpm,
            DEFAULT_BPM_TOLERANCE
          );
          if (isHarmonic) {
            const bpmDiff = Math.abs(matchingSection.bpm - targetSection.bpm);
            const compatibilityScore = Math.max(0, 1 - bpmDiff / 22.5);
            partSpecificBpmScore = Math.max(partSpecificBpmScore, compatibilityScore);
            bpmMatches.push(
              `${targetSection.part}: ${matchingSection.bpm} BPM matches ${targetSection.bpm} BPM`
            );
          }
        }
      }

      if (partSpecificBpmScore > 0) {
        matchScore += partSpecificBpmScore * QUICK_MATCH_WEIGHT_BPM;
        bpmScore = partSpecificBpmScore;
        reasons.push(`Part-specific BPM match: ${bpmMatches.join(', ')}`);
      }

      // Artist Matching (QUICK_MATCH_WEIGHT_ARTIST weight)
      if (song.artist.toLowerCase() === targetSong.artist.toLowerCase()) {
        matchScore += QUICK_MATCH_WEIGHT_ARTIST;
        reasons.push(`Artist match: ${song.artist}`);
      }

      // Origin Matching (QUICK_MATCH_WEIGHT_ORIGIN weight)
      if (song.origin && targetSong.origin &&
          song.origin.toLowerCase() === targetSong.origin.toLowerCase()) {
        matchScore += QUICK_MATCH_WEIGHT_ORIGIN;
        reasons.push(`Origin match: ${song.origin}`);
      }

      if (matchScore > 0) {
        results.push({ ...song, matchScore, bpmScore, keyScore, reasons });
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}