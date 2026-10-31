import { IAuthService, LoginCredentials, AuthSession, UserProfile, UserRole } from '../types/auth';
import { supabase as defaultSupabase } from './supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

export const AUTH_STORAGE_KEYS = {
  SESSION: 'voltacc_pos_session_v1',
  REMEMBER: 'voltacc_pos_remember_terminal_v1',
  SESSION_EXPIRED: 'voltacc_pos_session_expired_v1',
};

export class SupabaseAuthService implements IAuthService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = defaultSupabase) {
    this.client = client;
  }

  private resolveEmail(identifier: string): string {
    const trimmed = identifier.trim().toLowerCase();
    if (trimmed.includes('@')) {
      return trimmed;
    }
    // Convenience mappings for common shorthand operator IDs
    if (trimmed === 'vendedor') return 'cashier_suc1@pos.local';
    if (trimmed === 'admin') return 'admin@pos.local';
    if (trimmed === 'manager') return 'manager_suc1@pos.local';
    if (trimmed === 'tech' || trimmed === 'tecnico') return 'tech_suc2@pos.local';
    return `${trimmed}@pos.local`;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { identifier, passKey, rememberDevice } = credentials;

    const cleanUser = identifier.trim();
    const cleanPass = passKey.trim();

    if (!cleanUser || !cleanPass) {
      throw new Error('El usuario o ID y la contraseña operativa son requeridos');
    }

    // Persist remember preference so storage adapter routes to localStorage or sessionStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER, rememberDevice ? 'true' : 'false');
      } catch (e) {
        console.warn('Failed to set remember device preference:', e);
      }
    }

    const email = this.resolveEmail(cleanUser);

    const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
      email,
      password: cleanPass,
    });

    if (authError || !authData.user || !authData.session) {
      const message =
        authError?.message?.includes('Invalid login credentials')
          ? 'Credenciales inválidas. Verifique su usuario y contraseña'
          : authError?.message || 'Error al iniciar sesión';
      throw new Error(message);
    }

    // Hydrate profile from public.user_profiles
    const { data: profile, error: profileError } = await this.client
      .from('user_profiles')
      .select('id, email, first_name, last_name, role, branch_id, phone, status')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      await this.client.auth.signOut();
      throw new Error('No se encontró el perfil de operador asociado en la base de datos.');
    }

    if (profile.status === false) {
      await this.client.auth.signOut();
      throw new Error('La cuenta de operador se encuentra desactivada. Contacte a un administrador.');
    }

    const userProfile: UserProfile = {
      id: profile.id,
      email: profile.email || authData.user.email || '',
      username: profile.email ? profile.email.split('@')[0] : (profile.first_name || 'operador'),
      displayName:
        [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
        profile.email ||
        'Operador',
      firstName: profile.first_name || undefined,
      lastName: profile.last_name || undefined,
      role: profile.role as UserRole,
      branchId: profile.branch_id,
      phone: profile.phone,
      status: profile.status,
      terminalId: 'KPOS-REG-04',
    };

    const session: AuthSession = {
      user: userProfile,
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresAt: authData.session.expires_at ? authData.session.expires_at * 1000 : Date.now() + 3600 * 1000,
      rememberDevice,
    };

    // Clear any previous session expired flag
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_EXPIRED);
      } catch {}
    }

    return session;
  }

  async logout(): Promise<void> {
    try {
      await this.client.auth.signOut();
    } catch (e) {
      console.error('Error signing out from Supabase:', e);
    } finally {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
          sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
        } catch {}
      }
    }
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();

      if (error || !session) {
        if (error) {
          this.purgeStaleSession(true);
        }
        return null;
      }

      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        await this.logout();
        this.purgeStaleSession(true);
        return null;
      }

      // Hydrate profile
      const { data: profile, error: profileError } = await this.client
        .from('user_profiles')
        .select('id, email, first_name, last_name, role, branch_id, phone, status')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.status === false) {
        await this.logout();
        return null;
      }

      const rememberVal = typeof window !== 'undefined'
        ? localStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER) === 'true'
        : true;

      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.email || session.user.email || '',
        username: profile.email ? profile.email.split('@')[0] : (profile.first_name || 'operador'),
        displayName:
          [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
          profile.email ||
          'Operador',
        firstName: profile.first_name || undefined,
        lastName: profile.last_name || undefined,
        role: profile.role as UserRole,
        branchId: profile.branch_id,
        phone: profile.phone,
        status: profile.status,
        terminalId: 'KPOS-REG-04',
      };

      return {
        user: userProfile,
        token: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600 * 1000,
        rememberDevice: rememberVal,
      };
    } catch {
      this.purgeStaleSession(true);
      return null;
    }
  }

  private purgeStaleSession(setExpiredNotice: boolean): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
        sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
        if (setExpiredNotice) {
          sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION_EXPIRED, 'true');
        }
      } catch {}
    }
  }
}

export const authService: IAuthService = new SupabaseAuthService();
