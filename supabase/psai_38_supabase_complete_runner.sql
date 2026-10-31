-- ==============================================================================
-- CONSOLIDATED SUPABASE SQL RUNNER: psai_38_supabase_complete_runner.sql
-- Ticket: [PSAI-38] [POS] [Inventory] [Database]
--         Create-Suppliers-Purchase-Orders-And-Invoices-Schema
--
-- HOW TO USE IN SUPABASE STUDIO (SQL EDITOR):
--   You can paste and run this single file directly in the Supabase SQL Editor.
--   It executes in order:
--     PART 1: Schema Migration (drops empty legacy purchase_headers/details,
--             adds stock_quantity & cost_price_usd to products, creates
--             purchase_orders, purchase_order_items, supplier_invoices,
--             supplier_invoice_items, inventory_movements, triggers, and RLS).
--     PART 2: Realistic Seed Data (3 Argentine mobile accessory suppliers,
--             products including "Funda Armor MagSafe Titanio", 2 purchase
--             orders, 2 received supplier invoices, and automatic stock ledger
--             movements).
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PART 1: SCHEMA MIGRATION (20261031000000_purchases_and_stock_ledger.sql)
-- ==============================================================================

-- 1.1 Drop Legacy Unused Tables
DROP TABLE IF EXISTS public.purchase_details CASCADE;
DROP TABLE IF EXISTS public.purchase_headers CASCADE;

-- 1.2 Align public.products for stock_quantity and cost_price_usd
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_price_usd numeric(12,2) NOT NULL DEFAULT 0.00;

UPDATE public.products
SET
  stock_quantity = stock,
  cost_price_usd = purchase_price
WHERE stock_quantity <> stock OR cost_price_usd <> purchase_price;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS chk_products_stock_quantity_non_negative,
  ADD CONSTRAINT chk_products_stock_quantity_non_negative CHECK (stock_quantity >= 0),
  DROP CONSTRAINT IF EXISTS chk_products_cost_price_usd_non_negative,
  ADD CONSTRAINT chk_products_cost_price_usd_non_negative CHECK (cost_price_usd >= 0);

CREATE OR REPLACE FUNCTION public.sync_products_inventory_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.stock_quantity IS DISTINCT FROM 0 AND NEW.stock = 0 THEN
      NEW.stock := NEW.stock_quantity;
    ELSE
      NEW.stock_quantity := NEW.stock;
    END IF;

    IF NEW.cost_price_usd IS DISTINCT FROM 0.00 AND NEW.purchase_price = 0.00 THEN
      NEW.purchase_price := NEW.cost_price_usd;
    ELSE
      NEW.cost_price_usd := NEW.purchase_price;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity AND NEW.stock IS NOT DISTINCT FROM OLD.stock THEN
      NEW.stock := NEW.stock_quantity;
    ELSIF NEW.stock IS DISTINCT FROM OLD.stock AND NEW.stock_quantity IS NOT DISTINCT FROM OLD.stock_quantity THEN
      NEW.stock_quantity := NEW.stock;
    ELSIF NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity AND NEW.stock IS DISTINCT FROM OLD.stock THEN
      NEW.stock := NEW.stock_quantity;
    END IF;

    IF NEW.cost_price_usd IS DISTINCT FROM OLD.cost_price_usd AND NEW.purchase_price IS NOT DISTINCT FROM OLD.purchase_price THEN
      NEW.purchase_price := NEW.cost_price_usd;
    ELSIF NEW.purchase_price IS DISTINCT FROM OLD.purchase_price AND NEW.cost_price_usd IS NOT DISTINCT FROM OLD.cost_price_usd THEN
      NEW.cost_price_usd := NEW.purchase_price;
    ELSIF NEW.cost_price_usd IS DISTINCT FROM OLD.cost_price_usd AND NEW.purchase_price IS DISTINCT FROM OLD.purchase_price THEN
      NEW.purchase_price := NEW.cost_price_usd;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_sync_inventory_columns ON public.products;
