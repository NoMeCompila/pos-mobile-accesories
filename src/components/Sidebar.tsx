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
} from 'lucide-react';
import { NavigationTab } from '../types/pos';

interface SidebarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  darkMode,
  onToggleDarkMode,
}) => {
  const navItems = [
    { id: 'home' as NavigationTab, label: 'Home', icon: Home },
    { id: 'pos' as NavigationTab, label: 'Terminal de Venta', icon: Store },
    { id: 'catalog' as NavigationTab, label: 'Catálogo y Stock', icon: Boxes },
    { id: 'drawer' as NavigationTab, label: 'Apertura/cierre de Caja', icon: LockKeyhole },
    { id: 'history' as NavigationTab, label: 'Historial de Mis Ventas', icon: Receipt },
  ];

  const handleSelect = (tab: NavigationTab) => {
    onNavigate(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#283044]/40 backdrop-blur-xs z-50 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#f2f3ff] dark:bg-[#131b2e] border-r border-[#dae2fd]/60 dark:border-[#283044] shadow-sm z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Lockup */}
          <div className="h-16 px-5 flex items-center justify-between bg-[#f2f3ff] dark:bg-[#131b2e] border-b border-[#dae2fd]/40 dark:border-[#283044]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-[#007bb9] flex items-center justify-center text-white shadow-sm">
                <Zap className="w-6 h-6 fill-white text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-xl font-bold tracking-tight text-[#131b2e] dark:text-white leading-none">
                  VoltAcc
                </span>
                <span className="text-[11px] font-bold text-[#006194] dark:text-[#93ccff] uppercase tracking-wider mt-0.5">
                  Retail POS
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center gap-3 px-3.5 h-12 rounded-lg font-medium text-sm transition-all text-left ${
                    isActive
                      ? 'bg-[#007bb9] text-white shadow-sm font-semibold'
                      : 'text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#707881] dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Shift Status & Controls Card */}
        <div className="p-3 m-3 bg-[#eaedff] dark:bg-[#1e293b] rounded-xl flex flex-col gap-2.5 border border-[#dae2fd]/50 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006947] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006947]"></span>
              </span>
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                Caja 02 • Turno Activo
              </span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#6ffbbe] text-[#002113] uppercase tracking-wide">
              Online
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#dae2fd]/60 dark:border-slate-700 text-xs">
            <span className="font-mono-num text-[11px] text-[#3f4850] dark:text-slate-400">
              Terminal Node #02
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#dae2fd] dark:bg-slate-700 text-[#131b2e] dark:text-slate-200">
              POS
            </span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="mt-1 w-full h-9 rounded-lg bg-white/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-[#131b2e] dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#dae2fd]/40 dark:border-slate-700"
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
      </aside>
    </>
  );
};
