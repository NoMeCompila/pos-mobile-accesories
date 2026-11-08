import React, { useState } from 'react';
import {
  Truck,
  Plus,
  FileText,
  AlertTriangle,
  Download,
  Search,
  Filter,
  Eye,
  CreditCard,
  Edit,
  DollarSign,
  Package,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  Copy,
  ExternalLink,
  MessageSquare,
  Building2,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  Send,
  Boxes,
} from 'lucide-react';
import {
  useSuppliersData,
  useCreatePurchaseOrderMutation,
} from '../services/managerDashboardStore';

export const SuppliersSuppliesManagementView: React.FC = () => {
  const { data, isLoading } = useSuppliersData();
  const createOrderMutation = useCreatePurchaseOrderMutation();

  const [activeTab, setActiveTab] = useState<'directorio' | 'compras' | 'cuentas' | 'reposicion'>('directorio');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentVendor, setSelectedPaymentVendor] = useState<{ name: string; amount: string } | null>(null);
  const [paymentSource, setPaymentSource] = useState<'caja' | 'tesoreria'>('caja');

  const [newVendorModalOpen, setNewVendorModalOpen] = useState(false);
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [orderSupplierId, setOrderSupplierId] = useState('sup-01');
  const [orderAmount, setOrderAmount] = useState('450000');
  const [orderItemsCount, setOrderItemsCount] = useState('60');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedWa, setCopiedWa] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenPayment = (name: string, amount: string) => {
    setSelectedPaymentVendor({ name, amount });
    setPaymentSource('caja');
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setPaymentModalOpen(false);
    showToast(
      paymentSource === 'caja'
        ? `Pago de ${selectedPaymentVendor?.amount} registrado como Egreso de Caja POS.`
        : `Pago de ${selectedPaymentVendor?.amount} registrado por Tesorería Central.`
    );
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = data?.suppliers.find((s) => s.id === orderSupplierId) || data?.suppliers[0];
    if (sup) {
      await createOrderMutation.mutateAsync({
        supplierId: sup.id,
        supplierName: sup.name,
        issuedDate: new Date().toISOString().split('T')[0],
        totalAmount: parseFloat(orderAmount) || 100000,
        itemsCount: parseInt(orderItemsCount, 10) || 10,
        expectedDelivery: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      });
      setNewOrderModalOpen(false);
      showToast(`Orden de compra generada para ${sup.name}.`);
    }
  };

  const handleCopyWa = () => {
    const text = `Hola Silvia (Papelera Central) 👋 Te paso el pedido urgente de reposición para el local VoltAcc Downtown:\n\n📦 *50x* Rollos Papel Térmico 80mm x 50m (Cod: PAP-ROL-80MM)\n📦 *10x* Etiquetas Autoadhesivas 50x30mm (Cod: PAP-ETIQ-5030)\n\n📍 Entrega: Local Central Metropolitan (Caja POS 04)\n🧾 Factura A a CUIT 30-71449812-4\n¡Avisame cuando despachan! Gracias.`;
    navigator.clipboard?.writeText(text);
    setCopiedWa(true);
    showToast('Mensaje de WhatsApp copiado al portapapeles.');
    setTimeout(() => setCopiedWa(false), 3000);
  };

  // Filtered suppliers
  const suppliers = data?.suppliers.filter((sup) => {
    const matchesSearch =
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.cuit.includes(searchTerm) ||
      sup.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/10 text-primary dark:text-sky-300 font-mono">
              PROCURING &amp; SUPPLY CHAIN
            </span>
            <span className="text-xs text-on-surface-variant font-mono">Módulo #PRV-09</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">ARCA RG 1415 Sincronizada</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Gestión de Proveedores e Insumos
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Aprovisionamiento de mercadería de reventa, insumos de servicio técnico y consumibles de terminal POS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setNewVendorModalOpen(true)}
            className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proveedor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('compras')}
            className="h-10 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Ingresar Factura / Remito</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reposicion')}
            className="h-10 px-3.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors border border-outline-variant/20"
          >
            <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="relative">
              Reposición Urgente
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => showToast('Exportando catálogo de proveedores a CSV...')}
            className="h-10 w-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors shadow-xs border border-outline-variant/20"
            title="Exportar Catálogo CSV / XLS"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Deuda Total Cta. Cte.</span>
              <span className="font-mono text-2xl lg:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1 tracking-tight">
                $1,420,500 <span className="text-xs font-normal text-on-surface-variant">ARS</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs bg-surface-container-low -mx-4 -mb-4 px-4 py-2.5 border-t border-outline-variant/20">
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>4 vencimientos &lt; 7 días</span>
            </div>
            <button
              onClick={() => setActiveTab('cuentas')}
              className="text-primary hover:underline font-semibold font-mono text-[11px]"
            >
              Ver Pagos →
            </button>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Reposición Urgente</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-2xl lg:text-3xl font-bold text-on-surface">8</span>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/10">
                  Crítico &lt; Min
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs bg-surface-container-low -mx-4 -mb-4 px-4 py-2.5 border-t border-outline-variant/20">
            <span className="text-on-surface-variant">5 accesorios / 3 insumos POS</span>
            <button
              onClick={() => setActiveTab('reposicion')}
              className="text-primary hover:underline font-semibold font-mono text-[11px]"
            >
              Generar Pedido →
            </button>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Compras Registradas (Mes)</span>
              <span className="font-mono text-2xl lg:text-3xl font-bold text-primary mt-1 tracking-tight">
                $3,890,000 <span className="text-xs font-normal text-on-surface-variant">ARS</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs bg-surface-container-low -mx-4 -mb-4 px-4 py-2.5 border-t border-outline-variant/20">
            <span className="text-on-surface-variant font-mono">24 facturas / remitos cargados</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              +12.4%
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Proveedores Homologados</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-2xl lg:text-3xl font-bold text-on-surface">18</span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                  2 Inactivos
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs bg-surface-container-low -mx-4 -mb-4 px-4 py-2.5 border-t border-outline-variant/20">
            <span className="text-on-surface-variant">6 preventistas con visita semanal</span>
            <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400 font-semibold">100% CUIT Valid</span>
          </div>
        </div>
      </section>

      {/* 2. Navigation Tabs */}
      <div className="bg-surface-container-low p-1.5 rounded-xl flex flex-wrap gap-1.5 shadow-xs border border-outline-variant/20">
        <button
          type="button"
          onClick={() => setActiveTab('directorio')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'directorio'
              ? 'bg-surface-container-lowest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Ficha Maestra &amp; Directorio ABM</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary">
            {suppliers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('compras')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'compras'
              ? 'bg-surface-container-lowest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. Ingreso de Compras &amp; Remitos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cuentas')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'cuentas'
              ? 'bg-surface-container-lowest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>3. Cuentas Corrientes &amp; Caja POS</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
            4 Pend.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reposicion')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'reposicion'
              ? 'bg-surface-container-lowest text-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>4. Alerta Reposición &amp; Pedidos</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            8 Urg.
          </span>
        </button>
      </div>

      {/* TAB 1: Directorio ABM */}
      {activeTab === 'directorio' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Search Toolbar */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Razón Social, CUIT, Preventista..."
                  className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                >
                  <option value="all">Todos los Rubros</option>
                  <option value="Fundas, Vidrios y Cables">Fundas, Vidrios y Cables</option>
                  <option value="Repuestos & Displays Taller">Repuestos &amp; Displays Taller</option>
                  <option value="Bolsas, Blisters y Rollos Térmicos">Papelería &amp; Rollos POS</option>
                  <option value="Auriculares y Parlantes Bluetooth">Audio &amp; Gadgets</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Solo Activos</option>
                  <option value="with_debt">Con Saldo Pendiente</option>
                </select>
              </div>
            </div>
            <div className="text-xs text-on-surface-variant font-mono">
              Mostrando {suppliers.length} proveedores registrados
            </div>
          </div>

          {/* Suppliers Master Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-mono text-[11px] uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="py-3 px-4 font-semibold">Proveedor &amp; Razón Social</th>
                    <th className="py-3 px-4 font-semibold">Identificación / Fiscal</th>
                    <th className="py-3 px-4 font-semibold">Preventista &amp; Contacto</th>
                    <th className="py-3 px-4 font-semibold">Condición &amp; Plazo</th>
                    <th className="py-3 px-4 font-semibold">Rubro Principal</th>
                    <th className="py-3 px-4 font-semibold text-right">Saldo Cta. Cte.</th>
                    <th className="py-3 px-4 font-semibold text-center">Estado</th>
                    <th className="py-3 px-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {suppliers.map((sup) => {
                    const isExpanded = expandedVendorId === sup.id;
                    const sampleDebt = sup.id === 'sup-01' ? 680000 : sup.id === 'sup-02' ? 595000 : sup.id === 'sup-03' ? 145500 : 0;
                    return (
                      <React.Fragment key={sup.id}>
                        <tr className="hover:bg-surface-container-low/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary dark:text-sky-300 flex items-center justify-center font-bold text-sm font-headline">
                                {sup.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface text-sm font-headline">
                                  {sup.name}
                                </span>
                                <span className="text-[11px] text-on-surface-variant font-mono">
                                  Entrega: {sup.deliveryLeadDays} días hábiles
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs font-semibold text-on-surface">{sup.cuit}</span>
                              <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary dark:text-sky-300">
                                <CheckCircle2 className="w-3 h-3" /> Resp. Inscripto (Factura A)
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-on-surface">{sup.contactPerson}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => showToast(`Abriendo conversación de WhatsApp con ${sup.contactPerson}...`)}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 px-1.5 py-0.5 rounded"
                                >
                                  <MessageSquare className="w-3 h-3" /> {sup.phone}
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-on-surface">{sup.paymentTerms}</span>
                              <span className="text-[10px] text-primary font-medium font-mono">Órdenes activas: {sup.activeOrdersCount}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-surface-container text-on-surface">
                              {sup.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {sampleDebt > 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                                  ${sampleDebt.toLocaleString('es-AR')} ARS
                                </span>
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Vence en pocos días</span>
                              </div>
                            ) : (
                              <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">$0 ARS (Al día)</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Activo
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setExpandedVendorId(isExpanded ? null : sup.id)}
                                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                                title="Ver Ficha y Productos Vinculados"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {sampleDebt > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayment(sup.name, `$${sampleDebt.toLocaleString('es-AR')} ARS`)}
                                  className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary transition-colors"
                                  title="Pagar Saldo Cta Cte"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => showToast(`Editando datos de ${sup.name}...`)}
                                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-rose-500 transition-colors"
                                title="Editar Proveedor"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable row */}
                        {isExpanded && (
                          <tr className="bg-surface-container-low/50">
                            <td className="p-4" colSpan={8}>
                              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 space-y-3">
                                <div className="flex items-center justify-between border-b pb-2 border-outline-variant/20">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-primary" />
                                    <h4 className="font-headline font-bold text-sm text-on-surface">
                                      Catálogo de Productos Vinculados &amp; Condiciones ({sup.name})
                                    </h4>
                                  </div>
                                  <span className="text-xs font-mono text-on-surface-variant">CUIT: {sup.cuit} • {sup.email}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="p-3 rounded-lg bg-surface-container-low flex flex-col justify-between border border-outline-variant/20">
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono text-[11px] font-bold text-primary">SKU-REP-01</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">Reventa</span>
                                      </div>
                                      <h5 className="font-bold text-xs text-on-surface mt-1">Línea Principal de Artículos</h5>
                                      <p className="text-[11px] text-on-surface-variant mt-0.5">Categoría: {sup.category}</p>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center justify-between font-mono text-xs">
                                      <span className="text-on-surface-variant">Lead Time: <strong>{sup.deliveryLeadDays} días</strong></span>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{sup.paymentTerms}</span>
                                    </div>
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
          </div>
        </div>
      )}

      {/* TAB 2: Ingreso de Compras & Remitos */}
      {activeTab === 'compras' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-outline-variant/30">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg text-on-surface">Recepción de Mercadería &amp; Carga de Comprobante</h3>
                  <p className="text-xs text-on-surface-variant">
                    Impacto directo e inmediato en stock físico del depósito central + actualización de costo de reposición.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Stock Sync: En Línea
              </span>
            </div>

            {/* Invoice Header Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1 font-mono">Proveedor</label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20">
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.cuit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1 font-mono">Tipo Comprobante</label>
                <select className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20">
                  <option>Factura A (Con Discriminación IVA)</option>
                  <option>Factura C (Monotributo)</option>
                  <option>Remito Oficial R / Remito X</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1 font-mono">Nº Comprobante</label>
                <input
                  type="text"
                  defaultValue="0004-00018492"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1 font-mono">Fecha Emisión</label>
                <input
                  type="date"
                  defaultValue="2026-11-08"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20"
                />
              </div>
            </div>

            {/* Rows Table */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden mb-6 border border-outline-variant/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-mono text-[11px] uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="py-2.5 px-3">SKU / Producto</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 text-center">Cant. Ingreso</th>
                    <th className="py-2.5 px-3 text-right">Costo Unit. Neto</th>
                    <th className="py-2.5 px-3 text-center">Alícuota IVA</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-right">Margen Sug. (PVP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  <tr className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-on-surface">Cargador Rápido VoltAcc 35W Dual GaN</div>
                      <div className="font-mono text-[10px] text-on-surface-variant">DIST-CHG-35W</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">Reventa</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        defaultValue={30}
                        className="w-16 h-8 text-center rounded bg-surface-container text-xs font-mono font-bold focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-on-surface">$12,450.00</td>
                    <td className="py-3 px-3 text-center font-mono">21.0%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-on-surface">$373,500.00</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">$24,900.00 (100%)</td>
                  </tr>

                  <tr className="hover:bg-surface-container-lowest transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-on-surface">Funda Silicona Antichoque MagSafe Clear</div>
                      <div className="font-mono text-[10px] text-on-surface-variant">DIST-MGS-CLR</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">Reventa</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        defaultValue={50}
                        className="w-16 h-8 text-center rounded bg-surface-container text-xs font-mono font-bold focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-on-surface">$5,100.00</td>
                    <td className="py-3 px-3 text-center font-mono">21.0%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-on-surface">$255,000.00</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">$11,900.00 (133%)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Actions & Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 border-t border-outline-variant/20">
              <div className="space-y-2 text-xs text-on-surface">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                  <span>Ingresar inmediatamente +80 unidades físicas al stock del Depósito Central</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                  <span>Actualizar precio de reposición y ajustar PVP con margen configurado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary" />
                  <span>Cargar comprobante a Cuenta Corriente del Proveedor</span>
                </label>
              </div>

              <div className="w-full md:w-80 bg-surface-container-low p-4 rounded-xl space-y-2 border border-outline-variant/20">
                <div className="flex justify-between text-xs text-on-surface-variant font-mono">
                  <span>Subtotal Neto Gravado:</span>
                  <span className="font-bold text-on-surface">$628,500.00 ARS</span>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant font-mono">
                  <span>IVA Crédito Fiscal (21%):</span>
                  <span className="font-bold text-on-surface">$131,985.00 ARS</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-on-surface pt-2 border-t border-outline-variant/20 font-headline">
                  <span>Total Factura:</span>
                  <span className="text-primary font-mono text-base">$760,485.00 ARS</span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast('Recepción de mercadería registrada con éxito. Stock actualizado.')}
                  className="w-full h-10 mt-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Recepción &amp; Sumar Stock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Cuentas Corrientes & Pagos */}
      {activeTab === 'cuentas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">Vencimientos Próximos en Cuenta Corriente</h3>
                  <p className="text-xs text-on-surface-variant">Facturas impagas con plazo acordado con proveedores mayoristas.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400">
                Total Exigible: $1,420,500 ARS
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-outline-variant/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-sm text-on-surface">Distribuidora Norte S.R.L.</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      Vence en 3 días
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-mono">Factura A 0004-00018104 • Emisión 02/11/2026</p>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>Alias: DIST.NORTE.PAGOS</span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                  <span className="font-mono text-base font-bold text-rose-600 dark:text-rose-400">$680,000 ARS</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPayment('Distribuidora Norte S.R.L.', '$680,000 ARS')}
                    className="h-9 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Emitir Pago</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-outline-variant/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-sm text-on-surface">MicroTech Mayorista</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      Vence en 2 días
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-mono">Factura A 0002-00009411 • Emisión 05/11/2026</p>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span>Alias: MICROTECH.VENTAS</span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                  <span className="font-mono text-base font-bold text-rose-600 dark:text-rose-400">$595,000 ARS</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPayment('MicroTech Mayorista', '$595,000 ARS')}
                    className="h-9 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Emitir Pago</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Drawer Integration */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-outline-variant/30 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/20">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-headline font-bold text-sm text-on-surface">Caja 04 • Turno Activo</h4>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Cajero: Esteban Harrison</span>
              </div>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl space-y-2 border border-outline-variant/20">
              <span className="text-xs font-semibold text-on-surface-variant uppercase font-mono">Efectivo Físico en Cajón</span>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold text-on-surface">$320,450</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Disponible</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Límite de egreso en efectivo de mostrador: <strong className="text-on-surface">$150,000 ARS</strong> por operación sin pin de tesorero.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPayment('Pago a Proveedor Directo', '$50,000 ARS')}
              className="w-full h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-outline-variant/20"
            >
              <span>Registrar Egreso Rápido de Efectivo</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Reposición Urgente & Insumos */}
      {activeTab === 'reposicion' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xs border border-outline-variant/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-outline-variant/20 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono">
                    URGENTE • QUIEBRE DE STOCK INMINENTE
                  </span>
                  <span className="text-xs text-on-surface-variant font-mono">Algoritmo de Rotación 15d</span>
                </div>
                <h3 className="font-headline font-bold text-xl text-on-surface mt-1">
                  Generador de Pedido y Reposición Sugerida
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Cálculo en base a ventas de los últimos 15 días y stock mínimo por terminal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNewOrderModalOpen(true)}
                className="h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Orden de Compra</span>
              </button>
            </div>

            {/* Critical Supplies Table */}
            <div className="bg-surface-container-low rounded-xl overflow-hidden mb-6 border border-outline-variant/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant font-mono text-[11px] uppercase tracking-wider border-b border-outline-variant/20">
                    <th className="py-3 px-4">Insumo / Repuesto</th>
                    <th className="py-3 px-4">Proveedor Habitual</th>
                    <th className="py-3 px-4 text-center">Stock Actual</th>
                    <th className="py-3 px-4 text-center">Stock Mínimo</th>
                    <th className="py-3 px-4 text-center">Sugerido a Pedir</th>
                    <th className="py-3 px-4 text-right">Costo Estimado</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {data?.supplies.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-on-surface">{item.name}</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">SKU: {item.sku}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-primary">{item.preferredSupplier}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                        {item.currentStock} u.
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-on-surface-variant">{item.minStock} u.</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-xs text-primary">
                        {Math.max(item.minStock * 2 - item.currentStock, 10)} u.
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-on-surface">
                        ${(item.unitCost * Math.max(item.minStock * 2 - item.currentStock, 10)).toLocaleString('es-AR')} ARS
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'critical'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {item.status === 'critical' ? 'Crítico' : 'Bajo Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* WhatsApp automated text & PO tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="bg-surface-container-low p-4 rounded-xl space-y-3 border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface font-mono flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    Formato WhatsApp Automatizado para Preventista
                  </span>
                  <span className="text-[11px] font-mono text-on-surface-variant">Preventista: Silvia Giménez</span>
                </div>
                <div className="bg-surface-container-lowest p-3.5 rounded-lg text-xs font-mono text-on-surface leading-relaxed border border-outline-variant/20">
                  Hola Silvia (Papelera Central) 👋 Te paso el pedido urgente de reposición para el local VoltAcc Downtown:
                  <br /><br />
                  📦 *50x* Rollos Papel Térmico 80mm x 50m (Cod: PAP-ROL-80MM)<br />
                  📦 *10x* Etiquetas Autoadhesivas 50x30mm (Cod: PAP-ETIQ-5030)<br /><br />
                  📍 Entrega: Local Central Metropolitan (Caja POS 04)<br />
                  🧾 Factura A a CUIT 30-71449812-4<br />
                  ¡Avisame cuando despachan! Gracias.
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyWa}
                    className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedWa ? '¡Copiado!' : 'Copiar Pedido para WhatsApp'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Abriendo WhatsApp Web...')}
                    className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-2 transition-colors border border-outline-variant/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>Abrir WhatsApp Web Directo</span>
                  </button>
                </div>
              </div>

              {/* Purchase Orders List */}
              <div className="bg-surface-container-low p-4 rounded-xl space-y-3 border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface font-mono flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-primary" />
                    Órdenes de Compra en Tránsito ({data?.purchaseOrders.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {data?.purchaseOrders.map((po) => (
                    <div key={po.id} className="bg-surface-container-lowest p-3 rounded-lg flex items-center justify-between border border-outline-variant/20 shadow-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-primary">{po.orderNumber}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              po.status === 'in_transit'
                                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                : po.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {po.status === 'in_transit' ? 'En Tránsito' : po.status === 'pending' ? 'Pendiente' : 'Recibido'}
                          </span>
                        </div>
                        <div className="text-xs text-on-surface mt-0.5">{po.supplierName}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">
                          Entrega est.: {po.expectedDelivery} • {po.itemsCount} unidades
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-on-surface">
                          ${po.totalAmount.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Pago a Proveedor */}
      {paymentModalOpen && selectedPaymentVendor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">Emitir Pago a Proveedor</h3>
                  <p className="text-xs text-on-surface-variant">Seleccione canal de egreso financiero</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-surface-container-low p-3.5 rounded-xl flex items-center justify-between border border-outline-variant/20">
                <div>
                  <span className="text-[11px] text-on-surface-variant font-mono uppercase">Proveedor Destino</span>
                  <h4 className="font-bold text-sm text-on-surface">{selectedPaymentVendor.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-on-surface-variant font-mono uppercase">Monto a Liquidar</span>
                  <div className="font-mono text-lg font-bold text-rose-600 dark:text-rose-400">
                    {selectedPaymentVendor.amount}
                  </div>
                </div>
              </div>

              {/* Bifurcated Source */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono">
                  Origen de los Fondos
                </label>
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-colors border ${
                    paymentSource === 'caja'
                      ? 'bg-primary/5 border-primary/40'
                      : 'bg-surface-container border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="origen-pago"
                    checked={paymentSource === 'caja'}
                    onChange={() => setPaymentSource('caja')}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-on-surface">Pagar desde Caja Mostrador (Caja 04)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Efectivo Cajón
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Genera comprobante de <strong>Egreso de Caja</strong>. Descuenta inmediatamente del efectivo físico del cajón para el arqueo exacto.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-colors border ${
                    paymentSource === 'tesoreria'
                      ? 'bg-primary/5 border-primary/40'
                      : 'bg-surface-container border-transparent'
                  }`}
                >
                  <input
                    type="radio"
                    name="origen-pago"
                    checked={paymentSource === 'tesoreria'}
                    onChange={() => setPaymentSource('tesoreria')}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-on-surface">Pago por Administración / Tesorería Central</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                        Transferencia
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Transferencia bancaria o cuenta recaudadora central. <strong>No modifica el efectivo en la caja del cajero.</strong>
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low flex items-center justify-end gap-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Proveedor */}
      {newVendorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">Alta de Proveedor Homologado</h3>
                  <p className="text-xs text-on-surface-variant">Ficha maestra comercial y vinculación impositiva ARCA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewVendorModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewVendorModalOpen(false);
                showToast('Proveedor registrado con éxito.');
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-mono mb-1">Razón Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Distribuidora Sur S.A."
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-mono mb-1">CUIT *</label>
                  <input
                    type="text"
                    required
                    placeholder="30-12345678-9"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-mono text-xs text-on-surface border border-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-mono mb-1">Preventista / Contacto</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-mono mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+54 9 11 ..."
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-mono text-xs text-on-surface border border-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="p-4 bg-surface-container-low -mx-6 -mb-6 mt-6 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setNewVendorModalOpen(false)}
                  className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Proveedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Orden de Compra */}
      {newOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/30 animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">Emitir Orden de Compra Formal</h3>
                  <p className="text-xs text-on-surface-variant">Generación de documento formal de aprovisionamiento</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant font-mono mb-1">Proveedor *</label>
                <select
                  value={orderSupplierId}
                  onChange={(e) => setOrderSupplierId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/20 focus:ring-2 focus:ring-primary"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.cuit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-mono mb-1">Monto Estimado ($) *</label>
                  <input
                    type="number"
                    required
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-mono text-xs text-on-surface border border-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant font-mono mb-1">Cant. Unidades *</label>
                  <input
                    type="number"
                    required
                    value={orderItemsCount}
                    onChange={(e) => setOrderItemsCount(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-mono text-xs text-on-surface border border-outline-variant/20 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="p-4 bg-surface-container-low -mx-6 -mb-6 mt-6 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setNewOrderModalOpen(false)}
                  className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{createOrderMutation.isPending ? 'Emitiendo...' : 'Emitir Orden de Compra'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
