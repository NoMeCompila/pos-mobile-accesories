---
name: pos-pricing-and-payment-engine
description: Expert pricing and payment calculation engine for Point of Sale (POS) systems. Use when implementing fiscal rounding in cents, Wholesale/Retail price tiers, bimonetary USD/ARS currency conversions with historical rate snapshots, split payment tenders, external Posnet installment surcharges, cash discounts, or Mercado Pago fee calculations.
---

# pos-pricing-and-payment-engine

## Summary

Architects and implements the core financial calculation engine for Point of Sale (POS) environments, guaranteeing exact fiscal rounding in cents, dual Wholesale/Retail pricing policies, real-time bimonetary (USD/ARS) conversions with immutable historical rate snapshots, multi-tender split payments (*pagos divididos*), Posnet installment surcharges, cash discounts, and Mercado Pago commission reconciliations.

## When to Use

* Implementing exact decimal rounding algorithms (Half-Up commercial rounding in integer cents) to eliminate cent discrepancies between line items, sub-totals, surcharges, discounts, and fiscal invoice totals.

* Structuring dual-tier price lists (Wholesale / *Mayorista* vs. Retail / *Minorista*) driven by customer tax profiles, volume quantity thresholds, or supervisor overrides.

* Managing bimonetary catalogs where product costs or base prices are pegged to USD and converted to ARS at dynamic checkout exchange rates while locking an immutable rate snapshot for accounting and audit compliance.

* Orchestrating split payment checkouts (*pagos divididos*) across heterogeneous payment tenders (Cash ARS/USD, Debit/Credit Cards via external Posnet, Mercado Pago QR, Bank Transfer, Customer Credit / *Fiado*).

* Computing installment financial surcharges (*recargos por cuotas*) for external payment terminals (Posnet / Clover) based on financing coefficients (e.g., 1, 3, 6, 12 installments).

* Calculating cash payment discounts (*descuentos por pago en efectivo*) allocated strictly to the cash-tendered portion of a sale.

* Tracking gross receipts versus net settlements, deduction commissions, and retention taxes for digital wallets and payment gateways (Mercado Pago QR / Point).

## Steps

### 1. Enforce Exact Decimal Precision and Fiscal Cent Rounding Algorithms

Eliminate IEEE 754 floating-point inaccuracies and guarantee mathematical integrity down to the exact cent across all calculations:

* **Fixed-Point / Integer Cent Representation**: Never use standard JavaScript floating-point numbers (`number`) for cumulative financial operations. Express intermediate monetary operations using fixed-precision arithmetic (e.g., `numeric(12,2)` in PostgreSQL, `decimal.js` / `big.js` in TypeScript, or calculating directly in integer cents by multiplying by 100).

* **Half-Up Commercial Rounding (`ROUND_HALF_UP`)**: Round line item totals, percentage surcharges, and discounts to two decimal places using standard commercial rounding (where values with 0.005 and greater round away from zero to the nearest cent).

* **Fiscal Invariant Balancing**: Enforce the fundamental fiscal balance rule required by ARCA and tax authorities:
  $$\text{Final Total} = \sum(\text{Line Item Net}) + \text{Tender Surcharges} - \text{Tender Discounts} + \text{Perceptions}$$
  If the sum of individually rounded line items diverges from the ticket total by $\pm 0.01$ ARS due to fractional cent distributions, apply the discrepancy adjustment to the line item with the greatest fractional remainder (Hare-Niemeyer / Largest Remainder Method).

### 2. Manage Dual-Tier Price Lists (Wholesale vs. Retail) and Volume Rules

Enforce consistent pricing logic based on customer classification, item quantity, and basket composition:

* **Price Tier Resolution Hierarchy**:
  1. **Customer Specific**: If the customer profile is explicitly marked as `is_wholesale: true` (e.g., verified reseller or business CUIT), apply the Wholesale price (*Precio Mayorista*) to all eligible items.
  2. **Volume Threshold per Item / Category**: If a retail customer purchases $\ge N$ units of a single product (or across a qualifying accessory category, such as $\ge 3$ phone cases or cables), automatically upgrade those line items from Retail (*Precio Minorista*) to Wholesale.
  3. **Minimum Order Total**: If the overall cart value exceeds a configurable wholesale threshold (e.g., $\ge \$50,000$ ARS), evaluate wholesale eligibility across qualifying items.
  4. **Cashier / Supervisor Override**: Allow cashiers with supervisor authorization (manager PIN) to manually toggle wholesale pricing on individual items or the entire cart, recording an audit log entry.

