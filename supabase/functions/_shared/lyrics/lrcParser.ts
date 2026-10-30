export interface ParsedLrcLine {
  startMs?: number;
  text: string;
}

export interface ParsedLrc {
  lines: ParsedLrcLine[];
  hasTimestamps: boolean;
}

const TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
const METADATA_TAG_REGEX = /^\[[a-zA-Z]+:[^\]]*\]$/;

/**
 * Parses plain or synced LRC string into structured lines with millisecond timestamps.
 */
export function parseLrc(raw: string): ParsedLrc {
  if (!raw || typeof raw !== 'string') {
    return { lines: [], hasTimestamps: false };
  }

  const rawLines = raw.split(/\r?\n/);
  const result: ParsedLrcLine[] = [];
  let foundTimestamps = false;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata tags like [ar: Artist], [ti: Title], [offset: 0]
    if (METADATA_TAG_REGEX.test(trimmed)) {
      continue;
    }

    // Match all timestamp tags in the line (e.g. [01:23.45] or [01:23.45][02:34.56] text)
    const matches = Array.from(trimmed.matchAll(TIMESTAMP_REGEX));
    if (matches.length > 0) {
      foundTimestamps = true;
      const text = trimmed.replace(TIMESTAMP_REGEX, '').trim();
      if (!text) continue;

      for (const match of matches) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const fracStr = match[3] || '0';
        let ms = 0;
        if (fracStr.length === 1) ms = parseInt(fracStr, 10) * 100;
        else if (fracStr.length === 2) ms = parseInt(fracStr, 10) * 10;
        else ms = parseInt(fracStr.slice(0, 3), 10);

        const totalMs = min * 60 * 1000 + sec * 1000 + ms;
        result.push({ startMs: totalMs, text });
      }
    } else {
      // Plain lyric line
      result.push({ text: trimmed });
    }
  }

  // Sort lines by timestamp if available
  if (foundTimestamps) {
    result.sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));
  }

  return {
    lines: result,
    hasTimestamps: foundTimestamps,
  };
}
