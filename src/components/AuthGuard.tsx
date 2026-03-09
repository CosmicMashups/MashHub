/**
 * When backend is local, bypass auth and render children (guest local mode).
 * When backend is Supabase, show spinner while loading session; then render children (router).
 * Protected routes use ProtectedRoute to redirect to /login when unauthenticated.
 */
import React from 'react';
import { useBackendContext } from '../contexts/BackendContext';
import { useAuthContext } from '../contexts/AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLocal } = useBackendContext();
  const { loading } = useAuthContext();

  if (isLocal) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  return <>{children}</>;
}
