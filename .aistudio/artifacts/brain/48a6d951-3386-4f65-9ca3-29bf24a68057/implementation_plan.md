# VoltAcc Retail POS - Kinetic Retail Point of Sale System

A high-performance, enterprise-grade retail Point of Sale (POS) and inventory web application designed for fast-paced consumer tech and mobile accessory environments. The app delivers rapid barcode/SKU scanning, live multi-tender checkout, item voiding/refunds, real-time inventory management, sales history auditing with thermal receipt inspection, and cash drawer shift settlement.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were aligned during Phase 1 interactive clarification:

- **Data Persistence**: Offline-first client persistence powered by TanStack Query and synchronized `localStorage` caching for instant response, zero latency, and persistent transactions across reloads.
- **Prioritized Workflow Screen**: Complete cash drawer shift opening, float counting, and closing audit settlement screen (**Apertura/Cierre de Caja**) alongside the core POS terminal (**Terminal de Venta**), sales history (**Historial de Mis Ventas**), and stock inventory catalog (**Catálogo y Stock**).
- **Feedback & Feedback Mode**: Pure visual feedback with responsive animations, toast alerts, and status transitions without audio beeps.
- **Navigation & Layout**: Centralized reactive router linking all 5 views seamlessly (`Home`, `Terminal de Venta`, `Catálogo y Stock`, `Apertura/Cierre de Caja`, `Historial de Mis Ventas`), supporting responsive desktop 2-column split, collapsible sidebar drawer, and mobile bottom bar.
- **Theming**: First-class light and dark mode toggles with persistent user preference using Tailwind CSS v4 variables matching design tokens.

---

## 1. Overview & Core Concept

