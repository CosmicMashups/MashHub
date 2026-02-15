// Chromatic scale mapping for key normalization
export const CHROMATIC_KEYS = [
    "C", "C#", "D", "D#", "E", "F", 
    "F#", "G", "G#", "A", "A#", "B"
  ] as const;
  
  export type ChromaticKey = typeof CHROMATIC_KEYS[number];
  
  // Key normalization function
  export function normalizeKey(key: string): number {
    // Remove mode (Major/Minor) and trim whitespace
    const base = key.replace(/\s+(Major|Minor)/gi, "").trim();
    
    // Handle enharmonic equivalents
    const normalizedBase = base
      .replace(/Db/g, 'C#')
      .replace(/Eb/g, 'D#')
      .replace(/Gb/g, 'F#')
      .replace(/Ab/g, 'A#')
      .replace(/Bb/g, 'A#');
    
    const index = CHROMATIC_KEYS.indexOf(normalizedBase as ChromaticKey);
    
    if (index === -1) {
      throw new Error(`Unknown key: ${key}. Supported keys: ${CHROMATIC_KEYS.join(', ')}`);
    }
    
    return index;
  }
  
  // Get key range for matching (tolerance in semitones)
  export function getKeyRange(targetKey: string, tolerance: number): Set<number> {
    const targetIndex = normalizeKey(targetKey);
    const allowed = new Set<number>();
    
    for (let i = -tolerance; i <= tolerance; i++) {
      // Use modulo to wrap around the chromatic scale
      const wrappedIndex = (targetIndex + i + 12) % 12;
      allowed.add(wrappedIndex);
    }
    
    return allowed;
  }
  
  // Check if a song's keys match the target key within tolerance
  export function matchesKeyRange(songKeys: string[], targetKey: string, tolerance: number): boolean {
    try {
      const allowedIndices = getKeyRange(targetKey, tolerance);
      return songKeys.some(key => {
        try {
          const keyIndex = normalizeKey(key);
          return allowedIndices.has(keyIndex);
        } catch {
          // If key can't be normalized, skip it
          return false;
        }
      });
    } catch {
      // If target key can't be normalized, no match
      return false;
    }
  }
  
  // Get human-readable key names from indices
  export function getKeyNames(indices: number[]): string[] {
    return indices.map(index => CHROMATIC_KEYS[index]).filter(Boolean);
  }
  
  // Get all possible key combinations for a given tolerance
  export function getCompatibleKeys(targetKey: string, tolerance: number): string[] {
    const allowedIndices = getKeyRange(targetKey, tolerance);
    return Array.from(allowedIndices).map(index => CHROMATIC_KEYS[index]);
  }
  
  // Check if two keys are compatible
  export function areKeysCompatible(key1: string, key2: string, tolerance: number): boolean {
    try {
      const index1 = normalizeKey(key1);
      const index2 = normalizeKey(key2);
      const diff = Math.min(
        Math.abs(index1 - index2),
        12 - Math.abs(index1 - index2)
      );
      return diff <= tolerance;
    } catch {
      return false;
    }
  }

  /**
   * Parse a key string to extract pitch class and mode.
   * Returns null if the key cannot be parsed.
   * 
   * @param key - The key string (e.g., "D Major", "d minor", "C#")
   * @returns Object with pitchClass (0-11) and mode ('major' | 'minor' | null), or null if invalid
   */
  export function parseKeyToPitchClass(key: string): { pitchClass: number; mode: 'major' | 'minor' | null } | null {
    if (!key || typeof key !== 'string') {
      return null;
    }

    try {
      // Case-insensitive parsing
      const normalized = key.trim();
      if (!normalized) {
        return null;
      }

      // Extract mode (Major, Minor, or neither)
      const majorMatch = /\b(major|maj|M)\b/i.exec(normalized);
      const minorMatch = /\b(minor|min|m)\b/i.exec(normalized);
      
      let mode: 'major' | 'minor' | null = null;
      if (majorMatch) {
        mode = 'major';
      } else if (minorMatch) {
        mode = 'minor';
      }

      // Remove mode from key string for pitch class extraction
      const base = normalized.replace(/\s+(Major|Minor|Maj|Min|M|m)\b/gi, "").trim();
      
      // Handle enharmonic equivalents (case-insensitive)
      const normalizedBase = base
        .replace(/Db/gi, 'C#')
        .replace(/Eb/gi, 'D#')
        .replace(/Gb/gi, 'F#')
        .replace(/Ab/gi, 'A#')
        .replace(/Bb/gi, 'A#')
        .replace(/Cb/gi, 'B')
        .replace(/Fb/gi, 'E')
        .replace(/E#/gi, 'F')
        .replace(/B#/gi, 'C');

      const index = CHROMATIC_KEYS.findIndex(k => k.toLowerCase() === normalizedBase.toLowerCase());
      
      if (index === -1) {
        return null;
      }

      return { pitchClass: index, mode };
    } catch {
      return null;
    }
  }

  /**
   * Calculate harmonic distance-based similarity score between two keys.
   * Returns a score between 0 and 1, where:
   * - 1.0 = exact match (same pitch class and mode)
   * - 0.85 = same pitch class but different mode (Major vs Minor)
   * - 0.0 = maximum distance (tritone, 6 semitones apart)
   * 
   * Uses circular semitone distance with normalization to [0,1] range.
   * 
   * @param key1 - First key string
   * @param key2 - Second key string
   * @returns Similarity score between 0 and 1, or 0 if either key is invalid
   */
  export function calculateKeyDistance(key1: string, key2: string): number {
    const parsed1 = parseKeyToPitchClass(key1);
    const parsed2 = parseKeyToPitchClass(key2);

    // If either key is invalid, return 0
    if (!parsed1 || !parsed2) {
      return 0;
    }

    // Exact match: same pitch class and same mode
    if (parsed1.pitchClass === parsed2.pitchClass && parsed1.mode === parsed2.mode) {
      return 1.0;
    }

    // Calculate circular semitone distance
    // Circular distance accounts for enharmonic equivalence (C# = Db)
    const diff = Math.abs(parsed1.pitchClass - parsed2.pitchClass);
    const circularDistance = Math.min(diff, 12 - diff);

    // Normalize distance to [0,1] range
    // Max circular distance is 6 semitones (tritone), so divide by 6
    const normalizedDistance = circularDistance / 6;

    // Calculate similarity score: 1 - normalizedDistance
    let sectionScore = 1 - normalizedDistance;

    // Apply mode penalty if pitch class matches but mode differs
    // Mode penalty: 0.15 (15% reduction)
    if (parsed1.pitchClass === parsed2.pitchClass && parsed1.mode !== parsed2.mode) {
      // Both have modes and they differ
      if (parsed1.mode !== null && parsed2.mode !== null) {
        sectionScore = 1.0 - 0.15; // 0.85 for same pitch class, different mode
      }
    }

    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, sectionScore));
  }