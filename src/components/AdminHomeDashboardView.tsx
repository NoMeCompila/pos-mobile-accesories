import React, { useState } from 'react';
import {
  Zap,
  BarChart3,
  UserCog,
  RotateCcw,
  Sliders,
  LogOut,
  Moon,
  Sun,
  Menu,
  Activity,
  Pause,
  Play,
  Download,
  AlertTriangle,
  ShieldAlert,
  Server,
  Database,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Cloud,
  ChevronDown,
  ChevronUp,
  Key,
  Radio,
  FileCode,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types/pos';
import {
  useAdminDashboardData,
  useRenewArcaTraMutation,
  usePingArcaWsfeMutation,
  filterAuthEvents,
  filterAuditLogs,
} from '../services/adminDashboardStore';
import { AuthEventFilter, AuditTableFilter } from '../types/adminDashboard';

interface AdminHomeDashboardViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const AdminHomeDashboardView: React.FC<AdminHomeDashboardViewProps> = ({
  darkMode,
  onToggleDarkMode,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const { data: dashboardData, isLoading } = useAdminDashboardData();
  const renewTraMutation = useRenewArcaTraMutation();
  const pingWsfeMutation = usePingArcaWsfeMutation();

  // Local interactive UI state
  const [isFeedPaused, setIsFeedPaused] = useState(false);
  const [authFilter, setAuthFilter] = useState<AuthEventFilter>('ALL');
  const [tableFilter, setTableFilter] = useState<AuditTableFilter>('ALL');
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>('AUD-99240');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const kpis = dashboardData?.kpis;
  const arca = dashboardData?.arca;
  const cdn = dashboardData?.cdn;

  const filteredAuthEvents = dashboardData
    ? filterAuthEvents(dashboardData.authEvents, authFilter)
    : [];

  const filteredAuditLogs = dashboardData
    ? filterAuditLogs(dashboardData.auditLogs, tableFilter)
    : [];

  const handleExportLogs = () => {
    if (!dashboardData) return;
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      systemKpis: dashboardData.kpis,
      authEvents: dashboardData.authEvents,
      externalIntegrations: {
        arca: dashboardData.arca,
        cdn: dashboardData.cdn,
      },
      auditLogs: dashboardData.auditLogs,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voltacc_observability_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setActionFeedback('Logs exportados exitosamente en formato JSON');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleRenewTra = async () => {
    try {
      await renewTraMutation.mutateAsync();
      setActionFeedback('Ticket de Acceso (TRA) renovado ante WSAA');
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      setActionFeedback('Error al renovar TRA');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handlePingWsfe = async () => {
    try {
      await pingWsfeMutation.mutateAsync();
      setActionFeedback('Ping WSFEv1 exitoso (FEDummy OK)');
      setTimeout(() => setActionFeedback(null), 3000);
    } catch {
      setActionFeedback('Error en ping WSFEv1');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const toggleDiffRow = (id: string) => {
    setExpandedDiffId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#0b101b] text-[#131b2e] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-4 right-4 z-50 bg-[#006194] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Left Icon-Rail Sidebar (80px / w-20) */}
      <aside
        className={`fixed left-0 top-0 h-full w-20 bg-white dark:bg-[#131b2e] border-r border-[#dae2fd]/60 dark:border-[#283044] z-50 flex flex-col items-center py-4 shadow-xs transition-transform duration-300 ${
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex flex-col items-center gap-1.5 w-full pb-4 border-b border-[#dae2fd]/40 dark:border-[#283044] mb-3">
          <div
            className="w-10 h-10 rounded-xl bg-[#007bb9] flex items-center justify-center text-white shadow-sm cursor-pointer"
            title="VoltAcc POS"
            onClick={() => onNavigate('admin/home')}
          >
            <Zap className="w-5 h-5 fill-white" />
          </div>
        </div>

        {/* Navigation Icon Rail */}
        <nav className="flex-1 w-full px-2 flex flex-col items-center gap-2">
          {/* Active Tab: Resumen y Logs */}
          <button
            onClick={() => onNavigate('admin/home')}
            className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-[#007bb9] text-white font-bold shadow-sm transition-all cursor-pointer"
            title="Resumen y Logs (Activo)"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#006194] rounded-r-full" />
          </button>

          {/* Tab 2: Gestión de Usuarios */}
          <button
            onClick={() => onNavigate('admin/users')}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white transition-all cursor-pointer"
            title="Gestión de Usuarios"
          >
            <UserCog className="w-5 h-5" />
          </button>

          <button
            className="w-12 h-12 flex items-center justify-center rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white transition-all cursor-pointer"
            title="Backup & Restore (Próximamente)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            className="w-12 h-12 flex items-center justify-center rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white transition-all cursor-pointer"
            title="Configuración (Próximamente)"
          >
            <Sliders className="w-5 h-5" />
          </button>
        </nav>

        {/* Bottom Rail Actions */}
        <div className="flex flex-col items-center gap-3 w-full pt-4 border-t border-[#dae2fd]/40 dark:border-[#283044] mt-auto">
          {/* DB Ping Dot Indicator */}
          <div
            className="w-9 h-9 rounded-xl bg-[#f2f3ff] dark:bg-[#1a233b] flex items-center justify-center text-emerald-600 dark:text-emerald-400 cursor-help"
            title="Supabase PostgreSQL Conectado (Mock 28ms)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-10 h-10 rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b] hover:text-[#131b2e] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Alternar Modo Oscuro"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="w-10 h-10 rounded-xl text-[#ba1a1a] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Admin Avatar */}
          <div
            className="w-10 h-10 rounded-full bg-[#006194] flex items-center justify-center text-white text-xs font-bold ring-2 ring-emerald-500 cursor-default"
            title={`Administrador: ${user?.username || 'admin'}`}
          >
            AD
          </div>
        </div>
      </aside>

      {/* Main Layout Area (offset for 80px sidebar on lg) */}
      <div className="lg:pl-20 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#131b2e] border-b border-[#dae2fd]/60 dark:border-[#283044] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#707881] hover:bg-[#eaedff] dark:hover:bg-[#1e293b]"
              title="Abrir Menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-[#006194] dark:text-[#93ccff] tracking-tight">
                Humans In The Loop
              </span>
              <span className="text-xs text-[#707881] dark:text-slate-400 hidden sm:inline">
                • POS & Backoffice
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#dae2fd] dark:bg-[#1e293b] text-[#006194] dark:text-[#93ccff] text-[11px] font-bold tracking-wider">
              PROD • SUPABASE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#707881] dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Observabilidad en tiempo real</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div className="text-right">
              <span className="block text-xs font-semibold text-[#131b2e] dark:text-white">
                {user?.displayName || 'Administrador Root'}
              </span>
              <span className="block text-[11px] text-[#707881] dark:text-slate-400">
                Rol: Administrador
              </span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* Sub-header / Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#131b2e] dark:text-white">
                Centro de Control & Observabilidad
              </h1>
              <p className="text-sm text-[#707881] dark:text-slate-400 mt-0.5">
                Métricas del sistema, auditoría de eventos en vivo y estado de integraciones críticas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>En Vivo • Websocket PostgreSQL</span>
              </div>

              {/* Pause / Resume Button */}
              <button
                onClick={() => setIsFeedPaused(!isFeedPaused)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isFeedPaused
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : 'bg-white dark:bg-[#1a233b] text-[#3f4850] dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title={isFeedPaused ? 'Reanudar Feed' : 'Pausar Feed'}
              >
                {isFeedPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Reanudar Feed</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar Feed (5s)</span>
                  </>
                )}
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportLogs}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1a233b] text-[#3f4850] dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Exportar snapshot actual de logs"
              >
                <Download className="w-3.5 h-3.5 text-[#006194] dark:text-[#93ccff]" />
                <span>Exportar Logs (JSON)</span>
              </button>
            </div>
          </div>

          {/* Top Bento KPIs Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Sesiones Activas */}
            <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 shadow-xs border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#707881] dark:text-slate-400 uppercase tracking-wider">
                  Sesiones Activas
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#dae2fd]/60 dark:bg-[#1e293b] flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#131b2e] dark:text-white">
                  {kpis?.activeSessions.total ?? 14}
                </span>
                <span className="text-xs text-[#707881] dark:text-slate-400">concurrentes</span>
                <span className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3" />
                  +{kpis?.activeSessions.deltaVsLastHour ?? 2} vs 1h
                </span>
              </div>
              <p className="text-xs text-[#707881] dark:text-slate-400 truncate">
                {kpis?.activeSessions.breakdownText ?? '9 cajeros en TPV • 3 supervisores • 2 admins'}
              </p>
            </div>

            {/* Card 2: Eventos de Seguridad */}
            <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 shadow-xs border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#707881] dark:text-slate-400 uppercase tracking-wider">
                  Eventos Seguridad (24h)
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-[#ba1a1a] dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#ba1a1a] dark:text-rose-400">
                  {kpis?.securityEvents24h.total ?? 7}
                </span>
                <span className="text-xs text-[#707881] dark:text-slate-400">incidentes</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#707881] dark:text-slate-400 truncate">
                  {kpis?.securityEvents24h.breakdownText ?? '5 reintentos fallidos • 2 bloqueos de PIN'}
                </span>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-semibold w-fit truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                  <span>{kpis?.securityEvents24h.flaggedIp} ({kpis?.securityEvents24h.flaggedLocation})</span>
                </div>
              </div>
            </div>

            {/* Card 3: Latencia DB & Conexiones */}
            <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 shadow-xs border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#707881] dark:text-slate-400 uppercase tracking-wider">
                  Latencia DB & Conexiones
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#dae2fd]/60 dark:bg-[#1e293b] flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
                  <Server className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#131b2e] dark:text-white">
                  {kpis?.dbLatencyAndConnections.latencyMs ?? 28}
                </span>
                <span className="font-mono text-sm text-[#707881] dark:text-slate-400">ms</span>
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                  {kpis?.dbLatencyAndConnections.status ?? 'Saludable'}
                </span>
              </div>
              <div className="text-xs text-[#707881] dark:text-slate-400 truncate">
                {kpis?.dbLatencyAndConnections.auxiliaryStatusText ?? 'ARCA: Online 99.8% • Cloudinary: 42% cuota'}
              </div>
            </div>

            {/* Card 4: Tasa de Errores & Sync */}
            <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 shadow-xs border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-[#707881] dark:text-slate-400 uppercase tracking-wider">
                  Tasa de Errores API / Sync
                </span>
                <div className="w-8 h-8 rounded-lg bg-[#dae2fd]/60 dark:bg-[#1e293b] flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#131b2e] dark:text-white">
                    {kpis?.apiErrorRate.ratePercent ?? 0.04}%
                  </span>
                  <span className="font-mono text-xs text-[#707881] dark:text-slate-400">
                    {kpis?.apiErrorRate.errorTypeBadge ?? '(4xx/5xx)'}
                  </span>
                </div>
                {/* SVG Sparkline */}
                <svg className="w-16 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 80 24">
                  <path
                    d="M2 18 L15 17 L28 19 L40 12 L52 14 L65 7 L78 6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[#707881] dark:text-slate-400 text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                  {kpis?.apiErrorRate.successText ?? '99.96% éxito (18.4k reqs)'}
                </span>
                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                  {kpis?.apiErrorRate.pendingOfflineCount ?? 0} off.
                </span>
              </div>
            </div>
          </section>

          {/* Main Split: Left Feed (7 cols) / Right Integrations (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Auth Events Feed (col-span-7) */}
            <section className="lg:col-span-7 bg-white dark:bg-[#131b2e] rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#006194] dark:text-[#93ccff]" />
                  <h3 className="text-base sm:text-lg font-bold text-[#131b2e] dark:text-white">
                    Feed en Vivo: Eventos de Autenticación
                  </h3>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { key: 'ALL', label: 'Todos' },
                      { key: 'ALERT', label: 'Fallidos / Alertas', alertCount: 2 },
                      { key: 'LOGIN_SUCCESS', label: 'LOGIN_SUCCESS' },
                      { key: 'TOKEN_REFRESH', label: 'TOKEN_REFRESH' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setAuthFilter(f.key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        authFilter === f.key
                          ? 'bg-[#006194] text-white shadow-xs'
                          : 'bg-[#f2f3ff] dark:bg-[#1e293b] text-[#3f4850] dark:text-slate-300 hover:text-[#131b2e] dark:hover:text-white'
                      }`}
                    >
                      <span>{f.label}</span>
                      {'alertCount' in f && f.alertCount && (
                        <span className="w-4 h-4 rounded-full bg-[#ba1a1a] text-white inline-flex items-center justify-center text-[10px]">
                          {f.alertCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Stream List */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[560px] pr-1">
                {isLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Cargando stream de eventos...
                  </div>
                ) : filteredAuthEvents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No hay eventos de autenticación para el filtro seleccionado.
                  </div>
                ) : (
                  filteredAuthEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl bg-[#f2f3ff]/60 dark:bg-[#1a233b]/60 hover:bg-[#eaedff] dark:hover:bg-[#1e293b] border border-slate-200/50 dark:border-slate-800 transition-all flex flex-col gap-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#006194] dark:text-[#93ccff]">
                            {evt.timestamp}
                          </span>
                          <span className="font-semibold text-[#131b2e] dark:text-white truncate">
                            {evt.userEmail}
                          </span>
                          <span className="text-[11px] text-[#707881] dark:text-slate-400">
                            • {evt.roleLabel}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                            evt.statusBadge.variant === 'success'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : evt.statusBadge.variant === 'error'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              : evt.statusBadge.variant === 'warning'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {evt.statusBadge.text}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#707881] dark:text-slate-400 font-mono">
                        <span>Terminal: {evt.terminalId}</span>
                        <span>•</span>
                        <span>{evt.clientInfo}</span>
                        <span>•</span>
                        <span className={evt.category === 'ALERT' ? 'text-[#ba1a1a] dark:text-rose-400 font-bold' : ''}>
                          IP: {evt.ipAddress} {evt.countryCode ? `(${evt.countryCode})` : ''}
                        </span>
                      </div>

                      {evt.alertMessage && (
                        <div className="mt-1 flex items-start gap-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs">
                          <AlertTriangle className="w-4 h-4 text-[#ba1a1a] dark:text-rose-400 shrink-0 mt-0.5" />
                          <span>{evt.alertMessage}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Feed Stream Footer */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#707881] dark:text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Escuchando tabla <code className="text-[#006194] dark:text-[#93ccff] font-bold">auth.audit_events</code>
                </span>
                <span className="italic text-[11px]">
                  Mostrando {filteredAuthEvents.length} de {dashboardData?.authEvents.length ?? 5} registros
                </span>
              </div>
            </section>

            {/* Right: External Integrations Monitor (col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Card 1: ARCA / AFIP WSAA & WSFEv1 */}
              <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200/60 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#dae2fd]/60 dark:bg-[#1e293b] flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#131b2e] dark:text-white">
                        {arca?.serviceName ?? 'Servicio Fiscal ARCA'}
                      </h3>
                      <span className="font-mono text-xs text-[#707881] dark:text-slate-400">
                        {arca?.environment ?? 'AFIP WSAA / WSFEv1'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    {arca?.status ?? 'Operativo'}
                  </span>
                </div>

                {/* Token TRA Validity Meter */}
                <div className="bg-[#f2f3ff]/80 dark:bg-[#1a233b]/80 p-3.5 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#131b2e] dark:text-white">
                      Ticket de Acceso (TRA)
                    </span>
                    <span className="font-mono font-bold text-[#006194] dark:text-[#93ccff]">
                      Expira en {arca?.traExpiration.hoursRemainingText ?? '04h 28m'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-[#007bb9] rounded-full transition-all duration-500"
                      style={{ width: `${arca?.traExpiration.elapsedPercent ?? 63}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[#707881] dark:text-slate-400 font-mono text-[11px]">
                    <span>Vigencia: {arca?.traExpiration.validityHours ?? 12} Horas</span>
                    <span className="truncate max-w-[160px]" title={arca?.traExpiration.signaturePreview}>
                      Sign: {arca?.traExpiration.signaturePreview ?? 'wsaa_sig_8f3a9e...'}
                    </span>
                  </div>
                </div>

                {/* Metric Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#f2f3ff]/60 dark:bg-[#1a233b]/60 rounded-lg flex flex-col">
                    <span className="text-[10px] font-bold text-[#707881] dark:text-slate-400 uppercase">
                      Latencia FECAE
                    </span>
                    <span className="font-mono text-lg font-bold text-[#131b2e] dark:text-white">
                      {arca?.fecaeLatencyMs ?? 312} ms
                    </span>
                    <span className="text-[10px] text-[#707881] dark:text-slate-400">
                      Promedio últimas 50 facturas
                    </span>
                  </div>
                  <div className="p-3 bg-[#f2f3ff]/60 dark:bg-[#1a233b]/60 rounded-lg flex flex-col">
                    <span className="text-[10px] font-bold text-[#707881] dark:text-slate-400 uppercase">
                      Último CAE Autorizado
                    </span>
                    <span className="font-mono text-xs font-bold text-[#131b2e] dark:text-white truncate">
                      {arca?.lastAuthorizedCae ?? '74192837491023'}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                      {arca?.lastVoucherLabel ?? 'Factura B #0004-00018921'}
                    </span>
                  </div>
                </div>

                {/* Last Fiscal Action Log */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100/80 dark:bg-[#1e293b] text-xs text-[#131b2e] dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{arca?.lastActionMessage}</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleRenewTra}
                    disabled={renewTraMutation.isPending}
                    className="h-9 px-3 bg-[#f2f3ff] dark:bg-[#1e293b] hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5 text-[#006194] dark:text-[#93ccff]" />
                    <span>{renewTraMutation.isPending ? 'Renovando...' : 'Renovar TRA'}</span>
                  </button>
                  <button
                    onClick={handlePingWsfe}
                    disabled={pingWsfeMutation.isPending}
                    className="h-9 px-3 bg-[#f2f3ff] dark:bg-[#1e293b] hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{pingWsfeMutation.isPending ? 'Ping...' : 'Ping WSFEv1'}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: CDN & Multimedia */}
              <div className="bg-white dark:bg-[#131b2e] rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200/60 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#dae2fd]/60 dark:bg-[#1e293b] flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#131b2e] dark:text-white">
                        {cdn?.serviceName ?? 'CDN & Multimedia'}
                      </h3>
                      <span className="font-mono text-xs text-[#707881] dark:text-slate-400">
                        {cdn?.providers ?? 'Cloudinary & S3 Storage'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    {cdn?.status ?? 'Óptimo'}
                  </span>
                </div>

                {/* Storage Meter */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[#707881] dark:text-slate-400">Capacidad Usada</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-[#131b2e] dark:text-white">
                        {cdn?.usedGb ?? 8.4} GB
                      </span>
                      <span className="text-[#707881] dark:text-slate-400">
                        / {cdn?.totalGb ?? 20} GB ({cdn?.usedPercent ?? 42}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                      style={{ width: `${cdn?.usedPercent ?? 42}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#f2f3ff]/60 dark:bg-[#1a233b]/60 rounded-lg text-xs text-[#131b2e] dark:text-slate-300">
                  <span>{cdn?.catalogImagesCount ?? 1480} imágenes de catálogo</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {cdn?.edgeCacheHitRatePercent ?? 99.4}% Edge Cache Hit
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Database CDC Audit Trail */}
          <section className="bg-white dark:bg-[#131b2e] rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-800 p-4 sm:p-5 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#006194] dark:text-[#93ccff]" />
                  <h3 className="text-base sm:text-lg font-bold text-[#131b2e] dark:text-white">
                    Registro de Auditoría de Base de Datos (CDC Audit Trail)
                  </h3>
                </div>
                <p className="text-xs text-[#707881] dark:text-slate-400 mt-0.5">
                  Historial inmutable de mutaciones por triggers de PostgreSQL en tiempo real.
                </p>
              </div>

              {/* Table Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-[#707881] dark:text-slate-400 uppercase mr-1">
                  Filtrar tabla:
                </span>
                {(
                  [
                    { key: 'ALL', label: 'Todas' },
                    { key: 'sales', label: 'sales' },
                    { key: 'cash_shifts', label: 'cash_shifts' },
                    { key: 'products', label: 'products' },
                    { key: 'user_profiles', label: 'user_profiles' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTableFilter(t.key)}
                    className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                      tableFilter === t.key
                        ? 'bg-[#006194] text-white shadow-xs'
                        : 'bg-[#f2f3ff] dark:bg-[#1e293b] text-[#3f4850] dark:text-slate-300 hover:text-[#131b2e] dark:hover:white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f3ff] dark:bg-[#1e293b] text-[#707881] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Timestamp</th>
                    <th className="py-2.5 px-3">Tabla</th>
                    <th className="py-2.5 px-3">Operación</th>
                    <th className="py-2.5 px-3">Usuario / Rol</th>
                    <th className="py-2.5 px-3">Registro Afectado</th>
                    <th className="py-2.5 px-3">Cambios (Diff)</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-[#131b2e] dark:text-slate-300">
                  {filteredAuditLogs.map((log) => {
                    const isExpanded = expandedDiffId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => toggleDiffRow(log.id)}
                          className="hover:bg-[#f2f3ff]/50 dark:hover:bg-[#1e293b]/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[#006194] dark:text-[#93ccff]">
                              {log.tableName}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                log.operation === 'INSERT'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : log.operation === 'UPDATE'
                                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                  : log.operation === 'VOID'
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {log.operation}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-semibold">{log.username}</span>
                              <span className="text-[10px] text-[#707881] dark:text-slate-400">
                                {log.userRole}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold">
                            {log.affectedRecordIdentifier}
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="flex items-center gap-1">
                              {log.diffSummary.oldValueText && (
                                <span className="text-rose-600 line-through">
                                  {log.diffSummary.oldValueText}
                                </span>
                              )}
                              {log.diffSummary.oldValueText && log.diffSummary.newValueText && (
                                <span className="text-slate-400">→</span>
                              )}
                              {log.diffSummary.newValueText && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  {log.diffSummary.newValueText}
                                </span>
                              )}
                              {log.diffSummary.annotationText && (
                                <span className="text-slate-400 text-[10px]">
                                  {log.diffSummary.annotationText}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                              title="Ver Diff Completo"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Diff Details */}
                        {isExpanded && (
                          <tr className="bg-[#f2f3ff]/30 dark:bg-[#1a233b]/30">
                            <td colSpan={7} className="p-3 sm:p-4">
                              <div className="bg-white dark:bg-[#131b2e] p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                                  <span className="font-semibold text-[#131b2e] dark:text-white">
                                    Motivo: <span className="font-normal text-slate-600 dark:text-slate-300">{log.details.reason}</span>
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-500">
                                    {log.details.transactionIdOrDetails}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                                  {/* OLD JSON */}
                                  <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg border border-rose-100 dark:border-rose-900/30">
                                    <span className="text-rose-700 dark:text-rose-400 font-bold uppercase block mb-1.5 text-[10px]">
                                      Valores Anteriores (OLD)
                                    </span>
                                    <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-[11px] leading-relaxed">
                                      {JSON.stringify(log.details.oldRecord, null, 2)}
                                    </pre>
                                  </div>

                                  {/* NEW JSON */}
                                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase block mb-1.5 text-[10px]">
                                      Nuevos Valores (NEW)
                                    </span>
                                    <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-[11px] leading-relaxed">
                                      {JSON.stringify(log.details.newRecord, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
