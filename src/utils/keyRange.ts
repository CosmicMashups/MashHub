import { normalizeKey } from './keyNormalization';

/**
 * Returns true if candidateKey's **normalized** pitch class (equivalent major) lies on the
 * clockwise arc from startKey's PC to endKey's PC inclusive on the 12-point chromatic circle.
 * Uses normalized PCs, not list indices — works for any mode spelling (e.g. D Dorian vs D Major start).
 */
export function isKeyInLinkedRange(startKey: string, endKey: string, candidateKey: string): boolean {
  try {
    const start = normalizeKey(startKey);
    const end = normalizeKey(endKey);
    const cand = normalizeKey(candidateKey);

    // Walk from start to end clockwise on the ring of normalized pitch classes 0..11
    let i = start;
    for (let steps = 0; steps < 12; steps++) {
      if (i === cand) return true;
      if (i === end) return false; // we reached end without matching cand
      i = (i + 1) % 12;
    }
    return false;
  } catch {
    return false;
  }
}


