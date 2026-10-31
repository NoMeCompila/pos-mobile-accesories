# Spec Delta

## Purpose

Provides an administrative system observability and audit dashboard for monitoring active POS sessions, security events, external fiscal and CDN integrations, and real-time database change logs.

## ADDED Requirements

### Requirement: System Health KPI Overview Bento
The system SHALL display 4 top-level operational KPI cards on the Admin Home Dashboard (`#admin/home`) summarizing Active Concurrent Sessions, 24-Hour Security Events, Database Latency & Connections, and API/Sync Error Rate.

#### Scenario: Rendering system health KPI metrics
- **WHEN** an authenticated administrator views the Admin Home Dashboard (`#admin/home`)
- **THEN** the system renders the Active Sessions card with concurrent count, hourly delta badge, and role breakdown
- **AND** renders the 24h Security Events card with total incidents, failed retry breakdown, and flagged origin IP badge
- **AND** renders the DB Latency & Connections card with millisecond response time, health status pill, and auxiliary service indicators
- **AND** renders the API/Sync Error Rate card with error percentage, success volume, sparkline trend graph, and pending offline count

### Requirement: Live Authentication Events Stream and Category Filtering
The system SHALL display a real-time feed of authentication events (`auth.audit_events`) supporting category filtering and feed pause/resume controls.

#### Scenario: Filtering authentication events by category
- **WHEN** the administrator clicks a filter tab (`Todos`, `Fallidos / Alertas`, `LOGIN_SUCCESS`, `TOKEN_REFRESH`) in the authentication events feed
- **THEN** the feed immediately filters the displayed rows to show only events matching the selected category
- **AND** displays security incident warning banners on failed login or blocked access events

#### Scenario: Pausing and resuming the live authentication feed
- **WHEN** the administrator clicks the `"Pausar Feed"` button in the top action bar
- **THEN** the button state changes to `"Reanudar Feed"` with alert styling and pauses live feed updates until clicked again

### Requirement: External Fiscal and CDN Integration Monitors
The system SHALL display dedicated health monitor cards for the Argentine ARCA electronic invoicing service (`WSAA` / `WSFEv1`) and the CDN/Multimedia storage service.

#### Scenario: Monitoring ARCA fiscal service status and diagnostics
- **WHEN** the administrator inspects the Servicio Fiscal ARCA card on `#admin/home`
- **THEN** the card displays the operational status badge, Ticket de Acceso (TRA) expiration countdown, progress bar, cryptographic signature preview, average FECAE latency, and last authorized CAE voucher number
- **AND** triggers a diagnostic status refresh with visual confirmation when `"Renovar TRA"` or `"Ping WSFEv1"` is clicked

#### Scenario: Monitoring CDN and storage capacity
- **WHEN** the administrator inspects the CDN & Multimedia card on `#admin/home`
- **THEN** the card displays used versus total storage capacity in GB and percentage, progress bar, total catalog images count, and Edge Cache hit rate

### Requirement: Interactive Database CDC Audit Trail with Expandable JSON Diffs
The system SHALL display a chronological table of database mutations (`system_audit_logs`) with table-name filter pills and expandable rows showing `OLD` versus `NEW` JSON states.

#### Scenario: Filtering audit trail records by database table
- **WHEN** the administrator clicks a table filter pill (`Todas`, `sales`, `cash_shifts`, `products`, `user_profiles`)
- **THEN** the audit trail table displays only mutation rows belonging to the selected database table

#### Scenario: Expanding an audit row to inspect JSON state diff
- **WHEN** the administrator clicks an audit trail row or its expand icon
- **THEN** the system expands a detail panel below the row displaying the modification reason, transaction ID, and formatted `OLD` and `NEW` JSON payloads
- **AND** collapses the detail panel when clicked again

