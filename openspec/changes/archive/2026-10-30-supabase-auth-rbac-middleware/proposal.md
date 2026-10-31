# Proposal

## Why

The Retail POS currently relies on an in-memory/localStorage `MockAuthService` with a single hardcoded `"seller"` profile, leaving real Supabase authentication (`auth.users`) and the database RBAC schema (`public.user_profiles`) disconnected from the frontend. Implementing real Supabase Auth login, silent background token refresh, profile hydration, and multi-layered role permission middleware ensures uninterrupted counter operations during active cash shifts while strictly enforcing access control across all business roles (`admin`, `manager`, `cashier`, `technician`, and `customer`).

## What Changes

- **Supabase Authentication Service (`SupabaseAuthService`)**: Replace `MockAuthService` with a production `SupabaseAuthService` implementing `IAuthService` using `supabase.auth.signInWithPassword`, `supabase.auth.getSession`, `supabase.auth.onAuthStateChange`, and `supabase.auth.signOut`, with profile hydration from `public.user_profiles`.
- **Multi-Role Domain Alignment & Super-Admin Provisioning**: Align TypeScript `UserRole` and `UserProfile` contracts with PostgreSQL `public.user_role` (`admin`, `manager`, `cashier`, `technician`, `customer`), including a seeded/provisioned Super-Admin profile (`admin`) with unrestricted access to all POS modules.
- **Silent Token Refresh & Session Persistence**: Subscribe `AuthContext` to `supabase.auth.onAuthStateChange` (`TOKEN_REFRESHED`, `SIGNED_IN`, `SIGNED_OUT`) and support configurable storage persistence (`localStorage` when "Remember Device" is enabled vs `sessionStorage` when disabled) so token refreshes occur transparently without interrupting open cash register shifts or cart state.
- **Frontend Role Permission Middleware & Route Guards**: Introduce a declarative role-permission matrix and navigation guard middleware that restricts routes/views by role, redirects each role to its designated landing view upon login, and blocks unauthorized route access with an `"Unauthorized Access"` toast notification.
- **Database-Level RLS Enforcement & Anti-Escalation Verification**: Ensure all profile and sensitive data queries execute under the authenticated Supabase JWT so PostgreSQL RLS policies (`admin_full_access`, `branch_manager_select`, `self_select_profile`) and the `protect_user_profile_critical_fields` trigger block unauthorized reads and privilege escalation.
- **Shift-Aware Logout Safeguard**: Intercept logout initiation when an active cash register shift is open, prompting the operator with a confirmation warning regarding pending blind cash register closing (*arqueo ciego*) before executing `supabase.auth.signOut()`.

## Capabilities

### New Capabilities
- `auth/supabase-rbac-session`: Covers Supabase Auth credential login, `public.user_profiles` hydration, silent background JWT refresh during active shifts, storage persistence with expiration recovery, frontend role-permission route guarding, database RLS enforcement, shift-aware logout protection, and Super-Admin full-module access.

### Modified Capabilities
*(None)*

## Impact

- **Affected Code**:
  - `src/types/auth.ts` (update `UserRole`, `UserProfile`, `AuthSession`, and `IAuthService` contracts)
  - `src/types/pos.ts` (extend `NavigationTab` and route metadata for multi-role modules)
  - `src/services/supabaseClient.ts` (support dynamic storage adapter for Remember Device preference and background token refresh)
  - `src/services/authService.ts` (implement `SupabaseAuthService` with `public.user_profiles` query and fallback/error mapping)
  - `src/context/AuthContext.tsx` (integrate `onAuthStateChange` listener, session-expired notification handling, and role helper hooks)
  - `src/middleware/rolePermissionMiddleware.ts` (new role-to-route permission matrix, default landing route resolver, and guard helper)
  - `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/TopBar.tsx`, `src/components/LoginView.tsx` (enforce route middleware, role-filtered navigation items, Super-Admin module visibility, and open-shift logout confirmation modal)
  - `supabase/seed.sql` or migration helper (provision Super-Admin and test role accounts synchronized with `public.user_profiles`)
- **Dependencies**: Uses existing `@supabase/supabase-js`, React 19, and Tailwind CSS v4.
- **Breaking Changes**: **BREAKING** — Replaces legacy mock credential `"vendedor"` / `"123"` (`role: "seller"`) with Supabase email/password authentication backed by `auth.users` and `public.user_profiles`.

