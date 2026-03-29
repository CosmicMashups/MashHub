import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        const currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const hashError = hashParams.get('error_description') ?? hashParams.get('error');
        if (hashError) throw new Error(hashError);

        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session) {
          navigate('/', { replace: true });
          return;
        }

        navigate('/login', { replace: true });
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to complete authentication.';
        setError(message);
      }
    };

    void handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-red-700 dark:text-red-300">Authentication error</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 inline-flex items-center rounded-md bg-music-electric px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div
          className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-music-electric border-t-transparent"
          aria-label="Completing authentication"
        />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Completing sign-in...</p>
      </div>
    </div>
  );
}
