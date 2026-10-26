---
name: arca-wsfe-integrator
description: Expert integrator for Argentine ARCA (formerly AFIP) electronic invoicing web services (WSAA and WSFEv1) in Point of Sale (POS) systems. Use when configuring digital certificates, WSAA authentication tokens, Monotributista electronic vouchers (Factura C, Nota de Credito C, Nota de Debito C), multi-register points of sale (PtoVta), IIBB perception rules, official ARCA QR codes, or offline CAE synchronization queues.
---

# arca-wsfe-integrator

## Summary

Architects and implements complete Argentine electronic invoicing workflows with ARCA (formerly AFIP) Web Services (`WSAA` and `WSFEv1`), covering X.509 cryptographic authentication, *Monotributo* fiscal voucher emission, provincial gross income perceptions (*IIBB DGR*), official QR code generation, and offline contingency queues.

## When to Use

* Integrating or troubleshooting ARCA `WSAA` authentication and `WSFEv1` electronic invoicing endpoints in Homologation (testing) and Production environments

* Emitting mandatory *Monotributista* vouchers: Factura C (code `011`), Nota de Debito C (code `012`), and Nota de Credito C (code `013`)

* Managing sequential voucher numbering across multiple physical cash registers and points of sale (*Puntos de Venta / PtoVta*)

* Calculating and formatting provincial Gross Income perceptions (*Percepciones IIBB DGR*) and payment method surcharges or discounts on fiscal totals

* Generating the official ARCA fiscal QR code payload (Base64-encoded JSON) for 58mm/80mm thermal receipts and A4 PDF invoices

* Designing or implementing the asynchronous offline sales queue (`IndexedDB`) for automatic CAE recovery after internet or government server outages

## Steps

### 1. Manage X.509 Digital Certificates and WSAA Authentication Lifecycles

Enforce strict cryptographic security and token reuse rules when authenticating with ARCA `WSAA` (`LoginCMS`):

* **Environment Isolation**: Maintain strictly separated endpoints and X.509 certificate pairs (`.crt` and private `.key`) for Homologation (`wsaahomo.afip.gov.ar` / `wswhomo.afip.gov.ar`) and Production (`wsaa.afip.gov.ar` / `servicios1.afip.gov.ar`), storing credentials exclusively inside server-side secrets or Supabase Vault.

* **TRA Generation and CMS Signing**: Construct the XML Login Ticket Request (*TRA*) targeting service `wsfe` with a generation timestamp set 5 minutes in the past and an expiration timestamp 10 minutes in the future in Argentina standard time (`UTC-3`) to prevent clock-drift rejections, signing it using PKCS#7 / CMS DER encoding.

* **12-Hour Token Persistence and Reuse**: Store the returned *Ticket de Acceso* (`token`, `sign`, and `expirationTime`) in a protected backend table per environment and CUIT (`20334811590`). Reuse the cached token across all register requests until 10 minutes prior to its 12-hour expiration; never request a new token on every sale, as ARCA blocks concurrent login requests with `coe.alreadyAuthenticated`.

### 2. Orchestrate Mandatory Monotributista Voucher Emission (WSFEv1)

Follow strict sequence synchronization and field validation before invoking `FECAESolicitar`:

* **Point of Sale (*PtoVta*) and Voucher Type Mapping**: Map each physical cash register or store branch to its authorized ARCA *Punto de Venta* number and use the exact *Monotributo* voucher codes: `011` for Factura C, `012` for Nota de Debito C, and `013` for Nota de Credito C.

* **Atomic Sequence Synchronization (`FECompUltimoAutorizado`)**: Query `FECompUltimoAutorizado` for the specific `PtoVta` and `CbteTipo` while holding a database-level lock per point of sale, setting `CbteDesde` and `CbteHasta` to `last_authorized_voucher + 1` so two cashiers never submit colliding voucher numbers.

* **Concept and Service Date Rules (`Concepto`)**: Set `Concepto = 1` (*Productos*) when selling physical mobile accessories, `Concepto = 2` (*Servicios*) for pure repair labor, and `Concepto = 3` (*Productos y Servicios*) when combining spare parts and technical labor on a completed repair order. Whenever `Concepto` is `2` or `3`, mandate the inclusion of service start date (`FchServDesde`), service end date (`FchServHasta`), and payment due date (`FchVtoPago`) in `YYYYMMDD` format.

* **Customer Tax Identification Rules (`DocTipo` and `DocNro`)**: Validate recipient identification thresholds according to current ARCA regulations; use `DocTipo = 80` (CUIT) for business customers, `DocTipo = 96` (DNI) for identified final consumers, or `DocTipo = 99` (`DocNro = 0`) only for unidentified final consumer sales below the legal identification threshold, always setting the recipient tax condition ID (`CondicionIVAReceptorId`) required by ARCA RG 5616.

