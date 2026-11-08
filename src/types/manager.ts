export interface CommercialKpi {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  subtext: string;
}

export interface TerminalNodeStatus {
  id: string;
  name: string;
  code: string;
  cashierName: string;
  status: 'active' | 'idle' | 'locked' | 'offline';
  ipAddress: string;
  currentShiftTotal: number;
  transactionsCount: number;
  lastHeartbeat: string;
}

export interface SupervisorOverrideRequest {
  id: string;
  terminalCode: string;
  cashierName: string;
  actionType: 'discount_override' | 'ticket_void' | 'drawer_manual_open' | 'price_override';
  description: string;
  amount?: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ActiveShiftAudit {
  id: string;
  cashierName: string;
  terminalCode: string;
  openedAt: string;
  openingCash: number;
  salesTotal: number;
  cashDrawerBalance: number;
  expectedBalance: number;
  discrepancy: number;
  status: 'balanced' | 'discrepancy' | 'in_progress';
}

// Sales BI Analytics
export interface SalesBiMetrics {
  netSales: number;
  netSalesChange: string;
  grossMarginPercent: number;
  grossMarginChange: string;
  upt: number; // Units per ticket
  uptChange: string;
  averageTicket: number;
  averageTicketChange: string;
}

export interface DailySalesPerformance {
  day: string;
  actual: number;
  target: number;
}

export interface CategoryMixBreakdown {
  category: string;
  percentage: number;
  revenue: number;
  color: string;
}

export interface HourlyTrafficCell {
  day: string;
  hourRange: string;
  level: 1 | 2 | 3 | 4 | 5; // Traffic density 1-5
  visitorsCount: number;
}

export interface TopProductPerformance {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  marginPercent: number;
}

// Suppliers & Insumos Management
export interface SupplierRecord {
  id: string;
  name: string;
  cuit: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentTerms: string;
  deliveryLeadDays: number;
  activeOrdersCount: number;
  status: 'active' | 'inactive';
}

export interface PurchaseOrderRecord {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  issuedDate: string;
  expectedDelivery: string;
  totalAmount: number;
  itemsCount: number;
  status: 'draft' | 'pending' | 'in_transit' | 'received' | 'cancelled';
}

export interface TechnicalSupplyItem {
  id: string;
  sku: string;
  name: string;
  category: 'spare_parts' | 'packaging' | 'tools' | 'cleaning' | 'consumables';
  currentStock: number;
  minStock: number;
  unitCost: number;
  preferredSupplier: string;
  status: 'normal' | 'low' | 'critical';
}

