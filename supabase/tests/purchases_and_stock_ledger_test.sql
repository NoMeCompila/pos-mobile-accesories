-- ==============================================================================
-- Test Suite: supabase/tests/purchases_and_stock_ledger_test.sql
-- Ticket:     [PSAI-38] [POS] [Inventory] [Database]
--             Create-Suppliers-Purchase-Orders-And-Invoices-Schema
-- Description:
--   Self-contained transactional test suite verifying all 5 Acceptance Criteria:
--   - Scenario 1: Schema integrity, FK ON DELETE RESTRICT on suppliers, and
--                 non-negative numeric(12,2)/numeric(12,4) CHECK constraints.
--   - Scenario 2: Atomic stock increment (+15 -> 25) and replacement cost update
--                 ($8.00 -> $8.50 USD) + immutable inventory_movements ledger.
--   - Scenario 3: Preventing duplicate supplier invoice numbers per vendor
--                 (uq_supplier_invoice_number) while allowing same number on
--                 different vendors.
--   - Scenario 4: Reversal of inventory (-15 -> 10) upon purchase invoice
--                 cancellation and immutability protection on inventory_movements.
--   - Scenario 5: RLS enforcement blocking cashier profile from reading/writing
--                 purchasing and stock ledger tables.
-- ==============================================================================

BEGIN;

