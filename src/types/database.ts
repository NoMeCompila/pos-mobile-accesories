export type UserRole = 'admin' | 'manager' | 'cashier' | 'technician' | 'customer';

export interface UserProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  branch_id: string | null;
  phone: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandRow {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierRow {
  id: string;
  company_name: string;
  tax_id: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  brand_id: string | null;
  product_code: string;
  name: string;
  description: string | null;
  stock: number;
  stock_quantity: number;
  purchase_price: number;
  cost_price_usd: number;
  sale_price: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTypeRow {
  id: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  dni: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  locality: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SaleStatus = 'draft' | 'completed' | 'voided' | 'refunded';

export interface SaleHeaderRow {
  id: string;
  sale_number: string;
  customer_id: string | null;
  user_id: string;
  payment_type_id: string;
  branch_id: string | null;
  sale_date: string;
  total_sale: number;
  status: SaleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleDetailRow {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface PurchaseOrderRow {
  id: string;
  order_number: string;
  supplier_id: string;
  user_id: string | null;
  branch_id: string | null;
  status: PurchaseOrderStatus;
  expected_date: string | null;
  total_amount_usd: number;
  total_amount_ars: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItemRow {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  expected_unit_cost_usd: number;
  created_at: string;
  updated_at: string;
}

export type InvoiceCurrency = 'USD' | 'ARS';
export type SupplierInvoiceStatus = 'draft' | 'confirmed' | 'received' | 'cancelled';
export type SupplierInvoicePaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface SupplierInvoiceRow {
  id: string;
  supplier_id: string;
  purchase_order_id: string | null;
  user_id: string | null;
  branch_id: string | null;
  invoice_number: string;
  invoice_date: string;
  reception_date: string;
  currency: InvoiceCurrency;
  exchange_rate: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: SupplierInvoiceStatus;
  payment_status: SupplierInvoicePaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierInvoiceItemRow {
  id: string;
  supplier_invoice_id: string;
  product_id: string;
  quantity_received: number;
  unit_cost: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export type InventoryMovementOriginType =
  | 'supplier_purchase'
  | 'pos_sale'
  | 'repair_usage'
  | 'manual_adjustment';

export interface InventoryMovementRow {
  id: string;
  product_id: string;
  origin_type: InventoryMovementOriginType;
  origin_id: string;
  quantity_delta: number;
  resulting_stock: number;
  cost_snapshot: number;
  created_by: string | null;
  created_at: string;
}

export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';

export interface RepairRow {
  id: string;
  ticket_number: string;
  customer_id: string;
  technician_id: string | null;
  device_model: string;
  serial_number: string | null;
  issue_description: string;
  diagnostic: string | null;
  status: RepairStatus;
  scheduled_at: string | null;
  delivered_at: string | null;
  estimated_cost: number;
  final_cost: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
