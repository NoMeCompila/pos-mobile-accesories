import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CommercialKpi,
  TerminalNodeStatus,
  SupervisorOverrideRequest,
  ActiveShiftAudit,
  SalesBiMetrics,
  DailySalesPerformance,
  CategoryMixBreakdown,
  HourlyTrafficCell,
  TopProductPerformance,
  SupplierRecord,
  PurchaseOrderRecord,
  TechnicalSupplyItem,
} from '../types/manager';

// --- 1. Commercial Control Data ---

const INITIAL_COMMERCIAL_KPIS: CommercialKpi[] = [
  {
    id: 'kpi-gross-sales',
    label: 'Ventas Brutas del Día',
    value: '$2,845,900',
    change: '+14.2%',
    trend: 'up',
    subtext: 'vs. mismo día semana pasada ($2,492,000)',
  },
  {
    id: 'kpi-margin',
    label: 'Margen Bruto Estimado',
    value: '42.8%',
    change: '+1.6%',
    trend: 'up',
    subtext: 'Meta mensual establecida: 40.0%',
  },
  {
    id: 'kpi-active-shifts',
    label: 'Turnos de Caja Activos',
    value: '4 / 4',
    change: '100% cap',
    trend: 'neutral',
    subtext: '4 terminales operativas sin discrepancia grave',
  },
  {
    id: 'kpi-overrides',
    label: 'Autorizaciones Pendientes',
    value: '2',
    change: 'Atención req',
    trend: 'down',
    subtext: 'Descuentos y apertura manual de gaveta',
  },
];

const INITIAL_TERMINALS: TerminalNodeStatus[] = [
  {
    id: 'term-01',
    name: 'Caja Principal - Mostrador 01',
    code: 'TERM-MAIN-01',
    cashierName: 'Esteban Harrison',
    status: 'active',
    ipAddress: '192.168.1.101',
    currentShiftTotal: 980450,
    transactionsCount: 84,
    lastHeartbeat: 'Hace 4 seg',
  },
  {
    id: 'term-02',
    name: 'Caja Rápida - Accesorios',
    code: 'TERM-FAST-02',
    cashierName: 'Valeria Gómez',
    status: 'active',
    ipAddress: '192.168.1.102',
    currentShiftTotal: 742100,
    transactionsCount: 62,
    lastHeartbeat: 'Hace 12 seg',
  },
  {
    id: 'term-03',
    name: 'Módulo Técnico & Reparaciones',
    code: 'TERM-TECH-03',
    cashierName: 'Matías Silva',
    status: 'active',
    ipAddress: '192.168.1.103',
    currentShiftTotal: 615350,
    transactionsCount: 29,
    lastHeartbeat: 'Hace 8 seg',
  },
  {
    id: 'term-04',
    name: 'Isla Central - Venta Asistida',
    code: 'TERM-ISLAND-04',
    cashierName: 'Lucía Fernández',
    status: 'idle',
    ipAddress: '192.168.1.104',
    currentShiftTotal: 508000,
    transactionsCount: 38,
    lastHeartbeat: 'Hace 1 min',
  },
];

const INITIAL_OVERRIDES: SupervisorOverrideRequest[] = [
  {
    id: 'ovr-101',
    terminalCode: 'TERM-FAST-02',
    cashierName: 'Valeria Gómez',
    actionType: 'discount_override',
    description: 'Descuento cliente frecuente mayorista 20% en Combo Funda + Glass (Excede 10% permitido)',
    amount: 14500,
    timestamp: '14:32:05',
    status: 'pending',
  },
  {
    id: 'ovr-102',
    terminalCode: 'TERM-MAIN-01',
    cashierName: 'Esteban Harrison',
    actionType: 'drawer_manual_open',
    description: 'Apertura manual de gaveta para entrega de cambio en billetes de baja denominación',
    timestamp: '14:28:40',
    status: 'pending',
  },
  {
    id: 'ovr-103',
    terminalCode: 'TERM-TECH-03',
    cashierName: 'Matías Silva',
    actionType: 'ticket_void',
    description: 'Anulación de comprobante por error en modelo de módulo display Samsung A54',
    amount: 68000,
    timestamp: '13:15:10',
    status: 'approved',
  },
];

