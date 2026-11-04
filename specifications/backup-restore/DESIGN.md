---
name: Kinetic Retail POS
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-numeric:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
  label-badge:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.25rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style
The design system powers an enterprise-grade retail Point of Sale (POS) environment tailored for high-volume consumer tech and mobile accessory retail. Designed for cashiers, technicians, and floor managers operating under bright fluorescent lighting or varied store floor setups, the interface prioritizes ergonomics, operational velocity, and immediate glanceability.

The visual direction merges **Modern Functional Minimalism** with **Tactile Utility**:
- **Operational Clarity:** High information density without visual crowding; interfaces are engineered around fast-paced customer lines and high transaction throughput.
- **Precision & Tactility:** Surfaces feature crisp borders, tactile press responses, and unambiguous affordances to reduce mis-taps during rush periods.
- **Physical-First Ergonomics:** All actionable controls enforce strict touch-first sizing (minimum 44×44px hit targets) while maintaining tight keyboard shortcuts and barcode scanning workflows.

## Colors
The palette balances neutral grounding with high-chroma functional indicators to communicate stock states, cart totals, and terminal hardware status instantly.

- **Primary & Secondary (`#0284c7` & `#2563eb`):** Electric sky and cobalt blues drive high-priority transactional triggers, selected category tabs, scan confirm buttons, and key customer lookup fields.
- **Tertiary (`#10b981`):** Pure emerald green designates positive checkout confirmations, cash payment tenders, healthy SKU inventory, and active peripheral states (e.g., barcode scanner paired, drawer connected).
- **Alert Tones:**
  - **Amber (`#f59e0b`):** Warning states, low-stock threshold triggers (< 5 items), and held transactions.
  - **Rose (`#ef4444`):** Out of stock, item voids, price overrides requiring manager PIN, and card charge failures.
- **Neutrals (`#0f172a` down to `#f8fafc`):** Slate-based neutrals prevent eye fatigue over 8-hour shifts. The canvas operates on `#f8fafc` in light mode with `#ffffff` card tiles and `#e2e8f0` structural dividers. In dark mode, `#0f172a` acts as the root canvas with `#1e293b` container surfaces and `#334155` crisp dividing lines.

## Typography
Typography is segmented by ergonomic function to eliminate cognitive delay at checkout:

- **Headlines (`Space Grotesk`):** Contemporary, geometric, and firm. Applied to register totals, major modal titles, drawer settlement tallies, and primary category headings.
- **Interface & Body (`Hanken Grotesk`):** A razor-sharp grotesque offering immaculate legibility at varying viewing angles and distances on counter-mounted tablet displays.
- **Data & Numerical (`JetBrains Mono`):** Monospaced alignment applied to all price tags, cart subtotals, barcode sequences (EAN/UPC), IMEI numbers, and hardware diagnostic readouts. Tabular figures prevent layout jumping during continuous scanning.

## Layout & Spacing
The layout adheres to a split transactional workspace model optimized for touch terminals and dual-screen displays:

- **Fixed-Ratio Master Panels:** 
  - On counter registers (>= 1024px width), the screen is permanently split: 60% Left Catalog Grid (category filters, quick-tap SKU tiles) and 40% Right Order Manifest (cart stream, tax adjustments, total summary, action buttons).
  - On handheld mobile inventory/line-busting devices (< 768px), the layout reflows into a swipeable single-column view with an anchored bottom sheet indicating running totals and a single-tap "View Cart" sheet.
- **Rhythm & Touch Density:**
  - Spacing uses a base-4 system with strict density bounds. Touch targets must never collapse below `44px` (48px preferred for action items).
  - Dense product grids utilize `space-md` gaps to maximize visible product inventory without triggering mis-taps.

## Elevation & Depth
Depth conveys physical hierarchy between system background, operational canvas, and critical interrupting events:

- **Layer 0 (Canvas):** Tone `#f8fafc` (Light) / `#0f172a` (Dark). Recessed foundation.
- **Layer 1 (Card & Grids):** Surface `#ffffff` (Light) / `#1e293b` (Dark). 1px border using `rgba(15, 23, 42, 0.08)` (Light) or `rgba(255, 255, 255, 0.08)` (Dark). Minimal diffused drop shadow: `0 1px 3px rgba(15, 23, 42, 0.05)`.
- **Layer 2 (Floating Cart Bar & Dropdowns):** Subtle ambient shadow: `0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)`.
- **Layer 3 (Modals, Overrides, Tender Processing):** Elevated overlay surfaces with `0 20px 25px -5px rgba(15, 23, 42, 0.15)` paired with a soft slate backdrop veil (`rgba(15, 23, 42, 0.5)` with `backdrop-filter: blur(4px)`).

## Shapes
The design system employs a **Rounded** shape language (`roundedness: 2` / 0.5rem base radius):

- **Interactive Elements (Buttons, Inputs, Selectors):** Base `0.5rem` (`8px`) border radius. This delivers an ergonomic, comfortable touch surface that visually distinguishes controls from rigid hardware frames.
- **Container Surfaces (Product Tiles, Cart Summary Sheets):** `rounded-lg` (`1rem` / `16px`) to define clear module boundaries.
- **Status Pills & Stock Indicators:** Fully circular capsules (`9999px`) for SKU counts, warranty indicators, and peripheral statuses.

## Components

### Buttons
- **Touch Targets:** Minimum height of 48px on main triggers; 56px on Primary Checkout Tender buttons.
- **Primary (Tender/Pay):** Deep sky-to-cobalt gradient background (`#0284c7` to `#2563eb`), white high-contrast text, 0.5rem radius, active state translates down 1px with a darkened tone for immediate mechanical feedback.
- **Secondary (Void, Discount, Park):** Transparent fill with a solid 1.5px border matching neutral outline, dark text, subtle background hover/press tint.
- **Destructive (Delete Line Item, Cancel Sale):** Muted rose container (`#fef2f2`) with high-contrast text (`#ef4444`) to prevent catastrophic taps.

### Product Item Cards
- Surface: Crisp white with border, containing a top image/icon region, item title in `body-md` (truncated to 2 lines max), monospaced price in `label-numeric`, and an absolute top-right badge for real-time stock levels.
- Active Press: Fast scale depression (`scale(0.97)`) with instantaneous visual pulse to verify that the accessory was added to cart.

### Input Fields & Search Bars
- Minimum height 48px with clear internal prefix icons (barcode reader icon or magnifying glass).
- Clear action button (✕) displayed whenever input holds text to permit one-tap query resets.
- Border shifts to 2px solid `#0284c7` upon focus with zero offset rings.

### Data Badges & Inventory Chips
- Compact, pill-shaped tags:
  - **High Stock (10+):** Soft emerald fill (`#ecfdf5`), `#065f46` text.
  - **Low Stock (<5):** Soft amber fill (`#fffbeb`), `#92400e` text.
  - **Out of Stock:** Soft rose fill (`#fef2f2`), `#991b1b` text.

### Cart Item Lists
- Row-based tabular layout with zebra striping or explicit 1px divider lines.
- Left edge displays quantity adjustments (`-` / value / `+`) using large touch targets (minimum 36×36px per modifier).
- Right-aligned monospaced price calculation with itemized discounts tagged underneath in green.