import type { LyricLanguage } from '../../../../src/types/lyrics';
import { lemmatizeEnglish } from './englishLemmatizer.ts';
import { ENGLISH_STOPWORDS } from './englishStopwords.ts';
import { collapseDuplicateTokens } from './ngramHelper.ts';

export interface TokenizedWord {
  surface: string;
  lemma: string;
  isStop: boolean;
}

export interface LyricNlpAdapter {
  lang: LyricLanguage;
  tokenize(line: string): TokenizedWord[];
}

export class EnglishLyricNlpAdapter implements LyricNlpAdapter {
  lang: LyricLanguage = 'en';

  tokenize(line: string): TokenizedWord[] {
    if (!line || typeof line !== 'string') return [];

    // Split on words, normalize apostrophes
    const normalized = line.replace(/[’']/g, '');
    const rawTokens = normalized
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const tokens: TokenizedWord[] = [];
    for (const surface of rawTokens) {
      const isStop = ENGLISH_STOPWORDS.has(surface) || surface.length < 2;
      const lemma = isStop ? surface : lemmatizeEnglish(surface);
      tokens.push({
        surface,
        lemma,
        isStop,
      });
    }

    return tokens;
  }
}

/**
 * Helper to process a line into indexed lemmas and parallel surface tokens.
 * Drops stopwords & fillers, collapses consecutive duplicate lemmas (D6).
 */
export function processLineForIndex(
  adapter: LyricNlpAdapter,
  lineText: string
): { tokens: string[]; surfaceTokens: string[] } {
  const tokenized = adapter.tokenize(lineText);
  const contentWords = tokenized.filter((t) => !t.isStop);

  if (contentWords.length === 0) {
    return { tokens: [], surfaceTokens: [] };
  }

  // Collapse consecutive duplicates based on lemma
  const tokens: string[] = [contentWords[0].lemma];
  const surfaceTokens: string[] = [contentWords[0].surface];

  for (let i = 1; i < contentWords.length; i++) {
    const cur = contentWords[i];
    const prevLemma = tokens[tokens.length - 1];
    if (cur.lemma !== prevLemma) {
      tokens.push(cur.lemma);
      surfaceTokens.push(cur.surface);
    }
  }

  return { tokens, surfaceTokens };
}
