import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { DragDropProvider } from '../contexts/DragDropContext';
import { Song } from '../types';

// Mock data for testing
export const mockSongs: Song[] = [
  {
    id: '00001',
    title: 'Test Song 1',
    artist: 'Test Artist 1',
    bpms: [120, 125],
    keys: ['C Major', 'C# Major'],
    part: 'Intro',
    type: 'OP',
    origin: 'Anime',
    year: 2023,
    season: 'Spring',
    vocalStatus: 'Vocal',
    primaryBpm: 120,
    primaryKey: 'C Major'
  },
  {
    id: '00002',
    title: 'Test Song 2',
    artist: 'Test Artist 2',
    bpms: [140],
    keys: ['D Major'],
    part: 'Chorus',
    type: 'ED',
    origin: 'Anime',
    year: 2023,
    season: 'Summer',
    vocalStatus: 'Instrumental',
    primaryBpm: 140,
    primaryKey: 'D Major'
  }
];

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <DragDropProvider songs={mockSongs}>
      {children}
    </DragDropProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };