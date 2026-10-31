# Tasks

## 1. Domain Types & Navigation Contracts

- [x] 1.1 Create `src/types/adminDashboard.ts` defining Supabase-ready TypeScript interfaces (`SystemHealthKpis`, `AuthAuditEvent`, `AuthEventFilter`, `ArcaIntegrationStatus`, `CdnStorageStatus`, `DatabaseAuditLog`, `AuditTableFilter`, and `AdminDashboardData`) and verify with `npm.cmd run lint` that all types compile cleanly without errors.
- [x] 1.2 Update `NavigationTab` in `src/types/pos.ts` to include `'admin/home'` alongside `'admin/users'` and seller routes, then verify with `npm.cmd run lint` that existing route references remain type-safe.

## 2. Supabase-Ready Mock Telemetry & Audit Store

- [x] 2.1 Create `src/services/adminDashboardStore.ts` with seeded mock data matching `specifications/admin-home/code.html` (4 KPI cards, 5 `auth.audit_events` rows including security warnings, ARCA WSAA/WSFEv1 status, CDN storage metrics, and 4 `system_audit_logs` CDC rows with `old_record`/`new_record` JSON payloads) plus TanStack Query hooks (`useAdminDashboardData`, `useRenewArcaTraMutation`, `usePingArcaWsfeMutation`), and verify with `npm.cmd run lint` that the store compiles cleanly.

## 3. Admin Home Dashboard UI, Sidebar Navigation & Routing Guards

- [x] 3.1 Create `src/components/AdminHomeDashboardView.tsx` implementing the Stitch design from `specifications/admin-home/code.html` (top administrative header, 80px icon-rail sidebar with active state on `Resumen y Logs`, sub-header with `Pausar Feed` / `Exportar Logs` actions, 4 KPI bento cards, filterable `auth.audit_events` feed, ARCA & CDN health monitor cards with diagnostic buttons, and filterable `system_audit_logs` table with expandable `OLD` vs `NEW` JSON diff panels), and verify in the browser that all sections render accurately without console errors.
- [x] 3.2 Update `src/components/AdminUserManagementView.tsx` to accept `onNavigate: (tab: NavigationTab) => void` and wire the first sidebar icon (`Resumen y Logs`) to navigate to `'admin/home'` while keeping the second icon (`Gestión de Usuarios`) active on `'admin/users'`, then verify in the browser that clicking the sidebar icons switches between both views.
- [x] 3.3 Update `src/App.tsx` so `ADMIN_TABS` includes `'admin/home'` and `'admin/users'`, set `'admin/home'` as the default landing and fallback route for `admin` sessions, and render `AdminHomeDashboardView` when `activeTab === 'admin/home'`, then verify in the browser that logging in with `admin` / `123` lands directly on `#admin/home` while `vendedor` / `123` remains restricted to `#seller/home`.

## 4. End-to-End Manual Verification & Build Check

- [x] 4.1 Manually verify all RF#1–RF#5 acceptance scenarios in the browser (admin login landing on `#admin/home`, sidebar switching between `#admin/home` and `#admin/users`, seller blocked from `#admin/home`, auth feed category filtering and pause toggle, ARCA TRA/ping feedback, and CDC JSON diff row expansion) and verify that `npm.cmd run lint` and `npm.cmd run build` complete with zero errors.

## Workflow follow-up

- Run `/opsx-archive` after implementation and manual verification are complete to sync delta specs and archive `admin-home-dashboard`.

