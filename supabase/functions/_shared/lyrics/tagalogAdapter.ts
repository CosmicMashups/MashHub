import type { TokenizedWord, LyricNlpAdapter } from './englishAdapter.ts';
import { LYRIC_FILLER_VOCABLES } from '../../../../src/constants/lyrics.ts';

// Tagalog stopwords
const TL_STOPWORDS = new Set([
  'ang', 'mga', 'ng', 'sa', 'at', 'na', 'ay', 'si', 'ni', 'kay', 'ako', 'ikaw', 'ka', 'siya',
  'tayo', 'kami', 'kayo', 'sila', 'ito', 'iyan', 'iyon', 'dito', 'diyan', 'doon', 'nito',
  'niyan', 'noon', 'ano', 'sino', 'saan', 'kailan', 'bakit', 'paano', 'hindi', 'oo', 'wala',
  'meron', 'may', 'para', 'dahil', 'kung', 'kapag', 'pero', 'ngunit', 'subalit', 'lang',
  'naman', 'din', 'rin', 'pa', 'ba', 'kaya', 'pala', 'sana', 'ko', 'mo', 'nyo', 'namin', 'natin'
]);

const TL_FILLERS = new Set(LYRIC_FILLER_VOCABLES.tl);

// Common Tagalog affixes (prefixes, suffixes, infixes)
const PREFIXES = [
  'pinagka', 'napagka', 'nakikipag', 'pakikipag',
  'ipinag', 'ikinapang', 'nakapag', 'magpaka',
  'makapag', 'nakiki', 'makiki',
  'nagpa', 'magpa', 'nang', 'mang', 'naka', 'maka',
  'nag', 'mag', 'pag', 'um', 'in', 'i', 'na', 'ma'
];

const SUFFIXES = [
  'anhan', 'inhan', 'anan', 'inan',
  'han', 'hin', 'nan', 'nin',
  'an', 'in'
];

/**
 * Pure TypeScript Tagalog NLP Adapter.
 * Implements regex word split, rule-based affix stripping, and reduplication collapse.
 */
export class TagalogLyricNlpAdapter implements LyricNlpAdapter {
  lang: 'tl' = 'tl';

  private stemTagalog(surface: string): string {
    let word = surface.toLowerCase();

    // Reduplication collapse: e.g. "sayaw-sayaw" -> "sayaw", "gabi-gabi" -> "gabi"
    if (word.includes('-')) {
      const parts = word.split('-');
      if (parts.length === 2 && parts[0] === parts[1]) {
        return parts[0];
      }
    }

    // Partial reduplication: e.g. "sasayaw" -> "sayaw" (first CV duplicated)
    if (word.length >= 5 && word.slice(0, 2) === word.slice(2, 4)) {
      word = word.slice(2);
    }

    // Infix stripping: -um- and -in- (e.g. sumayaw -> sayaw, binasa -> basa)
    if (word.length >= 5) {
      if (word.slice(1, 3) === 'um' || word.slice(1, 3) === 'in') {
        word = word[0] + word.slice(3);
      }
    }

    // Prefix stripping
    for (const prefix of PREFIXES) {
      if (word.startsWith(prefix) && word.length - prefix.length >= 3) {
        word = word.slice(prefix.length);
        break;
      }
    }

    // Suffix stripping
    for (const suffix of SUFFIXES) {
      if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
        word = word.slice(0, -suffix.length);
        break;
      }
    }

    return word;
  }

  tokenize(line: string): TokenizedWord[] {
    if (!line || typeof line !== 'string') return [];

    const rawWords = line
      .toLowerCase()
      .replace(/[^\p{L}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const tokens: TokenizedWord[] = [];

    for (const surface of rawWords) {
      const clean = surface.replace(/^-+|-+$/g, '');
      if (!clean) continue;

      const isStop = TL_STOPWORDS.has(clean) || TL_FILLERS.has(clean) || clean.length < 2;
      const lemma = isStop ? clean : this.stemTagalog(clean);

      tokens.push({
        surface: clean,
        lemma,
        isStop,
      });
    }

    return tokens;
  }
}
