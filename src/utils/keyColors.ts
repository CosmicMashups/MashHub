/**
 * Key color gradient utility for section song cards.
 * Uses the same key-to-color assignment as the main page (SongList):
 * C Dark Red, C# Light Red, D Orange, D# Yellow, E Light Green, F Dark Green,
 * F# Light Blue, G Dark Blue, G# Indigo, A Purple, A# Orange-Brown, B Teal-Blue.
 */
import type { CSSProperties } from 'react';
import { getCamelotPosition } from '../constants/camelot';
import { musicKeyPalette } from '../theme/colors';

/** In light mode, gradient fades to theme surface (white). */
const LIGHT_END = 'var(--theme-surface-base)';
/** In dark mode, gradient fades to theme surface (gray-800). */
const DARK_END = 'var(--theme-surface-base)';

/**
 * Key color assignment matching main page (C Major Dark Red through B Major Teal-Blue).
 * Index = Camelot position 1..12. Position maps: 1 B, 2 F#, 3 C#, 4 G#, 5 D#, 6 A#, 7 F, 8 C, 9 G, 10 D, 11 A, 12 E.
 */
const CAMELOT_POSITION_TO_HEX: Record<number, string> = { ...musicKeyPalette };

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

export function getKeyRowStyle(key: string | undefined, isDark: boolean): CSSProperties {
  const normalizedKey = normalizeKeyForCamelot(key);
  const position = normalizedKey != null ? getCamelotPosition(normalizedKey) : null;
  const keyColor = position != null ? CAMELOT_POSITION_TO_HEX[position] : undefined;
  if (!keyColor) {
    return {
      background: 'var(--theme-surface-base)',
      borderLeft: '4px solid var(--theme-border-default)',
    };
  }

  const baseBackground = isDark
    ? `color-mix(in srgb, ${keyColor} 18%, var(--theme-surface-base))`
    : `color-mix(in srgb, ${keyColor} 14%, var(--theme-surface-base))`;

  return {
    background: baseBackground,
    borderLeft: `4px solid ${keyColor}`,
  };
}
