/**
 * Module-level backend mode for withFallback.
 * Updated by BackendContext on startup and by markSupabaseUnavailable / markSupabaseAvailable.
 */
import type { BackendMode } from './supabaseHealth';

let _mode: BackendMode = 'supabase';

export function getBackendMode(): BackendMode {
  return _mode;
}

export function setBackendMode(mode: BackendMode): void {
  _mode = mode;
}

export function markSupabaseUnavailable(_err: unknown): void {
  _mode = 'local';
  window.dispatchEvent(new CustomEvent('supabase:unavailable'));
}

export function markSupabaseAvailable(): void {
  _mode = 'supabase';
  window.dispatchEvent(new CustomEvent('supabase:available'));
}

const MAX_ATTEMPTS = 2;

/**
 * Tries supabaseOp first (up to MAX_ATTEMPTS on transient failure).
 * If BackendMode is 'local', skips straight to localOp.
 * If supabaseOp still fails after retries, marks mode as 'local' and runs localOp.
 */
export async function withFallback<T>(
  supabaseOp: () => Promise<T>,
  localOp: () => Promise<T>
): Promise<T> {
  if (getBackendMode() === 'local') {
    return localOp();
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await supabaseOp();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 200 * attempt));
      }
    }
  }
  markSupabaseUnavailable(lastError);
  return localOp();
}
