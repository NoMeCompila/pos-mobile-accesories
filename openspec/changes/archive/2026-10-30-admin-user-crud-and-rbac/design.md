# Design

## Context

The POS application currently uses `MockAuthService` (`src/services/authService.ts`) to authenticate a single hardcoded seller profile (`vendedor` / `123`) and routes all authenticated sessions to `#seller/home` via a URL hash listener in `src/App.tsx`. State management for products, cart, and shifts is handled through TanStack Query v5 hooks backed by `localStorage` in `src/services/posStore.ts`.

To integrate the Stitch administrative designs (`specifications/user-crud-managemnt` and `specifications/add-new-user`) without premature database coupling, the frontend needs:
1. Role-aware authentication and bidirectional hash route guards (`admin` vs `seller`).
2. A clean, React Query-backed user management store (`useUsers` hook in `src/services/posStore.ts` or `src/services/userStore.ts`) mirroring the `public.user_profiles` PostgreSQL schema.
3. Dedicated administrative UI components adhering to the Kinetic Retail POS design tokens (`#faf8ff` surface, `#006194` primary, `#007bb9` primary-container, Space Grotesk / Hanken Grotesk / JetBrains Mono typography, and Lucide React icons).

*(See `proposal.md` for business motivation and `specs/` for behavioral requirements).*

## Goals / Non-Goals

**Goals:**
- Support dual hardcoded login profiles (`admin` / `123` with role `'admin'`, and `vendedor` / `123` with role `'seller'`) inside `MockAuthService`.
- Enforce synchronous hash-route isolation in `App.tsx` so `admin` sessions only access `#admin/*` routes and `seller` sessions only access seller POS routes.
- Implement the Admin User Management view (`AdminUserManagementView.tsx`) and modal (`CreateUserModal.tsx`) faithful to the Stitch layouts (`specifications/user-crud-managemnt/code.html` and `specifications/add-new-user/code.html`).
- Structure the client-side user data model (`UserProfileRecord`, `CreateUserInput`) to match the future Supabase `public.user_profiles` table 1:1 so swapping the mock service for Supabase queries requires zero UI changes.

**Non-Goals:**
- Writing SQL migrations or Edge Functions in `supabase/` during this change.
- Introducing external routing libraries (`react-router-dom`) or heavy state managers (`redux`, `zustand`); keep the existing lightweight hash router and TanStack Query pattern.

## Decisions

### 1. Extend Existing Hash Router with Role Whitelists Instead of Adding `react-router-dom`
- **Choice**: Extend `NavigationTab` in `src/types/pos.ts` to include `'admin/users'` (and optional admin tabs) and define explicit route whitelists per role inside `App.tsx` (`ADMIN_TABS` vs `SELLER_TABS`).
- **Rationale**: The application already uses a deterministic `window.location.hash` listener in `App.tsx`. Adding a helper function `getDefaultTabForRole(role: UserRole)` and validating `currentTab` against the active `user.role` keeps the bundle small and avoids refactoring existing POS views.
- **Alternatives Considered**: Migrating the entire app to `react-router-dom` v7. Rejected as unnecessary overhead for a 2-developer team and outside the scope of adding the admin view.

### 2. TanStack Query + `localStorage` User Store Mirroring `public.user_profiles`
- **Choice**: Create a dedicated `useUsers()` custom hook in `src/services/userStore.ts` using `@tanstack/react-query` (`queryKey: ['user_profiles']`) persisted to `localStorage` under `'voltacc_pos_user_profiles_v1'`, seeded with the initial records from `specifications/user-crud-managemnt/code.html` (Admin Root, Camila Vega, Mateo Rossi, Camila Gomez, Lucas Perez, etc.).
- **Rationale**: Matches the exact pattern used in `src/services/posStore.ts` (`useProducts`, `useTickets`, `useCashShift`). Components consume standard data/mutation hooks (`users`, `createUser`, `updateUser`, `toggleUserStatus`), maintaining Clean Architecture separation between UI and data access.
- **Alternatives Considered**: Storing users in local component `useState` inside `AdminUserManagementView`. Rejected because state would be lost on tab switches or page reloads and wouldn't mirror async service boundaries.

### 3. Dedicated Admin Layout Shell vs Conditional Seller Shell
- **Choice**: Render the Admin layout shell (compact icon-rail sidebar + Admin TopBar with `"Portal Administrador"` / `"Super Admin"` badge, branch/terminal badges, and logout button, matching `specifications/user-crud-managemnt/code.html`) when `user.role === 'admin'`, while preserving the existing `Sidebar` + `TopBar` when `user.role === 'seller'`.
- **Rationale**: The Stitch design for the Admin portal uses a sleek 80px (`w-20`) icon-rail sidebar (`Resumen y Logs`, `Gestión de Usuarios`, `Backup & Restore`, `Configuración`) and an administrative header distinct from the cashier checkout TopBar (which has price checker, cash float pill, and barcode input). Separating or conditionally rendering the shell avoids cluttering `TopBar.tsx` with role-specific POS controls that do not apply to administrators.

### 4. Lucide React Icon Mapping for Stitch Material Symbols
- **Choice**: Map the Google Material Symbols used in the static Stitch HTML mockups (`manage_accounts`, `person_add`, `verified_user`, `point_of_sale`, `inventory_2`, `admin_panel_settings`, `schema`, `content_copy`) to their equivalent `lucide-react` icons already installed in the project (`UserCog`, `UserPlus`, `ShieldCheck`, `Store`, `Boxes`, `ShieldAlert`, `Database`, `Copy`).
- **Rationale**: Preserves consistent iconography and avoids external Google Fonts icon stylesheet requests while keeping the exact color tokens, badges, and visual hierarchy from `DESIGN.md`.

## Risks / Trade-offs

- **[Risk] Role mismatch on persisted browser sessions when switching between `vendedor` and `admin`** → **Mitigation**: In `App.tsx`, evaluate `user.role` inside the `useEffect` dependency array alongside `isAuthenticated`. Immediately redirect to `admin/users` or `seller/home` when `user.role` changes or on login resolution.
- **[Risk] Mock UUID collisions or invalid email duplicates** → **Mitigation**: Use `crypto.randomUUID()` (with fallback) on user creation and validate that `email.trim().toLowerCase()` does not already exist in the current `user_profiles` list before completing the mutation.

## Migration Plan

1. Update TypeScript interfaces in `src/types/auth.ts` and `src/types/pos.ts`.
2. Update `MockAuthService` in `src/services/authService.ts` to support `admin` / `123`.
3. Create `src/services/userStore.ts` with seeded `public.user_profiles` mock records and CRUD mutations.
4. Build `src/components/CreateUserModal.tsx` and `src/components/AdminUserManagementView.tsx`.
5. Wire role-based routing and layout shell switching in `src/App.tsx`.
6. **Rollback**: Revert the branch; `localStorage` keys are namespaced (`voltacc_pos_user_profiles_v1`) and do not affect existing cart or shift keys.

