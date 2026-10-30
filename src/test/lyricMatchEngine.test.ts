import { describe, it, expect } from 'vitest';
import { matchLyrics, RawLyricLine, SongMetadataLookup } from '../services/lyricMatchEngine';

describe('Lyric Match Engine Unit Tests (Section 11.1 Acceptance Criteria)', () => {
  const metadata: SongMetadataLookup = {
    song1: { title: 'Party Rock', artist: 'LMFAO' },
    song2: { title: 'Club Can Handle Me', artist: 'Flo Rida' },
    song3: { title: 'Stronger', artist: 'Sam Feldt' },
    song4: { title: 'Everytime I Cry', artist: 'Ava Max' },
    song5: { title: 'Judas', artist: 'Lady Gaga' },
    song6: { title: 'Gurenge', artist: 'LiSA' },
  };

  it('Acceptance 11.1 Item 1: Same words forms exact match with full lines and metadata', () => {
    const lines: RawLyricLine[] = [
      {
        id: 1,
        song_id: 'song1',
        line_index: 0,
        text: 'We gonna party like rockstars',
        repeat_count: 1,
        lang: 'en',
        tokens: ['parti', 'rockstar'],
        surface_tokens: ['party', 'rockstars'],
      },
      {
        id: 2,
        song_id: 'song2',
        line_index: 0,
        text: 'Tonight we gonna party like tomorrow is gone',
        repeat_count: 1,
        lang: 'en',
        tokens: ['tonight', 'parti', 'tomorrow'],
        surface_tokens: ['tonight', 'party', 'tomorrow'],
      },
    ];

    const groups = matchLyrics(lines, metadata);
    const partyGroup = groups.find((g) => g.sharedTerms.includes('parti'));
    expect(partyGroup).toBeDefined();
    expect(partyGroup?.kind).toBe('exact');
    expect(partyGroup?.members).toHaveLength(2);
    expect(partyGroup?.members[0].title).toBe('Party Rock');
    expect(partyGroup?.members[1].title).toBe('Club Can Handle Me');
    expect(partyGroup?.members[0].lineText).toBe('We gonna party like rockstars');
  });

  it('Acceptance 11.1 Item 2: Word form produces lemma kind with distinct surface terms', () => {
    const lines: RawLyricLine[] = [
      {
        id: 10,
        song_id: 'song1',
        line_index: 0,
        text: "I've got my eye on you",
        repeat_count: 1,
        lang: 'en',
        tokens: ['eye'],
        surface_tokens: ['eye'],
      },
      {
        id: 20,
        song_id: 'song2',
        line_index: 0,
        text: 'All eyes on me in the center of the ring',
        repeat_count: 1,
        lang: 'en',
        tokens: ['eye', 'center', 'ring'],
        surface_tokens: ['eyes', 'center', 'ring'],
      },
    ];

    const groups = matchLyrics(lines, metadata);
    const eyeGroup = groups.find((g) => g.sharedTerms.includes('eye'));
    expect(eyeGroup).toBeDefined();
    expect(eyeGroup?.kind).toBe('lemma');
    expect(eyeGroup?.members.some((m) => m.highlightTerms.includes('eyes'))).toBe(true);
    expect(eyeGroup?.members.some((m) => m.highlightTerms.includes('eye'))).toBe(true);
  });

  it('Acceptance 11.1 Item 4: Stronger case returns full lines for both songs', () => {
    const lines: RawLyricLine[] = [
      {
        id: 30,
        song_id: 'song3',
        line_index: 1,
        text: 'If you wanna get stronger',
        repeat_count: 1,
        lang: 'en',
        tokens: ['strong'],
        surface_tokens: ['stronger'],
      },
      {
        id: 40,
        song_id: 'song4',
        line_index: 3,
        text: 'Every time I cry, I get a little bit stronger',
        repeat_count: 1,
        lang: 'en',
        tokens: ['time', 'cri', 'strong'],
        surface_tokens: ['time', 'cry', 'stronger'],
      },
    ];

    const groups = matchLyrics(lines, metadata);
    const strongGroup = groups.find((g) => g.sharedTerms.includes('strong'));
    expect(strongGroup).toBeDefined();
    expect(strongGroup?.members[0].lineText).toBe('If you wanna get stronger');
    expect(strongGroup?.members[1].lineText).toBe('Every time I cry, I get a little bit stronger');
    expect(strongGroup?.members[0].artist).toBe('Sam Feldt');
    expect(strongGroup?.members[1].artist).toBe('Ava Max');
  });

  it('Acceptance 11.1 Item 5: Maximal phrase suppresses sub-phrases covering same lines', () => {
    const lines: RawLyricLine[] = [
      {
        id: 1,
        song_id: 'song1',
        line_index: 0,
        text: 'Dance all night long',
        repeat_count: 1,
        lang: 'en',
        tokens: ['dance', 'night'],
        surface_tokens: ['dance', 'night'],
      },
      {
        id: 2,
        song_id: 'song2',
        line_index: 0,
        text: 'We can dance night and day',
        repeat_count: 1,
        lang: 'en',
        tokens: ['dance', 'night', 'day'],
        surface_tokens: ['dance', 'night', 'day'],
      },
    ];

    const groups = matchLyrics(lines, metadata);
    const bigramGroup = groups.find((g) => g.sharedTerms.join(' ') === 'dance night');
    expect(bigramGroup).toBeDefined();

    // The sub-phrases "dance" and "night" should be suppressed since they cover the exact same lines
    const danceOnly = groups.find((g) => g.sharedTerms.length === 1 && g.sharedTerms[0] === 'dance');
    const nightOnly = groups.find((g) => g.sharedTerms.length === 1 && g.sharedTerms[0] === 'night');
    expect(danceOnly).toBeUndefined();
    expect(nightOnly).toBeUndefined();
  });

  it('Acceptance 11.1 Item 6: Common word collapse for lemma in > 5% of corpus (>20 songs)', () => {
    const lines: RawLyricLine[] = [
      {
        id: 1,
        song_id: 'song1',
        line_index: 0,
        text: 'love is in the air',
        repeat_count: 1,
        lang: 'en',
        tokens: ['love'],
        surface_tokens: ['love'],
      },
      {
        id: 2,
        song_id: 'song2',
        line_index: 0,
        text: 'feel the love tonight',
        repeat_count: 1,
        lang: 'en',
        tokens: ['feel', 'love'],
        surface_tokens: ['feel', 'love'],
      },
    ];

    const groups = matchLyrics(lines, metadata, {
      corpusSongCounts: { en: 25, ja: 0, ko: 0, tl: 0, other: 0 },
      documentFrequencies: { 'en:love': 5 }, // 5/25 = 20% > 5%
    });

    const loveGroup = groups.find((g) => g.sharedTerms.includes('love'));
    expect(loveGroup).toBeDefined();
    expect(loveGroup?.isCommonWord).toBe(true);
  });

  it('Acceptance 11.1 Item 8: Same-language rule (en and ja lines never group)', () => {
    const lines: RawLyricLine[] = [
      {
        id: 1,
        song_id: 'song1',
        line_index: 0,
        text: 'hero',
        repeat_count: 1,
        lang: 'en',
        tokens: ['hero'],
        surface_tokens: ['hero'],
      },
      {
        id: 60,
        song_id: 'song6',
        line_index: 0,
        text: 'hero',
        repeat_count: 1,
        lang: 'ja',
        tokens: ['hero'],
        surface_tokens: ['hero'],
      },
    ];

    const groups = matchLyrics(lines, metadata);
    // Language prefixes keep keys separate: en:hero vs ja:hero -> each has only 1 distinct song!
    expect(groups).toHaveLength(0);
  });

  it('Acceptance 11.1 Item 9: Semantic pairs inside lexical group are not duplicated', () => {
    const lines: RawLyricLine[] = [
      {
        id: 1,
        song_id: 'song1',
        line_index: 0,
        text: 'dance tonight',
        repeat_count: 1,
        lang: 'en',
        tokens: ['dance'],
        surface_tokens: ['dance'],
      },
      {
        id: 2,
        song_id: 'song2',
        line_index: 0,
        text: 'let us dance',
        repeat_count: 1,
        lang: 'en',
        tokens: ['dance'],
        surface_tokens: ['dance'],
      },
    ];

    const groups = matchLyrics(lines, metadata, {
      semanticPairs: [
        {
          lineId1: 1,
          songId1: 'song1',
          text1: 'dance tonight',
          lineId2: 2,
          songId2: 'song2',
          text2: 'let us dance',
          lang: 'en',
          similarity: 0.95,
        },
      ],
    });

    // Should only have 1 group (the lexical one), not an extra semantic group
    expect(groups).toHaveLength(1);
    expect(groups[0].kind).toBe('exact');
  });

  it('Acceptance 11.1 Item 10: Groups never contain fewer than 2 distinct songs', () => {
    const lines: RawLyricLine[] = [
      {
        id: 1,
        song_id: 'song1',
        line_index: 0,
        text: 'dance dance dance',
        repeat_count: 1,
        lang: 'en',
        tokens: ['dance'],
        surface_tokens: ['dance'],
      },
      {
        id: 2,
        song_id: 'song1',
        line_index: 1,
        text: 'dance again in the morning',
        repeat_count: 1,
        lang: 'en',
        tokens: ['dance', 'morn'],
        surface_tokens: ['dance', 'morning'],
      },
    ];

    const groups = matchLyrics(lines, metadata);
    expect(groups).toHaveLength(0);
  });
});
