/**
 * Key color gradient utility for section song cards.
 * Uses the same key-to-color assignment as the main page (SongList):
 * C Dark Red, C# Light Red, D Orange, D# Yellow, E Light Green, F Dark Green,
 * F# Light Blue, G Dark Blue, G# Indigo, A Purple, A# Orange-Brown, B Teal-Blue.
 */
import type { CSSProperties } from 'react';
import { getCamelotPosition } from '../constants/camelot';

/** In light mode, gradient fades to theme surface (white). */
const LIGHT_END = 'var(--theme-surface-base)';
/** In dark mode, gradient fades to theme surface (gray-800). */
const DARK_END = 'var(--theme-surface-base)';

/**
 * Key color assignment matching main page (C Major Dark Red through B Major Teal-Blue).
 * Index = Camelot position 1..12. Position maps: 1 B, 2 F#, 3 C#, 4 G#, 5 D#, 6 A#, 7 F, 8 C, 9 G, 10 D, 11 A, 12 E.
 */
const CAMELOT_POSITION_TO_HEX: Record<number, string> = {
  1: '#0d9488',   /* B Major - Teal-Blue */
  2: '#0ea5e9',   /* F# Major - Light Blue */
  3: '#dc2626',   /* C# Major - Light Red */
  4: '#4f46e5',   /* G# Major - Indigo */
  5: '#ca8a04',   /* D# Major - Yellow */
  6: '#c2410c',   /* A# Major - Orange-Brown */
  7: '#15803d',   /* F Major - Dark Green */
  8: '#991b1b',   /* C Major - Dark Red */
  9: '#0369a1',   /* G Major - Dark Blue */
  10: '#ea580c',  /* D Major - Orange */
  11: '#7c3aed',  /* A Major - Purple */
  12: '#16a34a',  /* E Major - Light Green */
};

/**
 * Normalize key display strings like "E Major", "A Minor" to Camelot map keys ("E", "Am").
 * getCamelotPosition only recognizes keys in KEY_TO_CAMELOT (e.g. "E", "Am", "F#"); "E Major" would not match.
 */
export function normalizeKeyForCamelot(key: string | undefined): string | undefined {
  const raw = (key ?? '').trim();
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.endsWith(' major')) {
    const note = raw.slice(0, -6).trim();
    return note || undefined;
  }
  if (lower.endsWith(' minor')) {
    const note = raw.slice(0, -6).trim();
    return note ? `${note}m` : undefined;
  }
  return raw;
}

/**
 * Returns CSS background style for a key-coded gradient (key color -> theme surface).
 * Uses the same 12-key color assignment as the main page.
 */
export function getKeyGradientStyle(
  key: string | undefined,
  isDark: boolean
): CSSProperties {
  const endColor = isDark ? DARK_END : LIGHT_END;
  const normalizedKey = normalizeKeyForCamelot(key);
  const position = normalizedKey != null ? getCamelotPosition(normalizedKey) : null;
  if (position == null) {
    return {
      background: 'var(--theme-surface-base)',
    };
  }
  const keyColor = CAMELOT_POSITION_TO_HEX[position];
  if (!keyColor) {
    return { background: 'var(--theme-surface-base)' };
  }
  return {
    background: `linear-gradient(to right, ${keyColor}, ${endColor})`,
  };
}
