import React, { useState } from 'react';
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
  AlertTriangle,
  X,
} from 'lucide-react';
import { useCashShift } from '../services/posStore';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenShortcuts: () => void;
  onOpenPriceChecker: () => void;
  onLockTerminal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Super-Admin',
  manager: 'Gerente',
  cashier: 'Cajero',
  seller: 'Vendedor',
  technician: 'Técnico',
  customer: 'Cliente',
};

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  onOpenShortcuts,
  onOpenPriceChecker,
  onLockTerminal,
  darkMode,
  onToggleDarkMode,
}) => {
  const { shift } = useCashShift();
  const { user, logout } = useAuth();
  const [showShiftWarningModal, setShowShiftWarningModal] = useState(false);

  const performSignOut = async () => {
    setShowShiftWarningModal(false);
    await logout();
    window.location.hash = 'login';
  };

  const handleLogoutClick = () => {
    // AC6: If an active cash shift is open, prompt operator regarding pending register close (arqueo ciego)
    if (shift.status === 'open' && (user?.role === 'cashier' || user?.role === 'seller' || user?.role === 'manager' || user?.role === 'admin')) {
      setShowShiftWarningModal(true);
      return;
    }
    performSignOut();
  };

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#faf8ff]/90 dark:bg-[#131b2e]/90 backdrop-blur-xl border-b border-[#dae2fd]/60 dark:border-[#283044] shadow-xs z-40 flex items-center justify-between px-4 sm:px-6 transition-all duration-300">
        {/* Left zone: Hamburger + Store Location + Terminal Node + Float */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden w-10 h-10 -ml-1 rounded-lg flex items-center justify-center text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-[#1e293b] active:scale-95 transition-all"
            title="Abrir menú"
            aria-label="Abrir navegación"
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

          {/* Store & Terminal Node info */}
          <div className="hidden sm:flex items-center gap-2 text-[#131b2e] dark:text-slate-200">
            <Store className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
            <span className="text-sm font-semibold">Downtown Flagship</span>
            <span className="text-[#bfc7d2]">•</span>
            <span className="font-mono-num text-xs text-[#3f4850] dark:text-slate-400">
              Term #04
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
        </div>

        {/* Right zone: Peripheral Quick Actions + Cashier Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Peripheral Buttons */}
          <div className="flex items-center gap-1">
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

            <button
              onClick={onOpenPriceChecker}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
              title="Consultar Precio / Stock"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onLockTerminal}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors cursor-pointer"
              title="Bloquear Terminal"
            >
              <Lock className="w-4 h-4" />
            </button>

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

          {/* Operator Profile & Logout */}
          <div className="flex items-center gap-2 pl-1">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200 leading-tight">
                {user?.displayName || shift.operator}
              </span>
              <span className="font-mono-num text-[11px] text-[#006194] dark:text-[#93ccff] font-bold leading-tight">
                {user?.role ? ROLE_LABELS[user.role] || user.role : 'Operador'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#006194] dark:bg-[#007bb9] flex items-center justify-center text-white shadow-xs">
              <User className="w-4 h-4 text-white" />
            </div>
            <button
              onClick={handleLogoutClick}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Shift-Aware Logout Safeguard Modal (AC6) */}
      {showShiftWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowShiftWarningModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="font-headline text-lg font-bold text-slate-900 dark:text-white">
                Turno de Caja Activo
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Actualmente tenés un turno de caja abierto en esta terminal (Operador: <b>{shift.operator}</b>).
                Para garantizar la integridad financiera y el arqueo ciego, se recomienda realizar el cierre de caja antes de salir.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 flex justify-between">
              <span>Fondo Inicial: ${shift.initialFloat.toFixed(2)}</span>
              <span>Tickets: {shift.ticketCount}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                onClick={() => {
                  setShowShiftWarningModal(false);
                  window.location.hash = 'drawer';
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#006194] hover:bg-[#007bb9] text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Ir a Cierre de Caja
              </button>

              <button
                onClick={performSignOut}
                className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Salir de Todas Formas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