* **Line Item Price Tier Immutability**: Store `applied_price_tier` (`'RETAIL' | 'WHOLESALE'`), `unit_base_price`, and `unit_final_price` on each sale line item so changes to master catalog price lists never alter historic sale lines.

### 3. Architect Bimonetary (USD / ARS) Conversions with Historical Rate Snapshots

Provide seamless catalog operation when replacement costs or retail prices are defined in United States Dollars:

* **Catalog Currency Definition**: Allow each product in the catalog to define its base currency (`cost_currency` and `price_currency` as `'USD'` or `'ARS'`).

* **Dynamic Exchange Rate Quotation**: Maintain an active exchange rate provider table in Supabase storing the active conversion rate (`exchange_rate`), rate type (`'BLUE'`, `'OFICIAL'`, or `'STORE_CUSTOM'`), and `last_updated_at` timestamp.

* **Immutable Historical Rate Snapshot**: When a sale is finalized, store the exact conversion factors on the sale header and every converted line item:
  * `exchange_rate_snapshot`: The exact exchange rate utilized (e.g., `1250.0000`).
  * `exchange_rate_type`: The identifier of the applied rate quotation.
  * `original_currency`: The source currency before conversion.
  * `original_amount`: The original price in source currency.
  * `quotation_timestamp`: The exact timestamp of the applied rate.
  Past invoices, gross margins, and inventory valuations must remain static regardless of future currency devaluations.

* **Multi-Currency Cash Tender (USD Cash in Register)**: When a customer pays in physical USD banknotes, record the tender as `CASH_USD`, capture the accepted exchange rate (which may differ from the sales rate, using a cashier purchase rate), compute the ARS equivalent credit, and calculate change due in ARS (or USD) with explicit ledger records for the cash drawer shift.

### 4. Orchestrate Split Payments (Pagos Divididos) and Tender Balancing

Support complex retail checkouts where the customer pays using two or more payment methods:

* **Tender Data Contract**: Represent all payments as an array of structured tender records:
  ```typescript
  interface PaymentTender {
    id: string;
    tender_type: 'CASH_ARS' | 'CASH_USD' | 'POSNET_DEBIT' | 'POSNET_CREDIT' | 'MERCADO_PAGO_QR' | 'BANK_TRANSFER' | 'CUSTOMER_CREDIT';
    base_allocated_amount: number; // Portion of the ticket subtotal covered
    surcharge_percentage: number;  // Financing or terminal surcharge %
    surcharge_amount: number;      // Calculated surcharge in cents
    discount_percentage: number;   // Specific tender discount %
    discount_amount: number;       // Calculated discount in cents
    final_tender_amount: number;   // Actual amount collected from customer
    metadata?: Record<string, any>; // Installment count, authorization code, MP payment ID
  }
  ```

* **Interactive Remaining Balance Resolution**: As the cashier inputs partial payments, dynamically compute:
  $$\text{Remaining Unpaid Subtotal} = \text{Ticket Subtotal} - \sum(\text{base\_allocated\_amount})$$
  Prevent completing the transaction until $\text{Remaining Unpaid Subtotal} == 0.00$.

* **Tender-Specific Surcharges and Discounts**: Calculate surcharges and discounts strictly against the specific tender's `base_allocated_amount`, rather than multiplying across the entire ticket total:
  $$\text{Final Ticket Total} = \sum(\text{final\_tender\_amount})$$

### 5. Calculate External Posnet Surcharges and Cash Discounts

Manage financing costs from standalone credit card terminals and incentives for cash payments:

