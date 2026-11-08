# layout/unified-sidebar-navigation Specification

## Purpose

Provides a unified, reusable navigation sidebar across all POS operator and administrative roles with VoltAcc Kinetic brand styling, a collapsible 80px desktop icon-rail with active view highlighting, and touch-friendly off-canvas mobile drawer ergonomics for smartphones.

## Requirements

### Requirement: Centralized Unified Sidebar Shell Across All Roles
The system SHALL render navigation through a single shared sidebar component mounted at the root layout level for all authenticated roles (`admin`, `manager`, `cashier`, `seller`, `technician`), without embedding duplicate `<aside>` elements inside individual feature views.

#### Scenario: Mounting the shared sidebar for an administrator session
- **WHEN** an authenticated user with role `admin` loads any administrative view (`#admin/home`, `#admin/users`, or `#admin/backup`)
- **THEN** the root layout renders the shared `Sidebar` and `TopBar` components
- **AND** the active administrative view renders inside the main content canvas without mounting a view-local `<aside>` element

#### Scenario: Mounting the shared sidebar for a seller or cashier session
- **WHEN** an authenticated user with role `cashier` or `seller` loads any POS view (`#seller/home`, `#pos`, `#catalog`, `#drawer`, or `#history`)
- **THEN** the root layout renders the same shared `Sidebar` component with identical structural styling

### Requirement: Role-Based Navigation Link Filtering
The system SHALL dynamically filter and display only the navigation routes authorized for the currently authenticated user's role.

#### Scenario: Filtering navigation links for administrator role
- **WHEN** the authenticated user has role `admin`
- **THEN** the sidebar displays administrative links (`Resumen y Logs` -> `#admin/home`, `Gestión de Usuarios` -> `#admin/users`, `Backup & Recovery` -> `#admin/backup`, and `Configuración` -> `#admin/config`)
- **AND** hides cashier-only POS checkout routes (`#pos`, `#drawer`, `#history`)

#### Scenario: Filtering navigation links for cashier or seller role
- **WHEN** the authenticated user has role `cashier` or `seller`
- **THEN** the sidebar displays POS operational links (`Home` -> `#seller/home`, `Terminal de Venta` -> `#pos`, `Catálogo y Stock` -> `#catalog`, `Apertura/cierre de Caja` -> `#drawer`, and `Historial de Mis Ventas` -> `#history`)
- **AND** hides administrative routes (`#admin/*`)

### Requirement: VoltAcc Kinetic Visual Identity Preservation
The system SHALL maintain the VoltAcc Kinetic visual design across all user roles, including the brand header lockup, corporate blue active states (`#007bb9`), and the bottom terminal telemetry and theme control card.

#### Scenario: Displaying the VoltAcc brand header and bottom telemetry card
- **WHEN** the sidebar is rendered in expanded state for any user role
- **THEN** the top header displays the rounded `#007bb9` icon container with white `Zap` logo, `"VoltAcc"` title, and `"RETAIL POS"` subtitle
- **AND** the bottom card displays the online status indicator dot, active terminal/role node badge, and the dark/light mode toggle button

### Requirement: Desktop Dual-Mode Retraction into 80px Icon-Rail (Option B)
The system SHALL allow desktop operators (`lg:` viewport $\ge 1024\text{px}$) to toggle the sidebar via the `TopBar` hamburger button between an expanded 288px (`w-72`) state and a collapsed 80px (`w-20`) icon-rail state while highlighting the active view icon.

#### Scenario: Collapsing the sidebar into the 80px icon-rail on desktop
- **WHEN** a user on a desktop viewport ($\ge 1024\text{px}$) clicks the hamburger menu button in the `TopBar` while the sidebar is expanded
- **THEN** the sidebar transitions to `w-20` (80px), hiding brand text and item text labels while centering the navigation icons vertically
- **AND** the main layout content container transitions its left offset from `lg:pl-72` to `lg:pl-20`

#### Scenario: Highlighting the active route icon in collapsed and expanded modes
- **WHEN** a navigation item matches the currently active route (`currentTab`) in either expanded or 80px icon-rail mode
- **THEN** the item is highlighted with a corporate blue background (`bg-[#007bb9]`), crisp white icon (`text-white`), subtle shadow, and a vertical active indicator pill on the left edge
- **AND** in 80px icon-rail mode, hovering over any icon displays its route label via native tooltip (`title`)

### Requirement: Smartphone and Mobile Off-Canvas Drawer Ergonomics
The system SHALL render the sidebar on mobile and tablet viewports (`< 1024px`) as a full-height (`100dvh`) off-canvas drawer overlay with blurred backdrop, $\ge 44 \times 44\text{px}$ touch targets, safe-area padding, and automatic dismissal upon route selection.

#### Scenario: Opening the mobile navigation drawer on a smartphone
- **WHEN** a user on a mobile viewport (`< 1024px`) taps the hamburger menu button in the `TopBar`
- **THEN** the sidebar slides in from the left (`translate-x-0`) at full expanded width (`w-72`) above the page content with a blurred backdrop overlay (`backdrop-blur-xs`)
- **AND** each navigation button and close control provides a minimum touch target height of 44px (`min-h-[44px]`)

#### Scenario: Auto-dismissing the mobile drawer upon selecting a route
- **WHEN** the mobile drawer is open on a smartphone and the user taps any navigation route item
- **THEN** the application navigates to the selected route and automatically closes the mobile drawer (`-translate-x-full`)

#### Scenario: Dismissing the mobile drawer via backdrop tap or close button
- **WHEN** the mobile drawer is open and the user taps the darkened backdrop or the top-right `X` close button
- **THEN** the mobile drawer retracts off-screen (`-translate-x-full`) and hides the backdrop overlay

