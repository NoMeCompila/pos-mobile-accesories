# auth/role-based-access Specification

## Purpose

Enforces multi-profile authentication and role-based route isolation between administrative management views and point-of-sale seller operations.

## Requirements

### Requirement: Dual Hardcoded Profile Authentication
The system SHALL authenticate both the hardcoded administrator profile (`admin` / `123`) and the hardcoded seller profile (`vendedor` / `123`), assigning each session its corresponding role (`admin` or `seller`).

#### Scenario: Successful administrator login
- **WHEN** an unauthenticated user on the login view enters username `"admin"` and password `"123"` and submits the form
- **THEN** the authentication provider resolves an active session with `role: "admin"` and `username: "admin"`
- **AND** redirects the user directly to the Admin Home Dashboard route (`#admin/home`)

#### Scenario: Successful seller login
- **WHEN** an unauthenticated user on the login view enters username `"vendedor"` and password `"123"` and submits the form
- **THEN** the authentication provider resolves an active session with `role: "seller"` and `username: "vendedor"`
- **AND** redirects the user to the seller home dashboard (`#seller/home`)

#### Scenario: Invalid credentials rejection
- **WHEN** a user submits any username and password combination other than the valid hardcoded profiles
- **THEN** the authentication provider rejects the login attempt
- **AND** displays `"Credenciales inválidas. Verifique su usuario y contraseña"` without creating a session

### Requirement: Bidirectional Role-Based Route Isolation
The system SHALL enforce strict navigation guards so that users authenticated with the `seller` role cannot access administrative routes and users authenticated with the `admin` role cannot access seller POS routes.

#### Scenario: Seller attempting to access an administrative route
- **WHEN** a user with an active `seller` session navigates to `#admin/home`, `#admin/users`, or any `#admin/*` route via URL hash change or browser history
- **THEN** the navigation guard blocks access to the administrative view
- **AND** immediately redirects the session to `#seller/home`

#### Scenario: Administrator attempting to access a seller POS route
- **WHEN** a user with an active `admin` session navigates to `#seller/home`, `#pos`, `#catalog`, `#drawer`, or `#history`
- **THEN** the navigation guard blocks access to the seller POS view
- **AND** immediately redirects the session to `#admin/home`

#### Scenario: Session restoration preserves role-specific landing route
- **WHEN** an authenticated browser session is reloaded or visits the root hash (`#` or `#login`)
- **THEN** the router directs an `admin` session to `#admin/home` and directs a `seller` session to `#seller/home`

### Requirement: Administrative Sidebar Navigation Between Portal Views
The system SHALL allow authenticated administrators to switch between the Admin Home Dashboard (`#admin/home`) and the User Management CRUD directory (`#admin/users`) using the administrative icon-rail sidebar.

#### Scenario: Navigating from User Management to Admin Home via first sidebar icon
- **WHEN** an authenticated administrator on `#admin/users` clicks the first icon (`Resumen y Logs`) in the administrative sidebar
- **THEN** the router navigates to `#admin/home`, renders the Admin Home Dashboard, and marks the first sidebar icon as active

#### Scenario: Navigating from Admin Home to User Management via second sidebar icon
- **WHEN** an authenticated administrator on `#admin/home` clicks the second icon (`Gestión de Usuarios`) in the administrative sidebar
- **THEN** the router navigates to `#admin/users`, renders the User Management CRUD view, and marks the second sidebar icon as active
