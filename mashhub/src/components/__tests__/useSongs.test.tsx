import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSongs } from '../../hooks/useSongs';
import { mockSongs } from '../../test/testUtils';

// Mock the database service
vi.mock('../../services/database', () => ({
  songService: {
    getAllSongs: vi.fn(() => Promise.resolve(mockSongs)),
    addSong: vi.fn(),
    updateSong: vi.fn(),
    deleteSong: vi.fn(),
    searchSongs: vi.fn()
  }
}));

describe('useSongs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads songs on mount', async () => {
    const { result } = renderHook(() => useSongs());
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.songs).toHaveLength(2);
  });

  it('adds a new song', async () => {
    const { result } = renderHook(() => useSongs());
    
    const newSong = {
      title: 'New Song',
      artist: 'New Artist',
      bpms: [130],
      keys: ['E Major'],
      part: 'Verse',
      type: 'OP',
      origin: 'Anime',
      year: 2024,
      season: 'Winter',
      vocalStatus: 'Vocal' as const,
      primaryBpm: 130,
      primaryKey: 'E Major'
    };

    await act(async () => {
      await result.current.addSong(newSong);
    });

    expect(result.current.songs).toHaveLength(3);
  });
});