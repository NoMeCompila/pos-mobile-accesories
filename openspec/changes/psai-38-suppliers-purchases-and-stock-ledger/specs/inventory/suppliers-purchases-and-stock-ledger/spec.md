# Spec Delta

## Purpose

Defines the relational database schema, financial precision constraints, Row Level Security (RLS) policies, and automated stock ledger triggers for wholesale supplier procurement (`purchase_orders` and `purchase_order_items`), received fiscal/commercial invoices (`supplier_invoices` and `supplier_invoice_items`), and the immutable inventory movement audit trail (`inventory_movements`).

## ADDED Requirements

### Requirement: Purchasing and stock ledger schema integrity
The database SHALL replace legacy `purchase_headers` and `purchase_details` tables with `purchase_orders`, `purchase_order_items`, `supplier_invoices`, `supplier_invoice_items`, and `inventory_movements`, enforcing UUID primary keys, `timestamptz` audit columns, `ON DELETE RESTRICT` supplier foreign keys, and exact `numeric(12,2)` / `numeric(12,4)` non-negative financial constraints.

#### Scenario: Applying migrations and verifying schema integrity with existing suppliers table
- **WHEN** the developer executes the purchasing schema migration against the existing `suppliers` table
- **THEN** tables `purchase_orders`, `purchase_order_items`, `supplier_invoices`, `supplier_invoice_items`, and `inventory_movements` are created with UUID primary keys and `timestamptz` audit timestamps
- **AND** foreign key constraints enforce `ON DELETE RESTRICT` preventing deletion of suppliers who have associated purchase orders or recorded invoices
- **AND** financial columns (`total_amount_usd`, `total_amount_ars`, `expected_unit_cost_usd`, `subtotal`, `tax_amount`, `total_amount`, `unit_cost`, `cost_snapshot`, and `exchange_rate`) enforce exact `numeric(12,2)` and `numeric(12,4)` types with non-negative `CHECK` constraints

### Requirement: Purchase order workflow and line item constraints
The database SHALL enforce valid procurement statuses (`draft`, `sent`, `partially_received`, `received`, `cancelled`) and unique `order_number` values on `purchase_orders`, while validating positive ordered quantities and non-negative received quantities on `purchase_order_items`.

#### Scenario: Rejecting invalid purchase order status or negative quantities
- **WHEN** a statement attempts to insert a `purchase_orders` record with an unrecognized status or a `purchase_order_items` record with `quantity_ordered <= 0`
- **THEN** the database `CHECK` constraint rejects the write and aborts the transaction

### Requirement: Unique supplier invoice number per vendor
The database SHALL enforce a composite unique constraint (`uq_supplier_invoice_number`) on `(supplier_id, invoice_number)` in `supplier_invoices` so that the same vendor cannot have duplicate invoice numbers, while allowing different suppliers to use the same numbering sequence.

#### Scenario: Preventing duplicate supplier invoice numbers per vendor
- **WHEN** an existing supplier invoice with `invoice_number = 'FC-0001-00048291'` is recorded for supplier "Distribuidora Celular SA" and another invoice is inserted for the same supplier with `invoice_number = 'FC-0001-00048291'`
- **THEN** the unique constraint `uq_supplier_invoice_number` rejects the insert and rolls back the transaction without creating orphaned invoice items or phantom stock increments

### Requirement: Atomic stock increment and replacement cost update upon invoice reception
The database SHALL atomically increment the product's available stock (`products.stock_quantity` and `products.stock`), update its replacement cost in USD (`products.cost_price_usd`), and append an immutable positive movement entry to `inventory_movements` whenever a supplier invoice and its items are recorded in a confirmed/received state.

#### Scenario: Atomic stock increment and replacement cost update upon invoice reception
- **WHEN** a product "Funda Armor MagSafe Titanio" has current stock of 10 units and cost of 8.00 USD, and an administrator records a confirmed/received supplier invoice item for 15 units at 8.50 USD each
- **THEN** the database atomically updates the product's stock to 25 units, updates `products.cost_price_usd` to 8.50 USD, and inserts an immutable record in `inventory_movements` with `origin_type = 'supplier_purchase'`, `quantity_delta = 15`, `resulting_stock = 25`, `cost_snapshot = 8.50`, and `origin_id` referencing the supplier invoice item

### Requirement: Automatic inventory reversal upon supplier invoice cancellation
The database SHALL automatically record a compensatory negative entry in `inventory_movements` and decrement the corresponding product's stock whenever a previously confirmed/received supplier invoice transitions to `cancelled`.

#### Scenario: Reversal of inventory upon purchase invoice voiding or cancellation
- **WHEN** a confirmed/received supplier invoice that previously incremented product stock by 15 units is updated to `cancelled` status
- **THEN** the database records a compensatory entry in `inventory_movements` with `quantity_delta = -15` and decrements the product's available stock by 15 units

### Requirement: Immutable inventory movements ledger
The database SHALL enforce append-only immutability on `inventory_movements`, prohibiting any `UPDATE` or `DELETE` operation on recorded stock ledger entries and restricting `origin_type` to `supplier_purchase`, `pos_sale`, `repair_usage`, or `manual_adjustment`.

#### Scenario: Blocking modification or deletion of historical stock movements
- **WHEN** any user or transaction attempts to execute `UPDATE` or `DELETE` on `public.inventory_movements`
- **THEN** the database trigger raises an exception and aborts the mutation

### Requirement: Role-based Row Level Security for purchasing and stock ledger
The database SHALL enforce Row Level Security (RLS) across `purchase_orders`, `purchase_order_items`, `supplier_invoices`, `supplier_invoice_items`, and `inventory_movements`, granting read and write access to `admin` and `manager` profiles while blocking `cashier`, `technician`, and `customer` profiles from reading or mutating supplier purchasing records.

#### Scenario: Restricting cashier access to supplier invoices and purchase orders
- **WHEN** an authenticated user with the `cashier` role queries or attempts to insert into `purchase_orders` or `supplier_invoices`
- **THEN** RLS policies deny access and return zero rows on `SELECT` or raise an RLS violation on write

### Requirement: Realistic wholesale supplier and purchasing seed data
The seed script (`supabase/seed.sql`) SHALL populate at least 3 active wholesale mobile accessory suppliers with valid Argentine CUITs, 2 purchase orders, 2 received supplier invoices, and matching `inventory_movements` ledger entries.

#### Scenario: Automated test data and mock seed execution
- **WHEN** `supabase/seed.sql` is executed on a fresh or reset Supabase database instance
- **THEN** the database contains at least 3 active suppliers with valid CUITs, 2 purchase orders, 2 supplier invoices, and corresponding `inventory_movements` records with all foreign keys and constraints satisfied

