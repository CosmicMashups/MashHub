/**
 * ProtectedRoute: redirects to /login when backend is Supabase and user has no session.
 * When backend is local, renders children without requiring auth.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useBackendContext } from '../contexts/BackendContext';
import { useAuthContext } from '../contexts/AuthContext';
import { PrimaryLoader } from './loading/PrimaryLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLocal } = useBackendContext();
  const { session, loading } = useAuthContext();
  const location = useLocation();

  if (isLocal) return <>{children}</>;
  if (loading) {
    return <PrimaryLoader label="Authenticating" />;
  }
  if (!session) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }
  return <>{children}</>;
}
