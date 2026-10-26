-- ==============================================================================
-- Migration: 20261026000000_create_user_profiles_and_rbac.sql
-- Description: Establishes user_profiles schema, auth synchronization triggers,
--              security definer helper functions, and granular RLS policies for:
--              Admin, Manager, Cashier, Technician, and Customer.
-- ==============================================================================

-- 1. Create Role Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'admin',
      'manager',
      'cashier',
      'technician',
      'customer'
    );
  END IF;
END $$;

-- 2. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  role public.user_role NOT NULL DEFAULT 'customer'::public.user_role,
  branch_id uuid, -- Optional branch association for future multi-store scaling
  phone text,
  status boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_email_non_empty CHECK (char_length(trim(email)) > 0)
);

-- Performance Indexes for FK lookups and RLS evaluation
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch_id ON public.user_profiles(branch_id);

-- 3. Trigger for Automatic updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Helper Functions for RLS (Bypassing recursion with SECURITY DEFINER and InitPlan optimization)
CREATE OR REPLACE FUNCTION public.get_auth_role(p_user_id uuid)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_branch_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.user_profiles WHERE id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.get_auth_role((SELECT auth.uid())) = 'admin'::public.user_role, false);
$$;

-- 5. Trigger for New User Signup (Automatic Profile Provisioning with 'customer' Default)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
  v_branch_id uuid;
BEGIN
  -- Strict fallback: all public signups default to 'customer'
  -- Only if invitation metadata explicitly provides a valid role, cast safely
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'customer'::public.user_role;
  END;

  IF v_role IS NULL THEN
    v_role := 'customer'::public.user_role;
  END IF;

  -- Optional branch_id from invitation metadata
  BEGIN
    v_branch_id := (NEW.raw_user_meta_data->>'branch_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_branch_id := NULL;
  END;

  INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    branch_id,
    phone
  ) VALUES (
    NEW.id,
    coalesce(NEW.email, ''),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    v_role,
    v_branch_id,
    NEW.raw_user_meta_data->>'phone'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger to Prevent Privilege Escalation (Non-admins cannot change role or branch)
CREATE OR REPLACE FUNCTION public.protect_user_profile_critical_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only administrators can modify roles or reassign branches
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Access Denied: Only administrators can modify user roles';
    END IF;
    IF NEW.branch_id IS DISTINCT FROM OLD.branch_id THEN
      RAISE EXCEPTION 'Access Denied: Only administrators can reassign branches';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_profile_critical_fields ON public.user_profiles;
CREATE TRIGGER trg_protect_user_profile_critical_fields
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_critical_fields();

-- 7. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Clean existing policies before recreating
DROP POLICY IF EXISTS "admin_full_access" ON public.user_profiles;
DROP POLICY IF EXISTS "self_select_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "self_update_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "branch_manager_select" ON public.user_profiles;
DROP POLICY IF EXISTS "branch_manager_update" ON public.user_profiles;

-- Scenario 3: Admin Full Access Override
CREATE POLICY "admin_full_access"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Scenario 4 & Base: Self Profile Read (Customers, Cashiers, Technicians, Managers view strictly their own profile)
CREATE POLICY "self_select_profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- Scenario 4 & Base: Self Profile Update (Users can update personal details, protected by anti-escalation trigger)
CREATE POLICY "self_update_profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Scenario 2: Manager Branch Profile Read (Managers can view employees in their own branch)
CREATE POLICY "branch_manager_select"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
    AND branch_id IS NOT NULL
    AND branch_id = public.get_auth_branch_id((SELECT auth.uid()))
  );

-- Scenario 2: Manager Branch Profile Update (Managers can update employees in their own branch, except admins)
CREATE POLICY "branch_manager_update"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
    AND branch_id IS NOT NULL
    AND branch_id = public.get_auth_branch_id((SELECT auth.uid()))
    AND role <> 'admin'::public.user_role
  )
  WITH CHECK (
    public.get_auth_role((SELECT auth.uid())) = 'manager'::public.user_role
    AND branch_id IS NOT NULL
    AND branch_id = public.get_auth_branch_id((SELECT auth.uid()))
    AND role <> 'admin'::public.user_role
  );

-- 8. Table Permissions for Data API
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
