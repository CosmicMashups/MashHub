import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { createRetryFetch } from './supabaseFetch';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = createClient<Database>(url ?? '', anonKey ?? '', {
  global: {
    fetch: createRetryFetch(),
  },
});
