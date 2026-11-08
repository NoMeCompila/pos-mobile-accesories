# Tasks

## 1. Types & Authentication Infrastructure

- [x] 1.1 Update `src/types/pos.ts` to add manager navigation routes (`manager/home`, `manager/sales-bi`, `manager/suppliers`) to `NavigationTab`, and verify with `npm run lint` that TypeScript compiles without errors.
- [x] 1.2 Update `src/services/authService.ts` to register `DEFAULT_MANAGER_PROFILE` (`username: "gerente"`, `passKey: "123"`, `role: "manager"`), and manually verify that logging in with `gerente` / `123` resolves an active session with role `manager`.

## 2. Manager Mock Stores & Data Services

- [x] 2.1 Create `src/types/manager.ts` and `src/services/managerDashboardStore.ts` defining data models and TanStack Query hooks for Commercial Control KPIs, active cash shifts, supervisor override approval queues, and POS terminal node telemetry. Verify with `npm run lint`.
- [x] 2.2 Add mock data and React query hooks in `src/services/managerDashboardStore.ts` for Sales BI analytics (weekly sales vs target, margin percentages, hourly traffic heatmaps) and suppliers directory (vendors, purchase orders, technical spare parts). Verify with `npm run lint`.

## 3. Stitch Screen Conversions to React Views

- [x] 3.1 Create `src/components/CommercialControlDashboardView.tsx` converted from `docs/stitch-screens/CommercialControlDashboardView.html`, integrating commercial KPI cards, live terminal node statuses, and supervisor cashier override approvals. Manually verify in the browser that the view renders matching VoltAcc design system without console errors.
- [x] 3.2 Create `src/components/SalesReportBIView.tsx` converted from `docs/stitch-screens/SalesReportBIView.html`, implementing interactive timeframe presets (Today, This Week, This Month), SVG/CSS comparative bar charts, category revenue mix, and hourly foot traffic heatmap. Manually verify in the browser that charts resize responsively.
- [x] 3.3 Create `src/components/SuppliersSuppliesManagementView.tsx` converted from `docs/stitch-screens/SuppliersSuppliesManagementView.html`, featuring searchable vendor table, purchase order tracking, low-stock technical supplies filter, and new order modal. Manually verify in the browser that modal toggles and filters work correctly.

## 4. Unified Navigation & Router Integration

- [x] 4.1 Update `src/components/Sidebar.tsx` and `src/components/TopBar.tsx` to include manager navigation items (`Control Comercial` -> `TrendingUp`, `Reportes BI` -> `BarChart2`, `Proveedores e Insumos` -> `Truck`), update permissions on reused items (`Gestión de Personal`, `Catálogo y Stock`, `Terminal de Venta`), and display manager context badge (`"Consola Comercial • Gerencia"`). Verify with `npm run lint`.
- [x] 4.2 Update `src/App.tsx` layout shell with `MANAGER_TABS`, role-based route guards, and view routing to render the 3 new manager views and the reused `AdminUserManagementView`, `CatalogStockView`, and `POSTerminalView`. Verify with `npm run build` that production build succeeds without errors.

## 5. End-to-End Manual Browser Verification

- [x] 5.1 Log in as Manager (`gerente` / `123`) in the browser and manually verify: landing on `#manager/home`, switching between all 6 navigation tabs (`#manager/home`, `#manager/sales-bi`, `#manager/suppliers`, `#admin/users`, `#catalog`, `#pos`), toggling the desktop 80px icon-rail with active icon highlight, and testing the mobile responsive drawer.
- [x] 5.2 Log in as Seller (`vendedor`) and Admin (`admin`) to manually verify that manager routes (`#manager/*`) remain isolated and that existing cashier and root administrator views function without regressions.

