# manager/commercial-portal Specification

## Purpose

Provides a commercial management portal for store supervisors with real-time cashier shift supervision, sales business intelligence analytics, and supplier replenishment controls.

## Requirements

### Requirement: Commercial Control Dashboard and Terminal Oversight
The system SHALL provide a centralized commercial control dashboard (`#manager/home`) displaying store gross sales, active shifts, average ticket, supervisor authorizations queue, and live POS terminal statuses.

#### Scenario: Viewing real-time commercial KPIs
- **WHEN** an authenticated manager accesses `#manager/home`
- **THEN** the system renders commercial KPI cards for Gross Sales, Active Cash Shifts, Average Ticket, and Pending Supervisor Overrides
- **AND** displays real-time health badges for all branch POS terminal nodes

#### Scenario: Authorizing a cashier override request
- **WHEN** a manager clicks an authorization action in the supervisor queue and submits their supervisor PIN
- **THEN** the system marks the override event as approved in local session telemetry
- **AND** updates the cashier terminal state without requiring page reload

### Requirement: Interactive Sales BI and Commercial Intelligence
The system SHALL provide an interactive business intelligence analytics dashboard (`#manager/sales-bi`) featuring sales vs target trends, gross margin percentage, category revenue mix, and hourly foot traffic heatmaps.

#### Scenario: Inspecting sales performance and margin metrics
- **WHEN** an authenticated manager accesses `#manager/sales-bi`
- **THEN** the system renders comparative bar charts for weekly net sales versus target
- **AND** displays a gross margin breakdown and category mix distribution

#### Scenario: Filtering sales analytics by date range
- **WHEN** the manager selects a date filter preset (Today, This Week, This Month) in the BI dashboard
- **THEN** the metrics, charts, and traffic heatmaps update interactively to reflect the chosen timeframe

### Requirement: Suppliers Directory and Insumos Replenishment
The system SHALL provide a supplier and technical supplies replenishment workspace (`#manager/suppliers`) managing vendor contacts, purchase order tracking, technical repair supplies, and delivery intake.

#### Scenario: Browsing registered vendors and purchase orders
- **WHEN** an authenticated manager navigates to `#manager/suppliers`
- **THEN** the system renders a searchable vendor list with payment terms, active purchase orders, and replenishment lead times

#### Scenario: Filtering technical supplies by stock threshold
- **WHEN** the manager toggles the low stock filter in the technical supplies catalog
- **THEN** the table displays only supplies and repair spare parts whose current inventory is at or below minimum reorder points

