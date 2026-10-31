# auth/supabase-rbac-session Specification

## Purpose

Provides end-to-end Supabase Auth credential authentication, business profile hydration from `public.user_profiles`, silent background JWT refresh during active POS shifts, persistent session recovery, frontend and PostgreSQL RLS role-based access control across all five business roles (`admin`, `manager`, `cashier`, `technician`, `customer`), shift-aware logout protection, and Super-Admin full-module access.

## Requirements

### Requirement: Multi-Role Supabase Authentication and Profile Hydration
The system SHALL authenticate operators and customers against Supabase Auth using email and password credentials, retrieve their business profile (`role`, `branch_id`, `first_name`, `last_name`, `status`) from `public.user_profiles`, hydrate the active session context, and redirect the user to their role-designated initial view.

#### Scenario: Successful multi-role login and profile hydration
- **WHEN** a registered user in `auth.users` with an active record in `public.user_profiles` (`admin`, `manager`, `cashier`, `technician`, or `customer`) submits valid credentials via `supabase.auth.signInWithPassword`
- **THEN** Supabase issues a valid JWT access token and refresh token
- **AND** the application retrieves the operator's business profile (`role`, `branch_id`, `first_name`, `last_name`) from `public.user_profiles`
- **AND** the session is hydrated into `AuthContext` and the user is redirected to their designated initial view (POS Register `#pos` for `cashier`, Workshop `#workshop` for `technician`, Executive Dashboard `#home` for `admin`/`manager`, or Customer Portal `#customer/orders` for `customer`)

#### Scenario: Disabled or missing user profile rejection
- **WHEN** a user authenticates with valid `auth.users` credentials but their `public.user_profiles` record has `status = false` or does not exist
- **THEN** the system immediately terminates the Supabase session
- **AND** displays an actionable error alert indicating the operator profile is inactive or unauthorized

### Requirement: Silent Background Token Refresh During Active Shifts
The system SHALL automatically refresh expiring JWT access tokens in the background using the Supabase refresh token without interrupting active cash register shifts, cart items, or ongoing checkout operations.

#### Scenario: Silent token refresh during an active cashier shift
- **WHEN** an active `cashier` has an open cash register shift and the access token nears its expiration threshold during item scanning or checkout
- **THEN** the Supabase client executes a silent background refresh using the refresh token and emits a `TOKEN_REFRESHED` event
- **AND** `AuthContext` updates the active token in memory and storage without unmounting views, clearing cart state, or causing `401 Unauthorized` errors

### Requirement: Session Persistence and Rehydration Across Restarts
The system SHALL persist and rehydrate authenticated sessions across browser reloads or restarts according to the operator's "Remember Device" preference, and gracefully handle expired or revoked refresh tokens.

#### Scenario: Rehydrating a persisted session on browser restart
- **WHEN** an operator who authenticated with `"Remember Device"` enabled refreshes the tab or reopens the browser
- **THEN** `supabase.auth.getSession()` restores the session from persistent storage (`localStorage`) and rehydrates the `public.user_profiles` state into `AuthContext`
- **AND** routes the operator directly to their authorized workspace without prompting for login

#### Scenario: Expired or revoked refresh token recovery
- **WHEN** session rehydration or background token refresh fails because the refresh token is expired or revoked
- **THEN** the system purges all stale local session data from `localStorage` and `sessionStorage`
- **AND** redirects the user to `/login` (`#login`) with an informative `"Your session has expired. Please sign in again."` notification

### Requirement: Frontend Role Permission Middleware and Route Guarding
The system SHALL enforce a role-permission middleware across all application routes and navigation menus, preventing unauthorized roles from accessing restricted views and redirecting them to their authorized landing view with an alert.

#### Scenario: Unauthorized route access blocked for cashier or technician
- **WHEN** an authenticated user with role `cashier` or `technician` attempts to navigate to a restricted route (such as `/settings/users`, `/reports/financial`, or `/inventory/costs`)
- **THEN** the frontend role permission middleware intercepts the navigation and denies access
- **AND** redirects the user to their authorized landing view (`#pos` for `cashier`, `#workshop` for `technician`) with an `"Unauthorized Access"` alert notification

### Requirement: Database-Level RLS Enforcement and Anti-Escalation
The system SHALL enforce PostgreSQL Row Level Security (RLS) policies and anti-escalation triggers on `public.user_profiles` and protected domain tables so unauthorized queries or role modifications are rejected at the database layer.

#### Scenario: Unauthorized data query or privilege escalation blocked by PostgreSQL
- **WHEN** an authenticated `cashier` or `technician` attempts to query restricted rows (such as supplier wholesale costs or other staff profiles) or attempts to update their own `role` or `branch_id` via the Supabase client
- **THEN** PostgreSQL Row Level Security policies deny the unauthorized read/write operation
- **AND** the database trigger `protect_user_profile_critical_fields` aborts any non-admin attempt to modify `role` or `branch_id` with an access denied exception

### Requirement: Clean Logout and Open Cash Shift Safeguard
The system SHALL verify whether an active cash register shift is open before completing a sign-out request, alerting the operator to confirm or perform blind cash closing (*arqueo ciego*) before purging session tokens.

#### Scenario: Logout intercepted when cash shift is open
- **WHEN** an authenticated `cashier` initiates sign-out while an active cash register shift (`shift.status === 'open'`) is open
- **THEN** the system displays a warning confirmation modal alerting the operator that a register close (*arqueo ciego*) is pending
- **AND** allows the operator to either navigate to the Cash Drawer Settlement view (`#drawer`) or explicitly confirm forced sign-out

#### Scenario: Confirmed logout purges tokens and state
- **WHEN** the operator confirms sign-out (or logs out with no open cash shift)
- **THEN** `supabase.auth.signOut()` purges all stored JWT tokens and session metadata from storage and `AuthContext`
- **AND** redirects the application immediately to the `/login` screen

### Requirement: Super-Admin Profile Provisioning and Full Module Access
The system SHALL support a Super-Admin profile (`role = 'admin'`, global cross-branch scope) capable of authenticating and accessing all functional modules and administrative views in the POS platform.

#### Scenario: Super-Admin login grants unrestricted module visibility and access
- **WHEN** an authenticated Super-Admin (`role = 'admin'`) initiates login
- **THEN** the role permission middleware grants unrestricted access to all POS, Catalog & Wholesale Costs, Cash Drawer, Sales History, Workshop Repairs, Financial Reports, and User Management modules
- **AND** the navigation sidebar exposes all operational and administrative module links

