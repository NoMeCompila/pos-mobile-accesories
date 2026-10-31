import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthSession, UserProfile, LoginCredentials } from '../types/auth';
import { authService, AUTH_STORAGE_KEYS } from '../services/authService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  session: AuthSession | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean;
  clearSessionExpiredNotice: () => void;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
  defaultRememberDevice: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION_EXPIRED) === 'true';
  });

  const isExplicitLogoutRef = useRef(false);

  const defaultRememberDevice = typeof window !== 'undefined'
    ? localStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER) !== 'false'
    : true;

  const clearSessionExpiredNotice = useCallback(() => {
    setIsSessionExpired(false);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_EXPIRED);
      } catch {}
    }
  }, []);

  // Hydrate session on app startup
  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const existingSession = await authService.getCurrentSession();
        if (isMounted) {
          setSession(existingSession);
          if (!existingSession && typeof window !== 'undefined' && sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION_EXPIRED) === 'true') {
            setIsSessionExpired(true);
          }
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    hydrate();

    // Subscribe to Supabase auth events for background token refresh and session state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'TOKEN_REFRESHED' && newSession) {
        // Silent token refresh: Update token in state WITHOUT toggling isLoading or unmounting UI
        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            token: newSession.access_token,
            refreshToken: newSession.refresh_token,
            expiresAt: newSession.expires_at ? newSession.expires_at * 1000 : Date.now() + 3600 * 1000,
          };
        });
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        if (!isExplicitLogoutRef.current) {
          // Token was revoked or session died unexpectedly
          setIsSessionExpired(true);
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION_EXPIRED, 'true');
            } catch {}
            if (window.location.hash !== '#login') {
              window.location.hash = 'login';
            }
          }
        }
        isExplicitLogoutRef.current = false;
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthSession> => {
    setIsLoading(true);
    isExplicitLogoutRef.current = false;
    try {
      const newSession = await authService.login(credentials);
      setSession(newSession);
      clearSessionExpiredNotice();
      return newSession;
    } finally {
      setIsLoading(false);
    }
  }, [clearSessionExpiredNotice]);

  const logout = useCallback(async (): Promise<void> => {
    isExplicitLogoutRef.current = true;
    setIsLoading(true);
    try {
      await authService.logout();
      setSession(null);
      clearSessionExpiredNotice();
    } finally {
      setIsLoading(false);
    }
  }, [clearSessionExpiredNotice]);

  const value: AuthContextType = {
    session,
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading,
    isSessionExpired,
    clearSessionExpiredNotice,
    login,
    logout,
    defaultRememberDevice,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