const INITIAL_SHIFTS: ActiveShiftAudit[] = [
  {
    id: 'sft-01',
    cashierName: 'Esteban Harrison',
    terminalCode: 'TERM-MAIN-01',
    openedAt: '08:30',
    openingCash: 50000,
    salesTotal: 980450,
    cashDrawerBalance: 320450,
    expectedBalance: 320450,
    discrepancy: 0,
    status: 'balanced',
  },
  {
    id: 'sft-02',
    cashierName: 'Valeria Gómez',
    terminalCode: 'TERM-FAST-02',
    openedAt: '09:00',
    openingCash: 40000,
    salesTotal: 742100,
    cashDrawerBalance: 215300,
    expectedBalance: 216000,
    discrepancy: -700,
    status: 'discrepancy',
  },
  {
    id: 'sft-03',
    cashierName: 'Matías Silva',
    terminalCode: 'TERM-TECH-03',
    openedAt: '09:15',
    openingCash: 35000,
    salesTotal: 615350,
    cashDrawerBalance: 180350,
    expectedBalance: 180350,
    discrepancy: 0,
    status: 'balanced',
  },
  {
    id: 'sft-04',
    cashierName: 'Lucía Fernández',
    terminalCode: 'TERM-ISLAND-04',
    openedAt: '10:00',
    openingCash: 35000,
    salesTotal: 508000,
    cashDrawerBalance: 158000,
    expectedBalance: 158000,
    discrepancy: 0,
    status: 'balanced',
  },
];

// --- 2. Sales BI Data ---

const SALES_BI_METRICS: SalesBiMetrics = {
  netSales: 16840500,
  netSalesChange: '+18.5% vs. período ant.',
  grossMarginPercent: 43.4,
  grossMarginChange: '+2.1% margen saludable',
  upt: 2.8,
  uptChange: '+0.3 unidades/ticket',
  averageTicket: 34500,
  averageTicketChange: '+12.4% ticket medio',
};

const DAILY_PERFORMANCE: DailySalesPerformance[] = [
  { day: 'Lun', actual: 2100000, target: 1900000 },
  { day: 'Mar', actual: 2350000, target: 2000000 },
  { day: 'Mié', actual: 2150000, target: 2100000 },
  { day: 'Jue', actual: 2680000, target: 2200000 },
  { day: 'Vie', actual: 3420000, target: 2800000 },
  { day: 'Sáb', actual: 4140500, target: 3500000 },
  { day: 'Dom', actual: 0, target: 0 },
];

const CATEGORY_MIX: CategoryMixBreakdown[] = [
  { category: 'Fundas & Protectores', percentage: 38, revenue: 6399390, color: '#007bb9' },
  { category: 'Cables & Cargadores', percentage: 26, revenue: 4378530, color: '#00a3e0' },
  { category: 'Vidrios Templados & Hidrogel', percentage: 18, revenue: 3031290, color: '#10b981' },
  { category: 'Audio & Auriculares BT', percentage: 12, revenue: 2020860, color: '#6366f1' },
  { category: 'Repuestos & Taller', percentage: 6, revenue: 1010430, color: '#f59e0b' },
];

const HOURLY_TRAFFIC: HourlyTrafficCell[] = [
  { day: 'Lun', hourRange: '09:00 - 12:00', level: 2, visitorsCount: 42 },
  { day: 'Lun', hourRange: '12:00 - 15:00', level: 3, visitorsCount: 78 },
  { day: 'Lun', hourRange: '15:00 - 18:00', level: 4, visitorsCount: 112 },
  { day: 'Lun', hourRange: '18:00 - 21:00', level: 5, visitorsCount: 145 },

  { day: 'Mar', hourRange: '09:00 - 12:00', level: 2, visitorsCount: 48 },
  { day: 'Mar', hourRange: '12:00 - 15:00', level: 3, visitorsCount: 82 },
  { day: 'Mar', hourRange: '15:00 - 18:00', level: 4, visitorsCount: 119 },
  { day: 'Mar', hourRange: '18:00 - 21:00', level: 5, visitorsCount: 154 },

  { day: 'Mié', hourRange: '09:00 - 12:00', level: 2, visitorsCount: 51 },
  { day: 'Mié', hourRange: '12:00 - 15:00', level: 3, visitorsCount: 85 },
  { day: 'Mié', hourRange: '15:00 - 18:00', level: 4, visitorsCount: 115 },
  { day: 'Mié', hourRange: '18:00 - 21:00', level: 4, visitorsCount: 130 },

  { day: 'Jue', hourRange: '09:00 - 12:00', level: 3, visitorsCount: 65 },
  { day: 'Jue', hourRange: '12:00 - 15:00', level: 4, visitorsCount: 98 },
  { day: 'Jue', hourRange: '15:00 - 18:00', level: 4, visitorsCount: 128 },
  { day: 'Jue', hourRange: '18:00 - 21:00', level: 5, visitorsCount: 168 },

  { day: 'Vie', hourRange: '09:00 - 12:00', level: 3, visitorsCount: 72 },
  { day: 'Vie', hourRange: '12:00 - 15:00', level: 4, visitorsCount: 110 },
  { day: 'Vie', hourRange: '15:00 - 18:00', level: 5, visitorsCount: 175 },
  { day: 'Vie', hourRange: '18:00 - 21:00', level: 5, visitorsCount: 220 },

  { day: 'Sáb', hourRange: '09:00 - 12:00', level: 4, visitorsCount: 95 },
  { day: 'Sáb', hourRange: '12:00 - 15:00', level: 5, visitorsCount: 160 },
  { day: 'Sáb', hourRange: '15:00 - 18:00', level: 5, visitorsCount: 240 },
  { day: 'Sáb', hourRange: '18:00 - 21:00', level: 5, visitorsCount: 215 },
];

