-- ==============================================================================
-- Migration: 20261026010000_create_core_pos_schema.sql
-- Description: Creates foundational tables for retail catalog, suppliers,
--              customers, checkout sales, inventory purchases, and repairs.
--              Enforces explicit named constraints (pk_*, fk_*, uq_*, chk_*),
--              UUID PKs, numeric(12,2) currencies, soft-delete, indexes, and RLS.
-- ==============================================================================

-- 1. BRANDS
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_brands PRIMARY KEY (id),
  CONSTRAINT uq_brands_name UNIQUE (name),
  CONSTRAINT chk_brands_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE TRIGGER trg_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  tax_id text,
  contact_name text,
  email text,
  phone text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_suppliers PRIMARY KEY (id),
  CONSTRAINT uq_suppliers_tax_id UNIQUE (tax_id),
  CONSTRAINT chk_suppliers_name_not_empty CHECK (char_length(trim(company_name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_suppliers_tax_id ON public.suppliers(tax_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON public.suppliers(is_active);

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid(),
  brand_id uuid,
  product_code text NOT NULL,
  name text NOT NULL,
  description text,
  stock integer NOT NULL DEFAULT 0,
  purchase_price numeric(12,2) NOT NULL DEFAULT 0.00,
  sale_price numeric(12,2) NOT NULL DEFAULT 0.00,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_products PRIMARY KEY (id),
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL,
  CONSTRAINT uq_products_code UNIQUE (product_code),
  CONSTRAINT chk_products_code_not_empty CHECK (char_length(trim(product_code)) > 0),
  CONSTRAINT chk_products_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0),
  CONSTRAINT chk_products_purchase_price_non_negative CHECK (purchase_price >= 0),
  CONSTRAINT chk_products_sale_price_non_negative CHECK (sale_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. PAYMENT TYPES
CREATE TABLE IF NOT EXISTS public.payment_types (
  id uuid DEFAULT gen_random_uuid(),
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_payment_types PRIMARY KEY (id),
  CONSTRAINT uq_payment_types_desc UNIQUE (description),
  CONSTRAINT chk_payment_types_desc_not_empty CHECK (char_length(trim(description)) > 0)
);

CREATE TRIGGER trg_payment_types_updated_at
  BEFORE UPDATE ON public.payment_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid DEFAULT gen_random_uuid(),
  user_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  dni text,
  email text,
  phone text,
  address text,
  locality text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_customers PRIMARY KEY (id),
  CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT uq_customers_dni UNIQUE (dni),
  CONSTRAINT chk_customers_first_name_not_empty CHECK (char_length(trim(first_name)) > 0),
  CONSTRAINT chk_customers_last_name_not_empty CHECK (char_length(trim(last_name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_customers_dni ON public.customers(dni);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. SALE HEADERS
CREATE TABLE IF NOT EXISTS public.sale_headers (
  id uuid DEFAULT gen_random_uuid(),
  sale_number text NOT NULL,
  customer_id uuid,
  user_id uuid NOT NULL,
  payment_type_id uuid NOT NULL,
  branch_id uuid,
  sale_date timestamptz NOT NULL DEFAULT now(),
  total_sale numeric(12,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'completed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_sale_headers PRIMARY KEY (id),
  CONSTRAINT fk_sale_headers_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sale_headers_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_sale_headers_payment_type FOREIGN KEY (payment_type_id) REFERENCES public.payment_types(id) ON DELETE RESTRICT,
  CONSTRAINT uq_sale_headers_number UNIQUE (sale_number),
  CONSTRAINT chk_sale_headers_number_not_empty CHECK (char_length(trim(sale_number)) > 0),
  CONSTRAINT chk_sale_headers_total_non_negative CHECK (total_sale >= 0),
  CONSTRAINT chk_sale_headers_status CHECK (status IN ('draft', 'completed', 'voided', 'refunded'))
);

CREATE INDEX IF NOT EXISTS idx_sale_headers_user_id ON public.sale_headers(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_headers_customer_id ON public.sale_headers(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_headers_sale_date ON public.sale_headers(sale_date);
CREATE INDEX IF NOT EXISTS idx_sale_headers_status ON public.sale_headers(status);

CREATE TRIGGER trg_sale_headers_updated_at
  BEFORE UPDATE ON public.sale_headers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. SALE DETAILS
CREATE TABLE IF NOT EXISTS public.sale_details (
  id uuid DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_sale_details PRIMARY KEY (id),
  CONSTRAINT fk_sale_details_sale FOREIGN KEY (sale_id) REFERENCES public.sale_headers(id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_details_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_sale_details_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_sale_details_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT chk_sale_details_subtotal_non_negative CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sale_details_sale_id ON public.sale_details(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_details_product_id ON public.sale_details(product_id);

-- 8. PURCHASE HEADERS
CREATE TABLE IF NOT EXISTS public.purchase_headers (
  id uuid DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  user_id uuid NOT NULL,
  invoice_number text NOT NULL,
  branch_id uuid,
  purchase_date timestamptz NOT NULL DEFAULT now(),
  total_cost numeric(12,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'received',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_purchase_headers PRIMARY KEY (id),
  CONSTRAINT fk_purchase_headers_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_headers_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT chk_purchase_headers_invoice_not_empty CHECK (char_length(trim(invoice_number)) > 0),
  CONSTRAINT chk_purchase_headers_total_cost_non_negative CHECK (total_cost >= 0),
  CONSTRAINT chk_purchase_headers_status CHECK (status IN ('draft', 'received', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_purchase_headers_supplier_id ON public.purchase_headers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_headers_user_id ON public.purchase_headers(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_headers_date ON public.purchase_headers(purchase_date);

CREATE TRIGGER trg_purchase_headers_updated_at
  BEFORE UPDATE ON public.purchase_headers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. PURCHASE DETAILS
CREATE TABLE IF NOT EXISTS public.purchase_details (
  id uuid DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL,
  unit_cost numeric(12,2) NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_purchase_details PRIMARY KEY (id),
  CONSTRAINT fk_purchase_details_purchase FOREIGN KEY (purchase_id) REFERENCES public.purchase_headers(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchase_details_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_purchase_details_quantity_positive CHECK (quantity > 0),
  CONSTRAINT chk_purchase_details_unit_cost_non_negative CHECK (unit_cost >= 0),
  CONSTRAINT chk_purchase_details_subtotal_non_negative CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_purchase_details_purchase_id ON public.purchase_details(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_details_product_id ON public.purchase_details(product_id);

-- 10. REPAIRS
CREATE TABLE IF NOT EXISTS public.repairs (
  id uuid DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL,
  customer_id uuid NOT NULL,
  technician_id uuid,
  device_model text NOT NULL,
  serial_number text,
  issue_description text NOT NULL,
  diagnostic text,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  delivered_at timestamptz,
  estimated_cost numeric(12,2) NOT NULL DEFAULT 0.00,
  final_cost numeric(12,2),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_repairs PRIMARY KEY (id),
  CONSTRAINT fk_repairs_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_repairs_technician FOREIGN KEY (technician_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT uq_repairs_ticket_number UNIQUE (ticket_number),
  CONSTRAINT chk_repairs_ticket_not_empty CHECK (char_length(trim(ticket_number)) > 0),
  CONSTRAINT chk_repairs_device_model_not_empty CHECK (char_length(trim(device_model)) > 0),
  CONSTRAINT chk_repairs_issue_not_empty CHECK (char_length(trim(issue_description)) > 0),
  CONSTRAINT chk_repairs_estimated_cost_non_negative CHECK (estimated_cost >= 0),
  CONSTRAINT chk_repairs_final_cost_non_negative CHECK (final_cost IS NULL OR final_cost >= 0),
  CONSTRAINT chk_repairs_status CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_repairs_customer_id ON public.repairs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairs_technician_id ON public.repairs(technician_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON public.repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_ticket_number ON public.repairs(ticket_number);

CREATE TRIGGER trg_repairs_updated_at
  BEFORE UPDATE ON public.repairs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

-- 1. BRANDS
CREATE POLICY "brands_read_all" ON public.brands
  FOR SELECT TO authenticated, anon
  USING (is_active = true OR public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "brands_write_admin_manager" ON public.brands
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

-- 2. PRODUCTS
CREATE POLICY "products_read_all" ON public.products
  FOR SELECT TO authenticated, anon
  USING (is_active = true OR public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "products_write_admin_manager" ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

-- 3. SUPPLIERS
CREATE POLICY "suppliers_all_admin_manager" ON public.suppliers
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

-- 4. PAYMENT TYPES
CREATE POLICY "payment_types_read_active" ON public.payment_types
  FOR SELECT TO authenticated, anon
  USING (is_active = true OR public.is_admin());

CREATE POLICY "payment_types_write_admin" ON public.payment_types
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. CUSTOMERS
CREATE POLICY "customers_staff_all" ON public.customers
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR 
    public.get_auth_role((SELECT auth.uid())) IN ('manager'::public.user_role, 'cashier'::public.user_role, 'technician'::public.user_role)
  )
  WITH CHECK (
    public.is_admin() OR 
    public.get_auth_role((SELECT auth.uid())) IN ('manager'::public.user_role, 'cashier'::public.user_role, 'technician'::public.user_role)
  );

CREATE POLICY "customers_self_select" ON public.customers
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 6. SALE HEADERS
CREATE POLICY "sales_admin_manager_all" ON public.sale_headers
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "sales_cashier_insert_own" ON public.sale_headers
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_auth_role((SELECT auth.uid())) = 'cashier'::public.user_role AND
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "sales_cashier_select_own" ON public.sale_headers
  FOR SELECT TO authenticated
  USING (
    public.get_auth_role((SELECT auth.uid())) = 'cashier'::public.user_role AND
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "sales_customer_read_own" ON public.sale_headers
  FOR SELECT TO authenticated
  USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = (SELECT auth.uid()))
  );

-- 7. SALE DETAILS
CREATE POLICY "sale_details_admin_manager_all" ON public.sale_details
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "sale_details_cashier_insert" ON public.sale_details
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sale_headers h 
      WHERE h.id = sale_id AND h.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "sale_details_cashier_select" ON public.sale_details
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sale_headers h 
      WHERE h.id = sale_id AND h.user_id = (SELECT auth.uid())
    )
  );

-- 8. PURCHASE HEADERS & DETAILS
CREATE POLICY "purchases_admin_manager_all" ON public.purchase_headers
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "purchase_details_admin_manager_all" ON public.purchase_details
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

-- 9. REPAIRS
CREATE POLICY "repairs_admin_manager_all" ON public.repairs
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "repairs_technician_manage" ON public.repairs
  FOR ALL TO authenticated
  USING (
    public.get_auth_role((SELECT auth.uid())) = 'technician'::public.user_role AND
    (technician_id = (SELECT auth.uid()) OR technician_id IS NULL)
  )
  WITH CHECK (
    public.get_auth_role((SELECT auth.uid())) = 'technician'::public.user_role AND
    (technician_id = (SELECT auth.uid()) OR technician_id IS NULL)
  );

CREATE POLICY "repairs_customer_read_own" ON public.repairs
  FOR SELECT TO authenticated
  USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = (SELECT auth.uid()))
  );

-- Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.brands, public.products, public.payment_types TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
