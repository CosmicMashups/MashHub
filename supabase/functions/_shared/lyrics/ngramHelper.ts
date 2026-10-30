/**
 * Collapses consecutive duplicate tokens:
 * e.g. ["dance", "dance", "dance", "hands", "hands"] -> ["dance", "hands"]
 */
export function collapseDuplicateTokens<T>(tokens: T[]): T[] {
  if (!tokens || tokens.length === 0) return [];
  const result: T[] = [tokens[0]];
  for (let i = 1; i < tokens.length; i++) {
    if (tokens[i] !== tokens[i - 1]) {
      result.push(tokens[i]);
    }
  }
  return result;
}

/**
 * Generates contiguous n-grams from an array of tokens (n from 1 to maxN).
 */
export function generateNgrams(tokens: string[], maxN = 4): string[][] {
  const ngrams: string[][] = [];
  const len = tokens.length;

  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i <= len - n; i++) {
      ngrams.push(tokens.slice(i, i + n));
    }
  }

  return ngrams;
}
