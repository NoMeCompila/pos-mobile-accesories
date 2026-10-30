import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthSession, UserProfile, LoginCredentials } from '../types/auth';
import { authService, AUTH_STORAGE_KEYS } from '../services/authService';

interface AuthContextType {
  session: AuthSession | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
  defaultRememberDevice: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const defaultRememberDevice = localStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER) === 'true';

  // Hydrate session on app startup
  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const existingSession = await authService.getCurrentSession();
        if (isMounted) {
          setSession(existingSession);
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
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthSession> => {
    const newSession = await authService.login(credentials);
    setSession(newSession);
    return newSession;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setSession(null);
  }, []);

  const value: AuthContextType = {
    session,
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading,
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
