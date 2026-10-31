import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RememberDeviceStorage } from '../supabaseClient';

// Mock localStorage and sessionStorage for node test environment
class MockStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).sessionStorage = mockSessionStorage;

test('RememberDeviceStorage defaults to localStorage when remember preference is true', () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  mockLocalStorage.setItem('voltacc_pos_remember_terminal_v1', 'true');

  const storage = new RememberDeviceStorage();
  storage.setItem('sb-token', 'jwt-token-123');

  assert.equal(mockLocalStorage.getItem('sb-token'), 'jwt-token-123');
  assert.equal(mockSessionStorage.getItem('sb-token'), null);
  assert.equal(storage.getItem('sb-token'), 'jwt-token-123');

  storage.removeItem('sb-token');
  assert.equal(storage.getItem('sb-token'), null);
});

test('RememberDeviceStorage uses sessionStorage when remember preference is false', () => {
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  mockLocalStorage.setItem('voltacc_pos_remember_terminal_v1', 'false');

  const storage = new RememberDeviceStorage();
  storage.setItem('sb-token', 'jwt-session-456');

  assert.equal(mockSessionStorage.getItem('sb-token'), 'jwt-session-456');
  assert.equal(mockLocalStorage.getItem('sb-token'), null);
  assert.equal(storage.getItem('sb-token'), 'jwt-session-456');

  storage.removeItem('sb-token');
  assert.equal(storage.getItem('sb-token'), null);
});

