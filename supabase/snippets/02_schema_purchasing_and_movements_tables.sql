-- ==============================================================================
-- SNIPPET 2: 02_schema_purchasing_and_movements_tables.sql
-- Título en Supabase: 02 - Schema: Tablas de Compras y Movimientos
-- Descripción:
--   Crea las 5 tablas del dominio de compras y control de stock:
--   - purchase_orders
--   - purchase_order_items
--   - supplier_invoices (con uq_supplier_invoice_number)
--   - supplier_invoice_items
--   - inventory_movements (libro mayor de stock inmutable)
--   Incluye claves foráneas, índices de performance y CHECK constraints.
-- ==============================================================================

-- 1. PURCHASE ORDERS (Órdenes de Compra)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  supplier_id uuid NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  branch_id uuid,
  status text NOT NULL DEFAULT 'draft',
  expected_date date,
  total_amount_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  total_amount_ars numeric(12,2) NOT NULL DEFAULT 0.00,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_purchase_orders PRIMARY KEY (id),
  CONSTRAINT uq_purchase_orders_number UNIQUE (order_number),
  CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_purchase_orders_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT chk_purchase_orders_number_not_empty CHECK (char_length(trim(order_number)) > 0),
  CONSTRAINT chk_purchase_orders_status CHECK (status IN ('draft', 'sent', 'partially_received', 'received', 'cancelled')),
  CONSTRAINT chk_purchase_orders_total_usd_non_negative CHECK (total_amount_usd >= 0),
  CONSTRAINT chk_purchase_orders_total_ars_non_negative CHECK (total_amount_ars >= 0)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected_date ON public.purchase_orders(expected_date);

DROP TRIGGER IF EXISTS trg_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2. PURCHASE ORDER ITEMS (Ítems de Órdenes de Compra)
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity_ordered integer NOT NULL,
  quantity_received integer NOT NULL DEFAULT 0,
  expected_unit_cost_usd numeric(12,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_purchase_order_items PRIMARY KEY (id),
  CONSTRAINT fk_purchase_order_items_order FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchase_order_items_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_purchase_order_items_qty_ordered_positive CHECK (quantity_ordered > 0),
  CONSTRAINT chk_purchase_order_items_qty_received_non_negative CHECK (quantity_received >= 0),
  CONSTRAINT chk_purchase_order_items_expected_cost_non_negative CHECK (expected_unit_cost_usd >= 0)
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON public.purchase_order_items(product_id);

DROP TRIGGER IF EXISTS trg_purchase_order_items_updated_at ON public.purchase_order_items;
CREATE TRIGGER trg_purchase_order_items_updated_at
  BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. SUPPLIER INVOICES (Facturas del Proveedor)
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id uuid DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  purchase_order_id uuid,
  user_id uuid DEFAULT auth.uid(),
  branch_id uuid,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  reception_date timestamptz NOT NULL DEFAULT now(),
  currency text NOT NULL DEFAULT 'USD',
  exchange_rate numeric(12,4) NOT NULL DEFAULT 1.0000,
  subtotal numeric(12,2) NOT NULL DEFAULT 0.00,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  total_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'received',
  payment_status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_supplier_invoices PRIMARY KEY (id),
  CONSTRAINT uq_supplier_invoice_number UNIQUE (supplier_id, invoice_number),
  CONSTRAINT fk_supplier_invoices_supplier FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  CONSTRAINT fk_supplier_invoices_order FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_supplier_invoices_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  CONSTRAINT chk_supplier_invoices_number_not_empty CHECK (char_length(trim(invoice_number)) > 0),
  CONSTRAINT chk_supplier_invoices_currency CHECK (currency IN ('USD', 'ARS')),
  CONSTRAINT chk_supplier_invoices_exchange_rate_positive CHECK (exchange_rate > 0),
  CONSTRAINT chk_supplier_invoices_subtotal_non_negative CHECK (subtotal >= 0),
  CONSTRAINT chk_supplier_invoices_tax_non_negative CHECK (tax_amount >= 0),
  CONSTRAINT chk_supplier_invoices_total_non_negative CHECK (total_amount >= 0),
  CONSTRAINT chk_supplier_invoices_status CHECK (status IN ('draft', 'confirmed', 'received', 'cancelled')),
  CONSTRAINT chk_supplier_invoices_payment_status CHECK (payment_status IN ('pending', 'paid', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON public.supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_order_id ON public.supplier_invoices(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_reception_date ON public.supplier_invoices(reception_date);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_status ON public.supplier_invoices(status);

DROP TRIGGER IF EXISTS trg_supplier_invoices_updated_at ON public.supplier_invoices;
CREATE TRIGGER trg_supplier_invoices_updated_at
  BEFORE UPDATE ON public.supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. SUPPLIER INVOICE ITEMS (Ítems de Factura del Proveedor)
CREATE TABLE IF NOT EXISTS public.supplier_invoice_items (
  id uuid DEFAULT gen_random_uuid(),
  supplier_invoice_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity_received integer NOT NULL,
  unit_cost numeric(12,2) NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_supplier_invoice_items PRIMARY KEY (id),
  CONSTRAINT fk_supplier_invoice_items_invoice FOREIGN KEY (supplier_invoice_id) REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_supplier_invoice_items_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_supplier_invoice_items_qty_positive CHECK (quantity_received > 0),
  CONSTRAINT chk_supplier_invoice_items_unit_cost_non_negative CHECK (unit_cost >= 0),
  CONSTRAINT chk_supplier_invoice_items_subtotal_non_negative CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_invoice_id ON public.supplier_invoice_items(supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_items_product_id ON public.supplier_invoice_items(product_id);

DROP TRIGGER IF EXISTS trg_supplier_invoice_items_updated_at ON public.supplier_invoice_items;
CREATE TRIGGER trg_supplier_invoice_items_updated_at
  BEFORE UPDATE ON public.supplier_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. INVENTORY MOVEMENTS (Libro Mayor Inmutable de Stock)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  origin_type text NOT NULL,
  origin_id uuid NOT NULL,
  quantity_delta integer NOT NULL,
  resulting_stock integer NOT NULL,
  cost_snapshot numeric(12,2) NOT NULL DEFAULT 0.00,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_inventory_movements PRIMARY KEY (id),
  CONSTRAINT fk_inventory_movements_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_inventory_movements_user FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT chk_inventory_movements_origin_type CHECK (origin_type IN ('supplier_purchase', 'pos_sale', 'repair_usage', 'manual_adjustment')),
  CONSTRAINT chk_inventory_movements_delta_non_zero CHECK (quantity_delta <> 0),
  CONSTRAINT chk_inventory_movements_resulting_stock_non_negative CHECK (resulting_stock >= 0),
  CONSTRAINT chk_inventory_movements_cost_snapshot_non_negative CHECK (cost_snapshot >= 0)
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_origin ON public.inventory_movements(origin_type, origin_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON public.inventory_movements(created_at);

