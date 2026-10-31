import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseAuthService, AUTH_STORAGE_KEYS } from '../authService';

class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();
(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).sessionStorage = mockSessionStorage;

function createMockSupabaseClient(overrides: {
  signInResult?: { user?: any; session?: any; error?: any };
  profileResult?: { data?: any; error?: any };
  getSessionResult?: { session?: any; error?: any };
}) {
  return {
    auth: {
      signInWithPassword: async () => overrides.signInResult ?? {
        data: {
          user: { id: 'usr-1', email: 'admin@pos.local' },
          session: { access_token: 'jwt-1', refresh_token: 'ref-1', expires_at: Math.floor(Date.now() / 1000) + 3600 },
        },
        error: null,
      },
      signOut: async () => {},
      getSession: async () => overrides.getSessionResult ?? {
        data: {
          session: {
            user: { id: 'usr-1', email: 'admin@pos.local' },
            access_token: 'jwt-1',
            refresh_token: 'ref-1',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        error: null,
      },
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => overrides.profileResult ?? {
            data: {
              id: 'usr-1',
              email: 'admin@pos.local',
              first_name: 'Super',
              last_name: 'Admin',
              role: 'admin',
              branch_id: null,
              phone: '12345678',
              status: true,
            },
            error: null,
          },
        }),
      }),
    }),
  } as any;
}

test('SupabaseAuthService logs in successfully for admin role', async () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  const client = createMockSupabaseClient({});
  const service = new SupabaseAuthService(client);

  const session = await service.login({
    identifier: 'admin@pos.local',
    passKey: 'admin123',
    rememberDevice: true,
  });

  assert.equal(session.user.role, 'admin');
  assert.equal(session.user.displayName, 'Super Admin');
  assert.equal(session.token, 'jwt-1');
  assert.equal(mockLocalStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER), 'true');
});

test('SupabaseAuthService supports cashier role hydration', async () => {
  const client = createMockSupabaseClient({
    signInResult: {
      data: {
        user: { id: 'usr-cashier', email: 'cashier_suc1@pos.local' },
        session: { access_token: 'jwt-cashier', refresh_token: 'ref-cashier', expires_at: Math.floor(Date.now() / 1000) + 3600 },
      },
      error: null,
    } as any,
    profileResult: {
      data: {
        id: 'usr-cashier',
        email: 'cashier_suc1@pos.local',
        first_name: 'Clara',
        last_name: 'Cashier',
        role: 'cashier',
        branch_id: 'b-01',
        phone: '1234',
        status: true,
      },
      error: null,
    },
  });

  const service = new SupabaseAuthService(client);
  const session = await service.login({
    identifier: 'vendedor',
    passKey: '123456',
    rememberDevice: false,
  });

  assert.equal(session.user.role, 'cashier');
  assert.equal(session.user.displayName, 'Clara Cashier');
  assert.equal(mockLocalStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER), 'false');
});

test('SupabaseAuthService rejects inactive profile with descriptive error', async () => {
  const client = createMockSupabaseClient({
    profileResult: {
      data: {
        id: 'usr-inactive',
        email: 'inactive@pos.local',
        role: 'cashier',
        status: false,
      },
      error: null,
    },
  });

  const service = new SupabaseAuthService(client);
  await assert.rejects(
    () => service.login({ identifier: 'inactive@pos.local', passKey: 'pass', rememberDevice: true }),
    /desactivada/
  );
});

test('SupabaseAuthService rejects missing profile', async () => {
  const client = createMockSupabaseClient({
    profileResult: { data: null, error: { message: 'Row not found' } },
  });

  const service = new SupabaseAuthService(client);
  await assert.rejects(
    () => service.login({ identifier: 'unknown@pos.local', passKey: 'pass', rememberDevice: true }),
    /No se encontró el perfil/
  );
});

test('SupabaseAuthService cleans storage and sets expired notice when session is expired', async () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  mockLocalStorage.setItem(AUTH_STORAGE_KEYS.SESSION, 'stale-data');

  const client = createMockSupabaseClient({
    getSessionResult: {
      session: {
        user: { id: 'usr-expired' },
        access_token: 'expired-jwt',
        expires_at: Math.floor(Date.now() / 1000) - 100, // expired 100 seconds ago
      },
      error: null,
    },
  });

  const service = new SupabaseAuthService(client);
  const current = await service.getCurrentSession();

  assert.equal(current, null);
  assert.equal(mockLocalStorage.getItem(AUTH_STORAGE_KEYS.SESSION), null);
  assert.equal(mockSessionStorage.getItem(AUTH_STORAGE_KEYS.SESSION_EXPIRED), 'true');
});

