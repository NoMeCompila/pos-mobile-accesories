---
name: offline-pos-sync-architect
description: Expert offline-first and asynchronous synchronization architect for Point of Sale (POS) systems. Use when designing local IndexedDB / Dexie.js stores, offline product catalog and customer caches, provisional checkout queues during internet or ARCA server outages, background synchronization workers, idempotency keys, or stock and cash shift conflict resolution.
---

# offline-pos-sync-architect

## Summary

Architects resilient offline-first Point of Sale (POS) workflows using local browser storage (`IndexedDB` / `Dexie.js`), network health monitors, optimistic stock and shift state tracking, and sequential background synchronization queues for Supabase transactions and delayed ARCA electronic invoicing (`CAE`).

## When to Use

* Designing local `IndexedDB` schemas to cache product catalogs, barcode lookup indexes, exchange rates, and customer profiles for zero-latency offline counter operation

* Implementing network connectivity and ARCA web service health monitors that switch the POS between online and contingency offline modes automatically

* Building the offline checkout outbox queue that records sales, split payments, and local stock decrements when internet or government billing servers fail

* Designing background synchronization workers that replay queued sales to Supabase and request pending ARCA `WSFEv1` electronic vouchers in strict chronological order

* Resolving data conflicts across multiple cash registers, including idempotency protection against duplicate sales, stock discrepancies, and blind shift closing audits

## Steps

### 1. Architect Local IndexedDB Storage and Read-Through Caching

Maintain a warm, locally indexed replica of essential store data so counter operations never stall on network round-trips:

* **Structured Local Tables (`IndexedDB` / `Dexie.js`)**: Define local object stores for `products_cache`, `customers_cache`, `exchange_rates_cache`, `active_shift_state`, and `sync_outbox_queue` with compound indexes on `barcode`, `sku`, and `cuit_dni` for sub-millisecond scanner lookups.

* **Incremental Delta Synchronization**: Hydrate the local catalog and customer store upon shift opening and subscribe to Supabase Realtime changes (or poll incremental `updated_at > last_sync_timestamp` deltas every 5 minutes) to keep Retail/Wholesale prices, USD rates, and available stock counts fresh without re-downloading the entire database.

* **Optimistic Local Stock Decrements**: When a sale is completed in offline mode, immediately decrement the local `products_cache.stock_quantity` on that workstation so the cashier sees accurate remaining inventory during consecutive offline checkouts.

### 2. Implement Dual-Layer Health Detection and Graceful Offline Fallback

Distinguish clearly between total internet disconnection and partial upstream ARCA fiscal service outages:

* **Two-Tier Health State Machine**: Track two independent connectivity states in global POS state: `SUPABASE_CLOUD_STATUS` (database reachability) and `ARCA_FISCAL_STATUS` (government SOAP service availability), combining browser `online`/`offline` events with active heartbeat probes and request timeout circuit breakers (8-second threshold).

* **Scenario A (Supabase Online, ARCA Offline)**: Persist the sale transaction, split payments, and inventory deduction immediately in Supabase PostgreSQL with fiscal status `PENDING_CAE`, and enqueue only the fiscal invoicing job in the retry queue.

* **Scenario B (Full Internet Outage)**: Persist the entire sale payload, line items, split payment tenders, and cashier shift association inside the local `IndexedDB` `sync_outbox_queue` with status `OFFLINE_QUEUED`, generating a deterministic client-side UUID (`client_sale_id`) as an idempotency key.

* **Provisional Contingency Receipt Printing**: Instruct the thermal printer pipeline to emit a clearly labeled provisional receipt containing the internal transaction UUID, itemized totals, and timestamp whenever a sale completes in contingency mode, queuing the official ARCA QR fiscal voucher for automatic generation once synced.

### 3. Design the Immutable Outbox Queue and Idempotent Payload Contract

Guarantee zero data loss and prevent duplicate transactions when replaying offline sales:

* **Self-Contained Snapshot Payloads**: Store complete, immutable financial snapshots inside each `sync_outbox_queue` entry, including exact unit prices, applied Retail/Wholesale tier, active USD-to-ARS exchange rate snapshot, payment surcharge percentages, register `PtoVta`, and active `shift_id` at the exact moment of checkout.

