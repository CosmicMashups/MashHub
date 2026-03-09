/**
 * ProtectedRoute: redirects to /login when backend is Supabase and user has no session.
 * When backend is local, renders children without requiring auth.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useBackendContext } from '../contexts/BackendContext';
import { useAuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLocal } = useBackendContext();
  const { session, loading } = useAuthContext();
  const location = useLocation();

  if (isLocal) return <>{children}</>;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div
          className="animate-spin rounded-full h-12 w-12 border-4 border-music-electric border-t-transparent"
          aria-label="Loading"
        />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
