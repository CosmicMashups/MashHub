// BPM matching functions
export function matchesBpmRange(songBpms: number[], targetBpm: number, delta: number): boolean {
    return songBpms.some(bpm => bpm >= targetBpm - delta && bpm <= targetBpm + delta);
  }
  
  // Get BPM compatibility score (0-1, higher is more compatible)
  export function getBpmCompatibilityScore(songBpms: number[], targetBpm: number, maxDelta: number): number {
    if (songBpms.length === 0) return 0;
    
    const bestMatch = songBpms.reduce((best, bpm) => {
      const diff = Math.abs(bpm - targetBpm);
      return diff < best ? diff : best;
    }, Infinity);
    
    if (bestMatch > maxDelta) return 0;
    
    // Return score based on how close the match is
    return Math.max(0, 1 - (bestMatch / maxDelta));
  }
  
  // Check if two BPMs are harmonically related (e.g., 120 and 240)
  export function areBpmsHarmonicallyRelated(bpm1: number, bpm2: number, tolerance: number = 5): boolean {
    // Check if one is a multiple of the other
    const ratio1 = bpm1 / bpm2;
    const ratio2 = bpm2 / bpm1;
    
    // Check for common harmonic ratios
    const harmonicRatios = [2, 3, 4, 1.5, 0.5, 0.75, 1.33];
    
    return harmonicRatios.some(ratio => 
      Math.abs(ratio1 - ratio) < tolerance || 
      Math.abs(ratio2 - ratio) < tolerance
    );
  }
  
  // Get suggested BPM adjustments for better matching
  export function getBpmAdjustmentSuggestions(songBpms: number[], targetBpm: number): number[] {
    const suggestions: number[] = [];
    
    songBpms.forEach(bpm => {
      // Direct match
      if (Math.abs(bpm - targetBpm) <= 5) {
        suggestions.push(bpm);
      }
      
      // Half-time
      if (Math.abs(bpm * 0.5 - targetBpm) <= 5) {
        suggestions.push(bpm * 0.5);
      }
      
      // Double-time
      if (Math.abs(bpm * 2 - targetBpm) <= 5) {
        suggestions.push(bpm * 2);
      }
      
      // 1.5x (common in electronic music)
      if (Math.abs(bpm * 1.5 - targetBpm) <= 5) {
        suggestions.push(bpm * 1.5);
      }
    });
    
    return [...new Set(suggestions)].sort((a, b) => Math.abs(a - targetBpm) - Math.abs(b - targetBpm));
  }