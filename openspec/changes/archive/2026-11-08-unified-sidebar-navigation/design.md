# Design

## Context

In the current codebase (`src/App.tsx`), authenticated users with role `admin` bypass the main layout shell (`Sidebar.tsx` + `TopBar.tsx`) and instead mount full-page views (`AdminHomeDashboardView.tsx`, `AdminUserManagementView.tsx`, `AdminBackupRecoveryView.tsx`) that each contain a duplicated 80px `<aside>` icon-rail and custom sticky header. Meanwhile, `cashier`/`seller` sessions mount `src/components/Sidebar.tsx`, which is hardcoded to a fixed 288px (`w-72`) width on desktop and only toggles as a drawer on mobile (`< lg:`). See `proposal.md` for motivation and `specs/layout/unified-sidebar-navigation/spec.md` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Unify layout rendering in `src/App.tsx` so all authenticated roles share a single `<Sidebar />` and `<TopBar />` shell.
- Support declarative, role-filtered navigation items inside `src/components/Sidebar.tsx` using a single configuration array (`NAV_ITEMS`).
- Implement Option B desktop retraction: toggle between expanded (`w-72` / 288px) and collapsed icon-rail (`w-20` / 80px) via the `TopBar` hamburger button, dynamically updating the layout's left offset (`lg:pl-72` vs `lg:pl-20` and `lg:left-72` vs `lg:left-20`).
- Ensure active route icons are prominently highlighted in both expanded and 80px icon-rail modes.
- Deliver a responsive smartphone off-canvas drawer (`< 1024px`) with `100dvh` height, safe-area padding, blurred backdrop, $\ge 44 \times 44\text{px}$ touch targets, and auto-close on navigation.

**Non-Goals:**
- Introducing external routing libraries (`react-router-dom`) or state management libraries (`zustand`/`redux`); existing hash-based state in `src/App.tsx` and React 19 `useState` are sufficient.
- Altering Supabase authentication logic or database schemas.

## Decisions

### 1. Single Layout Shell in `src/App.tsx` with Shared `isCollapsedDesktop` and `isMobileSidebarOpen` State
- **Decision**: Lift `isCollapsedDesktop` (`boolean`, defaulting to `false`) alongside `isMobileSidebarOpen` (`boolean`) in `POSApp` (`src/App.tsx`). Render `<Sidebar />` and `<TopBar />` once for all authenticated users, and mount both administrative views (`admin/home`, `admin/users`, `admin/backup`) and seller POS views (`seller/home`, `pos`, `catalog`, `drawer`, `history`) inside the shared `<main>` content area.
- **Rationale**: Eliminates ~250 lines of duplicated `<aside>` and mobile backdrop JSX across the three admin view components and guarantees consistent navigation and theme switching across roles.
- **Alternatives Considered**: Creating a separate `AdminSidebar.tsx` component. Rejected because it violates `RF-01` and `RF-03` requiring a single reusable component with unified VoltAcc styling across all profiles.

### 2. Declarative Role-Aware `NAV_ITEMS` Configuration in `src/components/Sidebar.tsx`
- **Decision**: Define a typed `NavigationItem[]` constant in `src/components/Sidebar.tsx` mapping each `NavigationTab` to its label, Lucide icon, and allowed `UserRole[]`:
  - Admin items (`roles: ['admin']`):
    - `admin/home`: `"Resumen y Logs"` (`BarChart3`)
    - `admin/users`: `"Gestión de Usuarios"` (`UserCog`)
    - `admin/backup`: `"Backup & Recovery"` (`RotateCcw`)
  - Cashier/Seller/Manager/Technician items (`roles: ['seller', 'cashier', 'manager', 'supervisor', 'technician', 'stock']`):
    - `home` / `seller/home`: `"Home"` (`Home`)
    - `pos`: `"Terminal de Venta"` (`Store`)
    - `catalog`: `"Catálogo y Stock"` (`Boxes`)
    - `drawer`: `"Apertura/cierre de Caja"` (`LockKeyhole`)
    - `history`: `"Historial de Mis Ventas"` (`Receipt`)
- **Rationale**: Filtering `NAV_ITEMS` via `useAuth().user?.role` keeps role logic declarative and easily extensible for future roles without conditional JSX branches.

### 3. Responsive Dual-Mode CSS Architecture (Desktop `w-72` / `w-20` vs Mobile Off-Canvas Drawer)
- **Decision**:
  - **Mobile (`< 1024px`)**: `<aside>` is always `w-72 h-[100dvh]` off-canvas (`-translate-x-full` when closed, `translate-x-0` when `isOpenMobile` is `true`), regardless of `isCollapsedDesktop`.
  - **Desktop (`lg:` $\ge 1024\text{px}$)**: `<aside>` is always visible (`lg:translate-x-0`) and switches width class between `lg:w-72` (`!isCollapsedDesktop`) and `lg:w-20` (`isCollapsedDesktop`).
  - **Active Highlighting**: Each navigation button uses `min-h-[48px]`. When active, it applies `bg-[#007bb9] text-white shadow-sm font-semibold` and renders a left vertical indicator bar (`<span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#006194] dark:bg-[#93ccff] rounded-r-full" />`). When collapsed on desktop (`lg:`), text labels and extended footer details are hidden (`lg:hidden`), icons are centered (`lg:justify-center lg:px-0`), and each button sets `title={item.label}` for native hover tooltips.
  - **Hamburger Button in `TopBar.tsx`**: Visible on both mobile and desktop. Clicking it invokes a unified handler in `App.tsx` that checks `window.innerWidth >= 1024`: on desktop it toggles `isCollapsedDesktop`; on mobile it opens `isMobileSidebarOpen`.

## Risks / Trade-offs

- **[Risk] Double headers in Admin Views** → `AdminHomeDashboardView`, `AdminUserManagementView`, and `AdminBackupRecoveryView` currently render their own internal `<header>` and `<aside>`. **Mitigation**: Remove the embedded `<aside>`, mobile backdrop, and redundant outer `<div className="lg:pl-20">` wrapper from all three admin views so they integrate cleanly inside the `<main>` container of `src/App.tsx`, while adapting `TopBar.tsx` to display role-appropriate badges (e.g., `"Portal Administrador • Super Admin"` when `user?.role === 'admin'`, and cash float / terminal controls for POS operators).
- **[Risk] Desktop collapsed state affecting mobile drawer layout** → If a user collapses the sidebar on desktop and resizes the browser to mobile width, `isCollapsedDesktop` could hide text labels inside the mobile drawer. **Mitigation**: Scope collapsed icon-rail classes strictly to the `lg:` breakpoint (`lg:w-20`, `lg:hidden` for labels when `isCollapsedDesktop` is true) so mobile viewports (`< lg:`) always render full 288px (`w-72`) labels and telemetry cards.

