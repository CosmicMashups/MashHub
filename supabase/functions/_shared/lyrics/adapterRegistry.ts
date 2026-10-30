import type { LyricLanguage } from '../../../../src/types/lyrics';
import { LyricNlpAdapter, EnglishLyricNlpAdapter } from './englishAdapter.ts';
import { JapaneseLyricNlpAdapter } from './japaneseAdapter.ts';
import { KoreanLyricNlpAdapter } from './koreanAdapter.ts';
import { TagalogLyricNlpAdapter } from './tagalogAdapter.ts';

const enAdapter = new EnglishLyricNlpAdapter();
const jaAdapter = new JapaneseLyricNlpAdapter();
const koAdapter = new KoreanLyricNlpAdapter();
const tlAdapter = new TagalogLyricNlpAdapter();

export function getLyricAdapter(lang: LyricLanguage): LyricNlpAdapter {
  switch (lang) {
    case 'ja':
      return jaAdapter;
    case 'ko':
      return koAdapter;
    case 'tl':
      return tlAdapter;
    case 'en':
    case 'other':
    default:
      return enAdapter;
  }
}
