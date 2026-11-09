# Proposal

## Why

Store managers currently lack a dedicated commercial control workspace, business intelligence sales reports, and supply-chain management tools. Introducing a dedicated Manager role (`gerente` / `123`) bridges operational cashiers and root administrators, empowering store supervisors with high-level commercial oversight, real-time terminal auditing, supplier replenishment workflows, and direct access to personal management, catalog stock, and POS checkout.

## What Changes

- Add hardcoded authentication support for the Manager profile (`username: "gerente"`, `passKey: "123"`, `role: "manager"`).
- Convert Stitch HTML prototypes into modular React 19 + TypeScript views:
  - `CommercialControlDashboardView.tsx`: Real-time supervisor cash drawer overrides, cashier shift audits, commercial KPIs, and store performance.
  - `SalesReportBIView.tsx`: Interactive sales BI analytics, net sales vs. target charts, gross margin, average ticket metrics, category mix breakdown, and hourly traffic heatmaps.
  - `SuppliersSuppliesManagementView.tsx`: Vendor management directory, purchase order status tracking, technical supplies catalog, and warehouse stock receipts.
- Re-use existing core views for the Manager profile:
  - `AdminUserManagementView.tsx` (`#admin/users`) for branch staff management.
  - `CatalogStockView.tsx` (`#catalog`) for inventory lookups.
  - `POSTerminalView.tsx` (`#pos`) for emergency managerial sale checkouts.
- Extend `NavigationTab` in `src/types/pos.ts` and add manager routes (`manager/home`, `manager/sales-bi`, `manager/suppliers`).
- Update `Sidebar.tsx` and `TopBar.tsx` to include role-aware navigation badges, routes, and icons for `manager`.

## Scope Boundaries

- **In Scope**:
  - Frontend React 19 component conversion from Stitch screens (`CommercialControlDashboardView.html`, `SalesReportBIView.html`, `SuppliersSuppliesManagementView.html`).
  - Mock state services and synthetic business data for commercial KPIs, BI charts, and suppliers.
  - Manager authentication profile in `authService.ts` and session restoration.
  - Route isolation in `App.tsx` and role-filtered navigation items in `Sidebar.tsx`.
- **Out of Scope**:
  - Live backend Supabase SQL migrations or new PostgreSQL tables for BI historical aggregates.
  - Production external vendor ERP or EDI integrations.
  - Automated test suites (Jest/Cypress). All verification is manual in browser.

## Database & System Impact

- **Database**: No Supabase schema migrations required. Uses mock in-memory stores and localStorage persistence for the new manager views.
- **Frontend**: Adds 3 new view components under `src/components/`, extends `src/types/pos.ts`, and updates `src/services/authService.ts`, `src/components/Sidebar.tsx`, and `src/App.tsx`.

## Capabilities

### New Capabilities
- `manager/commercial-portal`: Managerial commercial workspace encompassing Commercial Control Dashboard, Sales BI analytics, and Suppliers & Supplies management.

### Modified Capabilities
- `auth/role-based-access`: Add Manager profile authentication (`gerente` / `123`) and bidirectional route guards for `#manager/*`.
- `layout/unified-sidebar-navigation`: Extend role-based navigation item filtering and responsive drawer items for the `manager` profile.

## Impact

- Affected files: `src/types/pos.ts`, `src/types/auth.ts`, `src/services/authService.ts`, `src/components/Sidebar.tsx`, `src/App.tsx`, and new components in `src/components/`.
- Zero breaking changes to existing Admin or Cashier workflows.

