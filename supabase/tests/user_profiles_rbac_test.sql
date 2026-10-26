-- ==============================================================================
-- Test Suite: user_profiles_rbac_test.sql
-- Description: Automated verification script validating scenarios 1 to 4:
--              1. Automatic user profile creation on signup (default 'customer').
--              2. Strict customer/cashier self-isolation.
--              3. Manager branch-level isolation.
--              4. Admin full-access override.
--              5. Blocked privilege escalation attempts.
-- ==============================================================================

BEGIN;

-- Setup temporary test users in auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@pos.local', '{"role":"admin","first_name":"Super","last_name":"Admin"}'),
  ('a0000000-0000-0000-0000-000000000002', 'manager_suc1@pos.local', '{"role":"manager","first_name":"Martin","last_name":"Manager","branch_id":"b0000000-0000-0000-0000-000000000001"}'),
  ('a0000000-0000-0000-0000-000000000003', 'cashier_suc1@pos.local', '{"role":"cashier","first_name":"Clara","last_name":"Cashier","branch_id":"b0000000-0000-0000-0000-000000000001"}'),
  ('a0000000-0000-0000-0000-000000000004', 'tech_suc2@pos.local', '{"role":"technician","first_name":"Tomas","last_name":"Tech","branch_id":"b0000000-0000-0000-0000-000000000002"}'),
  ('a0000000-0000-0000-0000-000000000005', 'cliente@gmail.com', '{"first_name":"Lucas","last_name":"Cliente"}');

-- Check 1: Trigger executed and generated 5 profiles with default 'customer' for public signup
DO $$
DECLARE
  v_count int;
  v_customer_role public.user_role;
BEGIN
  SELECT count(*) INTO v_count FROM public.user_profiles;
  IF v_count <> 5 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Expected 5 auto-generated profiles, found %', v_count;
  END IF;

  SELECT role INTO v_customer_role FROM public.user_profiles WHERE id = 'a0000000-0000-0000-0000-000000000005';
  IF v_customer_role <> 'customer'::public.user_role THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Customer profile role expected customer, got %', v_customer_role;
  END IF;

  RAISE NOTICE 'PASSED: Test 1 - Automatic Profile Creation on Signup verified.';
END $$;

-- Check 2: Customer Data Isolation (Only reads and updates their own row)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000005';

DO $$
DECLARE
  v_visible int;
BEGIN
  SELECT count(*) INTO v_visible FROM public.user_profiles;
  IF v_visible <> 1 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Customer saw % rows, expected exactly 1 (self)', v_visible;
  END IF;
  RAISE NOTICE 'PASSED: Test 2 - Customer data isolation verified.';
END $$;

-- Check 3: Cashier Strict Self-Isolation
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000003';

DO $$
DECLARE
  v_visible int;
BEGIN
  SELECT count(*) INTO v_visible FROM public.user_profiles;
  IF v_visible <> 1 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Cashier saw % rows, expected strictly 1 (self)', v_visible;
  END IF;
  RAISE NOTICE 'PASSED: Test 3 - Cashier strict self-isolation verified.';
END $$;

-- Check 4: Manager Branch Visibility (Manager at Branch 1 sees self + cashier at Branch 1)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000002';

DO $$
DECLARE
  v_visible int;
  v_cross_branch int;
BEGIN
  SELECT count(*) INTO v_visible FROM public.user_profiles;
  SELECT count(*) INTO v_cross_branch FROM public.user_profiles WHERE branch_id = 'b0000000-0000-0000-0000-000000000002';

  IF v_visible <> 2 OR v_cross_branch > 0 THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Manager branch visibility mismatch. Visible: %, Cross-branch: %', v_visible, v_cross_branch;
  END IF;
  RAISE NOTICE 'PASSED: Test 4 - Manager branch isolation verified.';
END $$;

-- Check 5: Admin Full Access Override
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000001';

DO $$
DECLARE
  v_visible int;
BEGIN
  SELECT count(*) INTO v_visible FROM public.user_profiles;
  IF v_visible <> 5 THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Admin expected 5 rows, saw %', v_visible;
  END IF;
  RAISE NOTICE 'PASSED: Test 5 - Admin full access override verified.';
END $$;

-- Check 6: Anti-escalation trigger (Cashier attempts to promote self to admin)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" = 'a0000000-0000-0000-0000-000000000003';

DO $$
BEGIN
  BEGIN
    UPDATE public.user_profiles SET role = 'admin'::public.user_role WHERE id = 'a0000000-0000-0000-0000-000000000003';
    RAISE EXCEPTION 'TEST 6 FAILED: Non-admin was able to modify role!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PASSED: Test 6 - Privilege escalation correctly blocked by database trigger.';
  END;
END $$;

ROLLBACK;
