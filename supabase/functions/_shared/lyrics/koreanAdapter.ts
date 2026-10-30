import type { TokenizedWord, LyricNlpAdapter } from './englishAdapter.ts';
import { LYRIC_FILLER_VOCABLES } from '../../../../src/constants/lyrics.ts';

// Common Korean stopwords / particles / markers
const KO_STOPWORDS = new Set([
  '이', '그', '저', '것', '수', '등', '들', '및', '제', '더', '를', '과',
  '를', '에', '와', '한', '하다', '에서', '으로', '로', '에게', '뿐', '의',
  '가', '은', '는', '도', '만', '과', '와', '랑', '이랑', '보다', '처럼',
  '마저', '조차', '부터', '까지', '나', '너', '우리', '그들', '저희', '네'
]);

const KO_FILLERS = new Set(LYRIC_FILLER_VOCABLES.ko);

// Common grammatical josa (particles) and eomi (verb endings) to strip from eojeol
const JOSA_SUFFIXES = [
  '에서는', '에게는', '으로는', '에서도', '에게서',
  '에서', '에게', '으로', '한테', '처럼', '보다',
  '에는', '에도', '까지', '부터', '마다', '이나',
  '은', '는', '이', '가', '을', '를', '에', '와', '과', '로', '도', '만', '의', '랑'
];

const EOMI_SUFFIXES = [
  '있었어', '있었다', '하니까', '하는데', '했는데', '했었다',
  '하는', '했던', '하고', '하면', '해서', '잖아', '잖아',
  '어요', '아요', '었어', '았어', '었다', '았다', '는다', 'ㄴ다',
  '니다', '세요', '니까', '다면', '려고', '면서'
];

/**
 * Pure TypeScript Korean NLP Adapter.
 * Implements Intl.Segmenter word split into eojeol + rule-based suffix/particle stripping.
 */
export class KoreanLyricNlpAdapter implements LyricNlpAdapter {
  lang: 'ko' = 'ko';

  private segmentText(line: string): string[] {
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter('ko', { granularity: 'word' });
      const segments: string[] = [];
      for (const seg of segmenter.segment(line)) {
        const text = seg.segment.trim();
        if (text) segments.push(text);
      }
      return segments;
    }
    return line.split(/\s+/).map((s) => s.trim()).filter(Boolean);
  }

  private stemEojeol(surface: string): string {
    let stem = surface;

    // 1. Try stripping josa (particles)
    for (const josa of JOSA_SUFFIXES) {
      if (stem.endsWith(josa) && stem.length > josa.length + 1) {
        stem = stem.slice(0, -josa.length);
        break;
      }
    }

    // 2. Try stripping verb endings
    for (const eomi of EOMI_SUFFIXES) {
      if (stem.endsWith(eomi) && stem.length > eomi.length + 1) {
        stem = stem.slice(0, -eomi.length);
        break;
      }
    }

    return stem;
  }

  tokenize(line: string): TokenizedWord[] {
    if (!line || typeof line !== 'string') return [];

    const segments = this.segmentText(line);
    const tokens: TokenizedWord[] = [];

    for (const segment of segments) {
      const clean = segment.replace(/[.,!?~…\s]/g, '').trim();
      if (!clean) continue;

      const isStop = KO_STOPWORDS.has(clean) || KO_FILLERS.has(clean);
      const lemma = isStop ? clean : this.stemEojeol(clean);

      tokens.push({
        surface: clean,
        lemma,
        isStop,
      });
    }

    return tokens;
  }
}
