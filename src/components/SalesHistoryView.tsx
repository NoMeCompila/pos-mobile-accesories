import React, { useState } from 'react';
import {
  Receipt,
  Printer,
  Download,
  LockKeyhole,
  Calculator,
  Zap,
  Donut,
  TrendingUp,
  ArrowUpRight,
  Search,
  RotateCw,
  ArrowRight,
  Undo2,
  Send,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Ticket, PaymentMethod } from '../types/pos';
import { useSalesHistory } from '../services/posStore';

interface SalesHistoryViewProps {
  onOpenReceipt: (ticket: Ticket) => void;
  onNavigateToDrawer: () => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  onOpenReceipt,
  onNavigateToDrawer,
}) => {
  const { tickets, refundTicket } = useSalesHistory();

  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    tickets[0]?.id || 'trx-8942'
  );
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    // Payment method
    if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) return false;
    // Status
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    // Query search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = t.ticketNumber.toLowerCase().includes(q);
      const matchCustomer = t.customer.name.toLowerCase().includes(q) || t.customer.nif.toLowerCase().includes(q);
      const matchItems = t.itemSummary.toLowerCase().includes(q) || t.items.some(i => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
      if (!matchNumber && !matchCustomer && !matchItems) return false;
    }
    return true;
  });

  const pageSize = 7;
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRefund = (ticket: Ticket, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (ticket.status === 'refunded') {
      showToast('Este ticket ya fue reembolsado previamente.');
      return;
    }
    if (confirm(`¿Confirma tramitar la devolución del ticket ${ticket.ticketNumber}?`)) {
      refundTicket(ticket.id);
      showToast(`Devolución procesada para ${ticket.ticketNumber}. Se ha emitido vale de abono.`);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Ticket,Hora,Fecha,Cliente,Total,Metodo,Estado\n' +
      tickets
        .map(
          (t) =>
            `"${t.ticketNumber}","${t.time}","${t.date}","${t.customer.name}",${t.total},"${t.paymentMethod}","${t.status}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arqueo_ventas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Informe CSV descargado correctamente.');
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-8">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#131b2e] dark:bg-white text-white dark:text-[#131b2e] px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#6ffbbe] dark:text-[#006947]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Utility Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f2f3ff] dark:bg-[#1e293b] p-3.5 rounded-xl border border-[#dae2fd]/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#cce5ff] dark:bg-slate-800 flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white">
                Historial de Mis Ventas
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#006194] text-white font-bold">
                Operador #1042
              </span>
            </div>
            <span className="text-xs text-[#707881] dark:text-slate-400">
              Registro auditado de transacciones personales • Caja 02 Flagship
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="h-10 px-3.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#dae2fd]/60 dark:border-slate-700 shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
            <span>Imprimir Arqueo</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-10 px-3.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-[#eaedff] dark:hover:bg-slate-700 text-[#131b2e] dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#dae2fd]/60 dark:border-slate-700 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0051d5] dark:text-[#93ccff]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onNavigateToDrawer}
            className="h-10 px-3.5 rounded-lg bg-[#ffdad6] dark:bg-red-950/60 hover:bg-[#ffdad6]/80 text-[#ba1a1a] dark:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <LockKeyhole className="w-4 h-4" />
            <span>Cierre Rápido de Turno</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Cards Grid (5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Recaudado */}
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Total Personal
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3] flex items-center gap-0.5 font-bold">
              <TrendingUp className="w-3 h-3" />
              +14.2%
            </span>
          </div>
          <div className="my-2">
            <span className="font-headline text-3xl font-bold text-[#131b2e] dark:text-white tracking-tight">
              $1,420.80
            </span>
            <p className="text-xs text-[#707881] dark:text-slate-400 mt-0.5">34 tickets completados</p>
          </div>
          <div className="w-full bg-[#eaedff] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#006194] dark:bg-[#007bb9] h-full rounded-full" style={{ width: '78%' }} />
          </div>
        </div>

        {/* Card 2: Ticket Medio */}
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Ticket Medio
            </span>
            <Calculator className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
          </div>
          <div className="my-2">
            <span className="font-headline text-3xl font-bold text-[#131b2e] dark:text-white tracking-tight">
              $41.78
            </span>
            <p className="text-xs text-[#707881] dark:text-slate-400 mt-0.5">Media por venta en turno</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#006947] dark:text-[#4edea3] font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+$3.40 vs ayer</span>
          </div>
        </div>

        {/* Card 3: Top Artículo */}
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Top Artículo
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#006947] text-white font-bold uppercase">
              Top 1
            </span>
          </div>
          <div className="my-1.5 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 flex items-center justify-center shrink-0 text-[#006194] dark:text-[#93ccff]">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#131b2e] dark:text-white truncate">
                GaN 45W Dual USB-C
              </span>
              <span className="font-mono-num text-[11px] text-[#707881] dark:text-slate-400">
                18 uds • $539.82
              </span>
            </div>
          </div>
          <span className="text-xs text-[#707881] dark:text-slate-400 truncate">
            Representa el 38% del total
          </span>
        </div>

        {/* Card 4: Mix de Cobros */}
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Mix de Cobros
            </span>
            <Donut className="w-4 h-4 text-[#0051d5] dark:text-[#93ccff]" />
          </div>
          <div className="flex flex-col gap-1 my-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#707881] dark:text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0051d5]" />
                Tarjeta (55%)
              </span>
              <span className="font-mono-num font-bold text-[#131b2e] dark:text-white">
                $780.80
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#707881] dark:text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#006947]" />
                Efectivo (36%)
              </span>
              <span className="font-mono-num font-bold text-[#131b2e] dark:text-white">
                $520.00
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#707881] dark:text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#007bb9]" />
                Bizum (9%)
              </span>
              <span className="font-mono-num font-bold text-[#131b2e] dark:text-white">
                $120.00
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full flex overflow-hidden bg-[#eaedff] dark:bg-slate-800">
            <div className="bg-[#0051d5] h-full" style={{ width: '55%' }} />
            <div className="bg-[#006947] h-full" style={{ width: '36%' }} />
            <div className="bg-[#007bb9] h-full" style={{ width: '9%' }} />
          </div>
        </div>

        {/* Card 5: Meta y Comisión */}
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
              Comisión / Meta
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#dbe1ff] dark:bg-slate-700 text-[#003ea8] dark:text-[#93ccff] font-bold">
              85%
            </span>
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <div>
              <span className="font-headline text-2xl font-bold text-[#006194] dark:text-[#93ccff]">
                $71.04
              </span>
              <p className="text-xs text-[#707881] dark:text-slate-400">Comisión acum. (5%)</p>
            </div>
            <div className="relative w-9 h-9">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#eaedff] dark:text-slate-800"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="text-[#006194] dark:text-[#007bb9]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="85, 100"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
            </div>
          </div>
          <span className="text-xs text-[#006947] dark:text-[#4edea3] font-medium truncate">
            Faltan $279.20 para meta
          </span>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 flex flex-col gap-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Time Range Pills */}
          <div className="flex items-center bg-[#f2f3ff] dark:bg-slate-800 p-1 rounded-lg gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                timeRange === 'today'
                  ? 'bg-[#007bb9] text-white shadow-xs'
                  : 'text-[#707881] hover:text-[#131b2e] dark:hover:text-white'
              }`}
            >
              Hoy (Día)
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                timeRange === 'week'
                  ? 'bg-[#007bb9] text-white shadow-xs'
                  : 'text-[#707881] hover:text-[#131b2e] dark:hover:text-white'
              }`}
            >
              Esta Semana
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                timeRange === 'month'
                  ? 'bg-[#007bb9] text-white shadow-xs'
                  : 'text-[#707881] hover:text-[#131b2e] dark:hover:text-white'
              }`}
            >
              Este Mes (Octubre)
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                timeRange === 'year'
                  ? 'bg-[#007bb9] text-white shadow-xs'
                  : 'text-[#707881] hover:text-[#131b2e] dark:hover:text-white'
              }`}
            >
              Este Año (2025)
            </button>
          </div>

          {/* Quick Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Metodo Filter */}
            <div className="flex items-center bg-[#f2f3ff] dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-[#dae2fd]/60 dark:border-slate-700">
              <Banknote className="w-4 h-4 text-[#707881] mr-1.5" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-transparent text-xs text-[#131b2e] dark:text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-800">Todos los Cobros</option>
                <option value="cash" className="dark:bg-slate-800">Efectivo ($520.00)</option>
                <option value="card" className="dark:bg-slate-800">Tarjeta / TPV ($780.80)</option>
                <option value="bizum" className="dark:bg-slate-800">Bizum ($120.00)</option>
              </select>
            </div>

            {/* Estado Filter */}
            <div className="flex items-center bg-[#f2f3ff] dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-[#dae2fd]/60 dark:border-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#707881] mr-1.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-[#131b2e] dark:text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-slate-800">Todos los Estados</option>
                <option value="paid" className="dark:bg-slate-800">Cobrado</option>
                <option value="refunded" className="dark:bg-slate-800">Devolución / Reembolso</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Box & Metrics Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#707881]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por #TRX, cliente, NIF o accesorio..."
              className="w-full h-11 pl-10 pr-10 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 text-xs text-[#131b2e] dark:text-white placeholder:text-[#707881] focus:outline-none focus:ring-2 focus:ring-[#006194] border border-[#dae2fd]/60 dark:border-slate-700 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707881] hover:text-[#131b2e]"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#707881] dark:text-slate-400 w-full sm:w-auto justify-end">
            <span>
              Mostrando <strong>{paginatedTickets.length}</strong> de{' '}
              <strong>{filteredTickets.length}</strong> transacciones
            </span>
            <div className="h-4 w-px bg-[#dae2fd] dark:bg-slate-700" />
            <button
              onClick={() => showToast('Lista sincronizada.')}
              className="w-8 h-8 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 hover:bg-[#eaedff] dark:hover:bg-slate-700 flex items-center justify-center text-[#131b2e] dark:text-white transition-colors"
              title="Refrescar"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Table & Active Receipt Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Transactions Table Column (8 cols on XL) */}
        <div className="xl:col-span-8 bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="p-3.5 flex items-center justify-between bg-[#f2f3ff] dark:bg-slate-800/80 border-b border-[#dae2fd]/60 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
              <span className="font-headline text-xs font-bold uppercase tracking-wider text-[#131b2e] dark:text-white">
                Mis Tickets Emitidos
              </span>
            </div>
            <span className="text-[11px] font-mono-num text-[#707881] dark:text-slate-400">
              Turno iniciado: 08:30 AM
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#eaedff] dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400 border-b border-[#dae2fd]/60 dark:border-slate-700">
                  <th className="py-3 px-3.5">Nº Ticket</th>
                  <th className="py-3 px-2">Hora</th>
                  <th className="py-3 px-3.5">Resumen / Ítems</th>
                  <th className="py-3 px-2">Cliente</th>
                  <th className="py-3 px-2">Método</th>
                  <th className="py-3 px-2 text-right">Total</th>
                  <th className="py-3 px-2 text-center">Estado</th>
                  <th className="py-3 px-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dae2fd]/50 dark:divide-slate-800 text-xs text-[#131b2e] dark:text-slate-200">
                {paginatedTickets.map((ticket) => {
                  const isSelected = ticket.id === selectedTicket.id;
                  const isRefund = ticket.status === 'refunded';

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#cce5ff]/40 dark:bg-slate-700/60 font-medium'
                          : isRefund
                          ? 'bg-[#ffdad6]/20 dark:bg-red-950/20 hover:bg-[#ffdad6]/30'
                          : 'hover:bg-[#f2f3ff] dark:hover:bg-slate-800'
                      }`}
                    >
                      <td className="py-3 px-3.5 font-mono-num font-bold text-[#006194] dark:text-[#93ccff] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                          <span>{ticket.ticketNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono-num text-[#707881] dark:text-slate-400 whitespace-nowrap">
                        {ticket.time}
                      </td>
                      <td className="py-3 px-3.5 max-w-xs">
                        <div className="font-semibold truncate text-[#131b2e] dark:text-white">
                          {ticket.itemSummary}
                        </div>
                        <div className="text-[10px] text-[#707881] dark:text-slate-400">
                          {ticket.items.length} artículos
                        </div>
                      </td>
                      <td className="py-3 px-2 truncate max-w-[120px] text-[#707881] dark:text-slate-400">
                        {ticket.customer.name}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbe1ff] dark:bg-slate-700 text-[#003ea8] dark:text-[#93ccff]">
                          {ticket.paymentMethod === 'card' && <CreditCard className="w-3 h-3" />}
                          {ticket.paymentMethod === 'cash' && <Banknote className="w-3 h-3" />}
                          {ticket.paymentMethod === 'bizum' && <Smartphone className="w-3 h-3" />}
                          <span className="capitalize">{ticket.paymentMethod}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono-num font-bold whitespace-nowrap">
                        <span className={isRefund ? 'text-[#ba1a1a] dark:text-red-400' : ''}>
                          ${ticket.total.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {isRefund ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#93000a]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                            Devolución
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#006947]" />
                            Cobrado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenReceipt(ticket);
                            }}
                            className="w-7 h-7 rounded bg-[#eaedff] dark:bg-slate-800 flex items-center justify-center text-[#006194] hover:bg-[#006194] hover:text-white transition-colors"
                            title="Ver / Reimprimir Ticket"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isRefund && (
                            <button
                              onClick={(e) => handleRefund(ticket, e)}
                              className="w-7 h-7 rounded bg-[#eaedff] dark:bg-slate-800 flex items-center justify-center text-[#707881] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                              title="Tramitar Devolución"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 bg-[#f2f3ff] dark:bg-slate-800 border-t border-[#dae2fd]/60 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#707881]">
            <span>
              Página {currentPage} de {totalPages} • {filteredTickets.length} tickets registrados
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 disabled:opacity-40 font-semibold"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded text-xs font-bold ${
                    currentPage === p
                      ? 'bg-[#006194] text-white'
                      : 'bg-white dark:bg-slate-700 text-[#131b2e] dark:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-700 disabled:opacity-40 font-semibold"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Active Ticket Detail Inspector Column (4 cols on XL) */}
        <div className="xl:col-span-4 flex flex-col gap-3.5 sticky top-20">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-xs border border-[#dae2fd]/60 dark:border-slate-800 p-4 flex flex-col gap-3.5 relative">
            {/* Header */}
            <div className="flex items-start justify-between pb-2 border-b border-[#dae2fd]/60 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3] uppercase">
                    {selectedTicket.status === 'refunded' ? 'Devolución' : 'Cobrado'}
                  </span>
                  <span className="text-xs font-mono-num text-[#707881]">
                    {selectedTicket.terminal}
                  </span>
                </div>
                <h3 className="font-headline text-lg font-bold text-[#131b2e] dark:text-white mt-1">
                  Ticket {selectedTicket.ticketNumber}
                </h3>
                <span className="text-[11px] text-[#707881] dark:text-slate-400">
                  {selectedTicket.date} • {selectedTicket.time}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#cce5ff] dark:bg-slate-800 flex items-center justify-center text-[#006194] dark:text-[#93ccff]">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            {/* Customer Cardlet */}
            <div className="p-3 bg-[#f2f3ff] dark:bg-slate-800/80 rounded-lg flex items-center justify-between border border-[#dae2fd]/50 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#dae2fd] dark:bg-slate-700 flex items-center justify-center text-[#006194] dark:text-[#93ccff] font-bold text-xs">
                  {selectedTicket.customer.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#131b2e] dark:text-white">
                    {selectedTicket.customer.name}
                  </span>
                  <span className="font-mono-num text-[10px] text-[#707881] dark:text-slate-400">
                    NIF: {selectedTicket.customer.nif} • Club Volt +{selectedTicket.customer.points} pts
                  </span>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-[#006194] dark:text-[#93ccff]" />
            </div>

            {/* Line Item Breakdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#707881] dark:text-slate-400">
                Desglose de Artículos
              </span>

              {selectedTicket.items.map((line, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#faf8ff] dark:bg-slate-800/50 flex items-center justify-between border border-[#dae2fd]/40 dark:border-slate-700/60"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-semibold text-[#131b2e] dark:text-white truncate">
                      {line.productName}
                    </span>
                    <span className="font-mono-num text-[10px] text-[#707881] dark:text-slate-400">
                      SKU: {line.sku} • {line.quantity}x ${line.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-mono-num text-xs font-bold text-[#131b2e] dark:text-white">
                    ${line.totalPrice.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 rounded-xl bg-[#eaedff] dark:bg-slate-800 flex flex-col gap-1.5 border border-[#dae2fd]/60 dark:border-slate-700 text-xs">
              <div className="flex justify-between text-[#707881] dark:text-slate-400">
                <span>Base Imponible (Subtotal)</span>
                <span className="font-mono-num font-medium text-[#131b2e] dark:text-white">
                  ${selectedTicket.taxableBase.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#707881] dark:text-slate-400">
                <span>IVA Retail (21.0%)</span>
                <span className="font-mono-num font-medium text-[#131b2e] dark:text-white">
                  ${selectedTicket.vat.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#006947] dark:text-[#4edea3] font-medium">
                <span>Descuento Cupón Fidelidad</span>
                <span className="font-mono-num">-${selectedTicket.discount.toFixed(2)}</span>
              </div>

              <div className="h-px bg-[#dae2fd] dark:bg-slate-700 my-1" />

              <div className="flex justify-between items-baseline font-bold">
                <span className="text-xs text-[#131b2e] dark:text-white">Total Cobrado</span>
                <span className="font-headline text-2xl text-[#006194] dark:text-[#93ccff]">
                  ${selectedTicket.total.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 text-[11px] text-[#707881] dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#0051d5]" />
                  <span>
                    {selectedTicket.paymentMethod.toUpperCase()}{' '}
                    {selectedTicket.cardLast4 ? `**${selectedTicket.cardLast4}` : ''}
                  </span>
                </span>
                <span className="font-mono-num font-bold text-[#131b2e] dark:text-white">
                  {selectedTicket.authCode || 'AUTH #9941'}
                </span>
              </div>
            </div>

            {/* Quick Dispatch Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenReceipt(selectedTicket)}
                className="h-11 rounded-lg bg-[#006194] hover:bg-[#007bb9] active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Reimprimir Copia</span>
              </button>

              <button
                onClick={() => showToast('Enviado por WhatsApp al cliente.')}
                className="h-11 rounded-lg bg-[#f2f3ff] dark:bg-slate-800 hover:bg-[#eaedff] text-[#131b2e] dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#dae2fd]/60 dark:border-slate-700"
              >
                <Send className="w-4 h-4 text-[#006947]" />
                <span>WhatsApp / Email</span>
              </button>
            </div>

            {selectedTicket.status !== 'refunded' && (
              <button
                onClick={() => handleRefund(selectedTicket)}
                className="w-full h-10 rounded-lg bg-[#ffdad6]/60 dark:bg-red-950/40 hover:bg-[#ffdad6] text-[#ba1a1a] dark:text-red-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
                <span>Iniciar Devolución / Canje Parcial</span>
              </button>
            )}
          </div>

          {/* Quick Shift Audit Card */}
          <div className="bg-[#f2f3ff] dark:bg-[#1e293b] rounded-xl p-3 flex items-center justify-between border border-[#dae2fd]/60 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#707881] dark:text-slate-400" />
              <div className="flex flex-col">
                <span className="font-bold text-[#131b2e] dark:text-white">
                  Firma Digital de Sesión Activa
                </span>
                <span className="font-mono-num text-[10px] text-[#707881] dark:text-slate-400">
                  Audit Hash: e4b2..9fa0
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#6ffbbe]/40 text-[#006947] dark:text-[#4edea3]">
              Sin Discrepancias
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