* **Posnet Installment Coefficients**: Maintain a configurable matrix of installment financing surcharges:
  * 1 Cuota / Débito: `0%`
  * 3 Cuotas: `+15%` (Coefficient `1.15`)
  * 6 Cuotas: `+28%` (Coefficient `1.28`)
  * 12 Cuotas: `+55%` (Coefficient `1.55`)

* **External Posnet Transaction Capture**: When `POSNET_CREDIT` is chosen, prompt the cashier to select the number of installments (`installments_count`), compute the installment surcharge amount, and display both the installment surcharge and the monthly installment amount ($\text{final\_tender\_amount} / N$) for the customer. Prompt the cashier to record the external voucher authorization code (`posnet_auth_code`) and card brand (Visa, Mastercard, Cabal).

* **Cash Discount Mechanics**: When cash is tendered, apply the designated discount (e.g., `10%` off cash payments) strictly to the cash allocation:
  $$\text{discount\_amount} = \text{ROUND\_HALF\_UP}(\text{base\_allocated\_amount} \times (\text{discount\_percentage} / 100))$$
  $$\text{final\_tender\_amount} = \text{base\_allocated\_amount} - \text{discount\_amount}$$

* **ARCA Monotributo Fiscal Alignment**:
  * For Factura C, fold net discounts or financial surcharges into the line items or present them as global adjustment items (`Concepto` / `ImpNeto`).
  * Ensure the fiscal invoice amount (`ImpTotal`) matches the sum of all tenders' `final_tender_amount` to the cent ($0.01$ precision).

### 6. Process Mercado Pago Gateway Fees, QR Codes, and Net Settlement Accounting

Separate customer checkout totals from internal merchant accounting and register shift reconciliations:

* **Gross vs. Net Settlement Calculation**:
  * **Gross Customer Payment**: The customer pays the exact nominal ticket amount (or designated MP QR surcharge/discount tier).
  * **Platform Commission**: Calculate Mercado Pago processing fees based on the merchant's configured release schedule (e.g., Instant Release: $6.39\% + \text{IVA}$, 14-Day Release: $3.39\% + \text{IVA}$, or QR Debit / Balance: $0.80\% + \text{IVA}$).
  * **Tax Withholdings (*Retenciones*)**: Deduct applicable provincial IIBB or national withholding regimes when configured.
  * **Net Bank Intake**: Record $\text{Net Intake} = \text{Gross} - \text{Commission} - \text{Withholdings}$ as an expected settlement deposit in the accounting ledger.

* **Register Shift Closing (*Arqueo de Caja*) Separation**:
  * Shift summaries must strictly distinguish between physical cash in the drawer (`CASH_ARS`, `CASH_USD`) and digital tenders (`MERCADO_PAGO_QR`, `POSNET`, `BANK_TRANSFER`).
  * Blind shift closings (*arqueo ciego*) evaluate physical cash variances only against cash tenders, while digital tenders are verified against the gateway's settlement reports.

## Gotchas

* **Floating-Point Cent Drift in Split Payments**: Using naive arithmetic like `0.1 + 0.2` will produce `0.30000000000000004`, causing ARCA invoice rejections or validation failures where tender sums differ from invoice totals by `0.000000001`. Always round every tender calculation to 2 decimal places before comparing balances.

* **Re-evaluating USD Prices at Current Rates in History / Replay**: Never recalculate prices on historic sales or offline queue sync replays using the current day's exchange rate. Always read the immutable `exchange_rate_snapshot` recorded on the sale.

* **Applying Global Surcharges to Split Tenders**: Never apply a Posnet installment surcharge to the whole ticket when the customer only pays a fraction with credit card. The surcharge percentage must apply strictly to the card's allocated base subtotal.

* **Applying Cash Discounts to Non-Cash Tenders**: If a ticket of $\$10,000$ is split $\$5,000$ Cash and $\$5,000$ Card, a $10\%$ cash discount must only yield a $\$500$ discount on the cash portion, leaving the card portion unaffected at $\$5,000$.

* **Conflating Gross Cash Drawer Intake with Mercado Pago Settlements**: Never add Mercado Pago gross amounts to the expected physical cash drawer balance during shift closing audits, as this creates apparent massive cash shortages in the cash drawer count.