VoltAcc Retail POS is built for high-throughput retail stores (Store #104 / Flagship Downtown, Terminal #02) where speed, ergonomic accuracy, and reliability are essential.

### Target Personas & Workflows
1. **Cashier (E. Harrison)**: Rapid barcode scanning (F1), touch catalog selection, quick customer association (F4), coupon discounts, payment tender processing (Cash F8, Card F9, Bizum, Split), ticket parking ("En Espera"), and instant manual service additions (F2).
2. **Floor Staff / Inventory Clerk**: Real-time shelf inventory monitoring, stock threshold alerts (low stock < 5, critical out-of-stock), brand/category filtering, batch stock adjustments, and shelf location routing (Pasillo A-02, Cabecera C-01, Vitrinas).
3. **Shift Supervisor / Cash Auditor**: Shift float declaration ($250.00 initial float), mid-shift cash drops/movements, blind/verified shift close reconciliations with discrepancy calculation, and full transactional audit logs with thermal receipt reprinting and refunds.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme Tokens
- **Brand Palette**:
  - Dominant Canvas: Light `#faf8ff` (Surface) / Dark `#0f172a` (Inverse Surface)
  - Structural Cards: Light `#ffffff` (Surface Container Lowest) / Dark `#1e293b`
  - Primary Accent: `#006194` (Cobalt Sky) with high-contrast `#ffffff` text
  - Tertiary Accent: `#006947` / `#10b981` (Emerald) for active status, cash tenders, and completed transactions
  - Warning/Critical: `#ba1a1a` / `#ffdad6` for returns, voids, and out-of-stock items; Amber for low stock (< 5 units)
- **Typography**:
  - Headlines: `Space Grotesk` (clean, geometric, authoritative numbers)
  - Interface & Body: `Hanken Grotesk` / sans-serif (crisp legibility at all counter angles)
  - Data, SKUs & Currencies: `JetBrains Mono` with `tabular-nums` alignment
- **Ergonomics & Touch**:
  - 48px to 56px touch targets for rapid touch-screen operation
  - Keyboard shortcuts dock with dedicated listeners: `F1` (Scan), `F2` (Manual item), `F4` (Customer), `F8` (Cash), `F9` (Card), `F12 / Space` (Tender total), `Esc` (Dismiss/Cancel)

### Screen & Flow Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Navigation & Context Bar                    │
│  [Logo VoltAcc] · [Store #104 Term #02] · [Float: $250.00] · [Cashier] │
├───────────────┬────────────────────────────────────────────────────────┤
│   Sidebar     │                       Main Canvas                      │
│               │                                                        │
│ • Home        │ 1. Terminal de Venta (POS Split: Catalog + Cart)       │
│ • Venta (POS) │ 2. Catálogo y Stock (Grid/List, Filter, Shelf Locator) │
│ • Catálogo    │ 3. Apertura/Cierre de Caja (Float, Audits, Settlement) │
│ • Caja        │ 4. Historial de Mis Ventas (KPI Bento, Table, Ticket)  │
│ • Historial   │ 5. Home (Summary, Quick Actions, Daily Goals)          │
│               │                                                        │
│ [Shift Status]│                                                        │
└───────────────┴────────────────────────────────────────────────────────┘
```

#### 1. Terminal de Venta (Core POS)
- **Left Panel (65%)**:
  - F1 Barcode input field with quick-add SKU button.
  - Customer selector pill (e.g., General Customer, VIP points, NIF assignment).
  - Category carousel chips (`Todos`, `Fundas iPhone`, `Protectores 9H`, `Cargadores & GaN`, `Cables Reforzados`, `Audio / Wearables`).
  - Product grid with 8 default catalog items + Express Manual Item tile (+ Artículo Manual / F2).
  - Stock indicators on tiles (`18 uds disp.`, `¡Última ud!`, `3 uds`).
  - Real-time spark velocity bar (`34 tickets emitidos ($1,420.80) · Lector OK · TPV OK`).
- **Right Panel (35%)**:
  - Ticket header with active transaction number (`#TRX-8942`) and status badge (`En curso`).
  - "En Espera" button to park current ticket and start a new one.
  - Interactive item stream with quantity steppers (`-`, `+`) and line delete button.
  - Financial breakdown: Subtotal, Promo Coupon input (`ACC-10%`), Base Imponible, IVA desglosado (21%), and Total a Cobrar.
  - Quick Payment selector: Efectivo (F8), Tarjeta/TPV (F9), Bizum/Contactless, Dividir Pago.
  - High-impact Master Pay button (`Cobrar $113.21 [F12]`).
  - Hardware peripheral status indicators (Epson TM-T20III connected, cash drawer ready).

#### 2. Historial de Mis Ventas (Sales History)
- **KPI Bento Cards Grid**: Total Personal ($1,420.80, +14.2%), Ticket Medio ($41.78), Top Artículo (GaN 45W Dual), Mix de Cobros (Card 55%, Cash 36%, Bizum 9%), Comisión/Meta (85% to daily goal).
- **Filter Bar**: Time ranges (Hoy, Esta semana, Este mes, Personalizado), Payment method filter, Status filter, Search input by #TRX, client, or item.
- **Transaction Table**: Paginated list with ticket number, timestamp, item summary, customer, tender type, amount, status badge, and quick action buttons (reprint, return).
- **Active Ticket Inspector**: Detailed receipt breakdown with customer loyalty info, line items with SKU, VAT breakdown, payment authorization code, and actions: "Reimprimir Copia", "WhatsApp / Email", and "Iniciar Devolución / Canje Parcial".

#### 3. Catálogo y Stock (Inventory & Shelving)
- **Header Summary**: Active references (1,480 Ref. Activas), In stock (1,466 Disp.), Low stock alerts (14 Bajo Stock), and Batch scan button.
- **Search & Advanced Filters**: Multi-criteria search by SKU/model, stock levels (Con stock, Crítico <5, Agotados), brand selector (Apple, Samsung, Xiaomi, Google), and category pills.
- **Dual Display Modes**: Toggle between List and Grid views.
- **Rich Inventory Cards**: Shelf location indicators (`Pasillo A-02`, `Cabecera C-01`, `Cajón Mostrador`), real-time stock pills, price with VAT, and instant "+ Ticket" action.

#### 4. Apertura y Cierre de Caja (Cash Drawer Settlement)
- **Shift State Header**: Terminal Node #02, Current Status (Turno Abierto / Cerrado), Shift Operator (E. Harrison), Start Time (08:30 AM).
- **Cash Counting Calculator**: Denomination breakdown tool (Bills: $100, $50, $20, $10, $5; Coins: $2, $1, $0.50, $0.20, $0.10) with automatic total computation.
- **Reconciliation Engine**: Expected Cash vs. Counted Cash, automatically detecting cash overages/shortages (Sin Discrepancias / Cuadre exacto).
- **Cash Movement Registry**: Record manual entries (Ingreso / Retirada / Pago a proveedores) with audit timestamp and reason.
- **Closing Report Generator**: Thermal Z-Report preview ready to print or export.

#### 5. Home / Store Dashboard
- Executive daily snapshot, quick shortcuts into sales and inventory, cashier leaderboard, and active store alerts.

---

## 3. Key Product Decisions & Trade-Offs

- **TanStack Query + LocalStorage State Store**:
  - *Chosen Approach*: Wrap an in-memory repository with `@tanstack/react-query` query hooks (`useQuery({ queryKey: ['products'], ... })`, `useMutation`) with automatic hydration from and persistence to `localStorage`.
  - *Why*: Provides reactive state, caching, instant UI updates, optimistic inventory decrements upon checkout, and query invalidation without requiring server infrastructure.
- **Centralized Router Architecture**:
  - *Chosen Approach*: Single router state management with synced URL hash / state (`/pos`, `/history`, `/catalog`, `/drawer`, `/home`) supporting deep linking, browser navigation, and mobile bottom tab synchronization.
- **Realistic Interactive Modals**:
  - Manual Item creation modal (F2) with custom title, price, and tax category.
  - Payment completion overlay with change calculation for cash tenders.
  - Thermal receipt preview modal with formatted printable ticket.
  - Return/Refund processor calculating line refunds and updating inventory stock.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Centralized Router & App                        │
│                (App.tsx: Layout, Sidebar, TopBar, Routes)               │
├────────────────────────────────────────────────────────────────────────┤
│                       TanStack Query State Layer                       │
│  ┌───────────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │   useProducts     │  │    useCart       │  │    useSalesHistory  │ │
│  └─────────┬─────────┘  └────────┬─────────┘  └──────────┬──────────┘ │
│            │                     │                       │            │
│  ┌─────────┴─────────────────────┴───────────────────────┴──────────┐ │
│  │               Storage Persistence Bridge (localStorage)          │ │
│  │   • Default seed database with high-fidelity retail products     │ │
│  │   • Persistent sales transactions and receipts                   │ │
│  │   • Cash drawer float and shift records                          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│                         Interactive Screen Views                       │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌──────────┐ │
│  │ POSTerminalView│ │SalesHistoryView│ │  CatalogView   │ │CashDrawer│ │
│  └────────────────┘ └────────────────┘ └────────────────┘ └──────────┘ │
│                                                                        │
│                         Global Modal & Dock Systems                    │
│  • Checkout Modal & Change Calculator    • Thermal Receipt Print Modal │
│  • Manual Item / Repair Dialog (F2)      • Customer Selector Modal     │
│  • Keyboard Shortcuts Listener Dock      • Theme Toggle (Light/Dark)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Schema Entities
- **Product**: `id`, `sku`, `name`, `category`, `brand`, `price`, `stock`, `shelfLocation`, `image`, `isLowStock`, `isService`.
- **CartItem**: `product`, `quantity`, `discountPercent`, `notes`.
- **Ticket / Transaction**: `id` (`#TRX-8942`), `timestamp`, `cashier`, `terminal`, `customer` (`name`, `nif`, `points`), `items`, `subtotal`, `discount`, `vat`, `total`, `paymentMethod` (`cash`, `card`, `bizum`, `split`), `authCode`, `status` (`paid`, `refunded`, `held`).
- **CashShift**: `shiftId`, `operator`, `openedAt`, `closedAt`, `initialFloat`, `cashSales`, `cardSales`, `bizumSales`, `movements`, `countedCash`, `discrepancy`, `status` (`open`, `closed`).

---

## 5. Verification & Implementation Sequence

1. **Step 1 - Package Setup**: Install `@tanstack/react-query` via `install_applet_package`.
2. **Step 2 - Types & Seed Data**: Build `src/types/pos.ts` and `src/data/mockData.ts` containing the complete inventory with high-fidelity products, categories, historical tickets, and cash shifts.
3. **Step 3 - Query & State Store**: Build `src/services/posStore.ts` with TanStack Query hooks and persistence methods.
4. **Step 4 - Components & Layout**:
   - `Sidebar` & `TopBar` with drawer toggle, active cashier status, float pill, and dark mode toggle.
   - `POSTerminalView` matching Image 3 / Image 7 layout.
   - `SalesHistoryView` matching Image 5 layout with KPI cards and receipt inspector.
   - `CatalogStockView` matching Image 11 layout with search and shelf markers.
   - `CashDrawerSettlementView` with currency counter and audit balancing.
   - Modals: Manual Item Modal, Checkout / Payment Modal, and Thermal Receipt Modal.
5. **Step 5 - Keyboard Shortcuts**: Global listener for F1, F2, F4, F8, F9, F12, Esc.
6. **Step 6 - Verification**: Run `compile_applet` and test all views, flows, and theme toggling.