const TOP_PRODUCTS: TopProductPerformance[] = [
  { id: 'prod-01', sku: 'FUN-IP15-MAG-CLR', name: 'Funda Clear MagSafe iPhone 15 Pro Max', category: 'Fundas', unitsSold: 142, revenue: 2130000, marginPercent: 58.2 },
  { id: 'prod-02', sku: 'GLS-SAM-A54-PRV', name: 'Vidrio Templado Privacidad Samsung A54', category: 'Vidrios', unitsSold: 118, revenue: 1062000, marginPercent: 64.5 },
  { id: 'prod-03', sku: 'CAB-USBC-60W-2M', name: 'Cable USB-C a USB-C 60W Mallado 2M', category: 'Cables', unitsSold: 96, revenue: 1152000, marginPercent: 46.8 },
  { id: 'prod-04', sku: 'CAR-CARG-20W-PD', name: 'Cargador Rápido 20W Power Delivery', category: 'Cables', unitsSold: 84, revenue: 1512000, marginPercent: 42.1 },
  { id: 'prod-05', sku: 'AUR-TWS-ANC-V2', name: 'Auriculares TWS Noise Cancelling Gen 2', category: 'Audio', unitsSold: 38, revenue: 1824000, marginPercent: 39.4 },
];

// --- 3. Suppliers & Supplies Data ---

const INITIAL_SUPPLIERS: SupplierRecord[] = [
  {
    id: 'sup-01',
    name: 'TechDistribuidora Mayorista S.A.',
    cuit: '30-71449821-4',
    category: 'Fundas, Vidrios y Cables',
    contactPerson: 'Fernando Rossi',
    email: 'ventas@techdistribuidora.com.ar',
    phone: '+54 11 4821-9900',
    paymentTerms: '30 días f/factura',
    deliveryLeadDays: 2,
    activeOrdersCount: 2,
    status: 'active',
  },
  {
    id: 'sup-02',
    name: 'MegaRepuestos Celulares SRL',
    cuit: '30-68994120-9',
    category: 'Repuestos & Displays Taller',
    contactPerson: 'Alejandro Morales',
    email: 'contacto@megarepuestos.com',
    phone: '+54 11 5234-8811',
    paymentTerms: 'Transferencia inmediata',
    deliveryLeadDays: 1,
    activeOrdersCount: 1,
    status: 'active',
  },
  {
    id: 'sup-03',
    name: 'Global Packaging & Termorótulos',
    cuit: '33-54890123-9',
    category: 'Bolsas, Blisters y Rollos Térmicos',
    contactPerson: 'Marcela Domínguez',
    email: 'pedidos@globalpackaging.ar',
    phone: '+54 11 3901-4455',
    paymentTerms: '15 días f/factura',
    deliveryLeadDays: 4,
    activeOrdersCount: 0,
    status: 'active',
  },
  {
    id: 'sup-04',
    name: 'AudioPro Importaciones Express',
    cuit: '30-78119234-2',
    category: 'Auriculares y Parlantes Bluetooth',
    contactPerson: 'Nicolás Benítez',
    email: 'nicolas@audiopro-import.com',
    phone: '+54 11 4555-0912',
    paymentTerms: 'Anticipado 50% / Saldo contra entrega',
    deliveryLeadDays: 5,
    activeOrdersCount: 1,
    status: 'active',
  },
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    id: 'po-2026-041',
    orderNumber: 'OC-2026-041',
    supplierId: 'sup-01',
    supplierName: 'TechDistribuidora Mayorista S.A.',
    issuedDate: '2026-11-04',
    expectedDelivery: '2026-11-09',
    totalAmount: 1450000,
    itemsCount: 320,
    status: 'in_transit',
  },
  {
    id: 'po-2026-042',
    orderNumber: 'OC-2026-042',
    supplierId: 'sup-02',
    supplierName: 'MegaRepuestos Celulares SRL',
    issuedDate: '2026-11-06',
    expectedDelivery: '2026-11-08',
    totalAmount: 890000,
    itemsCount: 45,
    status: 'pending',
  },
  {
    id: 'po-2026-043',
    orderNumber: 'OC-2026-043',
    supplierId: 'sup-04',
    supplierName: 'AudioPro Importaciones Express',
    issuedDate: '2026-11-01',
    expectedDelivery: '2026-11-07',
    totalAmount: 1840000,
    itemsCount: 80,
    status: 'received',
  },
];

