import { describe, it, expect } from 'vitest';
import { parseLrc } from '../../supabase/functions/_shared/lyrics/lrcParser';
import { cleanLyricLine } from '../../supabase/functions/_shared/lyrics/lineCleaner';
import { normalizeTitleArtist, stringSimilarity } from '../../supabase/functions/_shared/lyrics/titleNormalizer';
import { detectLineLanguage } from '../../supabase/functions/_shared/lyrics/languageDetector';
import { collapseDuplicateTokens, generateNgrams } from '../../supabase/functions/_shared/lyrics/ngramHelper';
import { EnglishLyricNlpAdapter, processLineForIndex } from '../../supabase/functions/_shared/lyrics/englishAdapter';
import { lemmatizeEnglish } from '../../supabase/functions/_shared/lyrics/englishLemmatizer';

describe('Lyric Core Library (_shared/lyrics)', () => {
  describe('LRC Parser', () => {
    it('parses synced LRC with multiple lines and timestamps', () => {
      const lrc = `
[ti: Stronger]
[ar: Sam Feldt]
[00:15.30] If you wanna get stronger
[00:20.50] You gotta run
      `;
      const parsed = parseLrc(lrc);
      expect(parsed.hasTimestamps).toBe(true);
      expect(parsed.lines).toHaveLength(2);
      expect(parsed.lines[0].text).toBe('If you wanna get stronger');
      expect(parsed.lines[0].startMs).toBe(15300);
      expect(parsed.lines[1].text).toBe('You gotta run');
      expect(parsed.lines[1].startMs).toBe(20500);
    });

    it('parses plain lyrics without timestamps', () => {
      const plain = `Line one\nLine two\n\nLine three`;
      const parsed = parseLrc(plain);
      expect(parsed.hasTimestamps).toBe(false);
      expect(parsed.lines).toHaveLength(3);
      expect(parsed.lines[0].text).toBe('Line one');
      expect(parsed.lines[0].startMs).toBeUndefined();
    });
  });

  describe('Line Cleaner', () => {
    it('identifies standalone section headers', () => {
      const res = cleanLyricLine('[Chorus]');
      expect(res).toEqual({ text: '', sectionHint: 'Chorus' });
    });

    it('strips inline tags and trims text', () => {
      const res = cleanLyricLine('  We dance tonight [Verse 2]  ');
      expect(res?.text).toBe('We dance tonight');
    });
  });

  describe('Title and Artist Normalizer', () => {
    it('strips feat, remixes, and brackets', () => {
      expect(normalizeTitleArtist('Song Title (feat. Artist B) [Remix]')).toBe('song title');
      expect(normalizeTitleArtist('Anime OP (TV Size)')).toBe('anime op');
    });

    it('calculates dice similarity accurately', () => {
      expect(stringSimilarity('Stronger', 'Stronger (Club Mix)')).toBe(1.0);
      expect(stringSimilarity('Dance with me', 'Dance with you')).toBeGreaterThan(0.6);
    });
  });

  describe('Language Detector', () => {
    it('identifies Hangul as ko', () => {
      expect(detectLineLanguage('보고 싶다 이렇게 말하니까 더 보고 싶다')).toBe('ko');
    });

    it('identifies Kana/Kanji as ja', () => {
      expect(detectLineLanguage('君の笑顔がまぶしくて')).toBe('ja');
      expect(detectLineLanguage('心臓を捧げよ')).toBe('ja');
    });

    it('identifies Tagalog markers as tl', () => {
      expect(detectLineLanguage('Mahal kita pero hindi ko kaya')).toBe('tl');
      expect(detectLineLanguage('Sana tayo na lang dalawa sa buhay na ito')).toBe('tl');
    });

    it('identifies English text as en', () => {
      expect(detectLineLanguage('If you wanna get stronger')).toBe('en');
      expect(detectLineLanguage('Every time I cry I get a little bit stronger')).toBe('en');
    });
  });

  describe('Repetition Collapse & N-grams', () => {
    it('collapses consecutive identical tokens', () => {
      const tokens = ['dance', 'dance', 'dance', 'hand', 'hand', 'head'];
      expect(collapseDuplicateTokens(tokens)).toEqual(['dance', 'hand', 'head']);
    });

    it('generates n-grams up to maxN', () => {
      const ngrams = generateNgrams(['party', 'all', 'night'], 2);
      expect(ngrams).toEqual([
        ['party'], ['all'], ['night'],
        ['party', 'all'], ['all', 'night']
      ]);
    });
  });

  describe('English Adapter & Acceptance Criteria Tests', () => {
    const adapter = new EnglishLyricNlpAdapter();

    it('Acceptance 11.1 Item 4: "Stronger" case', () => {
      const line1 = 'If you wanna get stronger';
      const line2 = 'Every time I cry, I get a little bit stronger';

      const p1 = processLineForIndex(adapter, line1);
      const p2 = processLineForIndex(adapter, line2);

      // "stronger" lemmatizes to "strong"
      expect(p1.tokens).toContain('strong');
      expect(p2.tokens).toContain('strong');
    });

    it('Acceptance 11.1 Item 2: Word form "eyes" / "eye"', () => {
      expect(lemmatizeEnglish('eyes')).toBe('eye');
      expect(lemmatizeEnglish('danced')).toBe('dance');

      const p1 = processLineForIndex(adapter, "I've got my eye on you");
      const p2 = processLineForIndex(adapter, 'All eyes on me');

      expect(p1.tokens).toContain('eye');
      expect(p2.tokens).toContain('eye');
      expect(p1.surfaceTokens).toContain('eye');
      expect(p2.surfaceTokens).toContain('eyes');
    });

    it('Acceptance 11.1 Item 3: Repetition collapse with dance/hands', () => {
      const line = 'dance, dance, dance with my hands, hands, hands above my head';
      const p = processLineForIndex(adapter, line);

      // Should have collapsed consecutive dance -> dance, hands -> hand
      expect(p.tokens).toEqual(['dance', 'hand', 'head']);
    });

    it('Acceptance 11.1 Item 7: Filler words (oh, yeah) dropped as stopwords', () => {
      const line = 'Oh yeah ooh baby';
      const p = processLineForIndex(adapter, line);

      expect(p.tokens).toEqual(['baby']);
      expect(p.tokens).not.toContain('oh');
      expect(p.tokens).not.toContain('yeah');
      expect(p.tokens).not.toContain('ooh');
    });
  });
});
