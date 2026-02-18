/**
 * Shared in-memory cache for cover image URLs
 * Used by both useCoverImage and useCoverImagesForSongs hooks
 * Key: song.id, Value: image URL string or null
 */
export const coverImageCache = new Map<string, string | null>();
