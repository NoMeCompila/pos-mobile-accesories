import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  Banknote,
  Percent,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Key,
  Lock,
  Unlock,
  Store,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sliders,
  DollarSign,
  Monitor,
} from 'lucide-react';
import {
  useCommercialControlData,
  useApproveSupervisorOverrideMutation,
  useRejectSupervisorOverrideMutation,
} from '../services/managerDashboardStore';

export const CommercialControlDashboardView: React.FC = () => {
  const { data, isLoading, refetch } = useCommercialControlData();
  const approveMutation = useApproveSupervisorOverrideMutation();
  const rejectMutation = useRejectSupervisorOverrideMutation();

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedOverrideId, setSelectedOverrideId] = useState<string | null>(null);
  const [supervisorPin, setSupervisorPin] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenPinModal = (overrideId: string) => {
    setSelectedOverrideId(overrideId);
    setSupervisorPin('');
    setPinModalOpen(true);
  };

  const handleConfirmPinApproval = async () => {
    if (!supervisorPin || supervisorPin.length < 4) {
      showToast('El PIN de supervisor debe contener al menos 4 dígitos.');
      return;
    }
    if (selectedOverrideId) {
      await approveMutation.mutateAsync(selectedOverrideId);
      showToast('Autorización de supervisor concedida en la terminal.');
      setPinModalOpen(false);
      setSelectedOverrideId(null);
    }
  };

  const handleRejectOverride = async (overrideId: string) => {
    await rejectMutation.mutateAsync(overrideId);
    showToast('Solicitud de anulación / descuento rechazada.');
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Métricas comerciales sincronizadas en vivo.');
    }, 400);
  };

  const kpis = data?.kpis || [];
  const terminals = data?.terminals || [];
  const overrides = data?.overrides || [];
  const shifts = data?.shifts || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#007bb9] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#707881] dark:text-slate-400 uppercase tracking-wider">
            <span>Gerencia</span>
            <span>/</span>
            <span className="text-[#007bb9] dark:text-[#93ccff] font-bold">Control Comercial</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-[#131b2e] dark:text-white">
              Panel de Control Comercial & Operativo
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Supervisión en Vivo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-[#131b2e] border border-[#dae2fd]/60 dark:border-[#283044] text-[#131b2e] dark:text-slate-200 text-xs font-semibold hover:bg-[#eaedff] dark:hover:bg-[#1e293b] shadow-xs cursor-pointer transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#007bb9] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar Métricas</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Commercial KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#131b2e] border border-[#dae2fd]/60 dark:border-[#283044] shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#707881] dark:text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  kpi.trend === 'up'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : kpi.trend === 'down'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    : 'bg-[#eaedff] dark:bg-slate-800 text-[#007bb9]'
                }`}
              >
                {kpi.change}
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-headline font-bold text-[#131b2e] dark:text-white">
                {kpi.value}
              </div>
              <p className="text-xs text-[#707881] dark:text-slate-400 mt-1">{kpi.subtext}</p>
            </div>
          </div>
        ))}
      </section>

      {/* 2. Immediate Manager Authorizations Queue */}
      <section className="bg-white dark:bg-[#131b2e] rounded-2xl p-5 border-2 border-[#007bb9]/30 dark:border-[#007bb9]/40 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#dae2fd]/60 dark:border-[#283044] gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007bb9]/10 text-[#007bb9] dark:text-[#93ccff] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline text-base font-bold text-[#131b2e] dark:text-white">
                  Cola de Autorizaciones Inmediatas
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 uppercase">
                  Requiere PIN Gerente
                </span>
              </div>
              <p className="text-xs text-[#707881] dark:text-slate-400">
                Peticiones de anulación, descuentos VIP y apertura manual de gaveta en tiempo real
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#707881] dark:text-slate-400">
            {overrides.filter((o) => o.status === 'pending').length} pendientes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overrides.map((ovr) => {
            const isPending = ovr.status === 'pending';
            return (
              <div
                key={ovr.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isPending
                    ? 'bg-[#faf8ff] dark:bg-[#1a233b] border-amber-500/40'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-[#007bb9] dark:text-[#93ccff]">
                      {ovr.terminalCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        ovr.status === 'pending'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : ovr.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {ovr.status === 'pending'
                        ? 'Pendiente'
                        : ovr.status === 'approved'
                        ? 'Aprobado'
                        : 'Rechazado'}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#131b2e] dark:text-white">
                    {ovr.actionType === 'discount_override'
                      ? 'Descuento Excepcional'
                      : ovr.actionType === 'ticket_void'
                      ? 'Anulación de Comprobante'
                      : 'Apertura de Gaveta'}
                  </h3>
                  <p className="text-xs text-[#707881] dark:text-slate-400 mt-0.5">
                    Cajero: <strong className="text-[#131b2e] dark:text-white">{ovr.cashierName}</strong> • {ovr.timestamp}
                  </p>
                  <p className="text-xs bg-white dark:bg-[#131b2e] p-2 rounded-lg border border-[#dae2fd]/40 dark:border-[#283044] mt-2.5 text-[#3f4850] dark:text-slate-300">
                    {ovr.description}
                  </p>
                  {ovr.amount && (
                    <div className="mt-2 text-right">
                      <span className="text-xs text-[#707881]">Monto: </span>
                      <span className="font-headline font-bold text-base text-[#131b2e] dark:text-white">
                        ${ovr.amount.toLocaleString('es-AR')}
                      </span>
                    </div>
                  )}
                </div>

                {isPending && (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#dae2fd]/60 dark:border-[#283044]">
                    <button
                      onClick={() => handleRejectOverride(ovr.id)}
                      className="h-9 px-3 rounded-lg border border-rose-300 text-rose-600 dark:border-rose-900 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleOpenPinModal(ovr.id)}
                      className="h-9 px-3 rounded-lg bg-[#007bb9] hover:bg-[#006194] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Aprobar PIN</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Live POS Terminal Nodes Monitor */}
      <section className="bg-white dark:bg-[#131b2e] rounded-2xl p-5 border border-[#dae2fd]/60 dark:border-[#283044] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[#007bb9]" />
            <h2 className="font-headline text-base font-bold text-[#131b2e] dark:text-white">
              Monitoreo de Terminales POS y Nodos de Venta
            </h2>
          </div>
          <span className="text-xs font-mono text-[#707881] dark:text-slate-400">
            {terminals.length} Terminales en Red
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {terminals.map((term) => (
            <div
              key={term.id}
              className="p-4 rounded-xl border border-[#dae2fd]/60 dark:border-[#283044] bg-[#faf8ff] dark:bg-[#1a233b] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#dae2fd]/40 dark:border-[#283044]">
                  <div>
                    <span className="font-bold text-sm text-[#131b2e] dark:text-white block">
                      {term.code}
                    </span>
                    <span className="text-[11px] text-[#707881] dark:text-slate-400">
                      {term.cashierName}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      term.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${term.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {term.status === 'active' ? 'Operando' : 'En Espera'}
                  </span>
                </div>

                <div className="py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#707881] dark:text-slate-400">
                    <span>Recaudado Turno:</span>
                    <span className="font-bold text-[#131b2e] dark:text-white font-headline">
                      ${term.currentShiftTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#707881] dark:text-slate-400">
                    <span>Operaciones:</span>
                    <span className="font-semibold text-[#131b2e] dark:text-white">
                      {term.transactionsCount} tickets
                    </span>
                  </div>
                  <div className="flex justify-between text-[#707881] dark:text-slate-400">
                    <span>IP / Latencia:</span>
                    <span className="font-mono text-[11px]">{term.ipAddress}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#dae2fd]/40 dark:border-[#283044] text-[11px] text-[#707881] text-right font-mono">
                {term.lastHeartbeat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Shift Audits and Drawer Discrepancies */}
      <section className="bg-white dark:bg-[#131b2e] rounded-2xl p-5 border border-[#dae2fd]/60 dark:border-[#283044] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <h2 className="font-headline text-base font-bold text-[#131b2e] dark:text-white">
              Auditoría de Gavetas de Dinero & Cierre Parcial
            </h2>
          </div>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            Conciliación en Cero
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f2f3ff] dark:bg-[#1a233b] text-[#707881] dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4 rounded-l-lg">Terminal</th>
                <th className="py-2.5 px-4">Cajero</th>
                <th className="py-2.5 px-4">Apertura</th>
                <th className="py-2.5 px-4">Fondo Inicial</th>
                <th className="py-2.5 px-4">Ventas Turno</th>
                <th className="py-2.5 px-4">Efectivo en Caja</th>
                <th className="py-2.5 px-4">Diferencia</th>
                <th className="py-2.5 px-4 rounded-r-lg">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dae2fd]/40 dark:divide-[#283044]">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/50">
                  <td className="py-3 px-4 font-mono font-bold text-[#007bb9]">{s.terminalCode}</td>
                  <td className="py-3 px-4 font-semibold text-[#131b2e] dark:text-white">{s.cashierName}</td>
                  <td className="py-3 px-4 font-mono">{s.openedAt}</td>
                  <td className="py-3 px-4 font-mono">${s.openingCash.toLocaleString('es-AR')}</td>
                  <td className="py-3 px-4 font-mono">${s.salesTotal.toLocaleString('es-AR')}</td>
                  <td className="py-3 px-4 font-mono font-bold">${s.cashDrawerBalance.toLocaleString('es-AR')}</td>
                  <td className={`py-3 px-4 font-mono font-bold ${s.discrepancy < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {s.discrepancy === 0 ? '$0' : `${s.discrepancy > 0 ? '+' : ''}$${s.discrepancy.toLocaleString('es-AR')}`}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === 'balanced'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {s.status === 'balanced' ? 'Cuadrada' : 'Descuadre'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supervisor PIN Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 bg-[#283044]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#dae2fd]/70 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#007bb9]" />
              <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Autorización de Supervisor
              </h3>
            </div>
            <p className="text-xs text-[#707881] dark:text-slate-400">
              Ingrese su PIN gerencial de 4 a 6 dígitos para validar esta operación en la terminal seleccionada.
            </p>
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={supervisorPin}
              onChange={(e) => setSupervisorPin(e.target.value)}
              className="h-11 px-3.5 text-center tracking-widest text-lg font-mono rounded-xl bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 text-[#131b2e] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007bb9]"
            />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setPinModalOpen(false)}
                className="h-10 rounded-xl border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPinApproval}
                className="h-10 rounded-xl bg-[#007bb9] hover:bg-[#006194] text-white text-xs font-bold shadow-md"
              >
                Autorizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

