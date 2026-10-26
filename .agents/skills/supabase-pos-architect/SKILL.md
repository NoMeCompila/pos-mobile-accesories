---
name: supabase-pos-architect
description: Expert PostgreSQL and Supabase architect for Point of Sale (POS) systems. Use when designing PostgreSQL schemas, migrations, indexes, atomic RPC functions, Row Level Security (RLS) policies, Supabase Auth session management, role-based access control, or Supabase Edge Functions connecting external services like ARCA electronic invoicing and heavy Excel/PDF report generation.
---

# supabase-pos-architect

## Summary

Architects production-grade PostgreSQL schemas, Row Level Security (RLS) policies, Supabase Auth session workflows, atomic database RPCs, and Deno/TypeScript Edge Functions tailored for multi-register Point of Sale (POS), inventory, repair tracking, and fiscal billing systems.

## When to Use

* Designing or modifying PostgreSQL tables, constraints, foreign keys, indexes, and SQL migrations in Supabase

* Writing or auditing Row Level Security (RLS) policies for multi-role POS access (Admin, Manager, Cashier, Technician, and external Customer)

* Implementing Supabase Auth login flows, persistent cashier shift sessions, JWT custom claims, and supervisor PIN or password overrides

* Creating atomic PostgreSQL functions (RPCs) for stock deductions, supplier invoice intake, blind cash register audits, and customer credit ledgers

* Building Supabase Edge Functions to integrate external SOAP/REST APIs (such as ARCA WSAA/WSFEv1 electronic invoicing) or to process heavy consolidated reports (Libro IVA Ventas, daily cash summaries, catalog exports)

## Steps

### 1. Design Professional PostgreSQL Tables and Schemas

Apply strict relational modeling and financial data integrity directives across all database tables:

* **Primary Keys and Audit Timestamps**: Define every table with a generated UUID primary key (`gen_random_uuid()`) and mandatory non-null `created_at` and `updated_at` timestamp-with-timezone columns updated automatically via trigger.

* **Exact Financial Precision**: Prohibit floating-point types for monetary values, tax rates, or currency conversions. Mandate exact fixed-precision numeric types (`numeric(12,2)` for ARS and USD currency amounts, and `numeric(12,4)` for exchange rate snapshots, tax aliquots, and percentage surcharges).

* **Immutable Ledgers Instead of Mutable Counters**: Model inventory stock movements, cash drawer flows, and customer credit accounts (*fiado*) as append-only ledger tables that record every debit, credit, or quantity delta with a reference to the originating document, rather than overwriting a single balance column without history.

* **Domain Constraints and Validation**: Enforce business rules at the database layer using `CHECK` constraints (such as non-negative prices, valid item types distinguishing physical accessories, spare parts, and labor services, and valid state machine statuses) and `NOT NULL` rules on critical fiscal identifiers.

* **Targeted Indexing Strategy**: Instruct the creation of explicit B-Tree indexes on all foreign key columns, barcode and SKU search fields, customer tax IDs (CUIT/DNI), and chronological date filter columns to prevent full table scans during peak checkout hours.

### 2. Implement High-Performance Row Level Security (RLS)

Enforce multi-role access control directly inside PostgreSQL on every public table:

* **Immediate RLS Activation**: Enable Row Level Security immediately after creating any table in the `public` schema so no table remains publicly exposed by default.

* **Cached Role Resolution**: Centralize user role lookup inside a stable security-definer helper function or read directly from JWT `app_metadata`, always wrapping `auth.uid()` and `auth.jwt()` calls inside a scalar subquery so PostgreSQL evaluates the user identity once per query (`InitPlan`) instead of once per scanned row.

* **Strict Five-Role Permission Matrix**:

  * **Admin and Manager**: Grant full read and write permissions across product catalogs, wholesale supplier costs, inventory adjustments, user profiles, and financial reports.

  * **Cashier**: Restrict read access to active catalog items and customer directory records; allow insert and read access only to sales tickets and cash movements linked to their own open register shift; strictly block visibility of supplier wholesale costs and theoretical expected cash balances during blind shift closing.

  * **Technician**: Grant read and update permissions strictly to repair work orders, diagnostic checklists, device intake photos, and spare part allocations assigned to workshop operations.

  * **Customer**: Restrict access to a scoped, read-only lookup of their own repair work order status and diagnostic timeline using a validated order token.

