import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { createRetryFetch } from './supabaseFetch';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
  url && anonKey ? { global: { fetch: createRetryFetch() } } : {}
);
