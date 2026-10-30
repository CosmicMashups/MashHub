/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_SITE_URL?: string;
	readonly NEXT_PUBLIC_SITE_URL?: string;
	readonly VITE_LYRICS_ENABLED?: string;
	readonly VITE_LYRICS_BACKEND?: 'auto' | 'edge' | 'vercel';
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
