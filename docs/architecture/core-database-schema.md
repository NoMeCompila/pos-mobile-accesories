# Architecture Documentation: Core POS Relational Schema

## 1. Overview
This module defines the 10 relational tables supporting catalog management, supplier intake, sales transactions, and workshop repairs. All entities enforce relational integrity, non-negative monetary figures (`numeric(12,2)`), non-negative stock, soft-delete flags, and Row-Level Security.

---

## 2. Table Catalog

| Table | Description | Primary Key | Foreign Keys | Soft Delete Flag |
| :--- | :--- | :--- | :--- | :--- |
| **`brands`** | Mobile & accessory brand catalog | UUID | None | `is_active boolean` |
| **`suppliers`** | Vendor directory with Tax ID (CUIT/RUT) | UUID | None | `is_active boolean` |
| **`products`** | Physical inventory and spare parts | UUID | `brand_id -> brands(id)` | `is_active boolean` |
| **`payment_types`** | Payment methods (Cash, Card, Transfer) | UUID | None | `is_active boolean` |
| **`customers`** | Client directory for billing & repairs | UUID | `user_id -> user_profiles(id)` | `is_active boolean` |
| **`sale_headers`** | Checkout transaction tickets | UUID | `customer_id`, `user_id`, `payment_type_id` | Status machine (`voided`) |
| **`sale_details`** | Sale line items with unit price & subtotal | UUID | `sale_id (CASCADE)`, `product_id (RESTRICT)` | Linked to header |
| **`purchase_headers`** | Supplier intake invoices & remitos | UUID | `supplier_id`, `user_id` | Status machine (`cancelled`) |
| **`purchase_details`**| Purchase intake line items & costs | UUID | `purchase_id (CASCADE)`, `product_id (RESTRICT)`| Linked to header |
| **`repairs`** | Technical service orders & appointments | UUID | `customer_id`, `technician_id -> user_profiles(id)` | `is_active` + Status machine |

---

## 3. Financial & Business Integrity Constraints
- **Stock Integrity**: `products.stock >= 0` prevents overselling at database level.
- **Monetary Precision**: Fixed `numeric(12,2)` prevents floating-point rounding errors across all prices, subtotals, and cost estimates.
- **Repair Lifecycle**: `status IN ('pending', 'in_progress', 'completed', 'delivered', 'cancelled')`.
- **Barcode & SKU Uniqueness**: `UNIQUE(product_code)` blocks duplicate items.
- **Referential Protection**: `ON DELETE RESTRICT` ensures products and customers with sales history cannot be physically purged.
