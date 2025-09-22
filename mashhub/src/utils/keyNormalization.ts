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