import React from 'react';
import {
  Store,
  Boxes,
  LockKeyhole,
  Receipt,
  TrendingUp,
  Zap,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Percent,
  CheckCircle2,
  Barcode,
} from 'lucide-react';
import { NavigationTab } from '../types/pos';
import { useSalesHistory, useCashShift, useProducts } from '../services/posStore';

interface HomeDashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ onNavigate }) => {
  const { tickets } = useSalesHistory();
  const { shift } = useCashShift();
  const { products } = useProducts();

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const totalRevenue = shift.cashSales + shift.cardSales + shift.bizumSales;

  return (
    <div className="flex flex-col w-full gap-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#006194] to-[#007bb9] text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-wider">
                Store #104 • Terminal 02
              </span>
              <span className="w-2 h-2 rounded-full bg-[#6ffbbe] animate-pulse" />
              <span className="text-xs text-white/90">Sistema Operativo</span>
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight">
              VoltAcc Retail POS
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Punto de venta y control integral de tienda. Escaneo ultra-rápido por código de barras,
              liquidación de tickets multimoneda y sincronización de stock en tiempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('pos')}
              className="h-12 px-6 rounded-xl bg-white hover:bg-[#f2f3ff] active:scale-95 text-[#006194] font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Store className="w-5 h-5" />
              <span>Abrir Terminal de Venta</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-l-full pointer-events-none blur-2xl" />
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Recaudación de Hoy
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#cce5ff] dark:bg-slate-800 flex items-center justify-center text-[#006194]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="font-headline text-3xl font-bold text-[#131b2e] dark:text-white">
              ${totalRevenue.toFixed(2)}
            </span>
            <p className="text-xs text-[#006947] dark:text-[#4edea3] font-semibold mt-0.5">
              +14.2% frente al turno anterior
            </p>
          </div>
          <span className="text-xs text-[#707881] dark:text-slate-400">
            {shift.ticketCount} tickets emitidos
          </span>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Fondo en Cajón
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#dbe1ff] dark:bg-slate-800 flex items-center justify-center text-[#0051d5]">
              <LockKeyhole className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="font-headline text-3xl font-bold text-[#131b2e] dark:text-white">
              ${(shift.initialFloat + shift.cashSales).toFixed(2)}
            </span>
            <p className="text-xs text-[#707881] dark:text-slate-400 mt-0.5">
              Float inicial: ${shift.initialFloat.toFixed(2)}
            </p>
          </div>
          <span className="text-xs text-[#006947] font-semibold">
            Sin discrepancias detectadas
          </span>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Referencias en Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#6ffbbe]/30 dark:bg-slate-800 flex items-center justify-center text-[#006947]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="font-headline text-3xl font-bold text-[#131b2e] dark:text-white">
              {products.length} artículos
            </span>
            <p className="text-xs text-[#707881] dark:text-slate-400 mt-0.5">1,480 total en catálogo</p>
          </div>
          <span className="text-xs text-[#ba1a1a] font-semibold">
            {lowStockCount} artículos bajo stock (&lt;5 uds)
          </span>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Cajero en Turno
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 flex items-center justify-center text-[#131b2e] dark:text-white">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="font-headline text-xl font-bold text-[#131b2e] dark:text-white">
              {shift.operator}
            </span>
            <p className="text-xs text-[#707881] dark:text-slate-400 mt-0.5">Operador #1042</p>
          </div>
          <span className="text-xs text-[#006947] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Turno activo desde 08:30 AM</span>
          </span>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('pos')}
          className="group cursor-pointer bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 hover:border-[#006194] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#cce5ff] dark:bg-slate-800 flex items-center justify-center text-[#006194] dark:text-[#93ccff] group-hover:scale-105 transition-transform">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Terminal de Venta
              </h3>
              <p className="text-xs text-[#707881] dark:text-slate-400">Atajo F1 para escáner</p>
            </div>
          </div>
          <p className="text-xs text-[#3f4850] dark:text-slate-300 leading-relaxed mb-4">
            Caja registradora táctil, lectura de códigos de barras, cesta activa con descuentos y cobro multi-método.
          </p>
          <div className="flex items-center text-xs font-bold text-[#006194] dark:text-[#93ccff] gap-1 group-hover:translate-x-1 transition-transform">
            <span>Iniciar venta rápida</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('catalog')}
          className="group cursor-pointer bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 hover:border-[#006194] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#6ffbbe]/30 dark:bg-slate-800 flex items-center justify-center text-[#006947] dark:text-[#4edea3] group-hover:scale-105 transition-transform">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Catálogo y Stock
              </h3>
              <p className="text-xs text-[#707881] dark:text-slate-400">Ubicaciones y alertas</p>
            </div>
          </div>
          <p className="text-xs text-[#3f4850] dark:text-slate-300 leading-relaxed mb-4">
            Consulta de existencias, localización por pasillo/vitrina, filtrado por marcas y stock crítico en tiempo real.
          </p>
          <div className="flex items-center text-xs font-bold text-[#006947] dark:text-[#4edea3] gap-1 group-hover:translate-x-1 transition-transform">
            <span>Explorar inventario</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('drawer')}
          className="group cursor-pointer bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 hover:border-[#006194] hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#dbe1ff] dark:bg-slate-800 flex items-center justify-center text-[#0051d5] dark:text-[#93ccff] group-hover:scale-105 transition-transform">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Apertura / Cierre de Caja
              </h3>
              <p className="text-xs text-[#707881] dark:text-slate-400">Cuadre Z y arqueo</p>
            </div>
          </div>
          <p className="text-xs text-[#3f4850] dark:text-slate-300 leading-relaxed mb-4">
            Conteo por denominación de billetes y monedas, registro de entradas/salidas y cuadre auditado sin descuadre.
          </p>
          <div className="flex items-center text-xs font-bold text-[#0051d5] dark:text-[#93ccff] gap-1 group-hover:translate-x-1 transition-transform">
            <span>Gestionar arqueo</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
