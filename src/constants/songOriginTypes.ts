/** Canonical song `type` values from the songs table (origin/category). */
export const PROJECT_SONG_TYPE_OPTIONS = [
  { value: 'Anime', label: 'Anime' },
  { value: 'Western', label: 'Western' },
  { value: 'K-Pop', label: 'K-Pop' },
  { value: 'OPM', label: 'OPM' },
] as const;

export type ProjectSongTypeFilter = (typeof PROJECT_SONG_TYPE_OPTIONS)[number]['value'];

export function normalizeSongTypeForFilter(type: string): string {
  const t = (type ?? '').trim().toLowerCase();
  if (t === 'kpop' || t === 'k-pop') return 'k-pop';
  return t;
}

export function songMatchesProjectSongTypes(
  song: { type?: string },
  allowedSongTypes?: string[] | null
): boolean {
  if (!allowedSongTypes || allowedSongTypes.length === 0) return true;
  const songNorm = normalizeSongTypeForFilter(song.type ?? '');
  return allowedSongTypes.some((a) => normalizeSongTypeForFilter(a) === songNorm);
}

export function filterSongsByProjectSongTypes<T extends { type?: string }>(
  songs: T[],
  allowedSongTypes?: string[] | null
): T[] {
  if (!allowedSongTypes?.length) return songs;
  return songs.filter((s) => songMatchesProjectSongTypes(s, allowedSongTypes));
}
