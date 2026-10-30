import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HarmonicWheelDetailPanel } from '../HarmonicWheelDetailPanel';
import type { HarmonicSegment } from '../../../utils/harmonicWheelDataset';

const mockSegment: HarmonicSegment = {
  pitchClass: 6,
  camelotPosition: 2,
  representativeMajor: 'F# Major',
  startAngleDeg: -60,
  endAngleDeg: -30,
  keys: [
    { key: 'F# Major', pitchClass: 6, mode: 'Major', displayOrder: 0 },
    { key: 'D# Minor', pitchClass: 6, mode: 'Minor', displayOrder: 1 },
    { key: 'G# Dorian', pitchClass: 6, mode: 'Dorian', displayOrder: 2 },
    { key: 'A# Phrygian', pitchClass: 6, mode: 'Phrygian', displayOrder: 3 },
    { key: 'B Lydian', pitchClass: 6, mode: 'Lydian', displayOrder: 4 },
    { key: 'C# Mixolydian', pitchClass: 6, mode: 'Mixolydian', displayOrder: 5 },
    { key: 'E# Locrian', pitchClass: 6, mode: 'Locrian', displayOrder: 6 },
  ],
};

describe('HarmonicWheelDetailPanel', () => {
  it('renders placeholder when segment is null', () => {
    render(
      <MemoryRouter>
        <HarmonicWheelDetailPanel segment={null} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Select a wedge on the wheel/i)).toBeDefined();
  });

  it('always renders all relative modes prominently without hiding them', () => {
    render(
      <MemoryRouter>
        <HarmonicWheelDetailPanel segment={mockSegment} />
      </MemoryRouter>
    );

    // Header
    expect(screen.getByText(/F# family/i)).toBeDefined();
    expect(screen.getByText(/Camelot 2B/i)).toBeDefined();

    // No "Show all mode names" button
    expect(screen.queryByText(/Show all mode names/i)).toBeNull();
    expect(screen.queryByText(/Show summary/i)).toBeNull();

    // All 7 modes are directly rendered
    expect(screen.getByText('F# Major')).toBeDefined();
    expect(screen.getByText('D# Minor')).toBeDefined();
    expect(screen.getByText('G# Dorian')).toBeDefined();
    expect(screen.getByText('A# Phrygian')).toBeDefined();
    expect(screen.getByText('B Lydian')).toBeDefined();
    expect(screen.getByText('C# Mixolydian')).toBeDefined();
    expect(screen.getByText('E# Locrian')).toBeDefined();

    // Mode labels
    expect(screen.getByText('Major mode')).toBeDefined();
    expect(screen.getByText('Minor mode')).toBeDefined();
    expect(screen.getByText('Dorian mode')).toBeDefined();

    // Camelot codes
    expect(screen.getByText('2B')).toBeDefined();
    expect(screen.getByText('2A')).toBeDefined();
  });

  it('triggers onUseInFilters when a specific mode card is clicked', () => {
    const onUseInFilters = vi.fn();
    render(
      <MemoryRouter>
        <HarmonicWheelDetailPanel segment={mockSegment} onUseInFilters={onUseInFilters} />
      </MemoryRouter>
    );

    const dMinorBtn = screen.getByRole('button', { name: /D# Minor/i });
    fireEvent.click(dMinorBtn);
    expect(onUseInFilters).toHaveBeenCalledWith('D# Minor');
  });

  it('triggers onUseInFilters with major key when main filter button is clicked', () => {
    const onUseInFilters = vi.fn();
    render(
      <MemoryRouter>
        <HarmonicWheelDetailPanel segment={mockSegment} onUseInFilters={onUseInFilters} />
      </MemoryRouter>
    );

    const mainFilterBtn = screen.getByRole('button', { name: /Filter Library by F# Major/i });
    fireEvent.click(mainFilterBtn);
    expect(onUseInFilters).toHaveBeenCalledWith('F# Major');
  });
});
