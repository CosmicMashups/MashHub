import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/testUtils';
import { SongList } from '../SongList';
import { mockSongs } from '../../test/testUtils';

describe('SongList', () => {
  it('renders song list correctly', () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    
    render(
      <SongList 
        songs={mockSongs} 
        onEditSong={mockOnEdit}
        onDeleteSong={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
    expect(screen.getByText('Test Song 2')).toBeInTheDocument();
    expect(screen.getByText('Test Artist 2')).toBeInTheDocument();
  });

  it('calls onEditSong when edit button is clicked', async () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    
    render(
      <SongList 
        songs={mockSongs} 
        onEditSong={mockOnEdit}
        onDeleteSong={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    editButtons[0].click();

    expect(mockOnEdit).toHaveBeenCalledWith(mockSongs[0]);
  });

  it('calls onDeleteSong when delete button is clicked', async () => {
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
    
    render(
      <SongList 
        songs={mockSongs} 
        onEditSong={mockOnEdit}
        onDeleteSong={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    deleteButtons[0].click();

    expect(mockOnDelete).toHaveBeenCalledWith(mockSongs[0].id);
  });
});