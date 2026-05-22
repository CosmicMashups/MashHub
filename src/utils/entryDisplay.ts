import { getCamelotPosition } from '../constants/camelot';
import { normalizeKeyForCamelot } from '../utils/keyColors';
import type { Song } from '../types';

export type PerformanceRole = 'vocal' | 'instrumental' | 'both';

export type SectionSortOption = 'bpm-asc' | 'bpm-desc' | 'key-asc' | 'key-desc';

export function getRoleLabel(role: PerformanceRole): string {
  if (role === 'vocal') return 'Vocal';
  if (role === 'instrumental') return 'Instrumental';
  return 'Both';
}

export type SectionEntrySong = Song & {
  entryId: string;
  primaryBpm?: number;
  bpms?: number[];
  primaryKey?: string;
  keys?: string[];
};

export function sortSectionEntriesByBpmOrKey<T extends SectionEntrySong>(
  songs: T[],
  sortBy: SectionSortOption
): T[] {
  const sorted = [...songs];
  if (sortBy === 'bpm-asc') {
    sorted.sort((a, b) => (a.primaryBpm ?? a.bpms?.[0] ?? 0) - (b.primaryBpm ?? b.bpms?.[0] ?? 0));
  } else if (sortBy === 'bpm-desc') {
    sorted.sort((a, b) => (b.primaryBpm ?? b.bpms?.[0] ?? 0) - (a.primaryBpm ?? a.bpms?.[0] ?? 0));
  } else if (sortBy === 'key-asc') {
    sorted.sort((a, b) => {
      const posA = getCamelotPosition(normalizeKeyForCamelot(a.primaryKey ?? a.keys?.[0]) ?? '') ?? 99;
      const posB = getCamelotPosition(normalizeKeyForCamelot(b.primaryKey ?? b.keys?.[0]) ?? '') ?? 99;
      return posA - posB;
    });
  } else {
    sorted.sort((a, b) => {
      const posA = getCamelotPosition(normalizeKeyForCamelot(a.primaryKey ?? a.keys?.[0]) ?? '') ?? 99;
      const posB = getCamelotPosition(normalizeKeyForCamelot(b.primaryKey ?? b.keys?.[0]) ?? '') ?? 99;
      return posB - posA;
    });
  }
  return sorted;
}
