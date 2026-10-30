# Proposal

## Why

The Retail POS currently authenticates only a single hardcoded seller profile (`vendedor`) and lacks an administrative portal to provision or manage store personnel, roles, and branch assignments. Introducing the Admin User Management workspace and strict Role-Based Access Control (RBAC) establishes clear operational separation between store administration and checkout terminals while providing the full UI and client-side state foundation prior to live Supabase database integration.

## What Changes

- **Dual Hardcoded Profile Authentication & RBAC Route Isolation**: Extend `MockAuthService` with a hardcoded administrator profile (`admin` / `123`, role `admin`) alongside the existing seller profile (`vendedor` / `123`, role `seller`), and enforce bidirectional navigation guards in `App.tsx` so sellers cannot access `#admin/*` views and administrators cannot access seller POS views (`#seller/home`, `#pos`, `#catalog`, `#drawer`, `#history`).
- **Admin User Management CRUD View (`#admin/users`)**: Integrate the administrative directory design from `specifications/user-crud-managemnt`, including the Admin navigation shell, 4 operational KPI cards (Total Usuarios, Usuarios Activos, Cajeros & Terminales, En Turno Ahora), real-time search, combined Role/Branch/Status filters, a collapsible `public.user_profiles` schema inspector, and a high-density user table with inline actions.
- **"Nuevo Usuario" Creation Modal**: Integrate the modal dialog from `specifications/add-new-user` triggered by `+ Nuevo Usuario`, featuring email validation, first/last name inputs, interactive segmented role pill cards (`cashier`, `supervisor`, `stock`, `admin`), branch selector, phone input, initial status toggle switch, and immediate persistence in the local mock store.

### Scope Boundaries

- **In Scope**:
  - Frontend UI views and components for the Admin User Management screen and "Add New User" modal.
  - Client-side mock CRUD store (`localStorage` backed) seeded with representative staff records.
  - Hardcoded `admin` (`admin` / `123`) and `seller` (`vendedor` / `123`) credentials with strict bidirectional route guards.
- **Out of Scope**:
  - Live Supabase PostgreSQL database connections, SQL migrations, or Edge Function execution (this change impacts **frontend UI views and client-side state only**; database schema migrations remain decoupled for a subsequent phase).
  - Transactional email invitations or password recovery flows.

## Capabilities

### New Capabilities
- `admin/user-management`: Administrative staff directory, operational KPI metrics, multi-criteria filtering, schema inspection drawer, and modal-driven user creation and status management.
- `auth/role-based-access`: Dual-profile credential authentication (`admin` and `seller`) and strict bidirectional route guarding between administrative and POS operational views.

### Modified Capabilities
*(None - no main specs currently exist in `openspec/specs/`)*

## Impact

- **Database Schema Impact**: None in this phase (frontend UI views and local mock state only; mirrors the target `public.user_profiles` schema structure visually).
- **Affected Frontend Code**: `src/types/auth.ts`, `src/types/pos.ts`, `src/services/authService.ts`, `src/services/posStore.ts` (or `src/services/userStore.ts`), `src/App.tsx`, and new admin components (`src/components/AdminUserManagementView.tsx`, `src/components/CreateUserModal.tsx`).
- **Reference Design Assets**: `specifications/user-crud-managemnt/` (`code.html`, `DESIGN.md`, `screen.png`) and `specifications/add-new-user/` (`code.html`, `DESIGN.md`, `screen.png`).

