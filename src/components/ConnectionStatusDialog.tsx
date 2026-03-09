/**
 * Shown when backend mode is local (Supabase unavailable). Non-blocking; user can dismiss.
 */
import React, { useState } from 'react';
import { useBackendContext } from '../contexts/BackendContext';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export function ConnectionStatusDialog() {
  const { isLocal, isChecking, status, retry } = useBackendContext();
  const [dismissed, setDismissed] = useState(false);
  const [showError, setShowError] = useState(false);

  if (!isLocal || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg border-2 border-amber-500/80 bg-amber-50 dark:bg-amber-950/90 dark:border-amber-600 shadow-lg p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Working Offline</h3>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            Supabase is unavailable. Changes are being saved locally and will not sync across devices.
          </p>
          {showError && status.error && (
            <div className="mt-2 rounded bg-amber-200/50 dark:bg-amber-900/50 p-2 text-xs text-amber-900 dark:text-amber-100">
              <pre className="whitespace-pre-wrap break-words">{status.error}</pre>
              <p className="mt-1 opacity-80">Last checked: {status.lastChecked.toLocaleTimeString()}</p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowError((v) => !v)}
              className="text-xs font-medium text-amber-800 dark:text-amber-200 underline hover:no-underline"
            >
              {showError ? 'Hide details' : 'Show details'}
            </button>
            <button
              type="button"
              onClick={() => retry()}
              disabled={isChecking}
              className="inline-flex items-center gap-1.5 rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isChecking ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Retry Connection
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-200/50 dark:hover:bg-amber-800/50"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
