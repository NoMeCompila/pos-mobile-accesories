import React, { useState } from 'react';
import {
  LockKeyhole,
  Banknote,
  Calculator,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Printer,
  History,
  Coins,
  ShieldCheck,
  Plus,
  RefreshCw,
  X,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { DenominationCount } from '../types/pos';
import { useCashShift } from '../services/posStore';

export const CashDrawerSettlementView: React.FC = () => {
  const { shift, addMovement, closeShift, openShift } = useCashShift();

  const [denominations, setDenominations] = useState<DenominationCount>({
    b100: 3,  // $300
    b50: 6,   // $300
    b20: 5,   // $100
    b10: 5,   // $50
    b5: 3,    // $15
    c2: 2,    // $4
    c1: 1,    // $1
    c050: 0,
    c020: 0,
    c010: 0,
  });

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'in' | 'out'>('out');
  const [movementAmount, setMovementAmount] = useState('50.00');
  const [movementConcept, setMovementConcept] = useState('Retirada de seguridad a caja fuerte');
  const [movementAuth, setMovementAuth] = useState('M. Gomez (Supervisor)');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Compute counted cash
  const countedTotal =
    denominations.b100 * 100 +
    denominations.b50 * 50 +
    denominations.b20 * 20 +
    denominations.b10 * 10 +
    denominations.b5 * 5 +
    denominations.c2 * 2 +
    denominations.c1 * 1 +
    denominations.c050 * 0.5 +
    denominations.c020 * 0.2 +
    denominations.c010 * 0.1;

  const expectedCash = shift.initialFloat + shift.cashSales;
  const discrepancy = Math.round((countedTotal - expectedCash) * 100) / 100;
  const isShiftOpen = shift.status === 'open';

  const handleDenomChange = (key: keyof DenominationCount, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setDenominations((prev) => ({ ...prev, [key]: num }));
  };

  const handleOpenDrawer = () => {
    showToast('Pulso enviado: Cajón portamonedas abierto (RJ11).');
  };

  const handleAddMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(movementAmount);
    if (isNaN(amt) || amt <= 0 || !movementConcept.trim()) return;

    addMovement({
      type: movementType,
      amount: amt,
      concept: movementConcept.trim(),
      authorizedBy: movementAuth.trim(),
    });

    setIsMovementModalOpen(false);
    showToast(`Movimiento de ${movementType === 'in' ? 'ingreso' : 'retirada'} registrado.`);
  };

  const handleCloseShift = () => {
    if (confirm(`¿Confirma el cierre de turno Z? Total contado: $${countedTotal.toFixed(2)}.`)) {
      closeShift(countedTotal);
      showToast('Cierre de caja Z completado y archivado.');
    }
  };

  const handleNewShift = () => {
    const floatVal = prompt('Ingrese el fondo de caja inicial para el nuevo turno ($):', '250.00');
    if (floatVal !== null) {
      const parsed = parseFloat(floatVal) || 250.00;
      openShift(parsed);
      showToast(`Nuevo turno abierto con fondo de $${parsed.toFixed(2)}.`);
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-8">
      {/* Toast alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#131b2e] dark:bg-white text-white dark:text-[#131b2e] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#6ffbbe] dark:text-[#006947]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f2f3ff] dark:bg-[#1e293b] p-4 rounded-xl border border-[#dae2fd]/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#cce5ff] dark:bg-slate-800 flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
            <LockKeyhole className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Apertura y Cierre de Caja
              </h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isShiftOpen
                    ? 'bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3]'
                    : 'bg-[#ffdad6] text-[#ba1a1a]'
                }`}
              >
                {isShiftOpen ? 'Turno Abierto (Online)' : 'Turno Cerrado'}
              </span>
            </div>
            <span className="text-xs text-[#707881] dark:text-slate-400">
              {shift.terminalNode} • Operador: {shift.operator} • Apertura: {shift.openedAt}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenDrawer}
            className="h-10 px-3.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#dae2fd]/60 dark:border-slate-700 shadow-xs"
          >
            <Banknote className="w-4 h-4 text-[#006947]" />
            <span>Abrir Cajón (Test)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="h-10 px-3.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#dae2fd]/60 dark:border-slate-700 shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
            <span>Imprimir Arqueo X</span>
          </button>

          {isShiftOpen ? (
            <button
              onClick={handleCloseShift}
              className="h-10 px-4 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <LockKeyhole className="w-4 h-4" />
              <span>Cerrar Turno (Z)</span>
            </button>
          ) : (
            <button
              onClick={handleNewShift}
              className="h-10 px-4 rounded-lg bg-[#006194] hover:bg-[#007bb9] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Abrir Nuevo Turno</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards: Reconciliation Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
            Fondo Inicial (Float)
          </span>
          <span className="font-headline text-2xl sm:text-3xl font-bold text-[#131b2e] dark:text-white my-1">
            ${shift.initialFloat.toFixed(2)}
          </span>
          <span className="text-xs text-[#707881] dark:text-slate-400">Depositado a las {shift.openedAt}</span>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
            Ventas en Efectivo
          </span>
          <span className="font-headline text-2xl sm:text-3xl font-bold text-[#006947] dark:text-[#4edea3] my-1">
            ${shift.cashSales.toFixed(2)}
          </span>
          <span className="text-xs text-[#707881] dark:text-slate-400">Cobros directos en metálico</span>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
            Efectivo Teórico en Cajón
          </span>
          <span className="font-headline text-2xl sm:text-3xl font-bold text-[#006194] dark:text-[#93ccff] my-1">
            ${expectedCash.toFixed(2)}
          </span>
          <span className="text-xs text-[#707881] dark:text-slate-400">Fondo + Ventas en efectivo</span>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
            Total General Turno
          </span>
          <span className="font-headline text-2xl sm:text-3xl font-bold text-[#131b2e] dark:text-white my-1">
            ${(shift.cashSales + shift.cardSales + shift.bizumSales).toFixed(2)}
          </span>
          <span className="text-xs text-[#707881] dark:text-slate-400">Efectivo + Tarjeta + Bizum</span>
        </div>
      </div>

      {/* Main Grid: Denomination Counter & Movements Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (7 cols): Cash Denominations Counting Tool */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#dae2fd]/60 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#006194] dark:text-[#93ccff]" />
              <h3 className="font-headline text-sm font-bold text-[#131b2e] dark:text-white uppercase tracking-wider">
                Desglose y Conteo de Efectivo
              </h3>
            </div>
            <span className="text-xs text-[#707881] dark:text-slate-400">
              Introduzca unidades contadas físicamente
            </span>
          </div>

          {/* Bills Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#707881] dark:text-slate-300 flex items-center gap-1">
              <Banknote className="w-4 h-4 text-[#006947]" />
              <span>Billetes</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { label: '$100', key: 'b100' as const, mult: 100 },
                { label: '$50', key: 'b50' as const, mult: 50 },
                { label: '$20', key: 'b20' as const, mult: 20 },
                { label: '$10', key: 'b10' as const, mult: 10 },
                { label: '$5', key: 'b5' as const, mult: 5 },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-2.5 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 flex flex-col border border-[#dae2fd]/60 dark:border-slate-700"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#131b2e] dark:text-white">{item.label}</span>
                    <span className="font-mono-num text-[10px] text-[#707881]">
                      ${(denominations[item.key] * item.mult).toFixed(0)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={denominations[item.key]}
                    onChange={(e) => handleDenomChange(item.key, e.target.value)}
                    className="mt-1 w-full h-8 px-2 rounded bg-white dark:bg-slate-700 font-mono-num font-bold text-center text-xs border border-[#dae2fd] dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#006194]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Coins Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#707881] dark:text-slate-300 flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>Monedas</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { label: '$2.00', key: 'c2' as const, mult: 2 },
                { label: '$1.00', key: 'c1' as const, mult: 1 },
                { label: '$0.50', key: 'c050' as const, mult: 0.5 },
                { label: '$0.20', key: 'c020' as const, mult: 0.2 },
                { label: '$0.10', key: 'c010' as const, mult: 0.1 },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-2.5 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 flex flex-col border border-[#dae2fd]/60 dark:border-slate-700"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#131b2e] dark:text-white">{item.label}</span>
                    <span className="font-mono-num text-[10px] text-[#707881]">
                      ${(denominations[item.key] * item.mult).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={denominations[item.key]}
                    onChange={(e) => handleDenomChange(item.key, e.target.value)}
                    className="mt-1 w-full h-8 px-2 rounded bg-white dark:bg-slate-700 font-mono-num font-bold text-center text-xs border border-[#dae2fd] dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#006194]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Arqueo Comparison Block */}
          <div className="mt-2 p-4 rounded-xl bg-[#eaedff] dark:bg-slate-800/90 border border-[#dae2fd]/60 dark:border-slate-700 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#707881] dark:text-slate-400">Total Efectivo Contado Físico:</span>
              <span className="font-mono-num text-lg font-bold text-[#131b2e] dark:text-white">
                ${countedTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-[#707881] dark:text-slate-400">Total Esperado por Sistema:</span>
              <span className="font-mono-num text-sm font-bold text-[#006194] dark:text-[#93ccff]">
                ${expectedCash.toFixed(2)}
              </span>
            </div>

            <div className="h-px bg-[#dae2fd] dark:bg-slate-700 my-1" />

            {/* Discrepancy indicator */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#131b2e] dark:text-white">
                Diferencia / Cuadre:
              </span>
              {discrepancy === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cuadre Exacto (Sin Discrepancias)</span>
                </span>
              ) : discrepancy > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3]">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+${discrepancy.toFixed(2)} Sobrante en Caja</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ffdad6] text-[#ba1a1a]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>-${Math.abs(discrepancy).toFixed(2)} Faltante en Caja</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Movements Log & Actions */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Movements Container */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#dae2fd]/60 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
                <h3 className="font-headline text-xs font-bold text-[#131b2e] dark:text-white uppercase tracking-wider">
                  Movimientos de Caja ({shift.movements.length})
                </h3>
              </div>
              <button
                onClick={() => setIsMovementModalOpen(true)}
                className="h-8 px-2.5 rounded-lg bg-[#006194] hover:bg-[#007bb9] text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar</span>
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto no-scrollbar">
              {shift.movements.map((mov) => (
                <div
                  key={mov.id}
                  className="p-3 rounded-lg bg-[#faf8ff] dark:bg-slate-800/60 border border-[#dae2fd]/50 dark:border-slate-700/80 flex items-start justify-between gap-2"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        mov.type === 'in'
                          ? 'bg-[#6ffbbe]/30 text-[#006947]'
                          : 'bg-[#ffdad6]/60 text-[#ba1a1a]'
                      }`}
                    >
                      {mov.type === 'in' ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-[#131b2e] dark:text-white truncate">
                        {mov.concept}
                      </span>
                      <span className="font-mono-num text-[10px] text-[#707881] dark:text-slate-400">
                        {mov.time} • Por: {mov.authorizedBy}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono-num text-xs font-bold whitespace-nowrap ${
                      mov.type === 'in' ? 'text-[#006947] dark:text-[#4edea3]' : 'text-[#ba1a1a]'
                    }`}
                  >
                    {mov.type === 'in' ? '+' : '-'}${mov.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit & Peripheral Summary Cardlet */}
          <div className="bg-[#f2f3ff] dark:bg-[#1e293b] p-4 rounded-xl border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#006947]" />
              <span className="font-bold text-[#131b2e] dark:text-white">
                Firma Digital Cierre de Caja
              </span>
            </div>
            <p className="text-[#707881] dark:text-slate-400 text-[11px] leading-tight">
              Los arqueos se encriptan con firma del cajero activo ({shift.operator}). Audit hash: {shift.auditHash}
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-[#dae2fd]/60 dark:border-slate-700 text-[11px] font-mono-num">
              <span>Redsys POS: Conectado</span>
              <span className="text-[#006947] font-bold">Cajón RJ11: Listo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Movement Registration Modal */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-[#283044]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 border border-[#dae2fd]/70 dark:border-slate-700 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#dae2fd]/60 dark:border-slate-700">
              <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Registrar Movimiento de Efectivo
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707881] hover:bg-[#eaedff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMovementSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('out');
                    setMovementConcept('Retirada de seguridad a caja fuerte');
                  }}
                  className={`h-10 rounded-lg text-xs font-bold transition-all border ${
                    movementType === 'out'
                      ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]'
                      : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#707881]'
                  }`}
                >
                  Salida de Caja (Retirada)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMovementType('in');
                    setMovementConcept('Aporte adicional de cambio');
                  }}
                  className={`h-10 rounded-lg text-xs font-bold transition-all border ${
                    movementType === 'in'
                      ? 'bg-[#6ffbbe]/40 text-[#006947] border-[#006947]'
                      : 'bg-[#f2f3ff] dark:bg-slate-800 text-[#707881]'
                  }`}
                >
                  Entrada de Caja (Ingreso)
                </button>
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                <span>Importe ($):</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 font-mono-num font-bold text-sm"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                <span>Motivo / Concepto:</span>
                <input
                  type="text"
                  required
                  value={movementConcept}
                  onChange={(e) => setMovementConcept(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 text-xs"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#131b2e] dark:text-slate-200">
                <span>Autorizado por:</span>
                <input
                  type="text"
                  required
                  value={movementAuth}
                  onChange={(e) => setMovementAuth(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 border border-[#dae2fd] dark:border-slate-700 text-xs"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dae2fd]/60 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 h-10 rounded-lg bg-[#eaedff] dark:bg-slate-800 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 rounded-lg bg-[#006194] text-white text-xs font-semibold shadow-sm"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