CREATE TRIGGER trg_products_sync_inventory_columns
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_products_inventory_columns();

-- 1.3 Create purchase_orders
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

-- 1.4 Create purchase_order_items
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

-- 1.5 Create supplier_invoices
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

-- 1.6 Create supplier_invoice_items
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

-- 1.7 Create inventory_movements (Immutable Stock Ledger)
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

-- 1.8 Immutability & Automated Stock/Replacement Cost Triggers
CREATE OR REPLACE FUNCTION public.prevent_inventory_movements_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Immutable Ledger Violation: inventory_movements records cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_movements_immutable ON public.inventory_movements;
CREATE TRIGGER trg_inventory_movements_immutable
  BEFORE UPDATE OR DELETE ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_inventory_movements_mutation();

CREATE OR REPLACE FUNCTION public.apply_supplier_invoice_item_stock(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.supplier_invoice_items%ROWTYPE;
  v_invoice public.supplier_invoices%ROWTYPE;
  v_new_stock integer;
  v_unit_cost_usd numeric(12,2);
BEGIN
  SELECT * INTO v_item
  FROM public.supplier_invoice_items
  WHERE id = p_item_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT * INTO v_invoice
  FROM public.supplier_invoices
  WHERE id = v_item.supplier_invoice_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_invoice.status NOT IN ('confirmed', 'received') OR v_invoice.payment_status = 'cancelled' THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE origin_type = 'supplier_purchase'
      AND origin_id = v_item.id
      AND quantity_delta > 0
  ) THEN
    RETURN;
  END IF;

  IF v_invoice.currency = 'USD' THEN
    v_unit_cost_usd := v_item.unit_cost;
  ELSE
    v_unit_cost_usd := ROUND(v_item.unit_cost / v_invoice.exchange_rate, 2);
  END IF;

  UPDATE public.products
  SET
    stock_quantity = stock_quantity + v_item.quantity_received,
    cost_price_usd = v_unit_cost_usd
  WHERE id = v_item.product_id
  RETURNING stock_quantity INTO v_new_stock;

  INSERT INTO public.inventory_movements (
    product_id,
    origin_type,
    origin_id,
    quantity_delta,
    resulting_stock,
    cost_snapshot,
    created_by
  ) VALUES (
    v_item.product_id,
    'supplier_purchase',
    v_item.id,
    v_item.quantity_received,
    v_new_stock,
    v_unit_cost_usd,
    COALESCE(v_invoice.user_id, (SELECT auth.uid()))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_supplier_invoice_item_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.apply_supplier_invoice_item_stock(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supplier_invoice_items_after_insert ON public.supplier_invoice_items;
CREATE TRIGGER trg_supplier_invoice_items_after_insert
  AFTER INSERT ON public.supplier_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_supplier_invoice_item_insert();

CREATE OR REPLACE FUNCTION public.handle_supplier_invoice_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_new_stock integer;
  v_cost_snapshot numeric(12,2);
BEGIN
  IF NEW.status IN ('confirmed', 'received')
     AND NEW.payment_status <> 'cancelled'
     AND (OLD.status NOT IN ('confirmed', 'received') OR OLD.payment_status = 'cancelled') THEN
    FOR v_item IN
      SELECT id
      FROM public.supplier_invoice_items
      WHERE supplier_invoice_id = NEW.id
      ORDER BY created_at ASC, id ASC
    LOOP
      PERFORM public.apply_supplier_invoice_item_stock(v_item.id);
    END LOOP;
  END IF;

  IF (NEW.status = 'cancelled' AND OLD.status <> 'cancelled')
     OR (NEW.payment_status = 'cancelled' AND OLD.payment_status <> 'cancelled') THEN
    FOR v_item IN
      SELECT i.id, i.product_id, i.quantity_received, m.cost_snapshot
      FROM public.supplier_invoice_items i
      INNER JOIN public.inventory_movements m
        ON m.origin_type = 'supplier_purchase'
       AND m.origin_id = i.id
       AND m.quantity_delta > 0
      WHERE i.supplier_invoice_id = NEW.id
        AND NOT EXISTS (
          SELECT 1
          FROM public.inventory_movements rev
          WHERE rev.origin_type = 'supplier_purchase'
            AND rev.origin_id = i.id
            AND rev.quantity_delta < 0
        )
      ORDER BY i.created_at ASC, i.id ASC
    LOOP
      UPDATE public.products
      SET stock_quantity = stock_quantity - v_item.quantity_received
      WHERE id = v_item.product_id
      RETURNING stock_quantity INTO v_new_stock;

      v_cost_snapshot := v_item.cost_snapshot;

      INSERT INTO public.inventory_movements (
        product_id,
        origin_type,
        origin_id,
        quantity_delta,
        resulting_stock,
        cost_snapshot,
        created_by
      ) VALUES (
        v_item.product_id,
        'supplier_purchase',
        v_item.id,
        -v_item.quantity_received,
        v_new_stock,
        v_cost_snapshot,
        COALESCE(NEW.user_id, (SELECT auth.uid()))
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supplier_invoices_status_change ON public.supplier_invoices;
CREATE TRIGGER trg_supplier_invoices_status_change
  AFTER UPDATE OF status, payment_status ON public.supplier_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_supplier_invoice_status_change();

-- 1.9 Row Level Security (RLS) & Permissions
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchase_orders_admin_manager_all" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_order_items_admin_manager_all" ON public.purchase_order_items;
DROP POLICY IF EXISTS "supplier_invoices_admin_manager_all" ON public.supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoice_items_admin_manager_all" ON public.supplier_invoice_items;
DROP POLICY IF EXISTS "inventory_movements_admin_manager_select" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_admin_manager_insert" ON public.inventory_movements;

CREATE POLICY "purchase_orders_admin_manager_all" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "purchase_order_items_admin_manager_all" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "supplier_invoices_admin_manager_all" ON public.supplier_invoices
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "supplier_invoice_items_admin_manager_all" ON public.supplier_invoice_items
  FOR ALL TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role)
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "inventory_movements_admin_manager_select" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

CREATE POLICY "inventory_movements_admin_manager_insert" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.purchase_orders,
  public.purchase_order_items,
  public.supplier_invoices,
  public.supplier_invoice_items
TO authenticated, service_role;

GRANT SELECT, INSERT ON TABLE public.inventory_movements TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.sync_products_inventory_columns(),
  public.prevent_inventory_movements_mutation(),
  public.apply_supplier_invoice_item_stock(uuid),
  public.handle_supplier_invoice_item_insert(),
  public.handle_supplier_invoice_status_change()
TO authenticated, service_role;

-- ==============================================================================
-- PART 2: SEED DATA (Suppliers, Products, Purchase Orders, Invoices & Movements)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id    uuid := 'a0000000-0000-0000-0000-000000000001';
  v_manager_id  uuid := 'a0000000-0000-0000-0000-000000000002';
  v_branch_1    uuid := 'b0000000-0000-0000-0000-000000000001';

  v_brand_apple   uuid := '10000000-0000-0000-0000-000000000001';
  v_brand_spigen  uuid := '10000000-0000-0000-0000-000000000002';
  v_brand_anker   uuid := '10000000-0000-0000-0000-000000000003';

  v_supplier_1 uuid := '20000000-0000-0000-0000-000000000001';
  v_supplier_2 uuid := '20000000-0000-0000-0000-000000000002';
  v_supplier_3 uuid := '20000000-0000-0000-0000-000000000003';

  v_prod_magsafe_case   uuid := '30000000-0000-0000-0000-000000000001';
  v_prod_tempered_glass uuid := '30000000-0000-0000-0000-000000000002';
  v_prod_usbc_cable     uuid := '30000000-0000-0000-0000-000000000003';
  v_prod_iphone_battery uuid := '30000000-0000-0000-0000-000000000004';

  v_po_1 uuid := '40000000-0000-0000-0000-000000000001';
  v_po_2 uuid := '40000000-0000-0000-0000-000000000002';

  v_po_item_1 uuid := '41000000-0000-0000-0000-000000000001';
  v_po_item_2 uuid := '41000000-0000-0000-0000-000000000002';
  v_po_item_3 uuid := '41000000-0000-0000-0000-000000000003';

  v_inv_1 uuid := '50000000-0000-0000-0000-000000000001';
  v_inv_2 uuid := '50000000-0000-0000-0000-000000000002';

  v_inv_item_1 uuid := '51000000-0000-0000-0000-000000000001';
  v_inv_item_2 uuid := '51000000-0000-0000-0000-000000000002';
  v_inv_item_3 uuid := '51000000-0000-0000-0000-000000000003';
BEGIN
  -- Ensure admin and manager test users exist if seed.sql has not been run yet
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  )
  VALUES
    (
      v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@pos.local',
      crypt('admin123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin","first_name":"Super","last_name":"Admin"}',
      'authenticated', 'authenticated', now(), now()
    ),
    (
      v_manager_id, '00000000-0000-0000-0000-000000000000', 'manager_suc1@pos.local',
      crypt('manager123', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"manager","first_name":"Martin","last_name":"Manager","branch_id":"b0000000-0000-0000-0000-000000000001"}',
      'authenticated', 'authenticated', now(), now()
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_profiles (id, email, first_name, last_name, role, branch_id, status)
  VALUES
    (v_admin_id, 'admin@pos.local', 'Super', 'Admin', 'admin', NULL, true),
    (v_manager_id, 'manager_suc1@pos.local', 'Martin', 'Manager', 'manager', v_branch_1, true)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;

  -- Brands
  INSERT INTO public.brands (id, name, is_active)
  VALUES
    (v_brand_apple,  'Apple',  true),
    (v_brand_spigen, 'Spigen', true),
    (v_brand_anker,  'Anker',  true)
  ON CONFLICT (name) DO NOTHING;

  -- Select brand IDs in case they already existed with different UUIDs
  SELECT id INTO v_brand_apple  FROM public.brands WHERE name = 'Apple'  LIMIT 1;
  SELECT id INTO v_brand_spigen FROM public.brands WHERE name = 'Spigen' LIMIT 1;
  SELECT id INTO v_brand_anker  FROM public.brands WHERE name = 'Anker'  LIMIT 1;

  -- 3 Wholesale Suppliers with Argentine CUITs
  INSERT INTO public.suppliers (
    id, company_name, tax_id, contact_name, email, phone, address, is_active
  )
  VALUES
    (
      v_supplier_1,
      'Distribuidora Celular SA',
      '30-71458923-4',
      'Mariano Gomez',
      'ventas@distribuidoracelular.com.ar',
      '+54 11 4321-8890',
      'Av. Corrientes 2450, CABA',
      true
    ),
    (
      v_supplier_2,
      'Importadora Once Tech SRL',
      '30-71682341-9',
      'Luciana Fernandez',
      'mayorista@oncetech.com.ar',
      '+54 11 4951-3342',
      'Pasteur 412, CABA',
      true
    ),
    (
      v_supplier_3,
      'Repuestos Moviles Argentina SA',
      '30-70994125-7',
      'Roberto Sanchez',
      'pedidos@repuestosmoviles.com.ar',
      '+54 11 5234-9901',
      'Lavalle 1890, CABA',
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    tax_id = EXCLUDED.tax_id,
    is_active = EXCLUDED.is_active;

  -- Products
  INSERT INTO public.products (
    id, brand_id, product_code, name, description,
    stock, stock_quantity, purchase_price, cost_price_usd, sale_price, is_active
  )
  VALUES
    (
      v_prod_magsafe_case, v_brand_spigen, '7798001000011',
      'Funda Armor MagSafe Titanio',
      'Funda reforzada con anillo MagSafe para iPhone 15 Pro Max',
      10, 10, 8.00, 8.00, 18.00, true
    ),
    (
      v_prod_tempered_glass, v_brand_spigen, '7798001000028',
      'Vidrio Templado 9D Full Glue iPhone 15',
      'Protector de pantalla oleofobico bordes curvos 9H',
      30, 30, 1.80, 1.80, 6.00, true
    ),
    (
      v_prod_usbc_cable, v_brand_anker, '7798001000035',
      'Cable USB-C a USB-C Mallado 60W 1.8m',
      'Cable de carga rapida PowerLine III mallado en nylon',
      20, 20, 4.20, 4.20, 11.50, true
    ),
    (
      v_prod_iphone_battery, v_brand_apple, '7798001000042',
      'Bateria Reemplazo Original iPhone 13 3227mAh',
      'Repuesto celda Li-Ion con flex diagnosticable',
      5, 5, 16.00, 16.00, 42.00, true
    )
  ON CONFLICT (id) DO NOTHING;

  -- Purchase Orders
  INSERT INTO public.purchase_orders (
    id, order_number, supplier_id, user_id, branch_id,
    status, expected_date, total_amount_usd, total_amount_ars, notes
  )
  VALUES
    (
      v_po_1, 'PO-2026-0001', v_supplier_1, v_admin_id, v_branch_1,
      'received', CURRENT_DATE - INTERVAL '3 days', 217.50, 261000.00,
      'Reposicion mensual fundas MagSafe y vidrios templados'
    ),
    (
      v_po_2, 'PO-2026-0002', v_supplier_2, v_manager_id, v_branch_1,
      'partially_received', CURRENT_DATE + INTERVAL '2 days', 250.00, 300000.00,
      'Pedido cables carga rapida Anker y baterias iPhone 13'
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.purchase_order_items (
    id, purchase_order_id, product_id,
    quantity_ordered, quantity_received, expected_unit_cost_usd
  )
  VALUES
    (v_po_item_1, v_po_1, v_prod_magsafe_case,   15, 15, 8.50),
    (v_po_item_2, v_po_1, v_prod_tempered_glass, 50, 50, 1.80),
    (v_po_item_3, v_po_2, v_prod_usbc_cable,     25, 25, 4.50)
  ON CONFLICT (id) DO NOTHING;

  -- Supplier Invoices & Items (Triggers automatically update stock, cost_price_usd, and inventory_movements)
  INSERT INTO public.supplier_invoices (
    id, supplier_id, purchase_order_id, user_id, branch_id,
    invoice_number, invoice_date, reception_date,
    currency, exchange_rate, subtotal, tax_amount, total_amount,
    status, payment_status, notes
  )
  VALUES
    (
      v_inv_1, v_supplier_1, v_po_1, v_admin_id, v_branch_1,
      'FC-0001-00048291', CURRENT_DATE - INTERVAL '2 days', now() - INTERVAL '2 days',
      'USD', 1200.0000, 217.50, 0.00, 217.50,
      'received', 'paid', 'Factura mayorista Distribuidora Celular SA recibida completa'
    ),
    (
      v_inv_2, v_supplier_2, v_po_2, v_manager_id, v_branch_1,
      'FC-0004-00019302', CURRENT_DATE - INTERVAL '1 day', now() - INTERVAL '1 day',
      'USD', 1215.5000, 112.50, 0.00, 112.50,
      'received', 'pending', 'Recepcion parcial cables USB-C Anker 60W'
    )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.supplier_invoice_items (
    id, supplier_invoice_id, product_id,
    quantity_received, unit_cost, subtotal
  )
  VALUES
    (v_inv_item_1, v_inv_1, v_prod_magsafe_case,   15, 8.50, 127.50),
    (v_inv_item_2, v_inv_1, v_prod_tempered_glass, 50, 1.80,  90.00),
    (v_inv_item_3, v_inv_2, v_prod_usbc_cable,     25, 4.50, 112.50)
  ON CONFLICT (id) DO NOTHING;
END $$;

COMMIT;

