import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { fetchProfileRole, isAdminRole, isEvaluatorRole } from '../services/moderationService';
import type { UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileUsername: string | null;
  role: UserRole | null;
  profileLoading: boolean;
  isEvaluator: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateUser: (updates: { username?: string; password?: string }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthContext.Provider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    const s = await authService.getSession();
    const u = s?.user ?? null;
    if (!u) {
      setProfileUsername(null);
      setRole(null);
      return;
    }
    setProfileLoading(true);
    try {
      const row = await fetchProfileRole(u.id);
      setProfileUsername(row?.username ?? null);
      setRole((row?.role as UserRole) ?? 'user');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange((u, s) => {
      setUser(u);
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [user?.id, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    const { error } = await authService.signUp(email, password, username ? { username } : undefined);
    return { error: error?.message ?? null };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await authService.signInWithMagicLink(email);
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(() => authService.signOut(), []);

  const updateUser = useCallback(async (updates: { username?: string; password?: string }) => {
    const { error } = await authService.updateUser(updates);
    return { error: error?.message ?? null };
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    profileUsername,
    role,
    profileLoading,
    isEvaluator: isEvaluatorRole(role ?? undefined),
    isAdmin: isAdminRole(role ?? undefined),
    refreshProfile,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
