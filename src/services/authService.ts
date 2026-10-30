import { IAuthService, LoginCredentials, AuthSession, UserProfile } from '../types/auth';

export const AUTH_STORAGE_KEYS = {
  SESSION: 'voltacc_pos_session_v1',
  REMEMBER: 'voltacc_pos_remember_terminal_v1',
};

const DEFAULT_SELLER_PROFILE: UserProfile = {
  id: 'usr-seller-01',
  username: 'vendedor',
  displayName: 'Carlos Vendedor',
  role: 'seller',
  terminalId: 'KPOS-REG-04',
};

const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'usr-admin-root',
  username: 'admin',
  displayName: 'Admin Root Sistema',
  role: 'admin',
  terminalId: 'TERM-MAIN-04',
};

export class MockAuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { identifier, passKey, rememberDevice } = credentials;

    // Simulate standard POS auth latency
    await new Promise((resolve) => setTimeout(resolve, 250));

    const cleanUser = identifier.trim().toLowerCase();
    const cleanPass = passKey.trim();

    if (!cleanUser || !cleanPass) {
      throw new Error('El usuario o ID y la contraseña operativa son requeridos');
    }

    // Default admin credentials check: admin / 123
    if (cleanUser === 'admin' && cleanPass === '123') {
      const session: AuthSession = {
        user: DEFAULT_ADMIN_PROFILE,
        token: `mock-pos-jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
        rememberDevice,
      };

      this.saveSession(session, rememberDevice);
      return session;
    }

    // Default seller credentials check: vendedor / 123
    if (cleanUser === 'vendedor' && cleanPass === '123') {
      const session: AuthSession = {
        user: DEFAULT_SELLER_PROFILE,
        token: `mock-pos-jwt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
        rememberDevice,
      };

      // Persist according to remember preference
      this.saveSession(session, rememberDevice);
      return session;
    }

    throw new Error('Credenciales inválidas. Verifique su usuario y contraseña');
  }

  async logout(): Promise<void> {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
    } catch (e) {
      console.error('Error clearing session:', e);
    }
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      // Check sessionStorage first, then fallback to localStorage
      const sessionJson =
        sessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION) ||
        localStorage.getItem(AUTH_STORAGE_KEYS.SESSION);

      if (!sessionJson) return null;

      const session: AuthSession = JSON.parse(sessionJson);
      if (session.expiresAt && session.expiresAt < Date.now()) {
        await this.logout();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  private saveSession(session: AuthSession, rememberDevice: boolean): void {
    const serialized = JSON.stringify(session);
    try {
      if (rememberDevice) {
        localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, serialized);
        localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER, 'true');
        sessionStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEYS.SESSION, serialized);
        localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
        localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER, 'false');
      }
    } catch (e) {
      console.error('Failed to persist auth session:', e);
    }
  }
}

export const authService: IAuthService = new MockAuthService();
