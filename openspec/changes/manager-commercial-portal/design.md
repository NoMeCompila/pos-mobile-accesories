# Design

## Context

The system currently distinguishes between root `admin` (system observability, users, backup) and frontline `cashier`/`seller` (POS sales, cash drawer, receipt history). Store managers need high-level commercial control, business intelligence reports, and supplier replenishment tools, alongside the ability to manage branch staff, inspect catalog stock, and perform terminal checkouts. Stitch HTML prototypes are stored in `docs/stitch-screens/`.

## Goals / Non-Goals

**Goals:**
- Convert 3 HTML prototypes into clean React 19 + TypeScript components matching Tailwind CSS v4 styling:
  - `CommercialControlDashboardView.tsx` (`docs/stitch-screens/CommercialControlDashboardView.html`)
  - `SalesReportBIView.tsx` (`docs/stitch-screens/SalesReportBIView.html`)
  - `SuppliersSuppliesManagementView.tsx` (`docs/stitch-screens/SuppliersSuppliesManagementView.html`)
- Integrate hardcoded manager authentication (`gerente` / `123`) in `authService.ts`.
- Re-use existing components (`AdminUserManagementView`, `CatalogStockView`, `POSTerminalView`) for manager navigation routes.
- Integrate the manager routes into the unified `Sidebar.tsx` and `App.tsx` router with desktop 80px icon-rail and mobile drawer support.

**Non-Goals:**
- Introducing new backend database migrations or tables in Supabase for BI analytics (uses mock store data).
- Adding automated tests (violates project constraints).

## Decisions

### 1. Dedicated Manager Store vs. Individual View State
- **Decision**: Create a centralized `src/services/managerDashboardStore.ts` utilizing TanStack Query hooks (`useManagerKpis`, `useSalesBIData`, `useSuppliersData`).
- **Rationale**: Keeps view components purely presentational, following Clean Architecture and enabling seamless transition to real Supabase tables in the future.
- **Alternative considered**: Embedding hardcoded static JSON inside each view component. Rejected because it prevents interactive filtering and supervisor override actions.

### 2. View Re-use Pattern in `App.tsx`
- **Decision**: Render existing components (`AdminUserManagementView`, `CatalogStockView`, `POSTerminalView`) directly under manager route conditions in `App.tsx`.
- **Rationale**: Minimizes code duplication. The components already support self-contained state and callbacks.
- **Alternative considered**: Creating duplicate wrapper views (`ManagerStockView.tsx`, `ManagerUserView.tsx`). Rejected as unnecessary boilerplate.

### 3. Manager Navigation Taxonomy & Icons
- **Decision**:
  - `#manager/home`: "Control Comercial" with `TrendingUp` icon.
  - `#manager/sales-bi`: "Reportes BI" with `BarChart2` icon.
  - `#manager/suppliers`: "Proveedores e Insumos" with `Truck` icon.
  - `#admin/users`: "Gestión de Personal" with `UserCog` icon (shared with `admin`).
  - `#catalog`: "Catálogo y Stock" with `Boxes` icon (shared with `seller`, `cashier`).
  - `#pos`: "Terminal de Venta" with `Store` icon (shared with `seller`, `cashier`).
- **Rationale**: Provides clear functional grouping without cluttering the sidebar.

## Risks / Trade-offs

- **[Risk: Heavy HTML prototype footprint]** → Stitch screens contain dense inline Tailwind classes and SVG charts.
  - *Mitigation*: Refactor into semantic React sub-components (KPI cards, chart containers, filter bars) to maintain clean readability.
- **[Risk: Route conflict between Admin and Manager]** → Both roles access `#admin/users`.
  - *Mitigation*: Ensure `ADMIN_TABS` and `MANAGER_TABS` allow `#admin/users` without redirecting.

