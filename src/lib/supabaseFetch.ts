/**
 * Fetch wrapper that retries on transient failures (network errors, 5xx, 429).
 * Reduces random connection failures when using Supabase.
 */
const MAX_RETRIES = 2;
const INITIAL_DELAY_MS = 300;

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message?.toLowerCase().includes('fetch')) return true;
  if (err instanceof Error && (err.name === 'AbortError' || err.message === 'Failed to fetch')) return true;
  return false;
}

export function createRetryFetch(): typeof fetch {
  const baseFetch = typeof fetch !== 'undefined' ? fetch : (() => {
    throw new Error('fetch is not available');
  })();

  return async function retryFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await baseFetch(input, init);
        if (res.ok || !isRetryable(res.status)) return res;
        lastError = new Error(`HTTP ${res.status}`);
        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      } catch (err) {
        lastError = err;
        if (!isNetworkError(err) || attempt >= MAX_RETRIES) throw err;
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastError;
  };
}
