# Design

## Context

In `supabase/migrations/20261026010000_create_core_pos_schema.sql`, the database currently defines:
1. `public.suppliers` with all 10 baseline columns (`id`, `company_name`, `tax_id`, `contact_name`, `email`, `phone`, `address`, `is_active`, `created_at`, `updated_at`), RLS enabled (`suppliers_all_admin_manager`), and indexes on `tax_id` and `is_active`.
2. `public.products` with `stock` (`integer NOT NULL DEFAULT 0`) and `purchase_price` (`numeric(12,2) NOT NULL DEFAULT 0.00`), whereas `[PSAI-38]` references `products.stock_quantity` and `products.cost_price_usd`.
3. `public.purchase_headers` and `public.purchase_details`, which are empty legacy tables with zero frontend/backend code dependencies (only type definitions in `src/types/database.ts`).

See `proposal.md` for motivation and `specs/inventory/suppliers-purchases-and-stock-ledger/spec.md` for normative behavior requirements.

## Goals / Non-Goals

**Goals:**
- Provide a clean architectural transition from the conflated `purchase_headers` / `purchase_details` tables to the separated `purchase_orders` / `purchase_order_items` and `supplier_invoices` / `supplier_invoice_items` domain model.
- Maintain backward compatibility with existing tests (`supabase/tests/core_pos_schema_test.sql`) while exposing `products.stock_quantity` and `products.cost_price_usd` required by `[PSAI-38]`.
- Ensure atomic, concurrency-safe stock increments, replacement cost updates, and cancellation reversals backed by an append-only `inventory_movements` ledger.
- Enforce role-based RLS policies using cached scalar subqueries (`(SELECT auth.uid())`) and proper table grants aligned with `20261028050143_remote_schema.sql`.

**Non-Goals:**
- Building React UI screens for purchase orders or invoice entry (covered by subsequent frontend user stories).
- Implementing ARCA electronic invoicing web services (supplier invoices represent incoming vendor bills, not outgoing POS fiscal vouchers).

## Decisions

### Decision 1: Drop and Replace `purchase_headers` & `purchase_details` Instead of Altering In-Place
- **Choice**: Explicitly `DROP TABLE IF EXISTS public.purchase_details, public.purchase_headers CASCADE;` in the new migration and create `public.purchase_orders`, `public.purchase_order_items`, `public.supplier_invoices`, and `public.supplier_invoice_items` from scratch.
- **Rationale**:
  - **Domain Separation**: A Purchase Order (`purchase_orders`) is an outbound commercial request (`order_number`, `expected_date`, `status IN ('draft','sent','partially_received','received','cancelled')`, `quantity_ordered` vs. `quantity_received`), whereas a Supplier Invoice (`supplier_invoices`) is an inbound fiscal/accounting document (`invoice_number` unique per supplier, `currency`, `exchange_rate`, `subtotal`, `tax_amount`, `total_amount`, `payment_status`). `purchase_headers` mixed `invoice_number` with `status IN ('draft','received','cancelled')` in a single table.
  - **Zero Data & Zero Code Footprint**: Codebase inspection confirmed `purchase_headers` and `purchase_details` are not referenced anywhere in `src/` except `src/types/database.ts`, nor in `supabase/tests/` or `supabase/seed.sql`.
  - **Clean Constraint Naming**: Creating the four tables directly guarantees clean `pk_*`, `fk_*`, `uq_*`, and `chk_*` names matching project conventions without left-over index or trigger artifacts.
- **Alternatives Considered**:
  - *Alter/Rename `purchase_headers` to `purchase_orders` or `supplier_invoices`*: Rejected because over 60% of columns, constraints, and foreign keys differ, making an `ALTER TABLE` script brittle and harder to audit than a clean DDL replacement.

