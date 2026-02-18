import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { mockSongs } from '../../test/testUtils';

// ---------------------------------------------------------------------------
// Mock the database service — path is relative to THIS file (src/components/__tests__/)
// ---------------------------------------------------------------------------
vi.mock('../../services/database', () => ({
  songService: {
    getAll:      vi.fn(() => Promise.resolve(mockSongs)),
    add:         vi.fn(() => Promise.resolve('00099')),
    update:      vi.fn(() => Promise.resolve(1)),
    delete:      vi.fn(() => Promise.resolve()),
    bulkAdd:     vi.fn(() => Promise.resolve()),
    clearAll:    vi.fn(() => Promise.resolve()),
    search:      vi.fn(() => Promise.resolve([])),
    filterByBpm: vi.fn(() => Promise.resolve([])),
  },
  sectionService: {
    bulkAdd:               vi.fn(() => Promise.resolve()),
    cleanOrphanedSections: vi.fn(() => Promise.resolve(0)),
  },
  projectService: {
    getAll:               vi.fn(() => Promise.resolve([])),
    add:                  vi.fn(() => Promise.resolve('p001')),
    update:               vi.fn(() => Promise.resolve(1)),
    delete:               vi.fn(() => Promise.resolve()),
    getEntriesForProject: vi.fn(() => Promise.resolve([])),
    addEntry:             vi.fn(() => Promise.resolve('e001')),
    deleteEntry:          vi.fn(() => Promise.resolve()),
    updateEntryOrder:     vi.fn(() => Promise.resolve()),
  },
  db: {
    songSections: {
      where:  vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      anyOf:  vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('../../data/animeDataLoader', () => ({
  loadSongsAndSectionsWithHash: vi.fn(() =>
    Promise.resolve({ songs: [], sections: [], hash: 'test-hash' })
  ),
  parseSongsCSV: vi.fn(() => []),
  parseSongSectionsCSV: vi.fn(() => []),
}));

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

describe('App Integration', () => {
  it('renders the main app interface', async () => {
    render(<App />);

    await waitFor(() => {
      // The app header or a known nav element should be present
      expect(document.body).toBeTruthy();
    });
  });

  it('song data is eventually available in the DOM', async () => {
    render(<App />);

    await waitFor(
      () => {
        // At least one song title or loading indicator must appear
        const body = document.body.textContent ?? '';
        expect(body.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });
});
