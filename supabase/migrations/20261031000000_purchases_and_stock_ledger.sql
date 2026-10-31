-- ==============================================================================
-- Migration: 20261031000000_purchases_and_stock_ledger.sql
-- Ticket:    [PSAI-38] [POS] [Inventory] [Database]
--            Create-Suppliers-Purchase-Orders-And-Invoices-Schema
-- Description:
--   1. Drops legacy unused tables (purchase_details, purchase_headers).
--   2. Aligns public.products with stock_quantity and cost_price_usd columns
--      plus bidirectional synchronization trigger for backward compatibility.
--   3. Creates purchase_orders, purchase_order_items, supplier_invoices,
--      supplier_invoice_items, and immutable inventory_movements ledger.
--   4. Configures atomic stock increment, replacement cost update, and
--      invoice cancellation reversal triggers.
--   5. Enforces Row Level Security (RLS) policies and role permissions.
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: DROP LEGACY PURCHASE TABLES
-- ==============================================================================
DROP TABLE IF EXISTS public.purchase_details CASCADE;
DROP TABLE IF EXISTS public.purchase_headers CASCADE;

-- ==============================================================================
-- SECTION 2: ALIGN PRODUCTS TABLE FOR STOCK QUANTITY & USD REPLACEMENT COST
-- ==============================================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_price_usd numeric(12,2) NOT NULL DEFAULT 0.00;

-- Backfill existing rows so stock_quantity and cost_price_usd match baseline values
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

-- Bidirectional synchronization trigger so queries/tests reading or writing either
-- (stock, purchase_price) or (stock_quantity, cost_price_usd) stay consistent.
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

-- ==============================================================================
-- SECTION 3: PURCHASING & STOCK LEDGER RELATIONAL TABLES
-- ==============================================================================

-- 3.1 PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  supplier_id uuid NOT NULL,
  user_id uuid DEFAULT (SELECT auth.uid()),
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

-- 3.2 PURCHASE ORDER ITEMS
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

-- 3.3 SUPPLIER INVOICES
CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id uuid DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  purchase_order_id uuid,
  user_id uuid DEFAULT (SELECT auth.uid()),
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

-- 3.4 SUPPLIER INVOICE ITEMS
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

-- 3.5 INVENTORY MOVEMENTS (IMMUTABLE STOCK LEDGER)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  origin_type text NOT NULL,
  origin_id uuid NOT NULL,
  quantity_delta integer NOT NULL,
  resulting_stock integer NOT NULL,
  cost_snapshot numeric(12,2) NOT NULL DEFAULT 0.00,
  created_by uuid DEFAULT (SELECT auth.uid()),
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

-- ==============================================================================
-- SECTION 4: IMMUTABILITY & AUTOMATED STOCK / REPLACEMENT COST TRIGGERS
-- ==============================================================================

-- 4.1 Enforce append-only immutability on inventory_movements
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

-- 4.2 Atomic helper function to post a single supplier_invoice_item into stock & ledger
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

  -- Only apply stock if the invoice is in 'confirmed' or 'received' state and not cancelled
  IF v_invoice.status NOT IN ('confirmed', 'received') OR v_invoice.payment_status = 'cancelled' THEN
    RETURN;
  END IF;

  -- Idempotency check: skip if this invoice item already generated a positive supplier_purchase movement
  IF EXISTS (
    SELECT 1
    FROM public.inventory_movements
    WHERE origin_type = 'supplier_purchase'
      AND origin_id = v_item.id
      AND quantity_delta > 0
  ) THEN
    RETURN;
  END IF;

  -- Normalize unit cost to USD according to the parent invoice currency and exchange rate
  IF v_invoice.currency = 'USD' THEN
    v_unit_cost_usd := v_item.unit_cost;
  ELSE
    v_unit_cost_usd := ROUND(v_item.unit_cost / v_invoice.exchange_rate, 2);
  END IF;

  -- Atomically lock and update the product's stock_quantity and replacement cost_price_usd
  UPDATE public.products
  SET
    stock_quantity = stock_quantity + v_item.quantity_received,
    cost_price_usd = v_unit_cost_usd
  WHERE id = v_item.product_id
  RETURNING stock_quantity INTO v_new_stock;

  -- Record the immutable stock ledger entry
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

-- 4.3 Trigger when a line item is inserted into an already confirmed/received invoice
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

-- 4.4 Trigger when supplier_invoices status or payment_status changes (reception or cancellation reversal)
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
  -- Case A: Invoice transitions to confirmed/received (and is not cancelled)
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

  -- Case B: Invoice transitions to cancelled (either status = 'cancelled' or payment_status = 'cancelled')
  IF (NEW.status = 'cancelled' AND OLD.status <> 'cancelled')
     OR (NEW.payment_status = 'cancelled' AND OLD.payment_status <> 'cancelled') THEN

    -- Keep status and payment_status aligned on cancellation
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
      -- Atomically decrement product stock
      UPDATE public.products
      SET stock_quantity = stock_quantity - v_item.quantity_received
      WHERE id = v_item.product_id
      RETURNING stock_quantity INTO v_new_stock;

      v_cost_snapshot := v_item.cost_snapshot;

      -- Append compensatory negative movement to the immutable ledger
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

-- ==============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES & TABLE PERMISSIONS
-- ==============================================================================

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-applied
DROP POLICY IF EXISTS "purchase_orders_admin_manager_all" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_order_items_admin_manager_all" ON public.purchase_order_items;
DROP POLICY IF EXISTS "supplier_invoices_admin_manager_all" ON public.supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoice_items_admin_manager_all" ON public.supplier_invoice_items;
DROP POLICY IF EXISTS "inventory_movements_admin_manager_select" ON public.inventory_movements;
DROP POLICY IF EXISTS "inventory_movements_admin_manager_insert" ON public.inventory_movements;

-- 5.1 PURCHASE ORDERS (Admin & Manager full access; Cashier/Tech/Customer denied)
CREATE POLICY "purchase_orders_admin_manager_all" ON public.purchase_orders
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  )
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 5.2 PURCHASE ORDER ITEMS (Admin & Manager full access)
CREATE POLICY "purchase_order_items_admin_manager_all" ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  )
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 5.3 SUPPLIER INVOICES (Admin & Manager full access)
CREATE POLICY "supplier_invoices_admin_manager_all" ON public.supplier_invoices
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  )
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 5.4 SUPPLIER INVOICE ITEMS (Admin & Manager full access)
CREATE POLICY "supplier_invoice_items_admin_manager_all" ON public.supplier_invoice_items
  FOR ALL TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  )
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 5.5 INVENTORY MOVEMENTS (Append-only ledger: Admin & Manager read/insert)
CREATE POLICY "inventory_movements_admin_manager_select" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

CREATE POLICY "inventory_movements_admin_manager_insert" ON public.inventory_movements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
  );

-- 5.6 Explicit Grants (compatible with revoked default privileges in 20261028050143_remote_schema.sql)
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

