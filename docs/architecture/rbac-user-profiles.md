# Architecture Documentation: User Profiles & RBAC

## 1. Overview
The POS platform implements Role-Based Access Control (RBAC) at the database layer using PostgreSQL Row-Level Security (RLS) on Supabase.

Identity management is decoupled:
- **`auth.users`**: Internal Supabase engine managing cryptographically hashed credentials and JWT tokens.
- **`public.user_profiles`**: Business domain table synchronized via database trigger, storing operator roles, profile metadata, and branch affiliations.

---

## 2. Role Permission Matrix

| Role | Profile Access Scope | Branch Scope | Privilege Escalation Protection |
| :--- | :--- | :--- | :--- |
| **`admin`** | Full CRUD on all profiles | Cross-branch (Global) | Can reassign roles and branches |
| **`manager`** | Read and Update staff in assigned branch | Scoped to `branch_id` | Cannot elevate to or modify `admin` |
| **`cashier`** | Strict Self Profile (Read & Update personal contact) | Scoped to own profile | Blocked by trigger from altering `role` or `branch_id` |
| **`technician`**| Strict Self Profile (Read & Update personal contact) | Scoped to own profile | Blocked by trigger from altering `role` or `branch_id` |
| **`customer`** | Strict Self Profile (Read & Update personal contact) | Self only | Defaults on public signup, cannot modify role |

---

## 3. Database Schema & Security Artifacts

- **Migration**: [`supabase/migrations/20261026000000_create_user_profiles_and_rbac.sql`](../../supabase/migrations/20261026000000_create_user_profiles_and_rbac.sql)
- **Automated Test Suite**: [`supabase/tests/user_profiles_rbac_test.sql`](../../supabase/tests/user_profiles_rbac_test.sql)
- **Frontend Client**: [`src/services/supabaseClient.ts`](../../src/services/supabaseClient.ts)
- **TypeScript Definitions**: [`src/types/auth.ts`](../../src/types/auth.ts)

---

## 4. Key Architectural Patterns

1. **Anti-Escalation Database Trigger (`protect_user_profile_critical_fields`)**:
   PostgreSQL enforces that non-admin callers cannot modify their own `role` or `branch_id`, rendering client-side spoofing attempts impossible.
2. **Infinite Recursion Prevention**:
   RLS helper functions (`get_auth_role`, `is_admin`, `get_auth_branch_id`) are marked `SECURITY DEFINER` with `SET search_path = public` to safely read permissions without re-triggering table policies.
3. **Execution Plan Caching (`InitPlan`)**:
   Calls to `auth.uid()` are wrapped as scalar subqueries `(SELECT auth.uid())` so PostgreSQL computes identity once per query instead of per scanned row.
