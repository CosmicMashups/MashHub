import type { Song } from '../types';
import { calculateCompatibilityScore, calculateSectionCompatibility } from './compatibilityScore';
import type { SectionConstraints } from './compatibilityScore';

export type SectionWarningType =
  | 'bpm-mismatch'
  | 'key-clash'
  | 'bpm-outside-range'
  | 'key-outside-range'
  | 'duplicate-song';

export interface SectionWarning {
  type: SectionWarningType;
  label: string;
  songIds: [string, string];
  /** Human-readable detail for BPM/key outside-range (e.g. "Song 156 BPM, section range 135–160") */
  detail?: string;
}

/**
 * Returns warnings for a section: per-song (section compatibility) and consecutive pairs (song-vs-song).
 */
export function getWarningsForSection(
  songs: (Song & { entryId: string; locked: boolean })[],
  section: SectionConstraints
): SectionWarning[] {
  const warnings: SectionWarning[] = [];

  // Duplicate song in section
  for (let i = 0; i < songs.length; i++) {
    for (let j = i + 1; j < songs.length; j++) {
      if (songs[i].id === songs[j].id) {
        warnings.push({
          type: 'duplicate-song',
          label: 'Duplicate song',
          songIds: [songs[i].id, songs[j].id],
        });
      }
    }
  }

  // Per-song: section compatibility (bpm-outside-range, key-outside-range)
  for (const song of songs) {
    const result = calculateSectionCompatibility(song, section);
    const songBpm = song.primaryBpm ?? song.bpms?.[0];
    const songKey = song.primaryKey ?? song.keys?.[0] ?? '';
    for (const w of result.warnings) {
      if (w === 'bpm-outside-range' || w === 'key-outside-range') {
        const label = w === 'bpm-outside-range' ? 'BPM outside section range' : 'Key outside section range';
        let detail: string | undefined;
        if (w === 'bpm-outside-range') {
          if (section.bpmRangeMin != null && section.bpmRangeMax != null) {
            detail = `Song ${songBpm != null ? songBpm : '?'} BPM, section range ${section.bpmRangeMin}–${section.bpmRangeMax}`;
          } else if (section.targetBpm != null) {
            detail = `Song ${songBpm != null ? songBpm : '?'} BPM, section target ${section.targetBpm}`;
          }
        } else {
          if (section.keyRange != null && section.keyRange.length > 0) {
            detail = `Song key ${songKey || '?'}, allowed: ${section.keyRange.join(', ')}`;
          } else if (section.targetKey) {
            detail = `Song key ${songKey || '?'}, section target ${section.targetKey}`;
          }
        }
        warnings.push({ type: w, label, songIds: [song.id, song.id], detail });
      }
    }
  }

  // Consecutive pairs: bpm-mismatch, key-clash
  for (let i = 0; i < songs.length - 1; i++) {
    const songA = songs[i];
    const songB = songs[i + 1];
    const result = calculateCompatibilityScore(songA, songB);
    for (const w of result.warnings) {
      if (w === 'duplicate-song') continue;
      const label =
        w === 'bpm-mismatch' ? 'BPM mismatch' : w === 'key-clash' ? 'Key clash' : w;
      warnings.push({ type: w, label, songIds: [songA.id, songB.id] });
    }
  }

  return warnings;
}
