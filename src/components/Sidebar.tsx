import React from 'react';
import {
  Home,
  Store,
  Boxes,
  LockKeyhole,
  Receipt,
  Zap,
  Moon,
  Sun,
  X,
  BarChart3,
  UserCog,
  RotateCcw,
} from 'lucide-react';
import { NavigationTab } from '../types/pos';
import { UserRole } from '../types/auth';
import { useAuth } from '../context/AuthContext';

export interface NavigationItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

export const NAV_ITEMS: NavigationItem[] = [
  // Admin routes
  { id: 'admin/home', label: 'Resumen y Logs', icon: BarChart3, roles: ['admin'] },
  { id: 'admin/users', label: 'Gestión de Usuarios', icon: UserCog, roles: ['admin'] },
  { id: 'admin/backup', label: 'Backup & Recovery', icon: RotateCcw, roles: ['admin'] },
  // POS & Seller routes
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    roles: ['seller', 'cashier', 'manager', 'technician', 'customer'],
  },
  { id: 'pos', label: 'Terminal de Venta', icon: Store, roles: ['seller', 'cashier', 'manager'] },
  { id: 'catalog', label: 'Catálogo y Stock', icon: Boxes, roles: ['seller', 'cashier', 'manager', 'technician'] },
  { id: 'drawer', label: 'Apertura/cierre de Caja', icon: LockKeyhole, roles: ['seller', 'cashier', 'manager'] },
  { id: 'history', label: 'Historial de Mis Ventas', icon: Receipt, roles: ['seller', 'cashier', 'manager'] },
];

export interface SidebarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  isCollapsedDesktop?: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  isCollapsedDesktop = false,
  isOpenMobile,
  onCloseMobile,
  darkMode,
  onToggleDarkMode,
}) => {
  const { user } = useAuth();
  const userRole = (user?.role || 'cashier') as UserRole;

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  const handleSelect = (tab: NavigationTab) => {
    onNavigate(tab);
    onCloseMobile();
  };

  const isCurrentActive = (itemId: NavigationTab) => {
    if (currentTab === itemId) return true;
    if (itemId === 'home' && currentTab === 'seller/home') return true;
    return false;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#283044]/40 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-label="Cerrar fondo de navegación"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full max-h-[100dvh] bg-[#f2f3ff] dark:bg-[#131b2e] border-r border-[#dae2fd]/60 dark:border-[#283044] shadow-sm z-50 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsedDesktop ? 'w-72 lg:w-20' : 'w-72'}`}
      >
        <div className="flex flex-col">
          {/* Brand Lockup Header */}
          <div
            className={`h-16 px-4 flex items-center bg-[#f2f3ff] dark:bg-[#131b2e] border-b border-[#dae2fd]/40 dark:border-[#283044] transition-all duration-300 ${
              isCollapsedDesktop ? 'justify-between lg:justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                onClick={() => handleSelect(userRole === 'admin' ? 'admin/home' : 'home')}
                className="w-10 h-10 rounded-xl bg-[#007bb9] flex items-center justify-center text-white shadow-sm cursor-pointer shrink-0"
                title="VoltAcc POS"
              >
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
              <div className={`flex flex-col ${isCollapsedDesktop ? 'lg:hidden' : ''}`}>
                <span className="font-headline text-xl font-bold tracking-tight text-[#131b2e] dark:text-white leading-none">
                  VoltAcc
                </span>
                <span className="text-[11px] font-bold text-[#006194] dark:text-[#93ccff] uppercase tracking-wider mt-0.5">
                  {userRole === 'admin' ? 'Portal Admin' : 'Retail POS'}
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-11 h-11 min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] active:scale-95 transition-all"
              title="Cerrar menú"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 px-3 mt-4">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrentActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  title={item.label}
                  className={`relative flex items-center min-h-[48px] rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                    isCollapsedDesktop
                      ? 'gap-3 px-3.5 w-full text-left lg:justify-center lg:px-0 lg:w-12 lg:mx-auto'
                      : 'gap-3 px-3.5 w-full text-left'
                  } ${
                    active
                      ? 'bg-[#007bb9] text-white shadow-sm font-semibold'
                      : 'text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white'
                  }`}
                >
                  {/* Active Indicator Bar on left edge */}
                  {active && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#006194] dark:bg-[#93ccff] rounded-r-full" />
                  )}
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      active ? 'text-white' : 'text-[#707881] dark:text-slate-400'
                    }`}
                  />
                  <span className={`truncate ${isCollapsedDesktop ? 'lg:hidden' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Shift Status & Controls Card */}
        <div
          className={`p-3 m-3 transition-all duration-300 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] ${
            isCollapsedDesktop ? 'lg:m-1 lg:p-1.5' : ''
          }`}
        >
          {/* Expanded Bottom Telemetry Card */}
          <div
            className={`p-3 bg-[#eaedff] dark:bg-[#1e293b] rounded-xl flex flex-col gap-2.5 border border-[#dae2fd]/50 dark:border-slate-800 ${
              isCollapsedDesktop ? 'lg:hidden' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006947] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006947]"></span>
                </span>
                <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                  {userRole === 'admin' ? 'Consola Central • Super Admin' : 'Caja 02 • Turno Activo'}
                </span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#6ffbbe] text-[#002113] uppercase tracking-wide">
                Online
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#dae2fd]/60 dark:border-slate-700 text-xs">
              <span className="font-mono-num text-[11px] text-[#3f4850] dark:text-slate-400">
                {userRole === 'admin' ? 'Terminal Root' : 'Terminal Node #02'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#dae2fd] dark:bg-slate-700 text-[#131b2e] dark:text-slate-200 uppercase">
                {userRole === 'admin' ? 'ADMIN' : 'POS'}
              </span>
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              onClick={onToggleDarkMode}
              className="mt-1 w-full min-h-[44px] rounded-lg bg-white/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-[#131b2e] dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#dae2fd]/40 dark:border-slate-700 cursor-pointer"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>
          </div>

          {/* Collapsed Desktop Bottom Controls (Icon Rail Mode) */}
          {isCollapsedDesktop && (
            <div className="hidden lg:flex flex-col items-center gap-2 w-full pt-2 border-t border-[#dae2fd]/40 dark:border-[#283044]">
              {/* Online Pulse Status Dot */}
              <div
                className="w-10 h-10 rounded-xl bg-[#eaedff] dark:bg-[#1e293b] flex items-center justify-center cursor-help"
                title="Sistema Conectado (Online)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Collapsed Theme Toggle */}
              <button
                onClick={onToggleDarkMode}
                className="w-10 h-10 rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                aria-label="Alternar Modo Oscuro"
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
