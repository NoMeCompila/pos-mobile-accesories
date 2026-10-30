# Tasks

## 1. Domain Types & Schema Contracts

- [x] 1.1 Extend `UserRole` in `src/types/auth.ts` to include `'supervisor' | 'stock'` and define `UserProfileRecord` and `CreateUserInput` interfaces mirroring the 10-column `public.user_profiles` structure (`id`, `email`, `firstName`, `lastName`, `role`, `branchId`, `branchName`, `phone`, `status`, `avatarInitials`, `createdAt`, `updatedAt`). Verify by running `npm run lint` (`tsc --noEmit`) with zero type errors.
- [x] 1.2 Extend `NavigationTab` in `src/types/pos.ts` to include `'admin/users'` so the hash router supports administrative navigation targets. Verify by running `npm run lint` (`tsc --noEmit`).

## 2. Authentication Service & Mock User Store

- [x] 2.1 Update `MockAuthService` in `src/services/authService.ts` to add `DEFAULT_ADMIN_PROFILE` (`id: 'usr-admin-root'`, `username: 'admin'`, `displayName: 'Admin Root Sistema'`, `role: 'admin'`, `terminalId: 'TERM-MAIN-04'`) and authenticate credentials `admin` / `123` alongside `vendedor` / `123`. Verify manually by logging in with `admin` / `123` in the browser and inspecting `sessionStorage`/`localStorage` (`voltacc_pos_session_v1`) to confirm `user.role === 'admin'`.
- [x] 2.2 Create `src/services/userStore.ts` with a TanStack Query `useUsers()` hook backed by `localStorage` (`voltacc_pos_user_profiles_v1`), seeded with the initial staff records from `specifications/user-crud-managemnt/code.html` (Admin Root, Camila Vega, Mateo Rossi, Camila Gomez, Lucas Perez, etc.), and exposing `createUser`, `updateUser`, and `toggleUserStatus` mutations with duplicate email validation. Verify by importing `useUsers` and running `npm run lint` (`tsc --noEmit`).

## 3. UI Views & Modal Components

- [x] 3.1 Create `src/components/CreateUserModal.tsx` implementing the `"Nuevo Usuario"` modal dialog from `specifications/add-new-user/code.html` and `DESIGN.md`, including required email validation, first/last name inputs, interactive 4-option role pill selector (`cashier`, `supervisor`, `stock`, `admin`), branch selector, phone input, initial status toggle switch, and `Escape`/backdrop close handlers; support both create mode and edit mode when an existing `UserProfileRecord` is passed. Verify manually in the browser by opening the modal, testing empty/duplicate email validation, selecting each role pill, and submitting a new user.
- [x] 3.2 Create `src/components/AdminUserManagementView.tsx` implementing the Admin portal shell (compact icon-rail sidebar, Admin header with `"Portal Administrador"` / `"Super Admin"` badge, branch/terminal badges, and logout action) and the User Management directory from `specifications/user-crud-managemnt/code.html`, including the 4 dynamic KPI cards, real-time search input, Role/Branch/Status filter dropdowns, collapsible `"Cols Schema (10)"` PostgreSQL metadata drawer, and user table with UUID copy, `"Editar"`, and status toggle actions. Verify manually in the browser by searching users, combining filters, toggling the schema drawer, copying a UUID, and creating/editing a user.
- [x] 3.3 Update `src/App.tsx` to enforce bidirectional role-based route guards (`admin` sessions route exclusively to `#admin/users` and redirect away from seller routes; `seller` sessions route to `#seller/home` and redirect away from `#admin/*` routes) and render `AdminUserManagementView` when authenticated as `admin`. Verify manually in the browser by logging in as `admin` (`admin` / `123`), attempting to navigate to `#pos` or `#seller/home` (confirming redirect to `#admin/users`), logging out, logging in as `vendedor` (`vendedor` / `123`), and attempting to navigate to `#admin/users` (confirming redirect to `#seller/home`).

## 4. End-to-End Manual Verification & Build Check

- [x] 4.1 Execute full manual QA in the browser covering RE#1 (Admin CRUD directory, KPI counters, search, filters, schema drawer), RE#2 (`+ Nuevo Usuario` modal creation and persistence across page reloads), and RE#3 (`admin`/`123` vs `vendedor`/`123` login and bidirectional route isolation), and confirm `npm run lint` and `npm run build` succeed cleanly.

