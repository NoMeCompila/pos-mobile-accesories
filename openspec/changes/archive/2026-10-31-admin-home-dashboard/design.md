# Design

## Context

The Humans In The Loop POS & Backoffice application currently separates `seller` (`#seller/*`) and `admin` (`#admin/*`) portals via hash-based routing and role guards in `src/App.tsx`. Previously, `admin` users landed directly on `#admin/users` (`AdminUserManagementView`), which includes a left `80px` (`w-20`) icon-rail sidebar and top administrative header.

With the addition of the Admin Home Dashboard (`specifications/admin-home/code.html` and `DESIGN.md`), administrators require a dedicated observability home view (`#admin/home`) as their primary landing screen upon login, along with interactive sidebar navigation to switch between **Resumen y Logs** (`#admin/home`) and **Gestión de Usuarios** (`#admin/users`). Furthermore, all telemetry metrics, live authentication event streams (`auth.audit_events`), external service monitors (ARCA WSAA/WSFEv1 and CDN Storage), and database CDC audit trails (`system_audit_logs`) must be backed by a typed, client-side TanStack Query store designed for a future 1:1 replacement with Supabase PostgreSQL queries and Realtime subscriptions.

## Goals / Non-Goals

**Goals:**
- Implement `AdminHomeDashboardView` (`#admin/home`) faithfully matching `specifications/admin-home/code.html` and the *Kinetic Retail POS* design tokens (`#faf8ff` canvas, `#f2f3ff` surface-container-low, `#ffffff` cards, `#006194` primary, `#00855b` tertiary emerald, `#ba1a1a` crimson alert, Space Grotesk / Hanken Grotesk / JetBrains Mono typography).
- Set `#admin/home` as the default landing and fallback route for authenticated `admin` users while maintaining strict role isolation (`seller` users remain restricted to `#seller/*`).
- Enable seamless navigation between `#admin/home` (first sidebar icon: `Resumen y Logs`) and `#admin/users` (second sidebar icon: `Gestión de Usuarios`) across both admin views.
- Build a Clean Architecture mock telemetry service (`src/services/adminDashboardStore.ts`) and domain contracts (`src/types/adminDashboard.ts`) using TanStack Query (`@tanstack/react-query`) with interactive filtering, expandable JSON diff rows, feed pause/resume controls, and simulated ARCA TRA renewal / WSFEv1 ping mutations.

**Non-Goals:**
- Creating live Supabase database migrations, triggers, or Edge Functions in this phase.
- Making network calls to real ARCA SOAP endpoints or external CDN APIs.
- Implementing the `Backup & Restore` or `Configuración` views (their sidebar icons remain visual placeholders with tooltips).

## Decisions

### 1. Hash-Synchronized Admin Routing & Default Landing View
- **Decision**: Extend `NavigationTab` in `src/types/pos.ts` to `'seller/home' | 'seller/sales' | 'seller/orders' | 'seller/customers' | 'admin/home' | 'admin/users'`. In `src/App.tsx`, update `ADMIN_TABS` to `['admin/home', 'admin/users']` and change `getDefaultTabForRole('admin')` to return `'admin/home'`.
- **Rationale**: Ensures that logging in as `admin` / `123`, refreshing the browser on an invalid hash, or attempting to visit a `#seller/*` URL as an admin always resolves to `#admin/home` first (satisfying RF#2 and RF#3) without adding external router dependencies.
- **Alternatives Considered**: Keeping `#admin/users` as the fallback when a hash is missing; rejected because RF#3 explicitly requires the Admin Home Dashboard to be the first screen seen upon login.

### 2. Shared Sidebar Navigation Prop Across Admin Views
- **Decision**: Pass `activeTab: NavigationTab` and `onNavigate: (tab: NavigationTab) => void` into both `AdminHomeDashboardView` and `AdminUserManagementView` (or share a common admin shell header/sidebar pattern) so clicking the first sidebar button (`Resumen y Logs` / `monitoring` icon) calls `onNavigate('admin/home')` and clicking the second sidebar button (`Gestión de Usuarios` / `group` icon) calls `onNavigate('admin/users')`.
- **Rationale**: Preserves the exact Stitch layout of both `specifications/user-crud-managemnt/code.html` and `specifications/admin-home/code.html` while highlighting the active route (`bg-[#006194]/10 text-[#006194]`) and enabling instant view transitions (satisfying RF#4).

### 3. Supabase-Ready Telemetry Contracts & TanStack Query Store
- **Decision**: Define strict TypeScript interfaces in `src/types/adminDashboard.ts` (`SystemHealthKpis`, `AuthAuditEvent`, `ArcaIntegrationStatus`, `CdnStorageStatus`, `DatabaseAuditLog`) that mirror Supabase PostgreSQL schemas (`auth.audit_events` and `public.system_audit_logs` with `old_record: Record<string, unknown> | null` and `new_record: Record<string, unknown> | null`). Expose custom hooks in `src/services/adminDashboardStore.ts` (`useAdminDashboardData`, `useRenewArcaTraMutation`, `usePingArcaWsfeMutation`) backed by `@tanstack/react-query`.
- **Rationale**: Decouples UI rendering and local filter state (auth event category filter, CDC table filter, expanded row IDs, feed pause toggle) from data fetching. When Supabase is connected in a future iteration, only the query/mutation functions inside `src/services/adminDashboardStore.ts` will change from in-memory promises to `supabase.from(...).select(...)` and `supabase.channel(...)` subscriptions (satisfying RF#5).

### 4. Interactive CDC Audit Log Diff Expansion & JSON/CSV Log Export
- **Decision**: Store `expandedAuditId: string | null` in `AdminHomeDashboardView` (defaulting to `'AUD-99240'` so the `products` price update diff is immediately inspectable on load, matching the Stitch reference) and allow clicking any CDC row to toggle its `OLD` vs `NEW` JSON payload inspection panel. Wire the `Exportar Logs (JSON/CSV)` button to generate and download a real client-side JSON snapshot of current audit logs.
- **Rationale**: Delivers a high-craft, functional administrative prototype rather than a static mockup.

## Risks / Trade-offs

- **[Risk] Visual drift between `AdminHomeDashboardView` and `AdminUserManagementView` shell chrome** → **Mitigation**: Keep identical `w-20` sidebar dimensions, brand header (`Humans In The Loop • POS & Backoffice`), `PROD • SUPABASE` badge, and user profile/logout controls across both views so switching between `#admin/home` and `#admin/users` feels seamless without layout shift.
- **[Risk] Unbounded memory growth if simulated live events are appended indefinitely** → **Mitigation**: Keep the seeded telemetry deterministic and bounded in memory, with explicit `Pausar Feed / Reanudar Feed` toggle state and manual refresh/diagnostic actions (`Renovar TRA`, `Ping WSFEv1`).

## Migration Plan

1. Add `src/types/adminDashboard.ts` and extend `NavigationTab` in `src/types/pos.ts` with `'admin/home'`.
2. Implement `src/services/adminDashboardStore.ts` with seeded mock data matching `specifications/admin-home/code.html` and TanStack Query hooks/mutations.
3. Create `src/components/AdminHomeDashboardView.tsx` implementing the sub-header, 4 KPI cards, Live Auth Events feed with category filtering, ARCA & CDN integration monitors, and expandable Database CDC Audit Trail.
4. Update `src/components/AdminUserManagementView.tsx` to accept `onNavigate` and wire the first sidebar icon (`Resumen y Logs`) to navigate to `'admin/home'`.
5. Update `src/App.tsx` to route `admin` sessions to `'admin/home'` by default and render `AdminHomeDashboardView` when `activeTab === 'admin/home'`.

