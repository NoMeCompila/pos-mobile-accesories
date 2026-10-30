export type UserRole =
  | 'admin'
  | 'manager'
  | 'cashier'
  | 'technician'
  | 'stock'
  | 'supervisor'
  | 'seller'
  | 'customer';

export interface UserProfileRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: string | null;
  branchName?: string;
  phone?: string;
  status: boolean;
  avatarInitials: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: string | null;
  phone?: string;
  status: boolean;
}

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
