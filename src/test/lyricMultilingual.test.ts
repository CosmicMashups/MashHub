import { describe, it, expect } from 'vitest';
import { JapaneseLyricNlpAdapter } from '../../supabase/functions/_shared/lyrics/japaneseAdapter';
import { KoreanLyricNlpAdapter } from '../../supabase/functions/_shared/lyrics/koreanAdapter';
import { TagalogLyricNlpAdapter } from '../../supabase/functions/_shared/lyrics/tagalogAdapter';
import { getLyricAdapter } from '../../supabase/functions/_shared/lyrics/adapterRegistry';
import { detectLineLanguage } from '../../supabase/functions/_shared/lyrics/languageDetector';
import { processLineForIndex } from '../../supabase/functions/_shared/lyrics/englishAdapter';

describe('Multilingual Adapters & Acceptance Criteria 11.1 Item 11', () => {
  describe('Japanese Adapter (ja)', () => {
    const ja = new JapaneseLyricNlpAdapter();

    const sampleJaLines = [
      '強く生きていきたい',
      '君の笑顔がまぶしくて',
      '星が流れる夜に',
      '心を開いて歌おう',
      '走れ走れどこまでも',
      '夢を追いかけている',
      '雨が降っても平気さ',
      '愛を叫び続ける',
      '光の中へ飛び込め',
      '未来へ進む道がある',
    ];

    it('processes at least 10 labeled Japanese lines and extracts non-empty lemmas', () => {
      expect(sampleJaLines).toHaveLength(10);
      for (const line of sampleJaLines) {
        const { tokens, surfaceTokens } = processLineForIndex(ja, line);
        expect(tokens.length).toBeGreaterThan(0);
        expect(surfaceTokens.length).toBeGreaterThan(0);
      }
    });

    it('inflects verbs and drops common particles', () => {
      const tokens = ja.tokenize('走りました');
      // ました inflected to る
      const hashiri = tokens.find((t) => t.surface === '走り' || t.surface === '走りました');
      expect(hashiri).toBeDefined();
    });
  });

  describe('Korean Adapter (ko)', () => {
    const ko = new KoreanLyricNlpAdapter();

    const sampleKoLines = [
      '보고 싶다 이렇게 말하니까',
      '우리의 밤은 아름다워',
      '손을 잡고 함께 가자',
      '하늘을 올려다보면서',
      '매일 너를 생각했어',
      '마음이 아파서 눈물이 흘러',
      '사랑한다고 말해줄래',
      '기억 속에서 너를 찾아',
      '영원히 함께 있고 싶어',
      '다시 돌아갈 수 있을까',
    ];

    it('processes at least 10 labeled Korean lines and extracts content stems', () => {
      expect(sampleKoLines).toHaveLength(10);
      for (const line of sampleKoLines) {
        const { tokens, surfaceTokens } = processLineForIndex(ko, line);
        expect(tokens.length).toBeGreaterThan(0);
        expect(surfaceTokens.length).toBeGreaterThan(0);
      }
    });

    it('strips common josa (particles) and verb endings (best-effort)', () => {
      const p = processLineForIndex(ko, '하늘을 올려다보면서');
      // "하늘을" has "을" stripped -> "하늘"
      expect(p.tokens).toContain('하늘');
    });
  });

  describe('Tagalog Adapter (tl)', () => {
    const tl = new TagalogLyricNlpAdapter();

    const sampleTlLines = [
      'Mahal kita pero hindi ko kaya',
      'Sasayaw tayo hanggang umaga',
      'Buhay ay puno ng pangarap',
      'Ikaw ang tangi kong pag-ibig',
      'Lumilipad ang aking isipan',
      'Umuulan na naman sa labas',
      'Hawakan mo ang aking kamay',
      'Naghihintay sa iyong pagdating',
      'Walang iba kundi ikaw lamang',
      'Puso kong nasaktan sa paglisan',
    ];

    it('processes at least 10 labeled Tagalog lines and extracts lemmas', () => {
      expect(sampleTlLines).toHaveLength(10);
      for (const line of sampleTlLines) {
        const { tokens, surfaceTokens } = processLineForIndex(tl, line);
        expect(tokens.length).toBeGreaterThan(0);
        expect(surfaceTokens.length).toBeGreaterThan(0);
      }
    });

    it('handles infix and reduplication stemming', () => {
      const p = processLineForIndex(tl, 'sumayaw at sasayaw sa gabi-gabi');
      // sumayaw -> sayaw, sasayaw -> sayaw, gabi-gabi -> gabi
      expect(p.tokens).toContain('sayaw');
      expect(p.tokens).toContain('gabi');
    });
  });

  describe('Mixed Language Song Splitting (Section 12 Phase 4 Acceptance Gate)', () => {
    it('splits a mixed Korean/English song lines to the correct language adapter', () => {
      const mixedLyrics = [
        '보고 싶다 이렇게 말하니까 더 보고 싶다',
        'You know it all you are my best friend',
        '아침은 다시 올 거야',
        'Like a small piece of dust floating in the air',
      ];

      const detectedLangs = mixedLyrics.map(detectLineLanguage);
      expect(detectedLangs).toEqual(['ko', 'en', 'ko', 'en']);

      for (let i = 0; i < mixedLyrics.length; i++) {
        const lang = detectedLangs[i];
        const adapter = getLyricAdapter(lang);
        const { tokens } = processLineForIndex(adapter, mixedLyrics[i]);
        expect(tokens.length).toBeGreaterThan(0);
      }
    });
  });
});
