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
} from 'lucide-react';
import { useCashShift } from '../services/posStore';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenShortcuts: () => void;
  onOpenPriceChecker: () => void;
  onLockTerminal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  onOpenShortcuts,
  onOpenPriceChecker,
  onLockTerminal,
  darkMode,
  onToggleDarkMode,
}) => {
  const { shift } = useCashShift();

  return (
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
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors"
            title="Lector Barcode (F1)"
          >
            <Barcode className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenPriceChecker}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors"
            title="Consultar Precio / Stock"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onLockTerminal}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors"
            title="Bloquear Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenShortcuts}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors"
            title="Atajos de Teclado"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDarkMode}
            className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#3f4850] dark:text-slate-300 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] transition-colors"
            title="Cambiar tema"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>

        <div className="h-5 w-px bg-[#dae2fd] dark:bg-slate-700" />

        {/* Cashier Badge */}
        <div className="flex items-center gap-2 pl-1">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#131b2e] dark:text-slate-200 leading-tight">
              {shift.operator}
            </span>
            <span className="font-mono-num text-[11px] text-[#3f4850] dark:text-slate-400 leading-tight">
              Cashier
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#006194] dark:bg-[#007bb9] flex items-center justify-center text-white shadow-xs">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};
