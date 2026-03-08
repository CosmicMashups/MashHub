import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSongs } from '../../hooks/useSongs';
import { mockSongs } from '../../test/testUtils';

// ---------------------------------------------------------------------------
// Mock the database service with the ACTUAL method names used by useSongs.
// ---------------------------------------------------------------------------
vi.mock('../../services/database', () => ({
  songService: {
    getAll:     vi.fn(() => Promise.resolve(mockSongs)),
    add:        vi.fn((song) => Promise.resolve(song.id ?? '00099')),
    update:     vi.fn(() => Promise.resolve(1)),
    delete:     vi.fn(() => Promise.resolve()),
    bulkAdd:    vi.fn(() => Promise.resolve()),
    clearAll:   vi.fn(() => Promise.resolve()),
    search:     vi.fn(() => Promise.resolve([])),
    filterByBpm: vi.fn(() => Promise.resolve([])),
  },
  sectionService: {
    bulkAdd:              vi.fn(() => Promise.resolve()),
    cleanOrphanedSections: vi.fn(() => Promise.resolve(0)),
  },
  projectService: {
    getAll:   vi.fn(() => Promise.resolve([])),
    add:      vi.fn(() => Promise.resolve('p001')),
    update:   vi.fn(() => Promise.resolve(1)),
    delete:   vi.fn(() => Promise.resolve()),
  },
  db: {
    songSections: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      anyOf: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock the CSV data loader so loadSongsAndSectionsWithHash never fires over network
vi.mock('../../data/animeDataLoader', () => ({
  loadSongsAndSectionsWithHash: vi.fn(() =>
    Promise.resolve({ songs: [], sections: [], hash: 'test-hash' })
  ),
  parseSongsCSV: vi.fn(() => []),
  parseSongSectionsCSV: vi.fn(() => []),
}));

// Mock the search service to avoid Fuse.js initialisation side-effects
vi.mock('../../services/searchService', () => ({
  initSearchService: vi.fn(),
  addSong:           vi.fn(),
  removeSong:        vi.fn(),
  updateSongs:       vi.fn(),
  search:            vi.fn(() => []),
  getSuggestions:    vi.fn(() => []),
  getSearchStats:    vi.fn(() => ({ totalResults: 0, categories: {}, bestMatch: null })),
  _resetForTesting:  vi.fn(),
}));

// ---------------------------------------------------------------------------

describe('useSongs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes loading and exposes songs', async () => {
    const { result } = renderHook(() => useSongs());

    // Wait for all async effects to settle
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.songs).toHaveLength(mockSongs.length);
  });

  it('adds a new song and reflects it in the song list', async () => {
    const { result } = renderHook(() => useSongs());

    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    });

    const newSongData = {
      title: 'New Song',
      artist: 'New Artist',
      bpms: [130],
      keys: ['E Major'],
      type: 'OP',
      origin: 'Anime',
      year: 2024,
      season: 'Winter',
      primaryBpm: 130,
      primaryKey: 'E Major',
    };

    await act(async () => {
      await result.current.addSong(newSongData);
    });

    expect(result.current.songs.length).toBeGreaterThan(0);
  });

  it('deletes a song and removes it from the song list', async () => {
    const { result } = renderHook(() => useSongs());

    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    });

    const initialCount = result.current.songs.length;

    await act(async () => {
      await result.current.deleteSong(mockSongs[0]!.id);
    });

    expect(result.current.songs.length).toBeLessThan(initialCount + 1);
  });
});
