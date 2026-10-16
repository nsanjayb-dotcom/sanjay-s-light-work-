/**
 * ==============================================================================
 * SANJAY'S LIGHTWORKS - CUSTOM REACT AUTH HOOK (src/hooks/useAuth.ts)
 * ==============================================================================
 * 
 * Provides:
 * 1. Supabase `auth.onAuthStateChange` subscription management.
 * 2. Real-time session state, authenticated user identity, and user profile sync.
 * 3. Automatic protected route redirection based on authentication or role requirements.
 * 4. Helper methods for sign in, sign up, magic link/OTP, sign out, and profile updates.
 * 5. Optional AuthContext and AuthProvider for app-wide shared state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DbUser } from '../types/supabase';

// ==============================================================================
// 1. TYPES & INTERFACES
// ==============================================================================

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: DbUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
}

export interface UseAuthOptions {
  /** If true, triggers redirection when the user is not authenticated */
  requireAuth?: boolean;
  /** If true, triggers redirection when the user is authenticated but not an admin */
  requireAdmin?: boolean;
  /** Destination path for redirection (default: '/login' or '/') */
  redirectTo?: string;
  /** Custom callback invoked whenever access is denied or unauthenticated */
  onUnauthenticated?: () => void;
}

export interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string; session?: Session | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error?: string; user?: User | null }>;
  signInWithOtp: (email: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'apple' | 'github') => Promise<{ error?: string }>;
  signOut: (redirectTo?: string) => Promise<{ error?: string }>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<DbUser, 'id' | 'created_at'>>) => Promise<{ data?: DbUser | null; error?: string }>;
}

export type UseAuthReturn = AuthState & AuthActions;

// Owner/Admin designated email
const PHOTOGRAPHER_ADMIN_EMAIL = 'nsanjayb@gmail.com';

// ==============================================================================
// 2. PROFILE SYNC HELPER
// ==============================================================================

/**
 * Fetches user profile from `public.users` table, or auto-creates it if missing.
 */
async function syncUserProfile(authUser: User): Promise<DbUser | null> {
  if (!isSupabaseConfigured || !authUser) return null;

  try {
    // 1. Try to fetch existing profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (!error && data) {
      return data as DbUser;
    }

    // 2. If no record exists, initialize a new user profile
    const fallbackName = 
      authUser.user_metadata?.full_name || 
      authUser.user_metadata?.name || 
      (authUser.email ? authUser.email.split('@')[0] : 'Client');

    const role = (authUser.email === PHOTOGRAPHER_ADMIN_EMAIL || authUser.user_metadata?.role === 'admin') 
      ? 'admin' 
      : 'client';

    const newProfile = {
      id: authUser.id,
      email: authUser.email || '',
      full_name: fallbackName,
      phone: authUser.phone || authUser.user_metadata?.phone || null,
      role: role as 'client' | 'admin',
    };

    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .upsert(newProfile, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (insertError) {
      console.warn('[useAuth] Could not create profile row:', insertError.message);
      return newProfile as DbUser;
    }

    return inserted as DbUser;
  } catch (err) {
    console.error('[useAuth] Failed to sync user profile:', err);
    return null;
  }
}

// ==============================================================================
// 3. CORE CUSTOM HOOK: useAuth
// ==============================================================================

/**
 * Custom React hook wrapping Supabase `auth.onAuthStateChange`
 * 
 * Features:
 * - Real-time session and user tracking
 * - Automatic profile synchronization from `public.users`
 * - Automatic protected route redirection with `requireAuth` or `requireAdmin`
 * - Resilient offline/demo mode fallbacks
 */
