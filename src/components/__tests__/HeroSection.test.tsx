import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '../HeroSection';
import { mockSongs } from '../../test/testUtils';

describe('HeroSection', () => {
  it('renders Featured Catalog Entries header', () => {
    render(
      <HeroSection
        songsCount={mockSongs.length}
        projectsCount={1}
        songs={mockSongs}
      />
    );

    expect(screen.getByText(/Featured Catalog Entries/i)).toBeInTheDocument();
  });

  it('triggers onSelectSong when a featured catalog entry is clicked', () => {
    const handleSelectSong = vi.fn();

    render(
      <HeroSection
        songsCount={mockSongs.length}
        projectsCount={1}
        songs={mockSongs}
        onSelectSong={handleSelectSong}
      />
    );

    // Look for a featured entry button corresponding to one of mockSongs
    const firstSongTitle = mockSongs[0].title;
    const songEntry = screen.getByText(firstSongTitle);
    expect(songEntry).toBeInTheDocument();

    // Click the song card/entry
    fireEvent.click(songEntry.closest('[role="button"]') || songEntry);

    expect(handleSelectSong).toHaveBeenCalledTimes(1);
    expect(handleSelectSong).toHaveBeenCalledWith(
      expect.objectContaining({ title: firstSongTitle })
    );
  });

  it('triggers onSelectKey when a top harmonic key is clicked', () => {
    const handleSelectKey = vi.fn();

    render(
      <HeroSection
        songsCount={mockSongs.length}
        projectsCount={1}
        songs={mockSongs}
        onSelectKey={handleSelectKey}
      />
    );

    // Look for Top Harmonic Keys header and key elements
    expect(screen.getByText(/Top Harmonic Keys/i)).toBeInTheDocument();

    // Query the key card by its accessible role/label
    const keyButton = screen.getByRole('button', {
      name: /Filter catalog tracks in C Major/i,
    });
    expect(keyButton).toBeInTheDocument();

    // Click the key card
    fireEvent.click(keyButton);

    expect(handleSelectKey).toHaveBeenCalledTimes(1);
    expect(handleSelectKey).toHaveBeenCalledWith('C Major');
  });
});
