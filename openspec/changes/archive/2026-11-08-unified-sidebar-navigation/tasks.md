# Tasks

## 1. Navigation Types & Role Configuration

- [x] 1.1 Update `src/types/pos.ts` if needed to ensure all administrative and POS routes (`admin/home`, `admin/users`, `admin/backup`, `seller/home`, `pos`, `catalog`, `drawer`, `history`) are included in `NavigationTab`, and verify TypeScript compilation passes with `npm run lint`.
- [x] 1.2 Define the typed `NavigationItem` interface and declarative `NAV_ITEMS` array in `src/components/Sidebar.tsx` mapping routes, labels, Lucide icons (`BarChart3`, `UserCog`, `RotateCcw`, `Sliders`, `Home`, `Store`, `Boxes`, `LockKeyhole`, `Receipt`), and permitted `UserRole[]`. Manually verify that `useAuth().user?.role` filters items accurately for both `admin` and `seller`/`cashier` profiles.

## 2. Unified Sidebar Component (`Sidebar.tsx`) & Desktop 80px Icon-Rail (Option B)

- [x] 2.1 Refactor `src/components/Sidebar.tsx` props (`SidebarProps`) to accept `isCollapsedDesktop: boolean` and render the VoltAcc Kinetic brand lockup, role-filtered navigation items, and bottom telemetry/dark-mode card. Verify in the browser that expanded mode (`w-72` / 288px) preserves the exact VoltAcc visual styling across profiles.
- [x] 2.2 Implement the desktop 80px Icon-Rail collapsed mode (`lg:w-20`) in `src/components/Sidebar.tsx` when `isCollapsedDesktop` is `true`, hiding brand text and item labels on `lg:` while centering icons and adding native `title` tooltips. Verify in the browser at desktop width ($\ge 1024\text{px}$) that toggling collapses the sidebar to 80px and highlights the active route icon with a `#007bb9` pill, white icon, and left indicator bar.
- [x] 2.3 Enhance smartphone and mobile off-canvas drawer ergonomics (`< 1024px`) in `src/components/Sidebar.tsx` with `h-[100dvh]`, safe-area bottom padding (`pb-[env(safe-area-inset-bottom,12px)]`), blurred backdrop overlay, $\ge 44 \times 44\text{px}$ touch targets (`min-h-[48px]`), and auto-dismiss on item selection. Verify in Chrome DevTools mobile device toolbar (e.g., iPhone 14 / Pixel 7 viewport) that tapping any menu item navigates and automatically closes the drawer.

## 3. TopBar Hamburger Control & Role-Aware Header (`TopBar.tsx`)

- [x] 3.1 Update `src/components/TopBar.tsx` so the hamburger menu button is visible on both mobile and desktop viewports, adjusts its left offset dynamically (`lg:left-72` when expanded vs `lg:left-20` when collapsed), and displays role-appropriate context badges (e.g., `"Portal Administrador • Super Admin"` for `admin` and terminal/float controls for POS operators). Manually verify in the browser that clicking the hamburger button toggles the 80px icon-rail on desktop and opens the off-canvas drawer on mobile.

## 4. Admin Views Refactoring & Root Layout Shell (`App.tsx`)

- [x] 4.1 Remove the embedded `<aside>` icon-rail, mobile backdrop, and redundant local `<header>` / `lg:pl-20` wrapper from `src/components/AdminHomeDashboardView.tsx`, `src/components/AdminUserManagementView.tsx`, and `src/components/AdminBackupRecoveryView.tsx`. Verify via code inspection and `npm run lint` that zero `<aside>` tags remain in any admin view component.
- [x] 4.2 Unify the authenticated layout shell in `src/App.tsx` by managing `isCollapsedDesktop` and `isMobileSidebarOpen` state at the root level, rendering `<Sidebar />` and `<TopBar />` for all authenticated roles, and dynamically applying `lg:pl-72` or `lg:pl-20` to the main content wrapper. Verify with `npm run build` that the production bundle compiles without errors.

## 5. End-to-End Manual Browser Verification

- [x] 5.1 Log in as Administrator (`admin`) and manually verify in the browser: unified VoltAcc sidebar appearance, switching between `#admin/home`, `#admin/users`, and `#admin/backup`, desktop hamburger toggle into the 80px icon-rail with active icon highlighting, dark mode toggle, and mobile responsive drawer behavior.
- [x] 5.2 Log in as Seller/Cashier (`vendedor`) and manually verify in the browser: role-filtered POS navigation items (`Home`, `Terminal de Venta`, `Catálogo y Stock`, `Apertura/cierre de Caja`, `Historial de Mis Ventas`), desktop 80px icon-rail toggle, active icon highlighting, and smartphone drawer auto-close upon route selection.

