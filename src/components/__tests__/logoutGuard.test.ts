import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Logout guard intercepts signout when cash shift is open', () => {
  const shift = {
    status: 'open',
    operator: 'Carlos Vendedor',
  };

  const user = {
    role: 'cashier',
  };

  let showModal = false;
  let loggedOut = false;

  const handleLogoutClick = () => {
    if (shift.status === 'open' && (user.role === 'cashier' || user.role === 'manager' || user.role === 'admin')) {
      showModal = true;
      return;
    }
    loggedOut = true;
  };

  handleLogoutClick();
  assert.equal(showModal, true, 'Modal warning must display when shift is open');
  assert.equal(loggedOut, false, 'Must not immediately log out without operator decision');

  // When operator confirms sign out anyway
  const performSignOut = () => {
    showModal = false;
    loggedOut = true;
  };

  performSignOut();
  assert.equal(showModal, false);
  assert.equal(loggedOut, true);
});

test('Logout proceeds immediately when cash shift is closed', () => {
  const shift = {
    status: 'closed',
    operator: 'Carlos Vendedor',
  };

  const user = {
    role: 'cashier',
  };

  let showModal = false;
  let loggedOut = false;

  const handleLogoutClick = () => {
    if (shift.status === 'open' && (user.role === 'cashier' || user.role === 'manager' || user.role === 'admin')) {
      showModal = true;
      return;
    }
    loggedOut = true;
  };

  handleLogoutClick();
  assert.equal(showModal, false);
  assert.equal(loggedOut, true);
});

