import { UserRole } from '../types/auth';
import { NavigationTab } from '../types/pos';

export interface RoutePermissionConfig {
  defaultRoute: NavigationTab;
  allowedRoutes: readonly NavigationTab[];
  disallowedRoutes?: readonly NavigationTab[];
}

export const ROLE_PERMISSION_MATRIX: Record<UserRole, RoutePermissionConfig> = {
  admin: {
    defaultRoute: 'home',
    allowedRoutes: [
      'home',
      'pos',
      'catalog',
      'drawer',
      'history',
      'workshop',
      'reports/financial',
      'inventory/costs',
      'settings/users',
      'customer/orders',
      'seller/home',
    ],
  },
  manager: {
    defaultRoute: 'home',
    allowedRoutes: [
      'home',
      'pos',
      'catalog',
      'drawer',
      'history',
      'workshop',
      'reports/financial',
      'inventory/costs',
      'settings/users',
      'seller/home',
    ],
  },
  cashier: {
    defaultRoute: 'pos',
    allowedRoutes: [
      'pos',
      'drawer',
      'history',
      'catalog',
      'home',
      'seller/home',
    ],
    disallowedRoutes: [
      'reports/financial',
      'inventory/costs',
      'settings/users',
      'workshop',
    ],
  },
  seller: {
    defaultRoute: 'pos',
    allowedRoutes: [
      'pos',
      'drawer',
      'history',
      'catalog',
      'home',
      'seller/home',
    ],
    disallowedRoutes: [
      'reports/financial',
      'inventory/costs',
      'settings/users',
      'workshop',
    ],
  },
  technician: {
    defaultRoute: 'workshop',
    allowedRoutes: [
      'workshop',
      'catalog',
    ],
    disallowedRoutes: [
      'pos',
      'drawer',
      'reports/financial',
      'inventory/costs',
      'settings/users',
    ],
  },
  customer: {
    defaultRoute: 'customer/orders',
    allowedRoutes: [
      'customer/orders',
    ],
    disallowedRoutes: [
      'pos',
      'drawer',
      'history',
      'catalog',
      'home',
      'workshop',
      'reports/financial',
      'inventory/costs',
      'settings/users',
    ],
  },
};

export function normalizeRoute(rawRoute: string): NavigationTab {
  const cleaned = rawRoute.replace(/^[#/]+/, '').trim() as NavigationTab;
  return cleaned || 'home';
}

export function getDefaultRouteForRole(role?: UserRole): NavigationTab {
  if (!role) return 'login';
  const config = ROLE_PERMISSION_MATRIX[role];
  return config?.defaultRoute || 'home';
}

export function canAccessRoute(role: UserRole | undefined, route: string | NavigationTab): boolean {
  if (!role) return false;

  // Super-Admin has unrestricted access to all modules
  if (role === 'admin') {
    return true;
  }

  const cleanRoute = normalizeRoute(route);
  if (cleanRoute === 'login') return true;

  const config = ROLE_PERMISSION_MATRIX[role];
  if (!config) return false;

  // If explicitly disallowed, reject immediately
  if (config.disallowedRoutes?.includes(cleanRoute)) {
    return false;
  }

  return config.allowedRoutes.includes(cleanRoute);
}

export interface NavigationItem {
  id: NavigationTab;
  label: string;
}

export const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'home', label: 'Dashboard General' },
  { id: 'pos', label: 'Terminal de Venta' },
  { id: 'catalog', label: 'Catálogo y Stock' },
  { id: 'drawer', label: 'Apertura/cierre de Caja' },
  { id: 'history', label: 'Historial de Mis Ventas' },
  { id: 'workshop', label: 'Taller de Reparaciones' },
  { id: 'reports/financial', label: 'Reportes Financieros' },
  { id: 'inventory/costs', label: 'Costos y Proveedores' },
  { id: 'settings/users', label: 'Gestión de Usuarios' },
  { id: 'customer/orders', label: 'Portal del Cliente' },
];

export function getAllowedNavigationItems(role?: UserRole): NavigationItem[] {
  if (!role) return [];
  return ALL_NAVIGATION_ITEMS.filter((item) => canAccessRoute(role, item.id));
}

