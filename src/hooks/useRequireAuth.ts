/**
 * useRequireAuth: Custom hook for protecting components that require authentication.
 * 
 * This hook checks if the user has a valid session. If not authenticated and not loading,
 * it redirects to the login page with a return URL preserved in the query parameter.
 * 
 * @returns {Object} - Contains session and loading state
 * @property {Session | null} session - The current user session, or null if not authenticated
 * @property {boolean} loading - True while authentication state is being determined
 * 
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const { session, loading } = useRequireAuth();
 *   
 *   if (loading) return <LoadingSpinner />;
 *   // At this point, session is guaranteed to be non-null or redirect has occurred
 *   return <div>Welcome, {session.user.email}</div>;
 * }
 * ```
 */
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export function useRequireAuth() {
  const { session, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we're done loading and there's no session
    if (!loading && !session) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?redirect=${returnUrl}`, { replace: true });
    }
  }, [session, loading, navigate, location]);

  return { session, loading };
}
