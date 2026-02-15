import type { Song, PartHarmonicFilterBlock, SongSection } from '../types';
import { matchesKeyRange, areKeysCompatible, calculateKeyDistance, parseKeyToPitchClass } from '../utils/keyNormalization';
import { isKeyInLinkedRange } from '../utils/keyRange';
import { matchesBpmRange, getBpmCompatibilityScore, areBpmsHarmonicallyRelated } from '../utils/bpmMatching';
import { normalizeSectionName } from '../utils/sectionNormalization';
import { db } from './database';

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
  private static async songMatchesPartFilters(songId: string, blocks: PartHarmonicFilterBlock[]): Promise<boolean> {
    if (!blocks || blocks.length === 0) return true;

    // Get all sections for this song
    const sections = await db.songSections.where('songId').equals(songId).toArray();

    // For each filter block, check if at least one section matches
    for (const block of blocks) {
      const hasMatchingSection = sections.some(section => this.sectionMatchesPartFilter(section, block));
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

    // Apply PART-specific filters if present
    let finalFiltered = filtered;
    if (criteria.partSpecificFilters && criteria.partSpecificFilters.length > 0) {
      const partFilterResults = await Promise.all(
        filtered.map(async (song) => {
          const matches = await this.songMatchesPartFilters(song.id, criteria.partSpecificFilters!);
          return matches ? song : null;
        })
      );
      finalFiltered = partFilterResults.filter((song): song is Song => song !== null);
    }

    // Apply Part-Specific Key Filter if present
    // This filter matches songs where a specific section has a specific key
    // Uses normalized section names to enable logical matching (e.g., "Verse A" matches "Verse")
    if (criteria.partSpecificKey && criteria.partSpecificKey.section && criteria.partSpecificKey.key) {
      const normalizedFilterSection = normalizeSectionName(criteria.partSpecificKey.section);
      const partKeyFilterResults = await Promise.all(
        finalFiltered.map(async (song) => {
          // Get all sections for this song
          const sections = await db.songSections.where('songId').equals(song.id).toArray();
          
          // Find sections that match the normalized part name
          // Uses section normalization to enable logical matching (e.g., "Verse A" matches "Verse")
          const matchingSection = sections.find(section => 
            normalizeSectionName(section.part) === normalizedFilterSection
          );
          
          if (!matchingSection) {
            return null; // Section doesn't exist in this song
          }
          
          // Check if the section's key includes the selected key
          // Support multiple keys per section (comma-separated or array)
          const sectionKeys = matchingSection.key.includes(',')
            ? matchingSection.key.split(',').map(k => k.trim()).filter(k => k)
            : [matchingSection.key.trim()];
          
          const hasMatchingKey = sectionKeys.some(sectionKey => 
            sectionKey === criteria.partSpecificKey!.key
          );
          
          return hasMatchingKey ? song : null;
        })
      );
      finalFiltered = partKeyFilterResults.filter((song): song is Song => song !== null);
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
    if (criteria.selectedKeys && criteria.selectedKeys.length > 0) {
      const hasMatchingKey = song.keys.some(songKey => 
        criteria.selectedKeys!.some(selectedKey => songKey === selectedKey)
      );
      if (hasMatchingKey) {
        keyScore = 1;
        matchScore += keyScore * 0.3;
        reasons.push(`Key match: ${song.keys.join(', ')} matches selected keys`);
      }
    } else if (criteria.keyRangeStart && criteria.keyRangeEnd) {
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

  // Get quick match suggestions for a song using fuzzy logic with part-specific matching
  static async getQuickMatches(songs: Song[], targetSong: Song): Promise<MatchResult[]> {
    // Get target song sections
    const targetSections = await db.songSections.where('songId').equals(targetSong.id).toArray();
    
    if (targetSections.length === 0) {
      // Fallback to old method if no sections
      return this.findHarmonicMatches(songs, targetSong, { bpm: 10, key: 2 });
    }

    const results: MatchResult[] = [];
    const tolerance = { bpm: 10, key: 2 };

    for (const song of songs) {
      if (song.id === targetSong.id) continue; // Skip the target song itself

      // Get candidate song sections
      const candidateSections = await db.songSections.where('songId').equals(song.id).toArray();
      
      let matchScore = 0;
      let bpmScore = 0;
      let keyScore = 0;
      const reasons: string[] = [];

      // Part-Specific Key Matching (45% weight) - using distance-based harmonic scoring
      const partSpecificKeyScore = await this.calculatePartSpecificKeyScore(
        targetSong,
        song,
        targetSections,
        candidateSections
      );
      
      if (partSpecificKeyScore > 0) {
        matchScore += partSpecificKeyScore * 0.45; // 45% weight
        keyScore = partSpecificKeyScore;
        
        // Build detailed match reasons
        const keyMatchDetails: string[] = [];
        for (const targetSection of targetSections) {
          const matchingSection = candidateSections.find(
            cs => cs.part.toLowerCase() === targetSection.part.toLowerCase()
          );
          if (matchingSection) {
            const similarity = calculateKeyDistance(targetSection.key, matchingSection.key);
            if (similarity > 0) {
              const percentMatch = Math.round(similarity * 100);
              keyMatchDetails.push(`${targetSection.part}: ${percentMatch}% match (${targetSection.key} vs ${matchingSection.key})`);
            }
          }
        }
        
        if (keyMatchDetails.length > 0) {
          reasons.push(`Part-specific key match: ${keyMatchDetails.join(', ')}`);
        } else {
          reasons.push(`Part-specific key match: ${Math.round(partSpecificKeyScore * 100)}% similarity`);
        }
      }

      // Part-Specific BPM Matching (45% weight)
      // Uses normalized section names to enable logical matching (e.g., "Verse A" matches "Verse")
      let partSpecificBpmScore = 0;
      const bpmMatches: string[] = [];
      
      for (const targetSection of targetSections) {
        const normalizedTargetPart = normalizeSectionName(targetSection.part);
        const matchingSection = candidateSections.find(
          cs => normalizeSectionName(cs.part) === normalizedTargetPart
        );
        if (matchingSection) {
          const isHarmonic = areBpmsHarmonicallyRelated(matchingSection.bpm, targetSection.bpm, tolerance.bpm);
          if (isHarmonic) {
            // Calculate BPM compatibility score (0-1) using less sensitive computation
            // Penalty is reduced by 1.5x to make the weight computation less sensitive
            // Formula: similarity = max(0, 1 - (distance / (15 * 1.5))) = max(0, 1 - (distance / 22.5))
            const bpmDiff = Math.abs(matchingSection.bpm - targetSection.bpm);
            // Apply 1.5x less sensitive computation (divide penalty by 1.5, or multiply denominator by 1.5)
            const compatibilityScore = Math.max(0, 1 - (bpmDiff / (15 * 1.5)));
            partSpecificBpmScore = Math.max(partSpecificBpmScore, compatibilityScore);
            bpmMatches.push(`${targetSection.part}: ${matchingSection.bpm} BPM matches ${targetSection.bpm} BPM`);
          }
        }
      }
      
      if (partSpecificBpmScore > 0) {
        matchScore += partSpecificBpmScore * 0.45; // 45% weight
        bpmScore = partSpecificBpmScore;
        reasons.push(`Part-specific BPM match: ${bpmMatches.join(', ')}`);
      }

      // Artist Matching (5% weight)
      if (song.artist.toLowerCase() === targetSong.artist.toLowerCase()) {
        matchScore += 0.05; // 5% weight
        reasons.push(`Artist match: ${song.artist}`);
      }

      // Origin Matching (5% weight)
      if (song.origin && targetSong.origin && 
          song.origin.toLowerCase() === targetSong.origin.toLowerCase()) {
        matchScore += 0.05; // 5% weight
        reasons.push(`Origin match: ${song.origin}`);
      }

      if (matchScore > 0) {
        results.push({
          ...song,
          matchScore,
          bpmScore,
          keyScore,
          reasons
        });
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}