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
  purchase_price: number;
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

export type PurchaseStatus = 'draft' | 'received' | 'cancelled';

export interface PurchaseHeaderRow {
  id: string;
  supplier_id: string;
  user_id: string;
  invoice_number: string;
  branch_id: string | null;
  purchase_date: string;
  total_cost: number;
  status: PurchaseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseDetailRow {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
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
