# Design

## Context

The POS application (`pos-mobile-accesories`) already includes a foundational PostgreSQL RBAC migration (`supabase/migrations/20261026000000_create_user_profiles_and_rbac.sql`) defining the `public.user_role` enum (`admin`, `manager`, `cashier`, `technician`, `customer`), the `public.user_profiles` table, `SECURITY DEFINER` RLS helper functions (`get_auth_role`, `get_auth_branch_id`, `is_admin`), the `handle_new_user` signup trigger, and the `protect_user_profile_critical_fields` anti-escalation trigger.

However, the React 19 frontend still uses `MockAuthService` (`src/services/authService.ts`) with a legacy `"seller"` role and lacks:
1. Real Supabase Auth integration (`signInWithPassword`, `getSession`, `onAuthStateChange`, `signOut`) and `public.user_profiles` hydration.
2. Dynamic storage routing (`localStorage` vs `sessionStorage`) tied to the "Remember Device" preference.
3. Silent token refresh handling in `AuthContext` that preserves in-progress cart and cash shift state.
4. A centralized frontend Role Permission Middleware & Route Guard enforcing module access per role (`admin`, `manager`, `cashier`, `technician`, `customer`).
5. A shift-aware logout safeguard that warns operators if an open cash drawer shift (`shift.status === 'open'`) has not undergone blind cash closing (*arqueo ciego*).
6. Seeded/provisioned Super-Admin (`admin`) and role test accounts for immediate verification.

See `proposal.md` for full motivation and scope.

## Goals / Non-Goals

**Goals:**
- Replace `MockAuthService` with `SupabaseAuthService` backed by `@supabase/supabase-js` and `public.user_profiles` while keeping a deterministic fallback/test adapter capability for unit testing.
- Guarantee zero checkout interruption during background JWT refreshes (`TOKEN_REFRESHED` events update session state in-place without triggering global loading spinners or resetting React state).
- Enforce a strict five-role permission matrix (`admin`, `manager`, `cashier`, `technician`, `customer`) at both the frontend routing/UI layer and PostgreSQL RLS layer.
- Provide a Shift-Aware Logout flow that checks `useCashShift()` before calling `supabase.auth.signOut()`.
- Provision a Super-Admin profile (`admin@pos.local` / `role: 'admin'`) with full visibility and access across all modules.

**Non-Goals:**
- Building full CRUD screens for external customer self-registration or ARCA electronic invoicing (covered in dedicated epics).
- Changing the core PostgreSQL RLS policies already established in `20261026000000_create_user_profiles_and_rbac.sql`, beyond adding seed/provisioning support for the Super-Admin and role accounts.

## Decisions

### 1. Dynamic Storage Adapter for "Remember Device" (`RememberDeviceStorage`)
- **Decision**: Implement a custom `SupportedStorage` adapter in `src/services/supabaseClient.ts` that checks `localStorage.getItem('voltacc_pos_remember_terminal_v1')`. When `"true"` (default for fixed POS registers), Supabase Auth tokens are persisted in `localStorage` across browser restarts. When `"false"`, tokens are written to `sessionStorage` so closing the browser tab clears the session.
- **Rationale**: `@supabase/supabase-js` accepts a custom `auth.storage` implementation at client initialization. Using a delegating storage adapter allows switching persistence behavior dynamically on login without re-instantiating the Supabase singleton.
- **Alternatives Considered**: Calling `supabase.auth.signOut()` on `window.onbeforeunload` when `rememberDevice` is false — rejected because `beforeunload` also fires on page refresh (`F5`), which would unexpectedly log out an operator mid-shift.

### 2. In-Place Silent Token Refresh via `onAuthStateChange`
- **Decision**: Subscribe `AuthContext` to `supabase.auth.onAuthStateChange`. On `TOKEN_REFRESHED` and background `SIGNED_IN` events, update `session.token` and `session.expiresAt` in state **without** setting `isLoading = true` and **without** re-mounting `<POSApp />`. Only initial startup hydration (`INITIAL_SESSION`) and explicit `login()` / `logout()` calls toggle loading state cleanly.
- **Rationale**: In `<POSApp />`, rendering a full-screen loading spinner when `isLoading` is `true` unmounts the active view and interrupts barcode scanning or payment modal workflows. Updating token metadata silently in place mitigates the sprint operational risk.
- **Alternatives Considered**: Polling `supabase.auth.getSession()` on a timer — rejected because Supabase's built-in ticker (`autoRefreshToken: true`) already manages token renewal ahead of expiration and emits `TOKEN_REFRESHED`.

