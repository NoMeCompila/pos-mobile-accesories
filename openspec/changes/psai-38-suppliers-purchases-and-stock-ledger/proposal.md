# Proposal

## Why

The current baseline database schema (`20261026010000_create_core_pos_schema.sql`) includes an empty `suppliers` table alongside two simplified legacy tables (`purchase_headers` and `purchase_details`) that conflate procurement ordering with invoice reception, lack dual-currency (`USD`/`ARS`) and exchange rate tracking, and have no automated mechanism to increment product stock, update replacement costs, or record an immutable audit trail. Separating procurement requests (`purchase_orders`) from actual fiscal/commercial receipts (`supplier_invoices`) and introducing an append-only `inventory_movements` ledger ensures tamper-proof stock accounting, accurate replacement cost valuation in USD, and automatic reversal of phantom stock when invoices are cancelled.

## What Changes

- **Architectural Resolution (`purchase_headers` & `purchase_details` vs. New Domain Tables)**:
  - **BREAKING**: Drop legacy empty tables `public.purchase_details` and `public.purchase_headers` rather than mutating them in place. Because `purchase_headers` merges two distinct business lifecycle stages—procurement ordering and fiscal invoice reception—renaming it to `purchase_orders` while retaining `invoice_number` or vice versa would leave misleading semantics, mismatched constraints, and incomplete bimonetary columns. Since neither table has any production data, UI consumers, or service layer calls (only unused interfaces in `src/types/database.ts`), replacing them cleanly in a dedicated migration avoids technical debt.
- **Align `public.products` Catalog Columns for Bimonetary & Ledger Compatibility**:
  - Add `stock_quantity` (`integer`, synchronized with or aliasing `stock`) and `cost_price_usd` (`numeric(12,2)`, non-negative default `0.00`) on `public.products` (or standardize via synchronized columns/triggers so both existing `stock`/`purchase_price` tests and the new `stock_quantity`/`cost_price_usd` purchasing contract pass seamlessly).
- **Create Procurement & Supplier Invoicing Schema (`public.purchase_orders`, `public.purchase_order_items`, `public.supplier_invoices`, `public.supplier_invoice_items`)**:
  - Create `public.purchase_orders` with status workflow (`draft`, `sent`, `partially_received`, `received`, `cancelled`), unique `order_number`, `supplier_id` (`ON DELETE RESTRICT` to `public.suppliers`), `expected_date`, `total_amount_usd` (`numeric(12,2)`), `total_amount_ars` (`numeric(12,2)`), and audit timestamps.
  - Create `public.purchase_order_items` linking `purchase_order_id` (`ON DELETE CASCADE`) and `product_id` (`ON DELETE RESTRICT`) with `quantity_ordered`, `quantity_received`, and `expected_unit_cost_usd` (`numeric(12,2)`).
  - Create `public.supplier_invoices` with `supplier_id` (`ON DELETE RESTRICT`), composite unique constraint `uq_supplier_invoice_number` on `(supplier_id, invoice_number)`, `purchase_order_id` (nullable FK), `invoice_date`, `reception_date`, `currency` (`USD` or `ARS`), `exchange_rate` (`numeric(12,4)`), `subtotal`, `tax_amount`, `total_amount` (`numeric(12,2)`), `status` (`draft`, `confirmed`, `received`, `cancelled`), and `payment_status` (`pending`, `paid`, `cancelled`).
  - Create `public.supplier_invoice_items` with `supplier_invoice_id` (`ON DELETE CASCADE`), `product_id` (`ON DELETE RESTRICT`), `quantity_received`, `unit_cost` (`numeric(12,2)`), `unit_cost_usd` (`numeric(12,2)`), and `subtotal` (`numeric(12,2)`).
- **Create Immutable Stock Ledger (`public.inventory_movements`)**:
  - Create append-only `public.inventory_movements` table recording `product_id`, `origin_type` (`supplier_purchase`, `pos_sale`, `repair_usage`, `manual_adjustment`), `origin_id` (UUID referencing the originating line item or document), `quantity_delta` (non-zero integer, positive for purchases, negative for reversals/sales), `resulting_stock` (non-negative integer), `cost_snapshot` (`numeric(12,2)`), and `created_at`.
  - Protect `public.inventory_movements` with triggers blocking `UPDATE` and `DELETE` operations to guarantee immutability.
- **Automated Stock Increment, Replacement Cost Update, and Cancellation Reversal**:
  - Implement atomic PostgreSQL trigger/RPC logic so that when a `supplier_invoices` record is confirmed/received (or items are inserted into a confirmed/received invoice), `products.stock_quantity` (and `products.stock`) increments by `quantity_received`, `products.cost_price_usd` (and `products.purchase_price`) updates to the latest replacement unit cost in USD, and an immutable `+quantity_received` entry is appended to `inventory_movements`.
  - When a previously confirmed/received `supplier_invoices` record transitions to `cancelled` (or `payment_status = 'cancelled'`), automatically insert a compensatory negative entry (`-quantity_received`) in `inventory_movements` and decrement the product's available stock.
- **Row Level Security (RLS) & Automated Seed Data**:
  - Enable RLS across all new tables, granting `admin` and `manager` full read/write access to purchasing and ledger tables while restricting `cashier`, `technician`, and `customer` profiles from viewing wholesale supplier invoices or costs.
  - Extend `supabase/seed.sql` with at least 3 realistic Argentine mobile accessory wholesale suppliers (with valid CUITs), sample products (including "Funda Armor MagSafe Titanio"), 2 purchase orders, 2 supplier invoices, and corresponding inventory movement records.

## Capabilities

### New Capabilities
- `inventory/suppliers-purchases-and-stock-ledger`: Relational schema, RLS policies, atomic stock & replacement cost triggers, cancellation reversals, and realistic seed data for wholesale suppliers, purchase orders, supplier invoices, and the immutable inventory movements ledger.

### Modified Capabilities

## Impact

- **Database Migrations**: New migration `supabase/migrations/20261031000000_purchases_and_stock_ledger.sql` dropping unused `purchase_details`/`purchase_headers` and creating `purchase_orders`, `purchase_order_items`, `supplier_invoices`, `supplier_invoice_items`, `inventory_movements`, plus triggers and RLS policies.
- **Seed & Verification Suites**: Updates to `supabase/seed.sql` and `supabase/tests/core_pos_schema_test.sql` (plus a dedicated test suite for `[PSAI-38]` acceptance criteria).
- **TypeScript Definitions**: Updates to `src/types/database.ts` replacing `PurchaseHeaderRow` and `PurchaseDetailRow` with strongly typed interfaces for the new purchasing and stock ledger entities.

