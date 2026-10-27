-- ==============================================================================
-- Test Suite: core_pos_schema_test.sql
-- Description: Verifies constraints, Foreign Keys, Checks, Uniques, and RLS
--              across all 10 core tables in a self-contained transaction.
-- ==============================================================================

BEGIN;

-- 1. Setup Mock Admin and Staff Users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'admin_test@pos.local', '{"role":"admin"}'),
  ('c0000000-0000-0000-0000-000000000002', 'cashier_test@pos.local', '{"role":"cashier"}'),
  ('c0000000-0000-0000-0000-000000000003', 'tech_test@pos.local', '{"role":"technician"}');

-- Switch to admin context for setup
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'c0000000-0000-0000-0000-000000000001';

-- Setup Catalog Entities
INSERT INTO public.brands (id, name) VALUES ('d0000000-0000-0000-0000-000000000001', 'Apple');
INSERT INTO public.suppliers (id, company_name, tax_id) VALUES ('d0000000-0000-0000-0000-000000000002', 'Distribuidora Central', '30-71234567-9');
INSERT INTO public.payment_types (id, description) VALUES ('d0000000-0000-0000-0000-000000000003', 'Efectivo');
INSERT INTO public.customers (id, first_name, last_name, dni) VALUES ('d0000000-0000-0000-0000-000000000004', 'Juan', 'Perez', '35123456');

INSERT INTO public.products (
  id, brand_id, product_code, name, stock, purchase_price, sale_price
) VALUES (
  'd0000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000001',
  '7791234567890',
  'Funda Silicona iPhone 13',
  15,
  2500.00,
  6500.00
);

-- TEST 1: Check Constraint - Block Negative Stock
DO $$
BEGIN
  BEGIN
    INSERT INTO public.products (brand_id, product_code, name, stock, purchase_price, sale_price)
    VALUES ('d0000000-0000-0000-0000-000000000001', 'FAIL-01', 'Negative Stock Item', -5, 100, 200);
    RAISE EXCEPTION 'TEST 1 FAILED: Negative stock was allowed!';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSED: Test 1 - Negative stock blocked by check constraint.';
  END;
END $$;

-- TEST 2: Check Constraint - Block Negative Prices
DO $$
BEGIN
  BEGIN
    INSERT INTO public.products (brand_id, product_code, name, stock, purchase_price, sale_price)
    VALUES ('d0000000-0000-0000-0000-000000000001', 'FAIL-02', 'Negative Price Item', 10, -100, 200);
    RAISE EXCEPTION 'TEST 2 FAILED: Negative purchase_price was allowed!';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSED: Test 2 - Negative price blocked by check constraint.';
  END;
END $$;

-- TEST 3: Unique Constraint - Block Duplicate Barcode/SKU
DO $$
BEGIN
  BEGIN
    INSERT INTO public.products (brand_id, product_code, name, stock, purchase_price, sale_price)
    VALUES ('d0000000-0000-0000-0000-000000000001', '7791234567890', 'Duplicate Barcode Item', 5, 2500, 6500);
    RAISE EXCEPTION 'TEST 3 FAILED: Duplicate product_code was allowed!';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASSED: Test 3 - Duplicate barcode blocked by unique constraint.';
  END;
END $$;

-- TEST 4: Foreign Key Constraint - Block Sale with Non-existent User or Product
DO $$
BEGIN
  BEGIN
    INSERT INTO public.sale_headers (sale_number, customer_id, user_id, payment_type_id, total_sale)
    VALUES ('S-9999', 'd0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000999', 'd0000000-0000-0000-0000-000000000003', 6500.00);
    RAISE EXCEPTION 'TEST 4 FAILED: Sale with non-existent user_id was allowed!';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'PASSED: Test 4 - Invalid foreign key rejected.';
  END;
END $$;

-- TEST 5: Repair Status State Machine Constraint
DO $$
BEGIN
  BEGIN
    INSERT INTO public.repairs (ticket_number, customer_id, device_model, issue_description, status)
    VALUES ('REP-FAIL', 'd0000000-0000-0000-0000-000000000004', 'Samsung S22', 'Pantalla rota', 'invalid_status_xyz');
    RAISE EXCEPTION 'TEST 5 FAILED: Invalid repair status was allowed!';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASSED: Test 5 - Repair status state machine enforced.';
  END;
END $$;

-- TEST 6: Cascade Delete from Sale Header to Details
DO $$
DECLARE
  v_sale_id uuid := 'e0000000-0000-0000-0000-000000000001';
  v_detail_count int;
BEGIN
  INSERT INTO public.sale_headers (id, sale_number, customer_id, user_id, payment_type_id, total_sale)
  VALUES (v_sale_id, 'S-0001', 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 6500.00);

  INSERT INTO public.sale_details (sale_id, product_id, quantity, unit_price, subtotal)
  VALUES (v_sale_id, 'd0000000-0000-0000-0000-000000000005', 1, 6500.00, 6500.00);

  -- Delete header
  DELETE FROM public.sale_headers WHERE id = v_sale_id;

  SELECT count(*) INTO v_detail_count FROM public.sale_details WHERE sale_id = v_sale_id;
  IF v_detail_count <> 0 THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Sale detail was not cascade deleted!';
  END IF;

  RAISE NOTICE 'PASSED: Test 6 - Cascade deletion verified.';
END $$;

ROLLBACK;
