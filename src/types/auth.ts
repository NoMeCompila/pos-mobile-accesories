export type UserRole = 'admin' | 'manager' | 'cashier' | 'technician' | 'customer' | 'seller';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  branchId?: string | null;
  phone?: string | null;
  status?: boolean;
  terminalId?: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  refreshToken?: string;
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
