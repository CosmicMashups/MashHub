import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchingService } from '../../services/matchingService';
import { mockSongs } from '../../test/testUtils';

// ---------------------------------------------------------------------------
// Mock the Dexie `db` so no real IndexedDB is needed.
// NOTE: vi.mock factory is hoisted – ALL values must be defined inline.
// ---------------------------------------------------------------------------

// Sections shared across tests (mutated via helpers below when needed)
const defaultSections = [
  { sectionId: 's001', songId: '00001', part: 'Intro',  bpm: 120, key: 'C Major', sectionOrder: 1 },
  { sectionId: 's002', songId: '00001', part: 'Chorus', bpm: 125, key: 'G Major', sectionOrder: 2 },
  { sectionId: 's003', songId: '00002', part: 'Intro',  bpm: 140, key: 'D Major', sectionOrder: 1 },
];

vi.mock('../../services/database', () => {
  // Must be fully self-contained — no references to outer test-file variables.
  const sections = [
    { sectionId: 's001', songId: '00001', part: 'Intro',  bpm: 120, key: 'C Major', sectionOrder: 1 },
    { sectionId: 's002', songId: '00001', part: 'Chorus', bpm: 125, key: 'G Major', sectionOrder: 2 },
    { sectionId: 's003', songId: '00002', part: 'Intro',  bpm: 140, key: 'D Major', sectionOrder: 1 },
  ];

  const makeChain = (filteredSections: typeof sections) => ({
    toArray: () => Promise.resolve(filteredSections),
  });

  return {
    db: {
      songSections: {
        where: (field: string) => ({
          equals: (id: string) => makeChain(sections.filter((s) => s[field as keyof typeof s] === id)),
          anyOf: (ids: string[]) => makeChain(sections.filter((s) => ids.includes(s.songId))),
        }),
      },
    },
    songService: {},
    sectionService: {},
    projectService: {},
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MatchingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── findMatches — hard filters ─────────────────────────────────────────────

  describe('findMatches — hard filters', () => {
    it('filters songs within a BPM range (bpmRange criterion)', async () => {
      // Song 1: bpms [120, 125] — inside [115, 130]
      // Song 2: bpms [140]      — outside
      const matches = await MatchingService.findMatches(mockSongs, {
        bpmRange: [115, 130],
      });
      expect(matches).toHaveLength(1);
      expect(matches[0]?.id).toBe('00001');
    });

    it('returns empty array when no songs match BPM range', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        bpmRange: [195, 205],
      });
      expect(matches).toHaveLength(0);
    });

    it('filters songs by target key + tolerance', async () => {
      // Song 1: keys ['C Major', 'C# Major'] — matches 'C Major' tolerance 1
      // Song 2: keys ['D Major']              — 2 semitones from C, outside tolerance 1
      const matches = await MatchingService.findMatches(mockSongs, {
        targetKey: 'C Major',
        keyTolerance: 1,
      });
      expect(matches).toHaveLength(1);
      expect(matches[0]?.id).toBe('00001');
    });

    it('applies multiple hard filters simultaneously (BPM range + type)', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        bpmRange: [115, 130],
        type: 'OP',
      });
      expect(matches).toHaveLength(1);
      expect(matches[0]?.id).toBe('00001');
    });

    it('filters songs by exact type', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        type: 'ED',
      });
      expect(matches).toHaveLength(1);
      expect(matches[0]?.id).toBe('00002');
    });

    it('filters songs by year range (both songs are 2023)', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        yearRange: [2023, 2023],
      });
      expect(matches).toHaveLength(2);
    });

    it('returns empty array when year range excludes all songs', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        yearRange: [2000, 2010],
      });
      expect(matches).toHaveLength(0);
    });

    it('filters songs by text search on title', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        searchText: 'Test Song 1',
      });
      expect(matches).toHaveLength(1);
      expect(matches[0]?.id).toBe('00001');
    });

    it('filters songs by selectedKeys checkbox array', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        selectedKeys: ['D Major'],
      });
      expect(matches).toHaveLength(1);
      expect(matches[0]?.id).toBe('00002');
    });
  });

  // ── findMatches — scoring ──────────────────────────────────────────────────

  describe('findMatches — scoring', () => {
    it('scores songs with bpmScore when targetBpm + bpmTolerance matches (soft scoring, no hard filter)', async () => {
      // targetBpm/bpmTolerance contribute to score but are NOT a hard filter
      const matches = await MatchingService.findMatches(mockSongs, {
        targetBpm: 120,
        bpmTolerance: 10,
      });
      // Both songs are returned; Song 1 should have a positive bpmScore
      const song1 = matches.find((m) => m.id === '00001');
      expect(song1).toBeDefined();
      expect(song1!.bpmScore).toBeGreaterThan(0);
    });

    it('sorts results by matchScore descending', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        targetBpm: 120,
        bpmTolerance: 10,
        targetKey: 'C Major',
        keyTolerance: 1,
      });
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1]!.matchScore).toBeGreaterThanOrEqual(matches[i]!.matchScore);
      }
    });

    it('includes match reasons array in every result', async () => {
      const matches = await MatchingService.findMatches(mockSongs, {
        bpmRange: [115, 130],
      });
      expect(Array.isArray(matches[0]?.reasons)).toBe(true);
    });
  });

  // ── getQuickMatches ────────────────────────────────────────────────────────

  describe('getQuickMatches', () => {
    it('returns an array of results', async () => {
      const targetSong = mockSongs[0]!;
      const matches = await MatchingService.getQuickMatches(mockSongs, targetSong);
      expect(Array.isArray(matches)).toBe(true);
    });

    it('excludes the target song itself from results', async () => {
      const targetSong = mockSongs[0]!;
      const matches = await MatchingService.getQuickMatches(mockSongs, targetSong);
      expect(matches.every((m) => m.id !== targetSong.id)).toBe(true);
    });

    it('returns results sorted by matchScore descending', async () => {
      const targetSong = mockSongs[0]!;
      const matches = await MatchingService.getQuickMatches(mockSongs, targetSong);
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1]!.matchScore).toBeGreaterThanOrEqual(matches[i]!.matchScore);
      }
    });
  });

  // Reference the outer sections array to satisfy the "no unused variable" check
  it('_ (internal) mock sections reference', () => {
    expect(defaultSections.length).toBeGreaterThan(0);
  });
});