### Decision 2: Bidirectional Synchronization on `public.products` (`stock` <-> `stock_quantity`, `purchase_price` <-> `cost_price_usd`)
- **Choice**: Add `stock_quantity integer NOT NULL DEFAULT 0` and `cost_price_usd numeric(12,2) NOT NULL DEFAULT 0.00` to `public.products`, backfill them from `stock` and `purchase_price`, and attach a `BEFORE INSERT OR UPDATE` trigger (`trg_products_sync_inventory_columns`) that keeps `stock` and `stock_quantity` (as well as `purchase_price` and `cost_price_usd`) synchronized whenever either column name is written.
- **Rationale**: Existing migration `20261026010000_create_core_pos_schema.sql` and test suite `supabase/tests/core_pos_schema_test.sql` insert into `products (..., stock, purchase_price, sale_price)`, while `[PSAI-38]` acceptance criteria explicitly verify `products.stock_quantity` and `products.cost_price_usd`. A lightweight `BEFORE INSERT OR UPDATE` synchronization trigger allows both existing tests/queries and new `[PSAI-38]` queries/triggers to read and write seamlessly without breaking either contract.
- **Alternatives Considered**:
  - *Rename `stock` to `stock_quantity` and `purchase_price` to `cost_price_usd`*: Rejected because it would immediately break `supabase/tests/core_pos_schema_test.sql` and `src/types/database.ts` consumers expecting `stock` and `purchase_price`.
  - *Generated columns (`GENERATED ALWAYS AS`)*: Rejected because PostgreSQL generated columns cannot be directly targeted in `UPDATE products SET stock_quantity = ...` statements inside triggers or tests.

### Decision 3: Trigger Architecture for Invoice Reception & Cancellation Reversal
- **Choice**: Support both workflows by which a supplier invoice is received or cancelled in PostgreSQL:
  1. **Invoice Header Status Transition (`AFTER UPDATE OF status, payment_status ON public.supplier_invoices`)**:
     - When an invoice transitions from `draft`/`pending` to `confirmed` or `received`, iterate over its `supplier_invoice_items` (skipping any item that already has a `supplier_purchase` ledger entry for idempotency) to lock the `products` row (`FOR UPDATE`), increment `stock_quantity`, update `cost_price_usd` (converting ARS to USD via `exchange_rate` if `currency = 'ARS'`, or using `unit_cost` directly when `currency = 'USD'`), and insert the `+quantity_received` row into `inventory_movements`.
     - When a previously confirmed/received invoice transitions to `cancelled` (via `status = 'cancelled'` or `payment_status = 'cancelled'`), iterate over all its `supplier_invoice_items` that were previously posted to `inventory_movements` and have not yet been reversed, decrement `products.stock_quantity` by `quantity_received`, and insert a compensatory `-quantity_received` record in `inventory_movements` referencing the `supplier_invoice_items.id`.
  2. **Direct Line Item Insertion on Confirmed/Received Invoice (`AFTER INSERT ON public.supplier_invoice_items`)**:
     - Because SQL scripts, seeds, or single-transaction inserts often create a `supplier_invoices` header with `status = 'received'` (default) and then insert `supplier_invoice_items` rows, the `AFTER INSERT ON public.supplier_invoice_items` trigger checks the parent invoice's status. If the parent invoice is already in `confirmed` or `received` status (and not cancelled), it immediately executes the atomic stock increment, `cost_price_usd` update, and `inventory_movements` insertion for that item.
- **Rationale**: In SQL tests (such as Scenario 2 and Scenario 5), developers either insert an invoice with `status = 'received'` followed by `supplier_invoice_items`, OR insert a `draft` invoice with items and then `UPDATE supplier_invoices SET status = 'received'`. Supporting both via idempotency checks (verifying whether an active movement for `origin_type = 'supplier_purchase'` and `origin_id = item.id` with `quantity_delta > 0` already exists) guarantees Scenario 2 and Scenario 4 work reliably under both patterns without double-counting stock.