* **Database-Level Idempotency Enforcement**: Mandate a `UNIQUE` constraint on `sales.client_sale_id` in Supabase PostgreSQL so that if a network drop occurs mid-sync after the server commits the sale but before the browser receives the HTTP response, retrying the same outbox item safely returns the existing record instead of double-charging or double-deducting stock.

* **Browser Storage Persistence Protection**: Request persistent storage permissions (`navigator.storage.persist()`) upon POS initialization so the operating system or browser never evicts `IndexedDB` outbox records under disk pressure, and block browser tab closure (`beforeunload`) or user logout warnings whenever unsynchronized sales remain in the local outbox.

### 4. Orchestrate Sequential FIFO Background Synchronization

Replay queued operations in strict chronological order to satisfy both accounting ledgers and ARCA numbering rules:

* **Single-Leader Worker Execution**: Use the Web Locks API (`navigator.locks.request`) or a dedicated Service Worker / Web Worker lock so that if a cashier has multiple browser tabs open on the same Windows PC, only one synchronization loop processes the `sync_outbox_queue` at a time.

* **Two-Phase Replay Pipeline per Queued Sale**:

  * **Phase 1 (Database Commit)**: Push `OFFLINE_QUEUED` sales to the atomic Supabase checkout RPC using `client_sale_id`. Once confirmed in PostgreSQL, transition the queue record to `PENDING_CAE`.

  * **Phase 2 (Sequential ARCA CAE Acquisition)**: Process `PENDING_CAE` sales strictly one by one in FIFO order per point of sale (`PtoVta`). Query `FECompUltimoAutorizado`, adjust the fiscal voucher date (`CbteFch`) to the current synchronization date if prior vouchers were already issued on that date, obtain the 14-digit CAE, and mark the outbox item `SYNCED`.

* **Exponential Backoff and Dead-Letter Isolation**: Apply exponential backoff with jitter on transient network or `5xx` errors. If ARCA returns a permanent business validation rejection (such as an invalid customer CUIT/DNI or tax condition mismatch), move the item to `SYNC_ERROR_ACTION_REQUIRED` so it does not block subsequent valid sales in the queue, alerting the manager in the UI to correct the customer record and retry.

### 5. Reconcile Cash Register Shifts and Stock Conflicts Across Registers

Maintain audit integrity when closing cash drawers or reconciling concurrent multi-register inventory sales:

* **Pre-Close Shift Synchronization Gate**: Before executing the blind cash register closing (*arqueo ciego*), automatically trigger an immediate flush of all pending `sync_outbox_queue` items belonging to the active `shift_id`. If internet connectivity is still unavailable at shift end, include the locally queued `OFFLINE_QUEUED` cash and card totals in the local shift closing calculation and sync the unified shift closure packet once connectivity returns.

* **Post-Outage Stock Reconciliation**: Allow offline checkouts to commit into the database ledger even if concurrent sales on another physical register reduced stock below zero during the outage, flagging any resulting negative stock balances in an administrative reconciliation alert rather than rejecting an already-paid customer sale.

## Gotchas

* **Parallel Batching of ARCA Voucher Requests**: Never use `Promise.all()` to submit multiple queued offline invoices for the same `PtoVta` concurrently, as simultaneous requests will read the same `FECompUltimoAutorizado` number and cause immediate ARCA duplicate-number rejections.

* **Re-Calculating Prices During Sync Replay**: Never recalculate item prices or USD exchange conversions using current database values when replaying an offline sale hours later; always persist and honor the exact monetary amounts captured at the moment the customer paid.

* **Blocking the Entire Queue on a Single Bad Tax ID**: A single rejected invoice due to a malformed customer DNI/CUIT must never halt the FIFO worker for subsequent sales unless sequential numbering locks require supervisor intervention; validate `DocTipo` and `DocNro` checksums locally offline before allowing checkout.

* **Clearing Browser Data With Pending Outbox Items**: Never clear `IndexedDB` tables during routine session token refreshes or user switches if `sync_outbox_queue` contains non-empty `OFFLINE_QUEUED` or `PENDING_CAE` records.