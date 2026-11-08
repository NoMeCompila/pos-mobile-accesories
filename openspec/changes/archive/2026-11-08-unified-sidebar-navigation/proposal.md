# Proposal

## Why

Currently, the seller/cashier profile uses a dedicated modular component (`src/components/Sidebar.tsx`), whereas the administrator profile embeds duplicated `<aside>` icon-rail markup directly inside each administrative view (`AdminHomeDashboardView.tsx`, `AdminUserManagementView.tsx`, and `AdminBackupRecoveryView.tsx`). Consolidating navigation into a single, reusable component with unified VoltAcc Kinetic styling, desktop 80px icon-rail collapse, and touch-friendly smartphone ergonomics eliminates layout duplication and ensures a consistent user experience across all current and future operator roles.

## What Changes

- **In Scope**:
  - **Unified Reusable Sidebar Component**: Consolidate navigation into `src/components/Sidebar.tsx`, mounted centrally in `src/App.tsx` across all authenticated user roles (`admin`, `manager`, `cashier`/`seller`, `technician`).
  - **Removal of Embedded Admin Sidebars**: Remove duplicated inline `<aside>` elements and local layout wrappers from `AdminHomeDashboardView.tsx`, `AdminUserManagementView.tsx`, and `AdminBackupRecoveryView.tsx`.
  - **Role-Based Dynamic Route Filtering**: Dynamically filter displayed sidebar links according to the active user's role while strictly preserving VoltAcc Kinetic brand styling (`w-72` expanded, `#007bb9` accents, rounded `Zap` logo, and bottom telemetry card).
  - **Desktop Dual-Mode Retraction (Option B: 80px Icon-Rail)**: Enable a hamburger toggle in `TopBar.tsx` on desktop (`lg:`) that transitions the sidebar between expanded (`w-72` / 288px) and collapsed icon-rail (`w-20` / 80px) states, highlighting the active view icon with a corporate blue container, white icon, and left indicator pill.
  - **Smartphone & Mobile Touch Ergonomics**: Adapt the sidebar on mobile viewports (`< 1024px`) as an off-canvas drawer overlay with blurred backdrop, $\ge 44 \times 44\text{px}$ touch targets, automatic dismissal on route selection, and `100dvh` safe-area bottom padding.
- **Out of Scope**:
  - Database schema changes, Supabase migrations, or PostgreSQL Row Level Security (RLS) policy updates.
  - Unimplemented business views or automated test suites (all verification is conducted manually in the browser).

## Capabilities

### New Capabilities
- `layout/unified-sidebar-navigation`: Unified, role-aware sidebar navigation shell featuring VoltAcc Kinetic styling, desktop 80px icon-rail collapse with active route highlighting, and smartphone off-canvas drawer touch ergonomics.

### Modified Capabilities
- `auth/role-based-access`: Updates the `Administrative Sidebar Navigation Between Portal Views` requirement to route administrative views (`#admin/home`, `#admin/users`, `#admin/backup`) through the shared unified `Sidebar` component instead of view-embedded sidebars.

## Impact

- **Database / Backend Impact**: None. No Supabase schema migrations or RLS changes are required.
- **Frontend UI Views Affected**: `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/TopBar.tsx`, `src/components/AdminHomeDashboardView.tsx`, `src/components/AdminUserManagementView.tsx`, and `src/components/AdminBackupRecoveryView.tsx`.

