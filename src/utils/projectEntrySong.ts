import type { Song, ProjectEntry } from '../types';

/** Workspace entry row: song library fields + per-project entry metadata (notes come from songs table). */
export type ProjectEntrySong = Song & {
  entryId: string;
  locked: boolean;
  notes: string;
  performanceRole: 'vocal' | 'instrumental' | 'both';
  usedInMashup: boolean;
};

export function enrichProjectEntrySong(song: Song, entry: ProjectEntry): ProjectEntrySong {
  return {
    ...song,
    entryId: entry.id,
    locked: entry.locked,
    notes: song.notes ?? '',
    performanceRole: entry.performanceRole ?? 'vocal',
    usedInMashup: entry.usedInMashup ?? false,
  };
}
