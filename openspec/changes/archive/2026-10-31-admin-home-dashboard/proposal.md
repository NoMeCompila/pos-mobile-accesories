# Proposal

## Why

Authenticated administrators currently land directly on the User Management CRUD table (`#admin/users`) and lack an executive home view to monitor real-time system health, security incidents, fiscal service availability (ARCA WSAA/WSFEv1), and database change audit trails. Establishing the Admin Home Dashboard (`#admin/home`) as the default landing view provides immediate operational visibility while allowing seamless sidebar navigation across the administrative portal.

## What Changes

- **Admin Home Dashboard UI (`#admin/home`, RF#1)**: Integrate the Stitch observability design from `specifications/admin-home/code.html` and `DESIGN.md`, including:
  - 4 System Health KPI cards (Sesiones Activas, Eventos de Seguridad 24h, Latencia DB & Conexiones, Tasa de Errores API/Sync with sparkline).
  - Live Authentication Events Feed (`auth.audit_events`) with category filter pills (`ALL`, `ALERT`, `LOGIN_SUCCESS`, `TOKEN_REFRESH`), pause/resume feed toggle, and security incident banners.
  - External Integrations Monitor for Argentine ARCA electronic invoicing (TRA token validity meter, FECAE latency, last authorized CAE, diagnostic actions) and CDN/Multimedia storage capacity.
  - Interactive Database CDC Audit Trail (`system_audit_logs`) with table filter pills (`Todas`, `sales`, `cash_shifts`, `products`, `user_profiles`) and expandable JSON diff rows (`OLD` vs `NEW` state).
- **Default Admin Landing Route & Strict Role Isolation (RF#2, RF#3)**: Update authentication routing so `admin` sessions land on `#admin/home` first upon login or session restoration, while blocking non-admin roles (`seller`, `cashier`) from accessing `#admin/home`.
- **Admin Sidebar Navigation (RF#4)**: Wire the first icon in the administrative icon-rail sidebar (`Resumen y Logs`) to navigate to `#admin/home` and the second icon (`Gestión de Usuarios`) to navigate to `#admin/users`.
- **Supabase-Ready Mock Telemetry Store (RF#5)**: Provide typed client-side TanStack Query hooks (`useAdminDashboardStore`) seeded with realistic mock data structured 1:1 for future Supabase Realtime and PostgreSQL CDC integration.

### Scope Boundaries

- **In Scope**:
  - Frontend UI views and interactive micro-interactions for the Admin Home Dashboard (`#admin/home`).
  - Shared/unified Admin icon-rail navigation between `#admin/home` and `#admin/users`.
  - Typed mock telemetry and audit store ready for Supabase integration.
- **Out of Scope**:
  - Live Supabase PostgreSQL database migrations, triggers, or Edge Function deployments (this change impacts **frontend UI views and client-side state only**; no database schema changes are executed in this phase).
  - Live SOAP/REST calls to ARCA or Cloudinary production endpoints.

## Capabilities

### New Capabilities
- `admin/home-dashboard`: Administrative observability dashboard displaying system KPIs, live authentication event streams, ARCA fiscal and CDN integration health monitors, and interactive database CDC audit logs with expandable JSON diffs.

### Modified Capabilities
- `auth/role-based-access`: Updates the default administrator landing and fallback route from `#admin/users` to `#admin/home` and enables administrative sidebar navigation between `#admin/home` and `#admin/users`.

## Impact

- **Database Schema Impact**: None in this phase (frontend UI views and client-side mock state only; models `auth.audit_events` and `system_audit_logs` structures for future Supabase binding).
- **Affected Frontend Code**: `src/types/pos.ts`, `src/types/adminDashboard.ts` (new), `src/services/adminDashboardStore.ts` (new), `src/components/AdminHomeDashboardView.tsx` (new), `src/components/AdminUserManagementView.tsx`, and `src/App.tsx`.
- **Reference Design Assets**: `specifications/admin-home/` (`code.html`, `DESIGN.md`, `screen.png`).

