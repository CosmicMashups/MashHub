import type {
  LyricLanguage,
  LyricMatchKind,
  LyricMatchGroup,
  LyricMatchMember,
} from '../types/lyrics';
import {
  LYRIC_MAX_NGRAM,
  LYRIC_COMMON_DF_RATIO,
  LYRIC_MIN_CORPUS_FOR_DF,
  LYRIC_KIND_WEIGHTS,
} from '../constants/lyrics';
import { generateNgrams } from '../../supabase/functions/_shared/lyrics/ngramHelper';

export interface RawLyricLine {
  id: number;
  song_id: string;
  line_index: number;
  text: string;
  start_ms?: number | null;
  section_hint?: string | null;
  repeat_count: number;
  lang: LyricLanguage;
  tokens: string[];
  surface_tokens: string[];
}

export interface SongMetadataLookup {
  [songId: string]: {
    title: string;
    artist: string;
  };
}

export interface MatchEngineOptions {
  corpusSongCounts?: Record<LyricLanguage, number>;
  documentFrequencies?: Record<string, number>; // key: `${lang}:${lemma}` -> count
  semanticPairs?: {
    lineId1: number;
    songId1: string;
    text1: string;
    lineId2: number;
    songId2: string;
    text2: string;
    lang: LyricLanguage;
    similarity: number;
  }[];
}

/**
 * Pure TypeScript lyric match engine.
 * Implements Section 6.5 & Section 6.6 of lyric-matching.md:
 * - Contiguous lemma n-grams (1..4)
 * - Maximal-phrase rule (suppresses sub-phrases covering same/subset lines)
 * - Decides exact vs lemma match kind
 * - Single-word flood control & rarity calculation
 * - Groups contain lines from >= 2 distinct songs
 */
