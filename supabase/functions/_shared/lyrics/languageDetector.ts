import type { LyricLanguage } from '../../../../src/types/lyrics';

const HANGUL_REGEX = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/;
const KANA_REGEX = /[\u3040-\u30ff]/;
const CJK_IDEOGRAPH_REGEX = /[\u4e00-\u9faf]/;

// High-frequency Tagalog markers
const TAGALOG_MARKERS = new Set([
  'ang', 'mga', 'ng', 'sa', 'at', 'na', 'ay', 'si', 'ni', 'kay', 'ako', 'ikaw', 'ka', 'siya',
  'tayo', 'kami', 'kayo', 'sila', 'ito', 'iyan', 'iyon', 'dito', 'diyan', 'doon', 'nito',
  'niyan', 'noon', 'ano', 'sino', 'saan', 'kailan', 'bakit', 'paano', 'hindi', 'oo', 'wala',
  'meron', 'may', 'para', 'dahil', 'kung', 'kapag', 'pero', 'ngunit', 'subalit', 'buhay',
  'mahal', 'puso', 'lang', 'naman', 'din', 'rin', 'pa', 'ba', 'kaya', 'pala', 'sana'
]);

// High-frequency English markers
const ENGLISH_MARKERS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not',
  'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from',
  'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
  'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
  'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see'
]);

/**
 * Detects the language of a lyric line.
 * Per spec Section 6.1:
 * - Hangul → 'ko'
 * - Kana (or Kana+Han) → 'ja'; Han-only → 'ja' (v1 assumption)
 * - Latin → 'en' or 'tl' by stopword hit ratio; if neither wins clearly → 'other'
 */
export function detectLineLanguage(line: string): LyricLanguage {
  if (!line || typeof line !== 'string') return 'other';

  const text = line.trim();
  if (!text) return 'other';

  // 1. Check Hangul
  if (HANGUL_REGEX.test(text)) {
    return 'ko';
  }

  // 2. Check Kana / Kanji (v1 assumption: Han-only is ja)
  if (KANA_REGEX.test(text) || CJK_IDEOGRAPH_REGEX.test(text)) {
    return 'ja';
  }

  // 3. Latin word analysis
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return 'other';

  let enHits = 0;
  let tlHits = 0;

  for (const w of words) {
    if (ENGLISH_MARKERS.has(w)) enHits++;
    if (TAGALOG_MARKERS.has(w)) tlHits++;
  }

  if (tlHits > enHits && tlHits > 0) {
    return 'tl';
  }

  if (enHits > tlHits && enHits > 0) {
    return 'en';
  }

  // If words contain Latin characters and basic ratio is not decisive:
  // Default Latin text with common English lyrics tokens to 'en' if at least one letter is ASCII
  if (/^[a-zA-Z0-9\s'’.,!?-]+$/.test(text)) {
    return 'en';
  }

  return 'other';
}
