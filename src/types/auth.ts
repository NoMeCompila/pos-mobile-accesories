export type UserRole = 'seller' | 'manager';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  terminalId?: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: number;
  rememberDevice?: boolean;
}

export interface LoginCredentials {
  identifier: string;
  passKey: string;
  rememberDevice: boolean;
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
}
