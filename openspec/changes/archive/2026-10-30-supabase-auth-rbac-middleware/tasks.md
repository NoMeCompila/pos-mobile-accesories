# Tasks

## 1. Domain Contracts, Supabase Storage Adapter & Super-Admin Seed

- [x] 1.1 Update `src/types/auth.ts` and `src/types/pos.ts` to align `UserRole` (`'admin' | 'manager' | 'cashier' | 'technician' | 'customer'`), `UserProfile` (`email`, `firstName`, `lastName`, `branchId`, `status`), `AuthSession` (`refreshToken`), and `NavigationTab` routes (`workshop`, `reports/financial`, `inventory/costs`, `settings/users`, `customer/orders`), and verify `npx tsc --noEmit` passes on the updated types.
- [x] 1.2 Update `src/services/supabaseClient.ts` with a dynamic storage adapter (`RememberDeviceStorage`) that persists tokens to `localStorage` when "Remember Device" is enabled and `sessionStorage` when disabled while keeping `autoRefreshToken: true` and `persistSession: true`, and verify unit tests for the storage adapter pass.
- [x] 1.3 Create `supabase/seed.sql` (and update `supabase/tests/user_profiles_rbac_test.sql`) to provision the Super-Admin profile (`admin@pos.local` with `role = 'admin'`) alongside `manager`, `cashier`, `technician`, and `customer` accounts, and verify the SQL test suite and seed script are valid and documented in `docs/architecture/rbac-user-profiles.md`.

## 2. Supabase Auth Service & Profile Hydration (AC1, AC3, AC5)

- [x] 2.1 Implement `SupabaseAuthService` in `src/services/authService.ts` using `supabase.auth.signInWithPassword`, `supabase.auth.getSession`, and `supabase.auth.signOut`, querying `public.user_profiles` (`role`, `branch_id`, `first_name`, `last_name`, `status`) to hydrate the session and rejecting inactive (`status = false`) profiles, and verify with unit tests covering all 5 roles and error cases.
- [x] 2.2 Add expired/revoked refresh token cleanup in `src/services/authService.ts` so failed session restoration purges stale keys from `localStorage` and `sessionStorage` and surfaces a session-expired flag, and verify via automated tests that expired sessions clean storage and return `null`.

## 3. Silent Background Token Refresh & AuthContext Lifecycle (AC2, AC3)

- [x] 3.1 Update `src/context/AuthContext.tsx` to subscribe to `supabase.auth.onAuthStateChange` (`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`), updating `session` and `user` silently on `TOKEN_REFRESHED` without setting `isLoading = true` or unmounting active views, and verify via tests that an active cart/shift remains intact during token refresh.
- [x] 3.2 Handle unexpected `SIGNED_OUT` / token revocation events in `src/context/AuthContext.tsx` by clearing context state, emitting an informative session-expired notification, and redirecting to `#login`, and verify behavior when a refresh token is invalidated.

## 4. Frontend Role Permission Middleware & Route Guarding (AC1, AC4, AC7)

- [x] 4.1 Create `src/middleware/rolePermissionMiddleware.ts` defining the role permission matrix (`admin`, `manager`, `cashier`, `technician`, `customer`), `getDefaultRouteForRole(role)`, `canAccessRoute(role, route)`, and `getAllowedNavigationItems(role)` (ensuring Super-Admin `admin` has unrestricted access to all modules), and verify with comprehensive unit tests covering every role and restricted route (`/settings/users`, `/reports/financial`, `/inventory/costs`, `#drawer`, `#workshop`).
- [x] 4.2 Integrate `rolePermissionMiddleware` into `src/App.tsx`, `src/components/Sidebar.tsx`, and `src/components/LoginView.tsx` so login redirects each role to its designated initial view, unauthorized URL hash navigation is intercepted and redirected with an `"Unauthorized Access"` toast alert, and Super-Admin (`admin`) can view and access all modules, verifying with component/integration tests.

## 5. Shift-Aware Logout Safeguard & End-to-End Verification (AC6, AC7)

- [x] 5.1 Update `src/components/TopBar.tsx` to inspect `shift.status === 'open'` from `useCashShift()` when logout is clicked, displaying a confirmation modal warning the operator to perform blind cash register closing (*arqueo ciego*) before calling `logout()`, and verify that confirming logout calls `supabase.auth.signOut()`, clears tokens/state, and redirects to `#login`.
- [x] 5.2 Run the full test suite and TypeScript build (`npm run build` / `npx tsc --noEmit`) to verify all acceptance criteria (AC1–AC7) pass with zero errors.

## Workflow follow-up

- Archive the change with `openspec archive` after implementation and review are complete.

