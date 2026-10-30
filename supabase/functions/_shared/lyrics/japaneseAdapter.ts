import type { TokenizedWord, LyricNlpAdapter } from './englishAdapter.ts';
import { LYRIC_FILLER_VOCABLES } from '../../../../src/constants/lyrics.ts';

// Common Japanese stopwords (particles, aux, formal nouns, copulas)
const JA_STOPWORDS = new Set([
  'の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ',
  'ある', 'いる', 'も', 'する', 'から', 'な', 'こと', 'として', 'い', 'や',
  'れる', 'など', 'なっ', 'ない', 'この', 'ため', 'その', 'あっ', 'よう',
  'また', 'もの', 'という', 'あり', 'まで', 'られ', 'なる', 'へ', 'か',
  'だ', 'これ', 'によって', 'により', 'おり', 'より', 'による', 'ず',
  'なり', 'られる', 'において', 'ば', 'なかっ', 'なく', 'しかし', 'について',
  'せ', 'だっ', 'その後', 'できる', 'それ', 'う', 'ので', 'なお', 'のみ',
  'でき', 'き', 'いただく', 'どこ', 'ここ', 'そこ', 'あの'
]);

// Japanese filler vocables
const JA_FILLERS = new Set(LYRIC_FILLER_VOCABLES.ja);

// Common verb/adj inflection endings in Japanese kana to normalize to base form
const INFLECTION_RULES: [RegExp, string][] = [
  [/ました$/, 'る'],
  [/ません$/, 'る'],
  [/ないで$/, 'る'],
  [/なくて$/, 'い'],
  [/かった$/, 'い'],
  [/くない$/, 'い'],
  [/ければ$/, 'い'],
  [/ている$/, 'る'],
  [/ていた$/, 'る'],
  [/てある$/, 'る'],
  [/ておく$/, 'る'],
  [/ていく$/, 'る'],
  [/てくる$/, 'る'],
  [/ちゃう$/, 'る'],
  [/ちゃった$/, 'る'],
  [/させる$/, 'する'],
  [/られた$/, 'る'],
  [/られる$/, 'る'],
  [/ましょう$/, 'る'],
  [/ない$/, 'る'],
  [/たい$/, 'る'],
  [/たく$/, 'る'],
  [/た$/, 'る'],
  [/て$/, 'る'],
  [/だ$/, 'る'],
];

/**
 * Pure TypeScript / lightweight morphological tokenizer for Japanese.
 * Works across Browser, Node (Vercel Serverless), and Deno without heavy dictionary files.
 */
export class JapaneseLyricNlpAdapter implements LyricNlpAdapter {
  lang: 'ja' = 'ja';

  private segmentText(line: string): string[] {
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter('ja', { granularity: 'word' });
      const segments: string[] = [];
      for (const seg of segmenter.segment(line)) {
        const text = seg.segment.trim();
        if (text) segments.push(text);
      }
      return segments;
    }
    // Fallback: split on script boundaries (Kanji / Hiragana / Katakana / Latin)
    const tokens = line.match(/([\u4e00-\u9faf]+|[\u3040-\u309f]+|[\u30a0-\u30ff]+|[a-zA-Z0-9]+)/g) || [];
    return tokens.map((t) => t.trim()).filter(Boolean);
  }

  private normalizeLemma(surface: string): string {
    let lemma = surface;
    for (const [regex, rep] of INFLECTION_RULES) {
      if (regex.test(lemma) && lemma.length > 2) {
        lemma = lemma.replace(regex, rep);
        break;
      }
    }
    return lemma;
  }

  tokenize(line: string): TokenizedWord[] {
    if (!line || typeof line !== 'string') return [];

    const segments = this.segmentText(line);
    const tokens: TokenizedWord[] = [];

    for (const surface of segments) {
      // Clean punctuation
      const clean = surface.replace(/[、。！？「」『』（）…\s]/g, '').trim();
      if (!clean) continue;

      const isStop =
        clean.length < 2 && /[\u3040-\u309f]/.test(clean) // single hiragana particles (は, を, に, が, で)
        || JA_STOPWORDS.has(clean)
        || JA_FILLERS.has(clean);

      const lemma = isStop ? clean : this.normalizeLemma(clean);

      tokens.push({
        surface: clean,
        lemma,
        isStop,
      });
    }

    return tokens;
  }
}
