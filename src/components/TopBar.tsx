import React from 'react';
import {
  Menu,
  Store,
  Barcode,
  Search,
  Lock,
  HelpCircle,
  User,
  Moon,
  Sun,
  Zap,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useCashShift } from '../services/posStore';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  onToggleSidebar: () => void;
  isCollapsedDesktop?: boolean;
  onOpenShortcuts: () => void;
  onOpenPriceChecker: () => void;
  onLockTerminal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  isCollapsedDesktop = false,
  onOpenShortcuts,
  onOpenPriceChecker,
  onLockTerminal,
  darkMode,
  onToggleDarkMode,
}) => {
  const { shift } = useCashShift();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 bg-[#faf8ff]/90 dark:bg-[#131b2e]/90 backdrop-blur-xl border-b border-[#dae2fd]/60 dark:border-[#283044] shadow-xs z-40 flex items-center justify-between px-4 sm:px-6 transition-all duration-300 ${
        isCollapsedDesktop ? 'lg:left-20' : 'lg:left-72'
      }`}
    >
      {/* Left zone: Hamburger + Role Context / Store Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Universal Hamburger Toggle (Mobile Drawer & Desktop Icon-Rail) */}
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 -ml-1 rounded-lg flex items-center justify-center text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-[#1e293b] active:scale-95 transition-all cursor-pointer"
          title={isCollapsedDesktop ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          aria-label="Alternar navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small Logo for mobile view when sidebar is closed */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#007bb9] flex items-center justify-center text-white shadow-xs">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="font-headline font-bold text-base text-[#131b2e] dark:text-white">
            VoltAcc
          </span>
        </div>

        {/* Role-Specific Context Badges */}
        {isAdmin ? (
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-base text-[#131b2e] dark:text-white">
                VoltAcc Retail POS
              </span>
              <span className="text-[#dae2fd] dark:text-[#283044]">•</span>
              <span className="text-xs font-semibold text-[#006194] dark:text-[#93ccff] bg-[#eaedff] dark:bg-[#1e293b] px-2 py-0.5 rounded-md">
                Portal Administrador
              </span>
            </div>
            <span className="text-[10px] bg-[#006194] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider hidden md:inline-block">
              Super Admin
            </span>
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                En Línea
              </span>
            </div>
          </div>
        ) : isManager ? (
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-base text-[#131b2e] dark:text-white">
                VoltAcc Retail POS
              </span>
              <span className="text-[#dae2fd] dark:text-[#283044]">•</span>
              <span className="text-xs font-semibold text-[#006194] dark:text-[#93ccff] bg-[#eaedff] dark:bg-[#1e293b] px-2 py-0.5 rounded-md">
                Portal Gerencial • Control Comercial
              </span>
            </div>
            <span className="text-[10px] bg-[#007bb9] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider hidden md:inline-block">
              Gerente
            </span>
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                En Línea
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Store & Terminal Node info */}
            <div className="hidden sm:flex items-center gap-2 text-[#131b2e] dark:text-slate-200">
              <Store className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
              <span className="text-sm font-semibold">Downtown Flagship</span>
              <span className="text-[#bfc7d2]">•</span>
              <span className="font-mono-num text-xs text-[#3f4850] dark:text-slate-400">
                Term #02
              </span>
            </div>

            <div className="h-5 w-px bg-[#dae2fd] dark:bg-slate-700 hidden sm:block" />

            {/* Float Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f2f3ff] dark:bg-[#1e293b] border border-[#dae2fd]/50 dark:border-slate-800">
              <span className="text-xs text-[#3f4850] dark:text-slate-400">Float:</span>
              <span className="font-mono-num text-xs font-bold text-[#006194] dark:text-[#93ccff]">
                ${shift.initialFloat.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right zone: Quick Actions + Profile / Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Actions (POS & Admin) */}
        <div className="flex items-center gap-1">
          {!isAdmin && (
            <button
              onClick={() => {
                const input = document.getElementById('skuInput');
                input?.focus();
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
              title="Lector Barcode (F1)"
            >
              <Barcode className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onOpenPriceChecker}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
            title="Consultar Precio / Stock"
          >
            <Search className="w-4 h-4" />
          </button>

          {!isAdmin && (
            <button
              onClick={onLockTerminal}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
              title="Bloquear Terminal"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenShortcuts}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
            title="Atajos de Teclado"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDarkMode}
            className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
            title="Cambiar tema"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>

        <div className="h-5 w-px bg-[#dae2fd] dark:bg-slate-700" />

        {/* Operator / Admin Profile & Logout */}
        <div className="flex items-center gap-2 pl-1">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200 leading-tight">
              {user?.displayName || (isAdmin ? 'Admin Root' : shift.operator)}
            </span>
            <span className="font-mono-num text-[11px] text-[#3f4850] dark:text-slate-400 leading-tight">
              {isAdmin ? 'Super Admin' : isManager ? 'Gerente' : user?.role === 'seller' ? 'Vendedor' : 'Operador'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#006194] dark:bg-[#007bb9] flex items-center justify-center text-white shadow-xs font-bold text-xs">
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4 text-white" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <button
            onClick={async () => {
              await logout();
              window.location.hash = 'login';
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
