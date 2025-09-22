import { CHROMATIC_KEYS, normalizeKey } from './keyNormalization';

// Returns true if candidateKey is within the linked circular range from startKey to endKey inclusive.
// The linked list cycles ... A# -> B -> C -> C# ...
export function isKeyInLinkedRange(startKey: string, endKey: string, candidateKey: string): boolean {
  try {
    const start = normalizeKey(startKey);
    const end = normalizeKey(endKey);
    const cand = normalizeKey(candidateKey);

    // Walk from start to end clockwise on the 12-key ring
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