export function matchLyrics(
  lines: RawLyricLine[],
  songMetadata: SongMetadataLookup,
  options: MatchEngineOptions = {}
): LyricMatchGroup[] {
  if (!lines || lines.length === 0) return [];

  const {
    corpusSongCounts = { en: 0, ja: 0, ko: 0, tl: 0, other: 0 },
    documentFrequencies = {},
    semanticPairs = [],
  } = options;

  // 1. Build inverted index: key -> lines
  // key: `${lang}:${ngramLemmas.join(' ')}`
  interface CandidateGroup {
    key: string;
    lang: LyricLanguage;
    lemmas: string[];
    lineMatches: {
      line: RawLyricLine;
      startIndex: number;
      surfaceForms: string[];
    }[];
  }

  const index = new Map<string, CandidateGroup>();

  for (const line of lines) {
    const tokens = line.tokens;
    const surfaceTokens = line.surface_tokens;
    const ngrams = generateNgrams(tokens, LYRIC_MAX_NGRAM);

    let tokenOffset = 0;
    // Track token positions to retrieve matching surface forms
    for (const ngram of ngrams) {
      const n = ngram.length;
      // Find starting index of this ngram in tokens
      const startIdx = tokens.indexOf(ngram[0]);
      const surfaceForms = surfaceTokens.slice(startIdx, startIdx + n);
      const groupKey = `${line.lang}:${ngram.join(' ')}`;

      if (!index.has(groupKey)) {
        index.set(groupKey, {
          key: groupKey,
          lang: line.lang,
          lemmas: ngram,
          lineMatches: [],
        });
      }

      index.get(groupKey)!.lineMatches.push({
        line,
        startIndex: startIdx,
        surfaceForms,
      });
    }
  }

  // 2. Filter groups: lines must belong to at least 2 distinct songs
  const validCandidateGroups: CandidateGroup[] = [];
  for (const cand of index.values()) {
    const distinctSongs = new Set(cand.lineMatches.map((m) => m.line.song_id));
    if (distinctSongs.size >= 2) {
      validCandidateGroups.push(cand);
    }
  }

  // 3. Maximal-phrase rule:
  // Drop group A if another group B has a longer key (more lemmas) and covers a superset of lines
  const sortedByLenDesc = [...validCandidateGroups].sort(
    (a, b) => b.lemmas.length - a.lemmas.length
  );
  const survivingGroups: CandidateGroup[] = [];

  for (const cand of sortedByLenDesc) {
    const candLineIds = new Set(cand.lineMatches.map((m) => m.line.id));

    // Check if subsumed by an already accepted longer group
    const isSubsumed = survivingGroups.some((longer) => {
      // Must be same language and have more lemmas
      if (longer.lang !== cand.lang || longer.lemmas.length <= cand.lemmas.length) {
        return false;
      }
      // Check if longer lemmas contain cand lemmas
      const candPhrase = cand.lemmas.join(' ');
      const longerPhrase = longer.lemmas.join(' ');
      if (!longerPhrase.includes(candPhrase)) {
        return false;
      }
      // Check if longer covers all or a superset of lines
      const longerLineIds = new Set(longer.lineMatches.map((m) => m.line.id));
      for (const id of candLineIds) {
        if (!longerLineIds.has(id)) return false;
      }
      return true;
    });

    if (!isSubsumed) {
      survivingGroups.push(cand);
    }
  }

  // 4. Construct LyricMatchGroup instances & determine exact vs lemma
  const groups: LyricMatchGroup[] = [];

  for (const g of survivingGroups) {
    const distinctSongMap = new Map<string, RawLyricLine>();
    const memberSurfaceForms = new Set<string>();

    const members: LyricMatchMember[] = [];
    const seenSongLines = new Set<string>();

    for (const match of g.lineMatches) {
      const key = `${match.line.song_id}:${match.line.id}`;
      if (seenSongLines.has(key)) continue;
      seenSongLines.add(key);

      const songMeta = songMetadata[match.line.song_id] || {
        title: 'Unknown Title',
        artist: 'Unknown Artist',
      };

      const surfaceStr = match.surfaceForms.join(' ').toLowerCase();
      memberSurfaceForms.add(surfaceStr);

      members.push({
        songId: match.line.song_id,
        title: songMeta.title,
        artist: songMeta.artist,
        lineId: match.line.id,
        lineIndex: match.line.line_index,
        lineText: match.line.text,
        startMs: match.line.start_ms ?? undefined,
        highlightTerms: match.surfaceForms,
      });
    }

    if (new Set(members.map((m) => m.songId)).size < 2) {
      continue;
    }

    // Determine exact vs lemma:
    // If all members share the exact same surface form, kind is 'exact', otherwise 'lemma'
    const kind: LyricMatchKind = memberSurfaceForms.size === 1 ? 'exact' : 'lemma';

    // Rarity and common words flood control (Section 6.6)
    const isSingleWord = g.lemmas.length === 1;
    let isCommonWord = false;
    let rarityBonus = 0;

    if (isSingleWord) {
      const lemma = g.lemmas[0];
      const dfKey = `${g.lang}:${lemma}`;
      const df = documentFrequencies[dfKey] || members.length;
      const corpusTotal = corpusSongCounts[g.lang] || 0;

      if (corpusTotal >= LYRIC_MIN_CORPUS_FOR_DF) {
        const ratio = df / corpusTotal;
        if (ratio > LYRIC_COMMON_DF_RATIO) {
          isCommonWord = true;
        }
      }

      // Normalized IDF bonus
      if (corpusTotal > 0) {
        const idf = Math.log(1 + corpusTotal / (1 + df));
        rarityBonus = 0.1 * Math.min(1.0, idf / 4.0);
      }
    }

    const n = g.lemmas.length;
    const kindWeight = LYRIC_KIND_WEIGHTS[kind];
    const rank = kindWeight + 0.15 * (n / 4) + rarityBonus;

    groups.push({
      id: `${g.lang}:${kind}:${g.lemmas.join('+')}`,
      language: g.lang,
      kind,
      sharedTerms: g.lemmas,
      label: g.lemmas.join(' '),
      isCommonWord,
      rank,
      members,
    });
  }

  // 5. Semantic matches (Section 6.5 & Section 11.1 Item 9)
  // Remove pairs already inside a lexical group
  const lexicalLinePairs = new Set<string>();
  for (const g of groups) {
    const ids = g.members.map((m) => m.lineId);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        lexicalLinePairs.add(`${Math.min(ids[i], ids[j])}:${Math.max(ids[i], ids[j])}`);
      }
    }
  }

  for (const pair of semanticPairs) {
    const pairKey = `${Math.min(pair.lineId1, pair.lineId2)}:${Math.max(pair.lineId1, pair.lineId2)}`;
    if (lexicalLinePairs.has(pairKey)) {
      continue;
    }

    const meta1 = songMetadata[pair.songId1] || { title: 'Unknown', artist: 'Unknown' };
    const meta2 = songMetadata[pair.songId2] || { title: 'Unknown', artist: 'Unknown' };

    const members: LyricMatchMember[] = [
      {
        songId: pair.songId1,
        title: meta1.title,
        artist: meta1.artist,
        lineId: pair.lineId1,
        lineIndex: 0,
        lineText: pair.text1,
        highlightTerms: [pair.text1],
      },
      {
        songId: pair.songId2,
        title: meta2.title,
        artist: meta2.artist,
        lineId: pair.lineId2,
        lineIndex: 0,
        lineText: pair.text2,
        highlightTerms: [pair.text2],
      },
    ];

    const rank = LYRIC_KIND_WEIGHTS.semantic * pair.similarity;

    groups.push({
      id: `${pair.lang}:semantic:${pair.lineId1}_${pair.lineId2}`,
      language: pair.lang,
      kind: 'semantic',
      sharedTerms: [],
      label: `"${pair.text1.slice(0, 30)}..." ~ "${pair.text2.slice(0, 30)}..."`,
      isCommonWord: false,
      semanticSimilarity: pair.similarity,
      rank,
      members,
    });
  }

  // Sort groups by rank descending
  groups.sort((a, b) => b.rank - a.rank);

  return groups;
}
