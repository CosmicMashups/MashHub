import { supabase } from './supabase';

export type BackendMode = 'supabase' | 'local';

export interface HealthStatus {
  mode: BackendMode;
  supabaseAvailable: boolean;
  lastChecked: Date;
  error?: string;
}

const HEALTH_CHECK_TIMEOUT_MS = 5000;
const HEALTH_CHECK_RETRIES = 2;

/**
 * Pings Supabase with a minimal query (select 1 row from songs, limit 1).
 * Retries up to HEALTH_CHECK_RETRIES to avoid false "unavailable" on transient failures.
 */
export async function checkSupabaseHealth(): Promise<HealthStatus> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const missing = [];
  if (!url || String(url).trim() === '') missing.push('VITE_SUPABASE_URL');
  if (!anonKey || String(anonKey).trim() === '') missing.push('VITE_SUPABASE_ANON_KEY');
  if (missing.length > 0) {
    return {
      mode: 'local',
      supabaseAvailable: false,
      lastChecked: new Date(),
      error: `Missing ${missing.join(' and ')}. Add them to .env (see .env.example).`,
    };
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= HEALTH_CHECK_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

      const { error } = await supabase
        .from('songs')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timer);

      if (error) throw error;

      return { mode: 'supabase', supabaseAvailable: true, lastChecked: new Date() };
    } catch (err) {
      lastError = err;
      if (attempt < HEALTH_CHECK_RETRIES) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  return {
    mode: 'local',
    supabaseAvailable: false,
    lastChecked: new Date(),
    error: lastError instanceof Error ? lastError.message : String(lastError),
  };
}