### 3. Declarative Role Permission Matrix & Middleware (`src/middleware/rolePermissionMiddleware.ts`)
- **Decision**: Define a centralized permission configuration mapping each `UserRole` (`admin`, `manager`, `cashier`, `technician`, `customer`) to:
  - `defaultRoute`: Initial landing route after login (`home` for `admin`/`manager`, `pos` for `cashier`, `workshop` for `technician`, `customer/orders` for `customer`).
  - `allowedRoutes`: Array of permitted routes/tabs:
    - `admin` (Super-Admin): All routes (`home`, `pos`, `catalog`, `drawer`, `history`, `workshop`, `reports/financial`, `inventory/costs`, `settings/users`).
    - `manager`: Branch operational and managerial routes (`home`, `pos`, `catalog`, `drawer`, `history`, `workshop`, `reports/financial`, `inventory/costs`, `settings/users`).
    - `cashier`: Counter checkout routes (`pos`, `drawer`, `history`, `catalog` [read-only retail prices]). Explicitly blocked from `/settings/users`, `/reports/financial`, `/inventory/costs`, and wholesale cost fields.
    - `technician`: Workshop routes (`workshop`, `catalog` [spare parts lookup]). Explicitly blocked from `drawer`, `/settings/users`, `/reports/financial`, `/inventory/costs`.
    - `customer`: Self-service repair tracking (`customer/orders`).
- **Rationale**: A pure, testable middleware module (`evaluateRouteAccess(role, targetRoute)`) decouples authorization logic from UI components, enabling both the URL hash router in `src/App.tsx` and the `<Sidebar />` menu renderer to consume a single source of truth.

### 4. Profile Hydration & Identifier Resolution in `SupabaseAuthService`
- **Decision**: On `login({ identifier, passKey, rememberDevice })`:
  1. Normalize `identifier`: if the operator enters a shorthand username without `@` (e.g., `"admin"`, `"cashier"`, `"vendedor"`), map or append the default domain (`@pos.local`) or pass full email addresses directly to `supabase.auth.signInWithPassword({ email, password })`.
  2. Query `public.user_profiles` for `id = authData.user.id` selecting `id, email, first_name, last_name, role, branch_id, phone, status`.
  3. Verify `status === true`; if `false`, sign out immediately and throw an inactive account error.
  4. Map the database row into `UserProfile` and `AuthSession`.
- **Rationale**: Supports standard email login while remaining ergonomic for POS operators using quick terminal identifiers, and guarantees `AuthContext` always holds the authoritative role from `public.user_profiles`.

### 5. Shift-Aware Logout Guard
- **Decision**: In `TopBar.tsx` (and keyboard/lock screen logout triggers), clicking "Log Out" checks `shift.status === 'open'` from `useCashShift()`. If open (and user role is `cashier`, `manager`, or `admin`), display a confirmation modal warning that an open cash shift requires blind cash closing (*arqueo ciego*) before signing out, offering two actions: `"Go to Cash Drawer Closing"` (`#drawer`) or `"Sign Out Anyway"`.
- **Rationale**: Directly satisfies AC6 while preventing accidental session termination before counting physical drawer cash.

## Risks / Trade-offs

- **[Risk] Token expiration during an active cash register shift could interrupt checkout operations if silent refresh is not handled properly** → **Mitigation**: `supabaseClient` is configured with `autoRefreshToken: true`, and `AuthContext` handles `TOKEN_REFRESHED` events via silent state updates that never toggle `isLoading` or unmount `<POSTerminalView />`. If a refresh token is permanently revoked, an informative toast alerts the operator before redirecting to `#login`.
- **[Risk] Client-side route manipulation via URL hash (`window.location.hash = '#/settings/users'`)** → **Mitigation**: Both the `hashchange` listener and the active tab renderer in `src/App.tsx` pass the requested route through `rolePermissionMiddleware.canAccessRoute(user.role, route)`. Unauthorized attempts trigger `showToast('error', 'Unauthorized Access: Your role does not have permission to view this module.')` and redirect to `getDefaultRouteForRole(user.role)`. Even if bypassed in DevTools, PostgreSQL RLS policies reject unauthorized data reads/writes.
- **[Risk] Local development without live Supabase connectivity during automated UI tests** → **Mitigation**: Keep `SupabaseAuthService` cleanly implementing `IAuthService` and provide a seed script (`supabase/seed.sql`) with deterministic accounts (`admin@pos.local`, `manager_suc1@pos.local`, `cashier_suc1@pos.local`, `tech_suc2@pos.local`, `cliente@gmail.com`).

## Migration Plan

1. Apply database migration and seed script (`supabase/seed.sql`) to provision the Super-Admin (`admin@pos.local`) and role-specific accounts in `auth.users` and `public.user_profiles`.
2. Update TypeScript auth contracts (`src/types/auth.ts` and `src/types/pos.ts`) to replace legacy `'seller'` with the canonical `UserRole` union (`'admin' | 'manager' | 'cashier' | 'technician' | 'customer'`).
3. Deploy `SupabaseAuthService`, `rolePermissionMiddleware`, updated `AuthContext`, and UI route/shift guards.
4. Rollback strategy: Revert `authService` export binding to `MockAuthService` if an emergency offline fallback is required during pre-launch testing.

