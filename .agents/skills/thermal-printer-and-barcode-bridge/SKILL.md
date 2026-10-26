---
name: thermal-printer-and-barcode-bridge
description: Expert hardware integration architect for Point of Sale (POS) systems on Windows PCs. Use when implementing internal barcode generation (Code128 / EAN-13), USB barcode scanner keyboard-wedge listeners, adhesive product and repair label layouts, or 58mm and 80mm thermal receipt printing for ARCA fiscal vouchers, repair intake tickets, and cash register shift summaries.
---
# thermal-printer-and-barcode-bridge

## Summary

Architects and standardizes hardware peripheral workflows for Point of Sale (POS) workstations on Windows PCs, covering internal `Code128` and `EAN-13` barcode generation, zero-latency USB barcode scanner capture, adhesive label formatting, and silent or one-click 58mm/80mm thermal ticket printing.

## When to Use

- Generating unique internal barcodes (`Code128` or `EAN-13`) for unlabelled cell phone accessories, spare parts, and technical repair work orders
- Building or debugging the global USB HID barcode scanner listener to prevent dropped characters or focus conflicts during fast counter checkouts
- Designing 58mm (48mm printable width) and 80mm (72mm printable width) thermal ticket templates for ARCA Factura C vouchers, provisional offline receipts, repair intake slips, customer account receipts, and blind cash closing reports
- Formatting printable adhesive barcode labels for product shelving and incoming repair devices
- Configuring browser `@media print` stylesheets, Windows printer driver margins, or local ESC/POS print bridges for silent receipt emission

## Steps

### 1. Standardize Internal Barcode Generation (`Code128` and `EAN-13`)

Ensure every catalog item and workshop service order has a collision-free, scannable identifier:

- **Reserved Prefix Ranges by Entity Type**: Assign strict, non-overlapping prefix conventions for internally generated codes so the POS scanner listener immediately knows what entity was scanned:
  - **Unlabelled Physical Accessories and Spare Parts**: Use `EAN-13` with internal store prefix `200` to `209` (plus calculated modulo-10 check digit) or compact alphanumeric `Code128` starting with `ACC-`.
  - **Cell Phone Repair Work Orders**: Generate sequential `Code128` identifiers prefixed with `REP-` (such as `REP-000482`) so scanning the customer's paper claim slip or the sticker attached to the phone immediately loads the repair order into checkout or technician view.
- **Collision Validation at Creation**: Before persisting any newly generated internal barcode in Supabase, verify uniqueness against existing manufacturer and internal `products.barcode` records to guarantee zero ambiguous scanner matches.

### 2. Engineer the Global USB HID Barcode Scanner Listener

Capture high-speed USB keyboard-wedge scanner bursts reliably across the POS interface without manual cursor clicking:

- **Inter-Keystroke Timing Detection**: Distinguish hardware barcode scanner input from human typing by measuring the time delta between consecutive `keydown` events at the `window` level; treat bursts where characters arrive faster than 35ms per keystroke and terminate with `Enter` (or `Tab`) as a single barcode scan event.
- **Input Field Protection and Buffer Isolation**: Suppress global cart auto-addition when the active DOM element is an editable text note, customer name input, or price field (unless it is the designated POS barcode search input), flushing the keystroke buffer cleanly after every `Enter` terminator or 100ms timeout.
- **Context-Aware Scan Routing**: When a `REP-*` barcode is scanned on the POS checkout screen, automatically query and attach the completed repair work order (itemizing its spare parts and labor fee); when a product `EAN-13` / `Code128` barcode is scanned, increment the item quantity in the active cart and emit an audible/visual confirmation beep.

### 3. Architect 58mm and 80mm Thermal Receipt Templates

Structure all receipt views to render with razor-sharp legibility on continuous thermal paper rolls:

