/**
 * Jikan API Service
 *
 * Provides functions to fetch anime cover/poster images from Jikan API (MyAnimeList API).
 * Jikan API is free and does not require authentication.
 *
 * ## Rate-limit handling
 * Jikan allows ~3 requests/second. This module enforces three layers of protection:
 *
 *  1. **Origin-level cache** — results are cached by normalised anime title so multiple
 *     songs that share the same origin (e.g. "Attack on Titan") reuse one lookup.
 *
 *  2. **In-flight deduplication** — if a request for the same origin is already
 *     in-flight, subsequent callers receive the same Promise instead of firing a new
 *     HTTP request.
 *
 *  3. **Sequential rate-limit queue** — all outbound fetches are serialised through a
 *     FIFO queue that inserts a ~400 ms pause between consecutive requests, keeping
 *     throughput safely below 3 req/s.
 *
 * API Documentation: https://docs.api.jikan.moe/
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JikanAnimeImage {
  jpg: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
  webp: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
}

interface JikanAnime {
  mal_id: number;
  title: string;
  images: JikanAnimeImage;
}

interface JikanSearchResponse {
  data: JikanAnime[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------

/** Minimum ms between consecutive outbound Jikan requests (~2.5 req/s). */
const REQUEST_DELAY_MS = 400;

/**
 * Origin-level result cache.
 * key   = normalised origin string (lowercase, trimmed)
 * value = image URL or null
 */
const originCache = new Map<string, string | null>();

/**
 * In-flight request map.
 * key   = normalised origin string
 * value = pending Promise — shared with all callers asking for the same origin
 */
const inFlight = new Map<string, Promise<string | null>>();

/** FIFO queue of functions waiting to make an outbound HTTP call. */
type QueueEntry = () => void;
const requestQueue: QueueEntry[] = [];

/** Whether the queue drain loop is currently running. */
let isProcessingQueue = false;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Normalise an origin string to a stable cache key. */
function normaliseOrigin(origin: string): string {
  return origin.trim().toLowerCase();
}

/**
 * Drain the request queue one entry at a time, inserting REQUEST_DELAY_MS
 * between each outbound call.
 */
async function drainQueue(): Promise<void> {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const next = requestQueue.shift();
    next?.();
    // Wait between requests so we stay within the Jikan rate limit.
    await new Promise<void>((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }

  isProcessingQueue = false;
}

/**
 * Enqueue a rate-limited fetch task and return a Promise that resolves when
 * the task completes.
 */
function enqueueRequest<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push(() => {
      task().then(resolve, reject);
    });
    void drainQueue();
  });
}

/**
 * Execute the actual Jikan HTTP request for the given search query.
 * Returns the large image URL of the first result, or null if not found.
 */
async function fetchAnimeImageFromApi(searchQuery: string): Promise<string | null> {
  const encodedQuery = encodeURIComponent(searchQuery);
  const apiUrl = `https://api.jikan.moe/v4/anime?q=${encodedQuery}&limit=1`;

  const response = await fetch(apiUrl);

  if (response.status === 429) {
    console.warn('Jikan API rate limit reached for query:', searchQuery);
    return null;
  }

  if (!response.ok) {
    console.error('Jikan API error:', response.status, response.statusText);
    return null;
  }

  const data: JikanSearchResponse = await response.json() as JikanSearchResponse;

  if (!data.data || data.data.length === 0) {
    return null;
  }

  const firstAnime = data.data[0];
  return firstAnime?.images?.jpg?.large_image_url ?? null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches anime cover image URL from Jikan API based on anime title (origin).
 *
 * Applies three layers of optimisation before making a network call:
 * - returns immediately from origin cache if the title was previously resolved
 * - shares an existing in-flight Promise if the same title is being fetched
 * - otherwise enqueues a rate-limited HTTP request
 *
 * @param origin - The anime title to search for (from song.origin field)
 * @returns Promise resolving to the large image URL or null if not found/error
 *
 * @example
 * const imageUrl = await fetchAnimeCover("Attack on Titan");
 * // Returns: "https://cdn.myanimelist.net/images/anime/10/47347l.jpg" or null
 */
export async function fetchAnimeCover(origin: string): Promise<string | null> {
  if (!origin || typeof origin !== 'string') {
    return null;
  }

  const key = normaliseOrigin(origin);
  if (!key) {
    return null;
  }

  // 1. Origin-level cache hit
  if (originCache.has(key)) {
    return originCache.get(key) ?? null;
  }

  // 2. In-flight deduplication — return the existing promise if one exists
  const existing = inFlight.get(key);
  if (existing) {
    return existing;
  }

  // 3. Enqueue a new rate-limited request
  const promise = enqueueRequest(() => fetchAnimeImageFromApi(key)).then(
    (result) => {
      // Populate origin cache and remove from in-flight map
      originCache.set(key, result);
      inFlight.delete(key);
      return result;
    },
    (err: unknown) => {
      console.error('Error fetching anime cover from Jikan API:', err);
      originCache.set(key, null);
      inFlight.delete(key);
      return null;
    }
  );

  inFlight.set(key, promise);
  return promise;
}

/**
 * Clears the origin-level cache and any in-flight requests.
 * Intended for testing or manual cache invalidation.
 */
export function clearJikanCache(): void {
  originCache.clear();
  inFlight.clear();
  requestQueue.length = 0;
  isProcessingQueue = false;
}