const INITIAL_SUPPLIES: TechnicalSupplyItem[] = [
  {
    id: 'sup-item-01',
    sku: 'INS-TERM-80MM',
    name: 'Rollos de Papel Térmico 80mm x 50m (Caja x 50)',
    category: 'consumables',
    currentStock: 4,
    minStock: 8,
    unitCost: 38500,
    preferredSupplier: 'Global Packaging & Termorótulos',
    status: 'critical',
  },
  {
    id: 'sup-item-02',
    sku: 'INS-ETIQ-REP',
    name: 'Etiquetas Autoadhesivas Código de Barras Taller (Rollo x 1000)',
    category: 'packaging',
    currentStock: 3,
    minStock: 5,
    unitCost: 14200,
    preferredSupplier: 'Global Packaging & Termorótulos',
    status: 'low',
  },
  {
    id: 'sup-item-03',
    sku: 'REP-DISP-SAM-A54',
    name: 'Módulo Display OLED Original Samsung A54 5G',
    category: 'spare_parts',
    currentStock: 6,
    minStock: 4,
    unitCost: 52000,
    preferredSupplier: 'MegaRepuestos Celulares SRL',
    status: 'normal',
  },
  {
    id: 'sup-item-04',
    sku: 'REP-BATT-IP13',
    name: 'Batería Reemplazo Calidad OEM iPhone 13 (3227 mAh)',
    category: 'spare_parts',
    currentStock: 2,
    minStock: 5,
    unitCost: 28500,
    preferredSupplier: 'MegaRepuestos Celulares SRL',
    status: 'critical',
  },
  {
    id: 'sup-item-05',
    sku: 'INS-PEG-B7000',
    name: 'Pegamento Adhesivo B-7000 Precisión 110ml para Módulos',
    category: 'consumables',
    currentStock: 7,
    minStock: 3,
    unitCost: 6500,
    preferredSupplier: 'MegaRepuestos Celulares SRL',
    status: 'normal',
  },
];

// --- In-Memory State for Interactive Actions ---

let overrideRequests = [...INITIAL_OVERRIDES];
let purchaseOrders = [...INITIAL_PURCHASE_ORDERS];

// --- React Query Hooks ---

export function useCommercialControlData() {
  return useQuery({
    queryKey: ['manager', 'commercial-control'],
    queryFn: async () => {
      // Simulate fast local retrieval
      await new Promise((r) => setTimeout(r, 80));
      return {
        kpis: INITIAL_COMMERCIAL_KPIS,
        terminals: INITIAL_TERMINALS,
        overrides: [...overrideRequests],
        shifts: INITIAL_SHIFTS,
      };
    },
    staleTime: 1000 * 30,
  });
}

export function useSalesBiData(timeframe: 'today' | 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: ['manager', 'sales-bi', timeframe],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 100));
      return {
        timeframe,
        metrics: SALES_BI_METRICS,
        dailyPerformance: DAILY_PERFORMANCE,
        categoryMix: CATEGORY_MIX,
        trafficHeatmap: HOURLY_TRAFFIC,
        topProducts: TOP_PRODUCTS,
      };
    },
    staleTime: 1000 * 60,
  });
}

export function useSuppliersData() {
  return useQuery({
    queryKey: ['manager', 'suppliers'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 90));
      return {
        suppliers: INITIAL_SUPPLIERS,
        purchaseOrders: [...purchaseOrders],
        supplies: INITIAL_SUPPLIES,
      };
    },
    staleTime: 1000 * 30,
  });
}

export function useApproveSupervisorOverrideMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (overrideId: string) => {
      await new Promise((r) => setTimeout(r, 150));
      overrideRequests = overrideRequests.map((req) =>
        req.id === overrideId ? { ...req, status: 'approved' as const } : req
      );
      return overrideId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'commercial-control'] });
    },
  });
}

export function useRejectSupervisorOverrideMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (overrideId: string) => {
      await new Promise((r) => setTimeout(r, 150));
      overrideRequests = overrideRequests.map((req) =>
        req.id === overrideId ? { ...req, status: 'rejected' as const } : req
      );
      return overrideId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'commercial-control'] });
    },
  });
}

export function useCreatePurchaseOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newOrder: Omit<PurchaseOrderRecord, 'id' | 'orderNumber' | 'status'>) => {
      await new Promise((r) => setTimeout(r, 200));
      const orderNumber = `OC-2026-0${purchaseOrders.length + 44}`;
      const record: PurchaseOrderRecord = {
        ...newOrder,
        id: `po-${Date.now()}`,
        orderNumber,
        status: 'pending',
      };
      purchaseOrders = [record, ...purchaseOrders];
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'suppliers'] });
    },
  });
}