- **Configurable Paper Width Profiles**: Support both standard Argentine counter printer widths via a workstation setting: **80mm roll** (`72mm` safe printable width, 42-48 monospace characters per line) and **58mm roll** (`48mm` safe printable width, 32 monospace characters per line).
- **Mandatory Ticket Variants**:
  - **ARCA Fiscal Voucher (Factura C / Nota de Credito C / Nota de Debito C)**: Header with store logo, business name, CUIT `20334811590`, *Condicion frente al IVA: Responsable Monotributo*, *Punto de Venta* and voucher number, recipient DNI/CUIT and tax condition, itemized lines, applied payment method surcharge/discount breakdown, provincial IIBB perception line (if applicable), total ARS amount, official ARCA Base64 QR code, 14-digit CAE, and CAE expiration date.
  - **Provisional Offline Contingency Receipt**: Clearly marked non-fiscal header (*Comprobante Provisorio en Contingencia - CAE Pendiente*), internal `client_sale_id` reference, itemized lines, and payment tender summary.
  - **Cell Phone Repair Intake Ticket (Dual Copy: Customer Slip + Device Tag)**: Customer contact info, device brand/model, IMEI/serial, cosmetic intake checklist, reported fault, estimated budget, legal warranty terms signature line, internal `REP-*` barcode, and public QR code linking directly to the external customer repair status portal.
  - **Cash Register Blind Closing (*Arqueo Ciego*) and Account Statement Slips**: Shift ID, cashier name, opening timestamp, declared physical cash vs. expected payment method totals, calculated discrepancy, and manager audit signature line.

### 4. Design High-Density Adhesive Barcode Labels for Products and Repairs

Format small sticker labels so thermal label printers produce crisp, scannable bars without horizontal bleeding:

- **Pure Monochrome Vector Rendering**: Render all `Code128` and `EAN-13` barcodes using crisp SVG paths (`shape-rendering: crispEdges`) with pure `#000000` bars on `#FFFFFF` backgrounds, never anti-aliased JPEG/PNG bitmaps that blur on 203 DPI thermal printheads.
- **Quiet Zone and Minimum Bar Width**: Enforce a minimum quiet zone (blank margin) of at least `2.5mm` on both left and right sides of the barcode and a minimum module bar width of `1.5px` to `2px` at 203 DPI so standard laser and CCD scanners read labels on the first pass.
- **Compact Label Content Hierarchy**: Limit adhesive product labels (such as `30mm x 20mm` or `40mm x 25mm`) to 3 elements: truncated product name (1 line, bold), scannable barcode graphic with human-readable code below, and optional SKU or price tag.

### 5. Optimize Windows PC Browser Printing and Silent ESC/POS Execution

Eliminate layout clipping and minimize cashier clicks when printing from Windows browsers:

- **Strict `@media print` Isolation**: Hide all application navigation, sidebars, modals, and toast notifications during printing; set `@page { margin: 0; size: auto; }` and apply explicit millimeter widths (`width: 72mm` or `width: 48mm`) to the isolated print container so Windows print drivers do not shrink or paginate the receipt.
- **High-Contrast Thermal Typography**: Use high-legibility monospace or condensed sans-serif fonts in pure black (`#000000`), avoiding gray text (`#666666`) or thin font weights (`font-light`) which trigger dithering and look faded on thermal paper.
- **Kiosk Silent Printing and Bridge Support**: Document and support Chrome/Edge Windows kiosk printing flags (`--kiosk-printing`) for zero-dialog instant ticket emission at checkout, while keeping the print data contract modular so a local ESC/POS WebUSB or QZ Tray raw command bridge can be toggled without refactoring checkout components.

## Gotchas

- **Browser Header and Footer Clutter on Thermal Rolls**: Default Windows browser print settings inject URLs, page numbers, and dates at the top and bottom of the roll; always enforce `@page { margin: 0mm; }` in CSS so browser headers and footers are suppressed automatically.
- **QR Code Scannability Failure on 58mm Paper**: Rendering the ARCA fiscal QR code smaller than `22mm x 22mm` or with excessive error correction density (`Level H`) on a 203 DPI thermal printer causes the dots to merge; always use Error Correction **Level M** and a minimum size of `25mm x 25mm` centered with a white border.
- **Scanner Prefix/Suffix Collisions with Browser Shortcuts**: Some USB barcode scanners emit `Ctrl+J` or `F12` suffixes that trigger browser downloads or DevTools on Windows; intercept and call `event.preventDefault()` on rapid scanner sequences before the browser processes control key combinations.
- **Infinite Paper Feed on Fixed-Height Containers**: Never set `height: 100vh` or `min-height: 100%` on the `@media print` receipt wrapper, as this forces the thermal printer to feed a full A4 page length of blank paper after a 3-line ticket; always use `height: auto` so the printer cuts immediately after the footer.