### 3. Enforce Precision Tax, Perception, and Credit/Debit Note Rules

Ensure exact mathematical alignment across every currency and tax field in the `WSFEv1` payload:

* **Monotributo Net and Total Alignment**: For Type C vouchers, set `ImpIVA = 0` and `ImpTotConc = 0` (do not include an `Iva` array in the payload, as *Monotributo* vouchers do not itemize VAT). Ensure the mathematical identity `ImpTotal = ImpNeto + ImpTrib` holds to the exact cent (`numeric(12,2)`) after applying any payment method discounts, Posnet installment surcharges, or USD-to-ARS exchange rate conversions.

* **Provincial Gross Income Perceptions (*IIBB DGR*)**: When provincial perceptions apply for CUIT `20334811590`, populate the `Tributos` array with `Id = 7` (Percepcion de Ingresos Brutos), specifying the taxable base (`BaseImp`), percentage aliquot (`Alic`), and exact perception amount (`Importe`), summing all tributary items into `ImpTrib`.

* **Associated Vouchers on Credit and Debit Notes (`CbtesAsoc`)**: Whenever issuing a Nota de Credito C (`013`) for a sale cancellation/return or a Nota de Debito C (`012`) for a customer current account surcharge, require the `CbtesAsoc` structure referencing the original Factura C (`Tipo = 011`, `PtoVta`, `Nro`, `Cuit`, and `CbteFch`).

### 4. Generate Official ARCA Fiscal QR Codes and Print Layouts

Format all printed and downloadable fiscal documents according to official ARCA transparency specifications:

* **Standardized JSON QR Payload**: Construct the mandatory JSON object containing version (`ver: 1`), issue date (`fecha` in `YYYY-MM-DD`), issuer CUIT (`cuit: 20334811590`), point of sale (`ptoVta`), voucher type (`tipoCmp`), voucher number (`nroCmp`), total amount (`importe`), currency (`moneda: "PES"`), exchange rate (`ctz: 1`), customer document type and number (`tipoDocRec`, `nroDocRec`), authorization type (`tipoCodAut: "E"`), and numeric CAE code (`codAut`).

* **Base64 URL Encoding and Thermal Rendering**: Encode the JSON string in standard Base64 and append it to `https://www.afip.gob.ar/fe/qr/?p=<base64_payload>`. Render the resulting URL as a high-contrast QR image alongside the human-readable 14-digit CAE number and CAE expiration date (`Vto. CAE`) on both 58mm/80mm thermal tickets and PDF exports.

### 5. Implement Asynchronous Offline Contingency and CAE Retry Queues

Guarantee uninterrupted counter checkout when internet connectivity or ARCA servers fail:

* **Graceful Degradation at Checkout**: Detect network timeouts or ARCA `5xx` server unavailability within a strict 8-second timeout window. Commit the sale locally in the browser's `IndexedDB` contingency queue and in Supabase (when reachable) with status `PENDING_CAE`, printing a clearly labeled provisional receipt so the customer can complete payment immediately.

* **Chronological Background Synchronization**: Run an automated background worker that polls connectivity and processes `PENDING_CAE` sales in strict FIFO chronological order per `PtoVta`. Override the voucher issue date to match the permitted ARCA window, query `FECompUltimoAutorizado` before each submission, update the sale record with the granted CAE, and flag any permanent validation errors (`Observaciones` / `Errores`) for administrative review.

## Gotchas

* **Chronological Date Violations on Queued Invoices**: ARCA rejects `FECAESolicitar` if a newly submitted voucher has a date (`CbteFch`) earlier than the previously authorized voucher number on the same `PtoVta`. Always synchronize queued offline sales sequentially and adjust `CbteFch` to the current authorization date when required by sequential rules.

* **Including VAT Arrays on Type C Vouchers**: Passing the `Iva` array (`AlicIva`) on Factura C (`011`), Nota de Debito C (`012`), or Nota de Credito C (`013`) triggers an immediate schema rejection from `WSFEv1`.

* **Missing Service Dates on Repair Invoices**: Submitting a repair order invoice with `Concepto = 2` or `Concepto = 3` while omitting `FchServDesde`, `FchServHasta`, or `FchVtoPago` causes immediate rejection.

* **Floating-Point Rounding Discrepancies**: Even a `0.01` ARS difference between `ImpTotal` and `ImpNeto + ImpTrib` caused by JavaScript floating-point math will reject the CAE request; always round intermediate line totals and surcharges to two decimal places before building the SOAP payload.