### 3. Architect Supabase Auth, Sessions, and Supervisor Overrides

Guarantee continuous counter operation and server-verified privilege escalation:

* **Automated Profile Provisioning**: Instruct the creation of a database trigger on `auth.users` that automatically inserts a synchronized record in `public.user_profiles` with a least-privilege default role upon user registration.

* **JWT Custom Claims Synchronization**: Store the user's active role and assigned physical register ID inside `raw_app_meta_data` (never inside user-editable `raw_user_meta_data`) so both RLS policies and Edge Functions can validate permissions directly from the signed token.

* **Uninterrupted Cashier Shift Sessions**: Configure client authentication with persistent session storage and automatic background token refresh so token expiration never interrupts an active checkout or open cash drawer shift.

* **Server-Side Supervisor Authorization**: Prohibit client-only validation for restricted counter actions. Require a dedicated server-side RPC or Edge Function to verify a manager's PIN or credentials and write an immutable audit log entry before permitting sale cancellations, extraordinary discounts, or wholesale cost inspections.

### 4. Mandate Atomic PostgreSQL RPCs for Multi-Table POS Transactions

Encapsulate complex business operations inside transactional PostgreSQL functions invoked via `supabase.rpc()`:

* **Atomic Checkout and Stock Deduction**: Order the RPC to lock target product rows against concurrent modifications, validate stock availability according to negative-stock rules, insert the sale header, line items, and split payment tenders, decrement product inventory, and write the stock movement ledger entry within a single all-or-nothing transaction.

* **Supplier Invoice Reception**: Instruct the purchase intake RPC to record the supplier invoice, increment product stock quantities automatically, and update item replacement costs in one atomic step, with automatic reversal entries if an invoice is voided.

* **Blind Cash Register Closing (*Arqueo Ciego*)**: Require the shift-closing RPC to accept the cashier's declared physical cash count first, compute the theoretical expected balance internally by payment method, record any shortage or overage discrepancy for auditing, and transition the shift status to closed.

### 5. Build Supabase Edge Functions for External Services (ARCA and Heavy Reports)

Isolate cryptographic signing, third-party API credentials, and memory-intensive processing inside Supabase Edge Functions:

* **ARCA Electronic Invoicing Integration (WSAA and WSFEv1)**:

  * Keep X.509 digital certificates (`.crt`), private keys (`.key`), and tax configuration parameters stored exclusively in Edge Function secrets or Supabase Vault.

  * Persist and reuse the WSAA *Ticket de Acceso* (`token` and `sign`) in a protected database table restricted to `service_role` until 10 minutes before its 12-hour expiration to prevent ARCA authentication lockouts.

  * Serialize voucher number allocation per point of sale (*PtoVta*) before invoking `FECAESolicitar` for Factura C, Nota de Credito C, and Nota de Debito C so concurrent cash registers never submit duplicate voucher numbers.

  * Support asynchronous batch processing for sales queued locally in `IndexedDB` during internet or ARCA server outages, ensuring chronological CAE emission upon reconnection.

* **Consolidated Excel and PDF Report Generation**:

  * Delegate heavy dataset preparation (such as *Libro IVA Ventas*, daily multi-register cash summaries, valued product catalogs, and workshop service order logs) to indexed PostgreSQL views or aggregation RPCs.

  * Generate large Excel (`.xlsx`) and PDF documents inside Edge Functions, store the generated files in a private Supabase Storage bucket, and return short-lived signed download URLs to the frontend client to prevent browser UI freezes.

## Gotchas

* **Unwrapped `auth.uid()` Calls in RLS**: Never invoke `auth.uid()` directly on row-level comparisons without wrapping it in a scalar `SELECT` subquery, as uncached evaluation degrades query performance on large sales and product tables.

* **Insecure `SECURITY DEFINER` Functions**: Always instruct `SECURITY DEFINER` functions to explicitly lock `search_path = public` and validate the caller's role at the start of the function body to prevent privilege escalation.

* **Leaking Service Role Credentials**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend environment variables (`VITE_*`). Restrict service-role client instantiation strictly to server-side Edge Functions after verifying the caller's JWT session.

* **Mutable Metadata for Role Checks**: Never store or read authorization roles from `user_metadata`, which authenticated users can modify from the browser client; always enforce permissions using `app_metadata` or a protected `user_profiles` table.