export function useAuth(options?: UseAuthOptions): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Determine whether current user is an admin
  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.email === PHOTOGRAPHER_ADMIN_EMAIL) return true;
    if (user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin') return true;
    if (profile?.role === 'admin') return true;
    return false;
  }, [user, profile]);

  const isAuthenticated = Boolean(user && session);

  // ----------------------------------------------------------------------------
  // A. INITIAL SESSION LOAD & REAL-TIME LISTENER
  // ----------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      // In unconfigured / mock mode, check local admin status as fallback
      const localAdmin = typeof window !== 'undefined' && localStorage.getItem('sanjay_admin_authenticated') === 'true';
      if (localAdmin && isMounted) {
        setProfile({
          id: 'admin-local-id',
          email: PHOTOGRAPHER_ADMIN_EMAIL,
          full_name: "Sanjay (Owner)",
          phone: null,
          role: 'admin',
          created_at: new Date().toISOString()
        });
      }
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error: getSessionError }) => {
      if (!isMounted) return;

      if (getSessionError) {
        console.error('[useAuth] Error getting initial session:', getSessionError.message);
        setError(getSessionError.message);
        setLoading(false);
        return;
      }

      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        const userProfile = await syncUserProfile(initialSession.user);
        if (isMounted) setProfile(userProfile);
      }

      if (isMounted) setLoading(false);
    }).catch(err => {
      if (isMounted) {
        setError(err.message);
        setLoading(false);
      }
    });

    // 2. Subscribe to auth changes via `onAuthStateChange`
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setError(null);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (currentSession?.user) {
            const userProfile = await syncUserProfile(currentSession.user);
            if (isMounted) setProfile(userProfile);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ----------------------------------------------------------------------------
  // B. AUTOMATIC PROTECTED ROUTE REDIRECTION
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // Only evaluate after initial loading resolves
    if (loading) return;

    const { requireAuth, requireAdmin, redirectTo, onUnauthenticated } = options || {};

    const shouldRedirectUnauthenticated = requireAuth && !isAuthenticated;
    const shouldRedirectNonAdmin = requireAdmin && (!isAuthenticated || !isAdmin);

    if (shouldRedirectUnauthenticated || shouldRedirectNonAdmin) {
      if (onUnauthenticated) {
        onUnauthenticated();
        return;
      }

      if (redirectTo && typeof window !== 'undefined') {
        // Safe redirection without page refresh loop if already on target path
        if (window.location.pathname !== redirectTo && !window.location.href.endsWith(redirectTo)) {
          window.location.assign(redirectTo);
        }
      }
    }
  }, [loading, isAuthenticated, isAdmin, options]);

  // ----------------------------------------------------------------------------
  // C. AUTHENTICATION ACTIONS
  // ----------------------------------------------------------------------------

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    if (!isSupabaseConfigured) {
      // Local fallback for demo credentials
      if (password === 'Bhanu Naveen' || email === PHOTOGRAPHER_ADMIN_EMAIL) {
        localStorage.setItem('sanjay_admin_authenticated', 'true');
        return { session: null };
      }
      return { error: 'Supabase credentials not configured' };
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return { error: signInError.message };
      }

      setSession(data.session);
      setUser(data.user);
      return { session: data.session };
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    }
  }, []);

  const signUpWithEmail = useCallback(async (
    email: string, 
    password: string, 
    fullName?: string, 
    phone?: string
  ) => {
    setError(null);
    if (!isSupabaseConfigured) {
      return { error: 'Supabase credentials not configured' };
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName?.trim() || '',
            phone: phone?.trim() || '',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return { error: signUpError.message };
      }

      return { user: data.user };
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    }
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    setError(null);
    if (!isSupabaseConfigured) {
      return { error: 'Supabase credentials not configured' };
    }

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (otpError) {
        setError(otpError.message);
        return { error: otpError.message };
      }

      return {};
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple' | 'github') => {
    setError(null);
    if (!isSupabaseConfigured) {
      return { error: 'Supabase credentials not configured' };
    }

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        return { error: oauthError.message };
      }

      return {};
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    }
  }, []);

  const signOut = useCallback(async (redirectPath?: string) => {
    setError(null);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('sanjay_admin_authenticated');
      setSession(null);
      setUser(null);
      setProfile(null);

      if (redirectPath && typeof window !== 'undefined') {
        window.location.assign(redirectPath);
      }

      return {};
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;

      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        const refreshedProfile = await syncUserProfile(data.user);
        setProfile(refreshedProfile);
      }
    } catch (err: any) {
      console.warn('[useAuth] Could not refresh session:', err.message);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Omit<DbUser, 'id' | 'created_at'>>) => {
    if (!user) {
      return { error: 'No authenticated user to update profile for.' };
    }

    if (!isSupabaseConfigured) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { data: profile ? { ...profile, ...updates } : null };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        return { error: updateError.message };
      }

      setProfile(data as DbUser);
      return { data: data as DbUser };
    } catch (err: any) {
      return { error: err.message };
    }
  }, [user, profile]);

  return {
    session,
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithOtp,
    signInWithOAuth,
    signOut,
    refreshSession,
    updateProfile,
  };
}

// ==============================================================================
// 4. OPTIONAL GLOBAL AUTH CONTEXT & PROVIDER
// ==============================================================================

const AuthContext = createContext<UseAuthReturn | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  options?: UseAuthOptions;
}

export function AuthProvider({ children, options }: AuthProviderProps) {
  const auth = useAuth(options);
  return React.createElement(AuthContext.Provider, { value: auth }, children);
}

/**
 * Access the shared global AuthContext
 * (Must be used within an <AuthProvider>)
 */
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an <AuthProvider>');
  }
  return context;
}

export default useAuth;
