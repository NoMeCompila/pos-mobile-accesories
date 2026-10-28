---
name: pos-ui-react19-tailwind4
description: Expert Frontend and UI/UX architect for Point of Sale (POS) systems built with React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React, and Motion. Use when building or extending POS screens, checkout interfaces, repair intake forms, dashboards, or thermal print previews while strictly preserving the existing project design system, theme tokens, and component patterns.
---
# pos-ui-react19-tailwind4

## Summary

Architects and implements high-speed, keyboard-first Point of Sale (POS) interfaces using React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React, and Motion, strictly inheriting and extending the existing visual design language, layout structure, and theme tokens established in the repository.

## When to Use

- Building new views or components (Sales Checkout, Catalog CRUD, Repair Work Orders, Cash Shift Arqueo, Customer Current Accounts, or Analytics Dashboards) that must match the existing project UI
- Extending Tailwind CSS v4 `@theme` tokens, color palettes, typography scales, dark/light mode surfaces, and corporate logo branding already present in the codebase
- Implementing keyboard-first cashier ergonomics (`F1` to `F12` function key shortcuts, persistent USB barcode scanner focus listeners, and rapid modal navigation)
- Enforcing role-based UI states across the 5 system profiles (Admin, Manager, Cashier, Technician, and external Customer tracking portal)
- Designing responsive thermal print layouts (58mm and 80mm tickets, barcode sticker labels, and ARCA QR fiscal receipts) and Motion micro-interactions

## Steps

### 1. Audit and Inherit the Existing Project Design System First

Before creating or modifying any component, inspect the existing repository structure to guarantee 100% visual and architectural consistency:

- **Reuse Existing Primitives and Layouts**: Inspect `src/components/`, `src/layouts/`, and `src/styles/` (or the main CSS entry file) first. Reuse the project's established buttons, inputs, tables, badges, modals, sidebar navigation, and header shells rather than introducing duplicate or competing UI patterns.
- **Strictly Follow Tailwind CSS v4 Conventions**: Use the project's CSS-first `@import "tailwindcss";` and `@theme` custom variables (brand primary/secondary colors, surface backgrounds, border radii, and spacing tokens) instead of legacy `tailwind.config.js` overrides or arbitrary hardcoded hex values.
- **Preserve Corporate Identity and Visual Hierarchy**: Maintain the store's corporate logo placement, high-contrast semantic status badges (such as repair workflow states, stock alert levels, and online/offline connectivity indicators), and consistent Lucide React icon sizing (`size={16}` for dense table actions, `size={20}` for navigation and primary buttons).

### 2. Apply React 19, TypeScript, and Vite 6 Architecture Standards

Leverage modern React 19 capabilities and strict TypeScript typing across all modules:

- **Strict TypeScript Contracts**: Define explicit interfaces aligned with the generated Supabase database types (`Database['public']['Tables']`) for every component prop, form payload, and state store; prohibit `any` types and unsafe type assertions.
- **React 19 Form and Async Patterns**: Utilize React 19 action states (`useActionState`), optimistic UI updates (`useOptimistic`) for instant cart line edits and repair status transitions, and clean `ref` prop passing without legacy `forwardRef` wrappers.
- **Sub-Millisecond Cart and Table Rendering**: Keep high-frequency state (such as active POS cart items, barcode buffer inputs, and live search filters) isolated from heavy parent layout re-renders, and paginate or virtualize large product catalogs and historical invoice tables.

### 3. Engineer Keyboard-First Cashier Ergonomics and Hardware Focus

Optimize the Point of Sale counter interface for rapid, mouse-free operation on Windows PC workstations:

- **Global USB Barcode Scanner Listener**: Capture high-speed sequential keystrokes terminated by `Enter` at the window level so USB barcode scanners add accessories or look up repair orders reliably even when the search input is not explicitly focused, while ignoring scanner triggers when the user is typing inside a text note or modal input.
- **Standardized Function Key Shortcuts**: Bind predictable keyboard shortcuts for daily counter actions (such as focusing product search, toggling Retail vs. Wholesale price lists, selecting payment tender, opening the external Posnet voucher confirmation modal, and triggering ticket checkout) with visible `kbd` shortcut hints in the UI.
- **Purposeful Motion Micro-Interactions**: Use the `motion` library sparingly with fast, non-blocking transitions (120ms to 180ms ease-out) for modal dialogs, drawer slide-overs, and toast notifications so animations never slow down consecutive cashier keystrokes.

### 4. Enforce Role-Based UI Visibility and Operational Safeguards

Align frontend views strictly with the five operational profiles and security rules:

- **Cost and Expected Balance Masking**: Conditionally hide wholesale supplier cost columns (`cost_price_usd`) and profit margin indicators from Cashier and Technician views, and never render theoretical expected cash totals on the shift-closing screen before the cashier submits the blind count (*arqueo ciego*).
- **Supervisor Override Interception**: When a cashier triggers a restricted action (voiding a sale line, applying an extraordinary discount, or querying wholesale cost), automatically display the Supervisor Authorization Modal requiring manager PIN/credential verification before proceeding.
- **Real-Time Connectivity and ARCA Sync Status Bar**: Keep a persistent, unobtrusive status indicator in the top application bar displaying current internet connectivity, ARCA `WSFEv1` server availability, and the count of any offline sales (`PENDING_CAE` / `OFFLINE_QUEUED`) waiting in the local `IndexedDB` outbox.

### 5. Build Dedicated Print Views and External Customer Tracking Portals

Separate interactive screen layouts from physical print media and public customer views:

- **Thermal Ticket and Barcode Label Print Media (`@media print`)**: Create dedicated, high-contrast black-and-white stylesheets for 58mm and 80mm continuous thermal rolls. Strip all navigation chrome, shadows, and background fills during printing, and ensure crisp rendering of internal `Code128` product barcodes and the official ARCA Base64 QR code alongside the 14-digit CAE and expiration date.
- **Responsive External Customer Repair Portal**: Design the public repair tracking view as a clean, mobile-first status card (accessible via ticket QR scan or order code) that displays device intake details, diagnostic progress steps, and ready-for-pickup alerts while excluding all internal workshop admin navigation.

## Gotchas

- **Breaking Existing Visual Styles With Unscoped Classes**: Never overwrite global base styles or invent new card/table designs when an existing component pattern already exists in the repo; always inspect neighboring feature modules first and replicate their exact class structure.
- **Focus Trapping That Breaks Barcode Scanners**: Leaving focus trapped inside a closed radix/custom modal or a disabled button after adding an item to the cart will cause subsequent USB barcode scans to fail; always return focus cleanly to the main checkout workspace.
- **Displaying Unformatted Currency or Floating-Point Decimals**: Never render raw numbers for ARS or USD amounts; always format currency values consistently using `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` (or `USD`) and display an explicit indicator showing whether the active cart is using the *Minorista* (Retail) or *Mayorista* (Wholesale) price list.
- **Heavy Client Bundles Blocking Initial POS Load**: Lazy-load administrative modules (such as Excel/PDF export generators, chart libraries, and backup settings) via `React.lazy()` so the primary Cashier POS and Login screens load instantaneously.
