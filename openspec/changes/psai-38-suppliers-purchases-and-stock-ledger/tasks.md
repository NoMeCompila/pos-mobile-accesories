# Tasks

## 1. Purchasing & Stock Ledger Database Migration

- [x] 1.1 Create `supabase/migrations/20261031000000_purchases_and_stock_ledger.sql` dropping legacy `public.purchase_details` and `public.purchase_headers` tables and adding synchronized `stock_quantity` (`integer`) and `cost_price_usd` (`numeric(12,2)`) columns on `public.products`, verifying `products` column sync trigger keeps `stock`/`stock_quantity` and `purchase_price`/`cost_price_usd` aligned.
- [x] 1.2 Define `public.purchase_orders`, `public.purchase_order_items`, `public.supplier_invoices`, `public.supplier_invoice_items`, and `public.inventory_movements` in the migration with UUID PKs, `timestamptz` audit columns, `ON DELETE RESTRICT` supplier/product FKs, `uq_supplier_invoice_number` composite unique constraint, `numeric(12,2)` / `numeric(12,4)` non-negative `CHECK` constraints, and B-Tree indexes on `supplier_id`, `product_id`, `purchase_order_id`, and `supplier_invoice_id`.
- [x] 1.3 Implement append-only immutability triggers on `public.inventory_movements` and atomic stock increment, `cost_price_usd` replacement cost update, and cancellation reversal triggers on `public.supplier_invoices` and `public.supplier_invoice_items`, verifying both direct item insertion on a received invoice and header status transitions (`draft` -> `received` and `received` -> `cancelled`).
- [x] 1.4 Enable Row Level Security (RLS) and configure `admin` and `manager` read/write policies (using cached `(SELECT auth.uid())` subqueries) plus explicit `authenticated` and `service_role` table grants across all 5 new tables.

## 2. Seed Data & SQL Verification Suite

- [x] 2.1 Update `supabase/seed.sql` to populate at least 3 active mobile accessory wholesale suppliers with valid Argentine CUITs, catalog products (including "Funda Armor MagSafe Titanio"), 2 purchase orders with line items, and 2 received supplier invoices that automatically generate corresponding `inventory_movements` records.
- [x] 2.2 Create `supabase/tests/purchases_and_stock_ledger_test.sql` covering all 5 acceptance scenarios from `[PSAI-38]` (schema & FK restrictions, atomic stock +15 and $8.50 USD replacement cost update, duplicate `uq_supplier_invoice_number` rejection, invoice cancellation -15 stock reversal, and cashier RLS denial) and verify all tests pass.

## 3. TypeScript Database Contracts & Integration Check

- [x] 3.1 Update `src/types/database.ts` to include `stock_quantity` and `cost_price_usd` on `ProductRow` and replace `PurchaseHeaderRow` / `PurchaseDetailRow` with `PurchaseOrderRow`, `PurchaseOrderItemRow`, `SupplierInvoiceRow`, `SupplierInvoiceItemRow`, and `InventoryMovementRow`, verifying `npm run build` / `tsc --noEmit` succeeds without errors.
- [x] 3.2 Run `openspec validate psai-38-suppliers-purchases-and-stock-ledger --strict` and verify local database migration and seed scripts execute cleanly.

## Workflow follow-up

- Archive the change with `/opsx-archive` after implementation and review are complete.

