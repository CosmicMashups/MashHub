// BPM matching functions
export function matchesBpmRange(songBpms: number[], targetBpm: number, delta: number): boolean {
    return songBpms.some(bpm => bpm >= targetBpm - delta && bpm <= targetBpm + delta);
  }
  
  // Get BPM compatibility score (0-1, higher is more compatible)
  // Uses less sensitive computation: penalty is reduced by 1.5x to make weight computation less sensitive
  export function getBpmCompatibilityScore(songBpms: number[], targetBpm: number, maxDelta: number): number {
    if (songBpms.length === 0) return 0;
    
    const bestMatch = songBpms.reduce((best, bpm) => {
      const diff = Math.abs(bpm - targetBpm);
      return diff < best ? diff : best;
    }, Infinity);
    
    // Hard cutoff if beyond maxDelta
    if (bestMatch > maxDelta) return 0;
    
    // Apply 1.5x less sensitive computation (divide penalty by 1.5, or multiply denominator by 1.5)
    // Formula: similarity = max(0, 1 - (distance / (15 * 1.5))) = max(0, 1 - (distance / 22.5))
    return Math.max(0, 1 - (bestMatch / (15 * 1.5)));
  }
  
  /**
   * Check if two BPMs are harmonically related (e.g., 120 and 240).
   *
   * The tolerance parameter is interpreted as a percentage window around each
   * harmonic ratio (e.g., 5 → ±5%). This keeps the function compatible with
   * callers that pass values like `DEFAULT_BPM_TOLERANCE = 10` while still
   * enforcing a musically tight window.
   */
  export function areBpmsHarmonicallyRelated(bpm1: number, bpm2: number, tolerancePercent: number = 5): boolean {
    if (bpm1 <= 0 || bpm2 <= 0) return false;

    const ratio1 = bpm1 / bpm2;
    const ratio2 = bpm2 / bpm1;

    // Allow a small percentage window around each harmonic ratio.
    const tol = Math.abs(tolerancePercent) / 100;

    // Include 1 (same tempo) plus common harmonic ratios.
    const harmonicRatios = [1, 2, 3, 4, 1.5, 0.5, 0.75, 1.33];

    return harmonicRatios.some((ratio) =>
      Math.abs(ratio1 - ratio) <= tol || Math.abs(ratio2 - ratio) <= tol
    );
  }

  /**
   * Quick Match BPM score (0–1) for section-level comparison.
   * Piecewise linear / sigmoid-style: 0 BPM apart = 100%, 5 = 90%, 10 = 80%, 11+ = 70% and decreasing.
   * Used with QUICK_MATCH_WEIGHT_BPM (0.45).
   */
  export function getQuickMatchBpmScore(bpm1: number, bpm2: number): number {
    const diff = Math.abs(bpm1 - bpm2);
    if (diff <= 10) {
      return Math.max(0, 1 - diff * 0.02);
    }
    return Math.max(0, 0.7 - (diff - 11) * (0.7 / 9));
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