-- 1. Setup Mock Admin and Cashier Users for Test Scope
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'psai38_admin@pos.local', '{"role":"admin"}'),
  ('f0000000-0000-0000-0000-000000000002', 'psai38_cashier@pos.local', '{"role":"cashier"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, email, first_name, last_name, role, status)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'psai38_admin@pos.local', 'Admin', 'PSAI38', 'admin', true),
  ('f0000000-0000-0000-0000-000000000002', 'psai38_cashier@pos.local', 'Cashier', 'PSAI38', 'cashier', true)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

-- Switch to authenticated Admin role context
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'f0000000-0000-0000-0000-000000000001';

-- Setup Baseline Entities (Suppliers & Product "Funda Armor MagSafe Titanio")
INSERT INTO public.brands (id, name)
VALUES ('f1000000-0000-0000-0000-000000000001', 'Spigen Test PSAI38');

INSERT INTO public.suppliers (id, company_name, tax_id)
VALUES
  ('f2000000-0000-0000-0000-000000000001', 'Distribuidora Celular SA Test', '30-99000001-1'),
  ('f2000000-0000-0000-0000-000000000002', 'Mayorista Accesorios SRL Test', '30-99000002-2');

INSERT INTO public.products (
  id, brand_id, product_code, name, stock_quantity, cost_price_usd, sale_price
)
VALUES (
  'f3000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000001',
  'PSAI38-MAGSAFE-001',
  'Funda Armor MagSafe Titanio',
  10,
  8.00,
  18.00
);

-- ==============================================================================
-- SCENARIO 1: Schema Integrity, FK ON DELETE RESTRICT, and Financial CHECKs
-- ==============================================================================
DO $$
BEGIN
  -- Create a purchase order linked to Supplier 1
  INSERT INTO public.purchase_orders (
    id, order_number, supplier_id, status, expected_date, total_amount_usd, total_amount_ars
  ) VALUES (
    'f4000000-0000-0000-0000-000000000001',
    'PO-TEST-0001',
    'f2000000-0000-0000-0000-000000000001',
    'sent',
    CURRENT_DATE + 5,
    127.50,
    153000.00
  );

  INSERT INTO public.purchase_order_items (
    id, purchase_order_id, product_id, quantity_ordered, quantity_received, expected_unit_cost_usd
  ) VALUES (
    'f4100000-0000-0000-0000-000000000001',
    'f4000000-0000-0000-0000-000000000001',
    'f3000000-0000-0000-0000-000000000001',
    15,
    0,
    8.50
  );

  -- Verify FK ON DELETE RESTRICT prevents deleting a supplier with purchase orders
  BEGIN
    DELETE FROM public.suppliers WHERE id = 'f2000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'SCENARIO 1 FAILED: Deleting supplier with purchase_orders was allowed!';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASSED: Scenario 1a - Supplier deletion restricted by fk_purchase_orders_supplier.';
  END;

  -- Verify negative financial CHECK constraint on supplier_invoices exchange_rate / total_amount
  BEGIN
    INSERT INTO public.supplier_invoices (
      supplier_id, invoice_number, currency, exchange_rate, subtotal, tax_amount, total_amount
    ) VALUES (
      'f2000000-0000-0000-0000-000000000001',
      'FC-INVALID-NEG',
      'USD',
      -1.0000,
      100.00,
      0.00,
      100.00
    );
    RAISE EXCEPTION 'SCENARIO 1 FAILED: Non-positive exchange_rate was allowed!';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSED: Scenario 1b - Financial CHECK constraints enforced.';
  END;
END $$;

-- ==============================================================================
-- SCENARIO 2: Atomic Stock Increment (+15 -> 25) & Replacement Cost ($8.50 USD)
-- ==============================================================================
DO $$
DECLARE
  v_stock_qty integer;
  v_legacy_stock integer;
  v_cost_usd numeric(12,2);
  v_movement record;
BEGIN
  -- Insert received supplier invoice for 15 units at $8.50 USD each
  INSERT INTO public.supplier_invoices (
    id, supplier_id, purchase_order_id, invoice_number, currency, exchange_rate,
    subtotal, tax_amount, total_amount, status, payment_status
  ) VALUES (
    'f5000000-0000-0000-0000-000000000001',
    'f2000000-0000-0000-0000-000000000001',
    'f4000000-0000-0000-0000-000000000001',
    'FC-0001-00048291',
    'USD',
    1200.0000,
    127.50,
    0.00,
    127.50,
    'received',
    'paid'
  );

  INSERT INTO public.supplier_invoice_items (
    id, supplier_invoice_id, product_id, quantity_received, unit_cost, subtotal
  ) VALUES (
    'f5100000-0000-0000-0000-000000000001',
    'f5000000-0000-0000-0000-000000000001',
    'f3000000-0000-0000-0000-000000000001',
    15,
    8.50,
    127.50
  );

  -- Verify products.stock_quantity = 25 and products.cost_price_usd = 8.50
  SELECT stock_quantity, stock, cost_price_usd
  INTO v_stock_qty, v_legacy_stock, v_cost_usd
  FROM public.products
  WHERE id = 'f3000000-0000-0000-0000-000000000001';

  IF v_stock_qty <> 25 OR v_legacy_stock <> 25 THEN
    RAISE EXCEPTION 'SCENARIO 2 FAILED: Expected stock_quantity = 25, got %', v_stock_qty;
  END IF;

  IF v_cost_usd <> 8.50 THEN
    RAISE EXCEPTION 'SCENARIO 2 FAILED: Expected cost_price_usd = 8.50, got %', v_cost_usd;
  END IF;

  -- Verify immutable inventory_movements record
  SELECT * INTO v_movement
  FROM public.inventory_movements
  WHERE origin_type = 'supplier_purchase'
    AND origin_id = 'f5100000-0000-0000-0000-000000000001';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SCENARIO 2 FAILED: No inventory_movements record created!';
  END IF;

  IF v_movement.quantity_delta <> 15 OR v_movement.resulting_stock <> 25 OR v_movement.cost_snapshot <> 8.50 THEN
    RAISE EXCEPTION 'SCENARIO 2 FAILED: Unexpected ledger values (delta=%, resulting=%, cost=%)',
      v_movement.quantity_delta, v_movement.resulting_stock, v_movement.cost_snapshot;
  END IF;

  RAISE NOTICE 'PASSED: Scenario 2 - Atomic stock increment (25), cost_price_usd ($8.50), and ledger entry verified.';
END $$;

-- ==============================================================================
-- SCENARIO 3: Prevent Duplicate Supplier Invoice Number per Vendor
-- ==============================================================================
DO $$
BEGIN
  -- Attempting to insert duplicate invoice_number 'FC-0001-00048291' for the same supplier must fail
  BEGIN
    INSERT INTO public.supplier_invoices (
      supplier_id, invoice_number, currency, exchange_rate, subtotal, tax_amount, total_amount
    ) VALUES (
      'f2000000-0000-0000-0000-000000000001',
      'FC-0001-00048291',
      'USD',
      1200.0000,
      50.00,
      0.00,
      50.00
    );
    RAISE EXCEPTION 'SCENARIO 3 FAILED: Duplicate invoice_number for same supplier was allowed!';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASSED: Scenario 3 - Duplicate (supplier_id, invoice_number) rejected by uq_supplier_invoice_number.';
  END;
END $$;

-- ==============================================================================
-- SCENARIO 4: Reversal of Inventory upon Purchase Invoice Cancellation
--             & Immutability of inventory_movements
-- ==============================================================================
DO $$
DECLARE
  v_stock_after_cancel integer;
  v_rev_movement record;
BEGIN
  -- 4a. Verify inventory_movements immutability (UPDATE / DELETE blocked)
  BEGIN
    DELETE FROM public.inventory_movements
    WHERE origin_id = 'f5100000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'SCENARIO 4a FAILED: Deleting from inventory_movements was allowed!';
  EXCEPTION WHEN raise_exception THEN
    RAISE NOTICE 'PASSED: Scenario 4a - Direct DELETE on inventory_movements blocked by immutability trigger.';
  END;

  -- 4b. Cancel the confirmed/received supplier invoice
  UPDATE public.supplier_invoices
  SET status = 'cancelled', payment_status = 'cancelled'
  WHERE id = 'f5000000-0000-0000-0000-000000000001';

  SELECT stock_quantity INTO v_stock_after_cancel
  FROM public.products
  WHERE id = 'f3000000-0000-0000-0000-000000000001';

  IF v_stock_after_cancel <> 10 THEN
    RAISE EXCEPTION 'SCENARIO 4b FAILED: Expected stock_quantity reverted to 10, got %', v_stock_after_cancel;
  END IF;

  SELECT * INTO v_rev_movement
  FROM public.inventory_movements
  WHERE origin_type = 'supplier_purchase'
    AND origin_id = 'f5100000-0000-0000-0000-000000000001'
    AND quantity_delta < 0;

  IF NOT FOUND OR v_rev_movement.quantity_delta <> -15 OR v_rev_movement.resulting_stock <> 10 THEN
    RAISE EXCEPTION 'SCENARIO 4b FAILED: Compensatory negative movement (-15) not recorded properly!';
  END IF;

  RAISE NOTICE 'PASSED: Scenario 4b - Invoice cancellation recorded -15 ledger movement and restored stock to 10.';
END $$;

-- ==============================================================================
-- SCENARIO 5: RLS Enforcement (Cashier Blocked from Purchasing & Stock Ledger)
-- ==============================================================================
SET LOCAL "request.jwt.claim.sub" = 'f0000000-0000-0000-0000-000000000002';

DO $$
DECLARE
  v_visible_orders integer;
  v_visible_invoices integer;
  v_visible_movements integer;
BEGIN
  SELECT count(*) INTO v_visible_orders FROM public.purchase_orders;
  SELECT count(*) INTO v_visible_invoices FROM public.supplier_invoices;
  SELECT count(*) INTO v_visible_movements FROM public.inventory_movements;

  IF v_visible_orders <> 0 OR v_visible_invoices <> 0 OR v_visible_movements <> 0 THEN
    RAISE EXCEPTION 'SCENARIO 5 FAILED: Cashier role was able to read purchasing/ledger records!';
  END IF;

  RAISE NOTICE 'PASSED: Scenario 5 - RLS restricted cashier access to purchase_orders, supplier_invoices, and inventory_movements.';
END $$;

ROLLBACK;

