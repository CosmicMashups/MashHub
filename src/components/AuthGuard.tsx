/**
 * When backend is local, bypass auth and render children (guest local mode).
 * When backend is Supabase, show spinner while loading session; then render children (router).
 * Protected routes use ProtectedRoute to redirect to /login when unauthenticated.
 */
import React from 'react';
import { useBackendContext } from '../contexts/BackendContext';
import { useAuthContext } from '../contexts/AuthContext';
import { PrimaryLoader } from './loading/PrimaryLoader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLocal } = useBackendContext();
  const { loading } = useAuthContext();

  if (isLocal) return <>{children}</>;

  if (loading) {
    return <PrimaryLoader label="Syncing session" />;
  }

  return <>{children}</>;
}
