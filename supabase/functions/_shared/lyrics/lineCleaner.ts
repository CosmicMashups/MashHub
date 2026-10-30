export interface CleanedLine {
  text: string;
  sectionHint?: string;
}

const SECTION_HINT_REGEX = /^\s*\[([^\]]+)\]\s*$/;
const INLINE_TAG_REGEX = /\[[^\]]+\]/g;

/**
 * Normalizes lyric text:
 * - Extracts section hints like [Chorus] or [Verse 1]
 * - Strips bracketed tags
 * - Cleans whitespace and unicode artifacts
 */
export function cleanLyricLine(line: string): CleanedLine | null {
  if (!line || typeof line !== 'string') return null;

  const trimmed = line.trim();
  if (!trimmed) return null;

  // Check if the entire line is a section header like [Verse 1]
  const sectionMatch = trimmed.match(SECTION_HINT_REGEX);
  if (sectionMatch) {
    return {
      text: '',
      sectionHint: sectionMatch[1].trim(),
    };
  }

  // If there's an inline tag e.g. "We gonna party [Chorus]", remove it
  const cleaned = trimmed.replace(INLINE_TAG_REGEX, '').trim();
  if (!cleaned) return null;

  return {
    text: cleaned,
  };
}
