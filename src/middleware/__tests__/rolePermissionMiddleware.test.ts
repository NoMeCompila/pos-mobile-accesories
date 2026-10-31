import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessRoute,
  getDefaultRouteForRole,
  getAllowedNavigationItems,
  ALL_NAVIGATION_ITEMS,
} from '../rolePermissionMiddleware';

test('Super-Admin (admin) has unrestricted access to all modules and routes', () => {
  assert.equal(canAccessRoute('admin', 'home'), true);
  assert.equal(canAccessRoute('admin', 'pos'), true);
  assert.equal(canAccessRoute('admin', 'drawer'), true);
  assert.equal(canAccessRoute('admin', 'workshop'), true);
  assert.equal(canAccessRoute('admin', '/settings/users'), true);
  assert.equal(canAccessRoute('admin', '/reports/financial'), true);
  assert.equal(canAccessRoute('admin', '/inventory/costs'), true);
  assert.equal(canAccessRoute('admin', 'customer/orders'), true);

  const items = getAllowedNavigationItems('admin');
  assert.equal(items.length, ALL_NAVIGATION_ITEMS.length);
});

test('Cashier is permitted in POS/drawer/history/catalog and blocked from sensitive admin routes', () => {
  assert.equal(canAccessRoute('cashier', 'pos'), true);
  assert.equal(canAccessRoute('cashier', 'drawer'), true);
  assert.equal(canAccessRoute('cashier', 'history'), true);
  assert.equal(canAccessRoute('cashier', 'catalog'), true);

  // Blocked routes
  assert.equal(canAccessRoute('cashier', '/settings/users'), false);
  assert.equal(canAccessRoute('cashier', '/reports/financial'), false);
  assert.equal(canAccessRoute('cashier', '/inventory/costs'), false);
  assert.equal(canAccessRoute('cashier', 'workshop'), false);
});

test('Technician is permitted in workshop/catalog and blocked from cash drawer/POS/settings', () => {
  assert.equal(canAccessRoute('technician', 'workshop'), true);
  assert.equal(canAccessRoute('technician', 'catalog'), true);

  // Blocked routes
  assert.equal(canAccessRoute('technician', 'pos'), false);
  assert.equal(canAccessRoute('technician', 'drawer'), false);
  assert.equal(canAccessRoute('technician', '/reports/financial'), false);
  assert.equal(canAccessRoute('technician', '/settings/users'), false);
  assert.equal(canAccessRoute('technician', '/inventory/costs'), false);
});

test('Customer is restricted strictly to customer orders portal', () => {
  assert.equal(canAccessRoute('customer', 'customer/orders'), true);
  assert.equal(canAccessRoute('customer', 'pos'), false);
  assert.equal(canAccessRoute('customer', 'drawer'), false);
  assert.equal(canAccessRoute('customer', 'workshop'), false);
});

test('Default routes match designated role landing view', () => {
  assert.equal(getDefaultRouteForRole('admin'), 'home');
  assert.equal(getDefaultRouteForRole('manager'), 'home');
  assert.equal(getDefaultRouteForRole('cashier'), 'pos');
  assert.equal(getDefaultRouteForRole('technician'), 'workshop');
  assert.equal(getDefaultRouteForRole('customer'), 'customer/orders');
});

