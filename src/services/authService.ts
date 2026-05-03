/**
 * Thin wrappers over supabase.auth for use by AuthContext.
 */
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/siteUrl';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignUpOptions {
  username?: string;
}

export const authService = {
  async signUp(email: string, password: string, options?: SignUpOptions): Promise<AuthResponse> {
    const emailRedirectTo = getAuthRedirectUrl();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(options?.username ? { data: { username: options.username } } : {}),
        emailRedirectTo,
      },
    });
    return { user: data.user, session: data.session, error };
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, session: data.session, error };
  },

  async signInWithMagicLink(email: string): Promise<{ error: AuthError | null }> {
    const emailRedirectTo = getAuthRedirectUrl();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    return { error };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async updateUser(updates: { username?: string; password?: string }): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.updateUser({
      ...(updates.password && { password: updates.password }),
      ...(updates.username !== undefined && { data: { username: updates.username } }),
    });
    return { user: data.user, session: null, error };
  },

  onAuthStateChange(cb: (user: User | null, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      cb(session?.user ?? null, session ?? null);
    });
  },
};
