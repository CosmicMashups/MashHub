import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { mockSongs } from '../../test/testUtils';

// Mock the database service
vi.mock('../services/database', () => ({
  songService: {
    getAllSongs: vi.fn(() => Promise.resolve(mockSongs)),
    addSong: vi.fn(),
    updateSong: vi.fn(),
    deleteSong: vi.fn(),
    searchSongs: vi.fn()
  },
  projectService: {
    getAllProjects: vi.fn(() => Promise.resolve([])),
    addProject: vi.fn(),
    deleteProject: vi.fn(),
    addSongToProject: vi.fn(),
    removeSongFromProject: vi.fn(),
    reorderSongsInSection: vi.fn(),
    getProjectWithSections: vi.fn()
  }
}));

describe('App Integration', () => {
  it('renders the main app interface', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Mashup Manager')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Add Song')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('opens add song modal when Add Song button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Song')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Add Song'));
    
    expect(screen.getByText('Add New Song')).toBeInTheDocument();
  });

  it('filters songs based on search', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/search songs/i);
    await user.type(searchInput, 'Test Song 1');
    
    expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Song 2')).not.toBeInTheDocument();
  });
});