import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  DollarSign,
  Users,
  Percent,
  ArrowUpRight,
  PieChart,
  Flame,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Share2,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  ChevronDown,
  ShoppingBag,
  Store,
  Layers,
  Clock,
  AlertTriangle,
  BadgeAlert,
} from 'lucide-react';
import { useSalesBiData } from '../services/managerDashboardStore';

export const SalesReportBIView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('month');
  const [comparePrevious, setComparePrevious] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, isLoading, refetch } = useSalesBiData(timeframe);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Datos de Business Intelligence actualizados.');
    }, 400);
  };

  const handleExport = (format: string) => {
    setExportOpen(false);
    showToast(`Generando reporte gerencial en formato ${format}...`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Filters */}
      <section className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-sky-300 text-[11px] font-headline font-bold uppercase tracking-wider">
                Módulo Comercial
              </span>
              <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronizado en tiempo real
              </span>
            </div>
            <h1 className="text-2xl font-bold font-headline text-on-surface tracking-tight mt-1">
              Reportes de Ventas &amp; Business Intelligence
            </h1>
            <p className="text-xs text-on-surface-variant">
              Análisis multidimensional de rentabilidad, tráfico en sucursal y rendimiento de SKU.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setExportOpen(!exportOpen)}
                className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline text-xs font-semibold flex items-center gap-2 transition-all shadow-xs border border-outline-variant/20"
              >
                <Share2 className="w-4 h-4 text-primary" />
                <span>Exportar Reporte</span>
                <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-surface-container-lowest shadow-xl z-20 p-1.5 space-y-1 border border-outline-variant/30">
                  <button
                    onClick={() => handleExport('Excel (.xlsx)')}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-on-surface rounded-lg hover:bg-surface-container flex items-center gap-2.5 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Planilla Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport('PDF Ejecutivo')}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-on-surface rounded-lg hover:bg-surface-container flex items-center gap-2.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Dossier Ejecutivo (PDF)</span>
                  </button>
                  <button
                    onClick={() => handleExport('Ticket Térmico')}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-on-surface rounded-lg hover:bg-surface-container flex items-center gap-2.5 transition-colors"
                  >
                    <Printer className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Resumen Térmico 80mm</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-10 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-headline text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>

        {/* Timeframe Presets & Context Selectors */}
        <div className="pt-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-1 bg-surface-container rounded-lg gap-1 border border-outline-variant/20">
              <button
                type="button"
                onClick={() => setTimeframe('today')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeframe === 'today'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeframe === 'week'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Esta Semana
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeframe === 'month'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Este Mes
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-lowest rounded-lg shadow-xs border border-outline-variant/20">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono font-semibold text-on-surface">
                {timeframe === 'today' ? 'Hoy • 24 Nov 2026' : timeframe === 'week' ? 'Semana 47 • Nov 2026' : '01 Nov - 24 Nov 2026'}
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none pl-2">
              <input
                type="checkbox"
                checked={comparePrevious}
                onChange={(e) => setComparePrevious(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                vs. Período anterior
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  (+ Mes Pasado)
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-xs border border-outline-variant/20">
              <Store className="w-3.5 h-3.5 text-on-surface-variant" />
              <select className="bg-transparent text-xs font-medium text-on-surface focus:outline-none cursor-pointer">
                <option>Central Flagship #01</option>
                <option>Sucursal Shopping Alto Palermo</option>
                <option>Punto Express Belgrano #03</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-xs border border-outline-variant/20">
              <Users className="w-3.5 h-3.5 text-on-surface-variant" />
              <select className="bg-transparent text-xs font-medium text-on-surface focus:outline-none cursor-pointer">
                <option>Todos los Vendedores (4 activos)</option>
                <option>Esteban Harrison</option>
                <option>Valeria Gómez</option>
                <option>Matías Silva</option>
                <option>Lucía Fernández</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Executive BI KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Ventas Totales Netas</span>
            <span className="flex items-center text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 18.4%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              ${(data?.metrics.netSales ?? 6420850).toLocaleString('es-AR')}
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant">ARS</div>
          </div>
          <div className="pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 text-[10px] text-on-surface-variant flex justify-between items-center border-t border-outline-variant/20">
            <span>Bruto: $6,580,000</span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">N/C: -$159,150</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Ganancia Bruta Est.</span>
            <span className="flex items-center text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> {data?.metrics.grossMarginChange ?? '12.1%'}
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              $2,825,170
            </div>
            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              Margen Bruto: {data?.metrics.grossMarginPercent ?? 44.0}%
            </div>
          </div>
          <div className="pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 text-[10px] text-on-surface-variant flex justify-between items-center border-t border-outline-variant/20">
            <span>Costo Mercaderías (CMV)</span>
            <span className="font-mono font-medium">$3,595,680</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Tickets / Tráfico</span>
            <span className="flex items-center text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> 8.5%
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              1,428
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant">tickets fiscales</div>
          </div>
          <div className="pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 text-[10px] text-on-surface-variant flex justify-between items-center border-t border-outline-variant/20">
            <span>Ritmo de Caja</span>
            <span className="font-semibold text-primary">~62 tickets / día</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Ticket Promedio</span>
            <span className="flex items-center text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> {data?.metrics.averageTicketChange ?? '9.1%'}
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              ${(data?.metrics.averageTicket ?? 4496).toLocaleString('es-AR')}
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant">ARS por operación</div>
          </div>
          <div className="pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 text-[10px] text-on-surface-variant flex justify-between items-center border-t border-outline-variant/20">
            <span>Upselling Saludable</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">+ $370 vs mes ant.</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Índice UPT (Art./Ticket)</span>
            <span className="flex items-center text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> {data?.metrics.uptChange ?? '0.3 u.'}
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">
              {data?.metrics.upt ?? 2.34}
            </div>
            <div className="text-[11px] font-mono text-on-surface-variant">unidades promedio</div>
          </div>
          <div className="pt-2 bg-surface-container-low -mx-4 -mb-4 px-4 py-2 text-[10px] text-on-surface-variant flex justify-between items-center border-t border-outline-variant/20">
            <span>Venta Cruzada</span>
            <span className="text-primary font-bold">Vidrio + Funda (61%)</span>
          </div>
        </div>
      </section>

      {/* 3. Trend Charts & Category Mix */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Curve & Daily Bars (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-headline text-on-surface">Curva Semanal &amp; Picos Diarios</span>
                <span className="text-[10px] px-2 py-0.5 bg-surface-container font-mono rounded text-on-surface-variant">
                  W1-W4
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Volumen diario facturado comparado contra el mismo ciclo del mes previo
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-on-surface">
                <span className="w-3 h-3 rounded-xs bg-primary"></span> Mes Actual
              </span>
              <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
                <span className="w-3 h-0.5 bg-outline-variant"></span> Mes Anterior
              </span>
            </div>
          </div>

          {/* SVG Grid & Bars */}
          <div className="relative w-full bg-surface-container-low rounded-xl p-4 flex flex-col justify-between border border-outline-variant/20">
            <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 180">
              <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="700" y1="20" y2="20" />
              <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="700" y1="65" y2="65" />
              <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="700" y1="110" y2="110" />
              <line className="text-outline-variant/30" stroke="currentColor" strokeDasharray="4 4" x1="0" x2="700" y1="155" y2="155" />

              {/* Dotted comparison path */}
              <path
                className="text-slate-400 dark:text-slate-500"
                d="M 45,130 Q 140,115 240,105 T 440,95 T 540,40 T 650,55"
                fill="none"
                stroke="currentColor"
                strokeDasharray="6 4"
                strokeWidth="2.5"
              />

              {/* Day Bars */}
              <rect className="fill-primary/70 hover:fill-primary transition-colors cursor-pointer" height="65" rx="4" width="32" x="30" y="115" />
              <rect className="fill-primary/70 hover:fill-primary transition-colors cursor-pointer" height="80" rx="4" width="32" x="130" y="100" />
              <rect className="fill-primary/70 hover:fill-primary transition-colors cursor-pointer" height="90" rx="4" width="32" x="230" y="90" />
              <rect className="fill-primary/85 hover:fill-primary transition-colors cursor-pointer" height="105" rx="4" width="32" x="330" y="75" />
              <rect className="fill-primary hover:fill-primary/90 transition-colors cursor-pointer" height="140" rx="4" width="32" x="430" y="40" />
              <rect className="fill-sky-500 hover:fill-sky-400 transition-colors cursor-pointer" height="155" rx="4" width="32" x="530" y="25" />
              <rect className="fill-primary/70 hover:fill-primary transition-colors cursor-pointer" height="110" rx="4" width="32" x="630" y="70" />

              {/* Peak Circle */}
              <circle className="fill-white stroke-sky-500" cx="546" cy="25" r="4.5" strokeWidth="3" />
            </svg>

            {/* X-Axis */}
            <div className="grid grid-cols-7 text-center font-headline text-xs font-semibold text-on-surface-variant pt-2 border-t border-outline-variant/30 mt-2">
              <div>Lun <span className="block text-[10px] font-mono font-normal opacity-80">$620k</span></div>
              <div>Mar <span className="block text-[10px] font-mono font-normal opacity-80">$740k</span></div>
              <div>Mié <span className="block text-[10px] font-mono font-normal opacity-80">$810k</span></div>
              <div>Jue <span className="block text-[10px] font-mono font-normal opacity-80">$950k</span></div>
              <div className="text-primary font-bold">Vie 🔥 <span className="block text-[10px] font-mono">$1.38M</span></div>
              <div className="text-sky-600 dark:text-sky-400 font-bold">Sáb 🚀 <span className="block text-[10px] font-mono">$1.49M</span></div>
              <div>Dom <span className="block text-[10px] font-mono font-normal opacity-80">$990k</span></div>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-on-surface-variant bg-surface-container/60 p-2.5 rounded-lg border border-outline-variant/20">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <span><strong>Insights de Flujo:</strong> Viernes y Sábados concentran el <strong>44.7%</strong> del total comercial semanal.</span>
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
              Proyección Mes: $7.85M ARS
            </span>
          </div>
        </div>

        {/* Category Mix & Hourly Traffic Heatmap (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Category Mix */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold font-headline text-on-surface">Mix por Rubro / Categoría</h2>
                <p className="text-xs text-on-surface-variant">Participación porcentual en facturación</p>
              </div>
              <PieChart className="w-4 h-4 text-on-surface-variant" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
              {/* Donut SVG */}
              <div className="sm:col-span-5 flex justify-center relative">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4.5" />
                  <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="38, 100" strokeWidth="4.5" />
                  <path className="text-sky-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="27, 100" strokeDashoffset="-38" strokeWidth="4.5" />
                  <path className="text-emerald-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="20, 100" strokeDashoffset="-65" strokeWidth="4.5" />
                  <path className="text-indigo-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="15, 100" strokeDashoffset="-85" strokeWidth="4.5" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-headline font-bold text-sm text-on-surface">100%</span>
                  <span className="text-[9px] uppercase font-mono text-on-surface-variant">Catálogo</span>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="sm:col-span-7 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-medium">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Fundas &amp; Carcasas
                    </span>
                    <span className="font-mono font-bold">38% <span className="text-[10px] font-normal text-on-surface-variant">($2.44M)</span></span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Vidrios Templados
                    </span>
                    <span className="font-mono font-bold">27% <span className="text-[10px] font-normal text-on-surface-variant">($1.73M)</span></span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: '27%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Cables &amp; GaN
                    </span>
                    <span className="font-mono font-bold">20% <span className="text-[10px] font-normal text-on-surface-variant">($1.28M)</span></span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Gadgets &amp; Audio
                    </span>
                    <span className="font-mono font-bold">15% <span className="text-[10px] font-normal text-on-surface-variant">($963k)</span></span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Traffic Heatmap */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold font-headline text-on-surface">Horarios Pico &amp; Afluencia</h2>
                <p className="text-[11px] text-on-surface-variant">Concentración de operaciones por día vs. hora</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                <span>Baja</span>
                <span className="w-2 h-2 rounded-xs bg-sky-200 dark:bg-sky-950"></span>
                <span className="w-2 h-2 rounded-xs bg-sky-400 dark:bg-sky-700"></span>
                <span className="w-2 h-2 rounded-xs bg-sky-600 dark:bg-sky-500"></span>
                <span>Pico</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[280px]">
                <div className="grid grid-cols-7 gap-1 text-[10px] font-mono text-center text-on-surface-variant mb-1">
                  <span>09h</span><span>11h</span><span>13h</span><span>15h</span><span className="text-sky-600 dark:text-sky-400 font-bold">17h</span><span className="text-sky-600 dark:text-sky-400 font-bold">19h</span><span>21h</span>
                </div>
                <div className="space-y-1 text-xs">
                  {/* Lun */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 text-[10px] font-semibold text-on-surface-variant">Lun</span>
                    <div className="grid grid-cols-7 gap-1 flex-1 h-3.5">
                      <div className="bg-surface-container rounded-xs"></div>
                      <div className="bg-sky-200 dark:bg-sky-950 rounded-xs"></div>
                      <div className="bg-sky-200 dark:bg-sky-950 rounded-xs"></div>
                      <div className="bg-sky-400/60 dark:bg-sky-800 rounded-xs"></div>
                      <div className="bg-sky-500 dark:bg-sky-600 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-surface-container rounded-xs"></div>
                    </div>
                  </div>
                  {/* Mié */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 text-[10px] font-semibold text-on-surface-variant">Mié</span>
                    <div className="grid grid-cols-7 gap-1 flex-1 h-3.5">
                      <div className="bg-sky-200 dark:bg-sky-950 rounded-xs"></div>
                      <div className="bg-sky-200 dark:bg-sky-950 rounded-xs"></div>
                      <div className="bg-sky-400/60 dark:bg-sky-800 rounded-xs"></div>
                      <div className="bg-sky-500 dark:bg-sky-600 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-sky-200 dark:bg-sky-950 rounded-xs"></div>
                    </div>
                  </div>
                  {/* Vie */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 text-[10px] font-semibold text-primary font-bold">Vie</span>
                    <div className="grid grid-cols-7 gap-1 flex-1 h-3.5">
                      <div className="bg-sky-200 dark:bg-sky-950 rounded-xs"></div>
                      <div className="bg-sky-400/60 dark:bg-sky-800 rounded-xs"></div>
                      <div className="bg-sky-500 dark:bg-sky-600 rounded-xs"></div>
                      <div className="bg-sky-500 dark:bg-sky-600 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-sky-500 dark:bg-sky-600 rounded-xs"></div>
                    </div>
                  </div>
                  {/* Sáb */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 text-[10px] font-semibold text-sky-600 dark:text-sky-400 font-bold">Sáb</span>
                    <div className="grid grid-cols-7 gap-1 flex-1 h-3.5">
                      <div className="bg-sky-400/60 dark:bg-sky-800 rounded-xs"></div>
                      <div className="bg-sky-500 dark:bg-sky-600 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-sky-600 dark:bg-sky-500 rounded-xs"></div>
                      <div className="bg-sky-500 dark:bg-sky-600 rounded-xs"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md flex items-center justify-between border border-outline-variant/20">
                  <span>Franja Dorada: <strong>17:00 a 19:30 h</strong></span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">38% de ventas en este bloque</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pareto 80/20 Matrix */}
      <section className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-headline text-on-surface">Matriz Comercial de Inventario (Regla 80/20)</h2>
              <span className="text-[10px] font-bold bg-primary/10 text-primary dark:text-sky-300 px-2 py-0.5 rounded-full">
                Análisis Pareto
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">Identificación de artículos gancho, generadores de rentabilidad y stock estancado.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span>Total SKUs Activos: <strong>342</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Top Volumen */}
          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between space-y-3 border border-outline-variant/20">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold font-headline text-on-surface">Top Volumen (Unidades)</h3>
                  <p className="text-[10px] text-on-surface-variant">Productos gancho de alta rotación</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-primary font-mono">Cant. Vendida</span>
            </div>

            <div className="space-y-2">
              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-headline font-bold text-xs text-primary w-4">#1</span>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Vidrio Templado 9D iPhone 15/16</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">SKU: GL-9D-IP15 • Reposición c/4d</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-on-surface">412 u.</span>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+28%</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-headline font-bold text-xs text-primary w-4">#2</span>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Protector de Cámara Zafiro Metal</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">SKU: CAM-ZAF-PRO • Pack Doble</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-on-surface">285 u.</span>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+14%</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-headline font-bold text-xs text-primary w-4">#3</span>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Cable Reforzado Tipo C a C 60W 1.2m</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">SKU: CBL-CC-NYLON</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-on-surface">210 u.</span>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">+9%</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-on-surface-variant font-medium pt-1">
              Representan el <strong className="text-on-surface">63.5%</strong> de los productos ingresados en mostrador.
            </div>
          </div>

          {/* Top Rentabilidad */}
          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col justify-between space-y-3 border border-outline-variant/20">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold font-headline text-on-surface">Top Rentabilidad ($)</h3>
                  <p className="text-[10px] text-on-surface-variant">Mayor margen de ganancia líquida</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">Margen Neto</span>
            </div>

            <div className="space-y-2">
              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-headline font-bold text-xs text-emerald-600 dark:text-emerald-400 w-4">#1</span>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Funda Armor MagSafe Titanio</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">Margen Unitario: 68%</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">+$485,000</span>
                  <span className="block text-[10px] text-on-surface-variant font-mono">98 u. vendidas</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-headline font-bold text-xs text-emerald-600 dark:text-emerald-400 w-4">#2</span>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Cargador Rápido GaN 45W Dual</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">Margen Unitario: 54%</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">+$390,000</span>
                  <span className="block text-[10px] text-on-surface-variant font-mono">65 u. vendidas</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-headline font-bold text-xs text-emerald-600 dark:text-emerald-400 w-4">#3</span>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Batería Magnética Wireless 10k</div>
                    <div className="text-[10px] font-mono text-on-surface-variant">Margen Unitario: 49%</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">+$310,200</span>
                  <span className="block text-[10px] text-on-surface-variant font-mono">42 u. vendidas</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-on-surface-variant font-medium pt-1">
              Aportan el <strong className="text-on-surface">42.1%</strong> de la utilidad total del período.
            </div>
          </div>

          {/* Inmovilizados */}
          <div className="bg-rose-500/5 dark:bg-rose-950/20 rounded-xl p-4 flex flex-col justify-between space-y-3 border border-rose-500/20">
            <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <BadgeAlert className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold font-headline text-rose-700 dark:text-rose-300">Inmovilizados (&gt;60 Días)</h3>
                  <p className="text-[10px] text-on-surface-variant">Candidatos a liquidación / combo</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase bg-rose-500/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded">
                Riesgo Capital
              </span>
            </div>

            <div className="space-y-2">
              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Auriculares BT v5.0 Básicos</div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">0 ventas en 45 días</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">32 u. en stock</span>
                  <span className="block text-[10px] text-on-surface-variant">$192k parados</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Funda Silicona iPhone 11 Pro</div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">1 venta en 60 días</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">18 u. en stock</span>
                  <span className="block text-[10px] text-on-surface-variant">Obsoleto</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-2.5 rounded-lg flex items-center justify-between shadow-xs border border-outline-variant/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-on-surface truncate">Adaptador Micro-USB a Tipo C v1</div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">0 ventas en 90 días</div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">44 u. en stock</span>
                  <span className="block text-[10px] text-on-surface-variant">Remanente</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => showToast('Iniciando configurador de Combo Promocional 2x1...')}
              className="w-full py-2 bg-surface-container-lowest hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-headline font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Armar Combo Promocional 2x1</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Team Performance & Payment Mix */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Cashier Performance Table (7 cols) */}
        <div className="xl:col-span-7 bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold font-headline text-on-surface">Rendimiento por Vendedor / Cajero</h2>
              <p className="text-xs text-on-surface-variant">Productividad por personal asignado en Downtown Flagship</p>
            </div>
            <span className="text-xs font-mono bg-surface-container px-2 py-1 rounded text-on-surface-variant">
              4 Activos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-headline font-bold border-b border-outline-variant/20">
                  <th className="py-2.5 px-3 rounded-l-lg">Vendedor</th>
                  <th className="py-2.5 px-2">Facturado</th>
                  <th className="py-2.5 px-2 text-center">Tickets</th>
                  <th className="py-2.5 px-2">Ticket Prom.</th>
                  <th className="py-2.5 px-3 rounded-r-lg text-right">Comisión Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold font-headline flex items-center justify-center text-xs">
                        EH
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">Esteban Harrison</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Líder del Mes
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-on-surface">$2,190,400</td>
                  <td className="py-3 px-2 text-center font-mono">462</td>
                  <td className="py-3 px-2 font-mono">$4,741</td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">$65,712</span>
                    <span className="block text-[10px] text-on-surface-variant">3.0% cumplido</span>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary dark:text-sky-300 font-bold font-headline flex items-center justify-center text-xs">
                        VG
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">Valeria Gómez</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">Turno Mañana</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-on-surface">$1,780,250</td>
                  <td className="py-3 px-2 text-center font-mono">398</td>
                  <td className="py-3 px-2 font-mono">$4,472</td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono font-bold text-on-surface">$53,407</span>
                    <span className="block text-[10px] text-on-surface-variant">3.0% cumplido</span>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface font-bold font-headline flex items-center justify-center text-xs">
                        MS
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">Matías Silva</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">Turno Tarde</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-on-surface">$1,420,100</td>
                  <td className="py-3 px-2 text-center font-mono">318</td>
                  <td className="py-3 px-2 font-mono">$4,465</td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono font-bold text-on-surface">$42,603</span>
                    <span className="block text-[10px] text-on-surface-variant">3.0% cumplido</span>
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface font-bold font-headline flex items-center justify-center text-xs">
                        LF
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">Lucía Fernández</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">Refuerzo Fin de Sem.</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-mono font-bold text-on-surface">$1,030,100</td>
                  <td className="py-3 px-2 text-center font-mono">250</td>
                  <td className="py-3 px-2 font-mono">$4,120</td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-mono font-bold text-on-surface">$30,903</span>
                    <span className="block text-[10px] text-on-surface-variant">3.0% cumplido</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods & Audit (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Payment Mix */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-headline text-on-surface">Mix de Medios de Pago</h2>
              <span className="text-[10px] font-mono text-on-surface-variant">Tarifas y Acreditación</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium flex items-center gap-1.5 text-on-surface">
                    <Receipt className="w-4 h-4 text-primary" /> Transferencia / QR (Mercado Pago)
                  </span>
                  <span className="font-mono font-bold">42% <span className="font-normal text-on-surface-variant">($2,696,757)</span></span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '42%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-0.5">
                  <span>Comisión arancel: 0.8% + IVA</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Inmediato</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium flex items-center gap-1.5 text-on-surface">
                    <Receipt className="w-4 h-4 text-sky-500" /> Tarjeta de Débito
                  </span>
                  <span className="font-mono font-bold">28% <span className="font-normal text-on-surface-variant">($1,797,838)</span></span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '28%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-0.5">
                  <span>Arancel Payway: 1.2%</span>
                  <span>24 hs hábiles</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium flex items-center gap-1.5 text-on-surface">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Efectivo en Caja
                  </span>
                  <span className="font-mono font-bold">18% <span className="font-normal text-on-surface-variant">($1,155,753)</span></span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '18%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-0.5">
                  <span>Sin comisiones bancarias</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Cero Retención</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium flex items-center gap-1.5 text-on-surface">
                    <Receipt className="w-4 h-4 text-indigo-400" /> Tarjeta de Crédito (1-3 Cuotas)
                  </span>
                  <span className="font-mono font-bold">12% <span className="font-normal text-on-surface-variant">($770,502)</span></span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: '12%' }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-0.5">
                  <span>Costo financiero estimado: -$48,200</span>
                  <span>Cuota Simple 3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Voids & Discounts Audit */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold font-headline text-on-surface">Control de Descuentos &amp; Anulaciones</h2>
              </div>
              <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded">
                Auditoría PIN
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <span className="text-[11px] text-on-surface-variant">Descuentos Aplicados</span>
                <div className="font-headline font-bold text-base text-on-surface mt-0.5">
                  $112,400 <span className="text-[10px] font-normal text-on-surface-variant">ARS</span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block mt-1">Mayor emisor: Esteban H. ($54k)</span>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20">
                <span className="text-[11px] text-on-surface-variant">Tickets Anulados</span>
                <div className="font-headline font-bold text-base text-on-surface mt-0.5">4 tickets</div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">100% con PIN Supervisor</span>
              </div>
            </div>
            <div className="text-[11px] text-on-surface-variant bg-surface-container/50 p-2.5 rounded-lg flex items-center justify-between border border-outline-variant/20">
              <span>Tasa de merma / cancelación: <strong>0.28%</strong> (Umbral óptimo &lt; 1.0%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Alerts & Monthly Target */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
        {/* Low stock alert in best sellers (6 cols) */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-headline text-on-surface">Quiebre de Stock en "Best Sellers"</h3>
                <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded">Urgente</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                <strong>2 de los 10 productos clave</strong> presentan menos de 3 días de cobertura estimada de inventario según el ritmo de ventas actual:
              </p>
            </div>
          </div>
          <div className="space-y-2 bg-rose-500/10 p-3 rounded-lg text-xs border border-rose-500/20">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-on-surface truncate">Vidrio Templado 9D iPhone 15/16</span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">14 u. restantes (Cobertura: 1.2 días)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-on-surface truncate">Funda Armor MagSafe Titanio</span>
              <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">6 u. restantes (Cobertura: 2.1 días)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => showToast('Redirigiendo a Generación de Pedido a Proveedor...')}
              className="flex-1 h-9 px-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-headline font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Generar Pedido a Proveedor
            </button>
            <button
              onClick={() => showToast('Alerta pospuesta por 24 horas.')}
              className="h-9 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-headline font-semibold transition-colors border border-outline-variant/20"
            >
              Ignorar 24h
            </button>
          </div>
        </div>

        {/* Commercial Monthly Target (6 cols) */}
        <div className="lg:col-span-6 bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Objetivo de Venta Mensual</span>
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">85.6% completado</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-headline text-on-surface">$6,420,850</span>
              <span className="text-xs font-mono text-on-surface-variant">/ $7,500,000 ARS</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: '85.6%' }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-on-surface-variant">
              <span>Resta para el objetivo: <strong>$1,079,150</strong></span>
              <span className="font-bold text-primary">6 días hábiles restantes</span>
            </div>
          </div>
          <div className="text-[11px] text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between border border-outline-variant/20">
            <span>Ritmo necesario: <strong>$179,858 / día</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Alcanzable
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
