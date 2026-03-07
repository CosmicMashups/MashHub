/**
 * Key color gradient utility for section song cards.
 * Uses Camelot position for consistent key -> color mapping.
 */
import type { CSSProperties } from 'react';
import { getCamelotPosition } from '../constants/camelot';

/** Neutral gradient when key is unknown (no tint). */
const LIGHT_END = '#ffffff';
const DARK_END = '#1f293b';

/**
 * Map Camelot position (1-12) to HSL hue (0-360) for a consistent key color wheel.
 * Position 1 = 0deg (red), 4 = 90deg (green), 7 = 180deg (cyan), 10 = 270deg (blue).
 */
function hueForCamelotPosition(position: number): number {
  return ((position - 1) * 30) % 360;
}

/**
 * Returns CSS background style for a key-coded gradient (key color -> white in light mode, key color -> dark in dark mode).
 * Uses the song key to pick a hue; saturation and lightness are fixed for consistency.
 */
export function getKeyGradientStyle(
  key: string | undefined,
  isDark: boolean
): CSSProperties {
  const endColor = isDark ? DARK_END : LIGHT_END;
  const position = key != null && key.trim() !== '' ? getCamelotPosition(key.trim()) : null;
  if (position == null) {
    return {
      background: isDark ? 'rgb(55 65 81)' : 'rgb(249 250 251)',
    };
  }
  const hue = hueForCamelotPosition(position);
  const keyColor = `hsl(${hue}, 55%, ${isDark ? '45%' : '88%'})`;
  return {
    background: `linear-gradient(to right, ${keyColor}, ${endColor})`,
  };
}
