-- ==============================================================================
-- Supabase Database Seed: supabase/seed.sql
-- Description: Provisions development and test accounts across all roles:
--              1. Super-Admin (admin@pos.local / admin123)
--              2. Manager (manager_suc1@pos.local / manager123)
--              3. Cashier (cashier_suc1@pos.local / cashier123)
--              4. Technician (tech_suc2@pos.local / tech123)
--              5. Customer (cliente@gmail.com / cliente123)
-- ==============================================================================

-- 1. Create default branch UUIDs for test scope
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_manager_id uuid := 'a0000000-0000-0000-0000-000000000002';
  v_cashier_id uuid := 'a0000000-0000-0000-0000-000000000003';
  v_tech_id uuid := 'a0000000-0000-0000-0000-000000000004';
  v_customer_id uuid := 'a0000000-0000-0000-0000-000000000005';
  v_branch_1 uuid := 'b0000000-0000-0000-0000-000000000001';
  v_branch_2 uuid := 'b0000000-0000-0000-0000-000000000002';
BEGIN
  -- Insert or update test users in auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  )
  VALUES
    (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@pos.local',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin","first_name":"Super","last_name":"Admin"}',
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      v_manager_id,
      '00000000-0000-0000-0000-000000000000',
      'manager_suc1@pos.local',
      crypt('manager123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"manager","first_name":"Martin","last_name":"Manager","branch_id":"b0000000-0000-0000-0000-000000000001"}',
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      v_cashier_id,
      '00000000-0000-0000-0000-000000000000',
      'cashier_suc1@pos.local',
      crypt('cashier123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"cashier","first_name":"Clara","last_name":"Cashier","branch_id":"b0000000-0000-0000-0000-000000000001"}',
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      v_tech_id,
      '00000000-0000-0000-0000-000000000000',
      'tech_suc2@pos.local',
      crypt('tech123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"technician","first_name":"Tomas","last_name":"Tech","branch_id":"b0000000-0000-0000-0000-000000000002"}',
      'authenticated',
      'authenticated',
      now(),
      now()
    ),
    (
      v_customer_id,
      '00000000-0000-0000-0000-000000000000',
      'cliente@gmail.com',
      crypt('cliente123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"Lucas","last_name":"Cliente"}',
      'authenticated',
      'authenticated',
      now(),
      now()
    )
  ON CONFLICT (id) DO NOTHING;

  -- Verify public.user_profiles synchronization (trigger handle_new_user should populate automatically, but upsert for idempotency)
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role, branch_id, status)
  VALUES
    (v_admin_id, 'admin@pos.local', 'Super', 'Admin', 'admin', NULL, true),
    (v_manager_id, 'manager_suc1@pos.local', 'Martin', 'Manager', 'manager', v_branch_1, true),
    (v_cashier_id, 'cashier_suc1@pos.local', 'Clara', 'Cashier', 'cashier', v_branch_1, true),
    (v_tech_id, 'tech_suc2@pos.local', 'Tomas', 'Tech', 'technician', v_branch_2, true),
    (v_customer_id, 'cliente@gmail.com', 'Lucas', 'Cliente', 'customer', NULL, true)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    branch_id = EXCLUDED.branch_id,
    status = EXCLUDED.status;

END $$;

