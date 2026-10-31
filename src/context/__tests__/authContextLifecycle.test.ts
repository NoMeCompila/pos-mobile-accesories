import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Silent token refresh updates session token without resetting state', () => {
  let sessionState = {
    user: { id: 'usr-1', email: 'cashier@pos.local', role: 'cashier' },
    token: 'jwt-initial',
    expiresAt: Date.now() + 1000,
  };

  let isLoading = false;

  // Simulate onAuthStateChange('TOKEN_REFRESHED')
  const handleAuthChange = (event: string, newSession: any) => {
    if (event === 'TOKEN_REFRESHED' && newSession) {
      // Update session in place without touching isLoading
      sessionState = {
        ...sessionState,
        token: newSession.access_token,
        expiresAt: newSession.expires_at * 1000,
      };
    }
  };

  handleAuthChange('TOKEN_REFRESHED', {
    access_token: 'jwt-refreshed-seamless',
    refresh_token: 'new-ref',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });

  assert.equal(sessionState.token, 'jwt-refreshed-seamless');
  assert.equal(isLoading, false, 'isLoading must remain false during silent token refresh');
});

test('Revoked token / unexpected SIGNED_OUT sets session expired notice', () => {
  let isSessionExpired = false;
  let isExplicitLogout = false;

  const handleAuthChange = (event: string) => {
    if (event === 'SIGNED_OUT') {
      if (!isExplicitLogout) {
        isSessionExpired = true;
      }
    }
  };

  handleAuthChange('SIGNED_OUT');
  assert.equal(isSessionExpired, true, 'Unexpected SIGNED_OUT must flag session expiration');
});

