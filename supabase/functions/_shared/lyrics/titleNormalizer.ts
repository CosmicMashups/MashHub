/**
 * Normalizes title and artist strings for LRCLIB and lookup services:
 * - Removes parenthetical attributes like (feat. X), (Remix), (TV Size), [Instrumental]
 * - Strips punctuation, trims and collapses extra whitespace
 * - Keeps original alphanumeric letters in lowercase
 */
export function normalizeTitleArtist(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let normalized = input
    // Remove (feat. ...), [feat ...], (with ...)
    .replace(/\s*[\(\[](?:feat|featuring|with|ft)\.?[^\)\]]*[\)\]]/gi, '')
    // Remove (TV Size), (TV Edit), (Short Ver.)
    .replace(/\s*[\(\[](?:tv\s*size|tv\s*version|tv\s*edit|short\s*ver\.?)[^\)\]]*[\)\]]/gi, '')
    // Remove (Remix), (Club Mix), (Acoustic), (Live), [Official ...]
    .replace(/\s*[\(\[](?:remix|mix|acoustic|live|official|audio|video|instrumental)[^\)\]]*[\)\]]/gi, '')
    // Remove generic brackets/parentheses content if trailing
    .replace(/\s*[\(\[][^\)\]]*[\)\]]$/, '')
    .toLowerCase()
    .trim();

  // Collapse excess whitespace
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Calculates dice coefficient / bigram similarity between two normalized strings (0 to 1).
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitleArtist(str1).replace(/[^a-z0-9]/g, '');
  const s2 = normalizeTitleArtist(str2).replace(/[^a-z0-9]/g, '');

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1.0 : 0.0;

  const pairs1 = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const pair = s1.slice(i, i + 2);
    pairs1.set(pair, (pairs1.get(pair) || 0) + 1);
  }

  let matches = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const pair = s2.slice(i, i + 2);
    const count = pairs1.get(pair) || 0;
    if (count > 0) {
      pairs1.set(pair, count - 1);
      matches++;
    }
  }

  return (2.0 * matches) / ((s1.length - 1) + (s2.length - 1));
}