### Decision 4: Currency Normalization for `products.cost_price_usd` and `cost_snapshot`
- **Choice**: On `supplier_invoices`, `currency` is constrained to `('USD', 'ARS')` and `exchange_rate` is `numeric(12,4) NOT NULL DEFAULT 1.0000 CHECK (exchange_rate > 0)`. When updating `products.cost_price_usd` and recording `inventory_movements.cost_snapshot`:
  - If `currency = 'USD'`, the USD replacement cost is `NEW.unit_cost`.
  - If `currency = 'ARS'`, the USD replacement cost is `ROUND(NEW.unit_cost / v_exchange_rate, 2)`.
- **Rationale**: Respects the bimonetary POS rules while keeping Scenario 2 (`$8.50 USD` invoice item -> `cost_price_usd = 8.50` and `cost_snapshot = 8.50`) exact to 2 decimal places.

### Decision 5: Explicit Table Grants Alongside RLS
- **Choice**: Include explicit `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ... TO authenticated;` and `GRANT ALL ON TABLE ... TO service_role;` statements in the new migration.
- **Rationale**: Migration `20261028050143_remote_schema.sql` altered default privileges for role `postgres` in schema `public` to revoke `SELECT, INSERT, UPDATE, DELETE` from `authenticated` on newly created tables unless explicitly granted. Explicitly granting DML privileges to `authenticated` (with RLS enforcing the actual role checks via `public.is_admin()` and `public.get_auth_role((SELECT auth.uid()))`) prevents permission-denied errors during local `supabase db reset` and test execution.

## Risks / Trade-offs

- **[Risk] Revoked Default Privileges in `20261028050143_remote_schema.sql`** → **Mitigation**: Explicitly issue `GRANT SELECT, INSERT, UPDATE, DELETE ON ... TO authenticated` and `GRANT ALL ON ... TO service_role` for all 5 new tables and `GRANT EXECUTE` on trigger/helper functions in the migration.
- **[Risk] Double Stock Increment if Invoice Status Is Updated After Items Were Already Counted** → **Mitigation**: Guard stock increment inside a helper or trigger check that verifies `NOT EXISTS (SELECT 1 FROM public.inventory_movements WHERE origin_type = 'supplier_purchase' AND origin_id = v_item.id AND quantity_delta > 0)` before incrementing stock.
- **[Risk] Negative Stock on Invoice Cancellation if Merchandise Was Already Sold** → **Mitigation**: `products` has `chk_products_stock_non_negative CHECK (stock >= 0)`. If cancelling an invoice would drive stock below zero, the constraint protects catalog integrity and rolls back the cancellation until stock is reconciled.

## Migration Plan

1. Create `supabase/migrations/20261031000000_purchases_and_stock_ledger.sql`:
   - Drop `public.purchase_details` and `public.purchase_headers`.
   - Alter `public.products` to add `stock_quantity` and `cost_price_usd` with bidirectional sync trigger.
   - Create `public.purchase_orders`, `public.purchase_order_items`, `public.supplier_invoices`, `public.supplier_invoice_items`, and `public.inventory_movements` with all PKs, FKs (`ON DELETE RESTRICT` to `suppliers` and `products`, `ON DELETE CASCADE` from headers to items), `UNIQUE` constraints (`uq_purchase_orders_number`, `uq_supplier_invoice_number`), `CHECK` constraints, and B-Tree indexes.
   - Create immutability trigger on `public.inventory_movements` and stock/cost automation triggers on `public.supplier_invoices` and `public.supplier_invoice_items`.
   - Enable RLS and create `admin`/`manager` policies and explicit table grants.
2. Update `supabase/seed.sql` to seed 3 active mobile accessory suppliers with valid Argentine CUITs, catalog products (including "Funda Armor MagSafe Titanio"), 2 purchase orders, and 2 received supplier invoices generating `inventory_movements` audit entries.
3. Add `supabase/tests/purchases_and_stock_ledger_test.sql` covering all 5 acceptance scenarios from `[PSAI-38]`.
4. Update `src/types/database.ts` with TypeScript interfaces for the new schema.

