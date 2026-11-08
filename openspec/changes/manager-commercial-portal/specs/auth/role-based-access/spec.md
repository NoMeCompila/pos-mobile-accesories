# auth/role-based-access Specification Delta

## MODIFIED Requirements

### Requirement: Dual Hardcoded Profile Authentication
The system SHALL authenticate the hardcoded administrator profile (`admin` / `123`), the hardcoded seller profile (`vendedor` / `123`), and the hardcoded manager profile (`gerente` / `123`), assigning each session its corresponding role (`admin`, `seller`, or `manager`).

#### Scenario: Successful administrator login
- **WHEN** an unauthenticated user on the login view enters username `"admin"` and password `"123"` and submits the form
- **THEN** the authentication provider resolves an active session with `role: "admin"` and `username: "admin"`
- **AND** redirects the user directly to the Admin Home Dashboard route (`#admin/home`)

#### Scenario: Successful seller login
- **WHEN** an unauthenticated user on the login view enters username `"vendedor"` and password `"123"` and submits the form
- **THEN** the authentication provider resolves an active session with `role: "seller"` and `username: "vendedor"`
- **AND** redirects the user to the seller home dashboard (`#seller/home`)

#### Scenario: Successful manager login
- **WHEN** an unauthenticated user on the login view enters username `"gerente"` and password `"123"` and submits the form
- **THEN** the authentication provider resolves an active session with `role: "manager"` and `username: "gerente"`
- **AND** redirects the user to the commercial control dashboard (`#manager/home`)

#### Scenario: Invalid credentials rejection
- **WHEN** a user submits any username and password combination other than the valid hardcoded profiles
- **THEN** the authentication provider rejects the login attempt
- **AND** displays `"Credenciales inválidas. Verifique su usuario y contraseña"` without creating a session

### Requirement: Bidirectional Role-Based Route Isolation
The system SHALL enforce strict navigation guards so that users authenticated with the `seller` role cannot access administrative or manager routes, and users authenticated with the `manager` role access manager, staff, catalog, and POS routes while being isolated from system disaster recovery.

#### Scenario: Seller attempting to access an administrative route
- **WHEN** a user with an active `seller` session navigates to `#admin/home`, `#admin/users`, or any `#admin/*` route via URL hash change or browser history
- **THEN** the navigation guard blocks access to the administrative view
- **AND** immediately redirects the session to `#seller/home`

#### Scenario: Administrator attempting to access a seller POS route
- **WHEN** a user with an active `admin` session navigates to `#seller/home`, `#pos`, `#catalog`, `#drawer`, or `#history`
- **THEN** the navigation guard blocks access to the seller POS view
- **AND** immediately redirects the session to `#admin/home`

#### Scenario: Manager attempting to access root system disaster recovery routes
- **WHEN** a user with an active `manager` session navigates to `#admin/backup` or `#admin/home`
- **THEN** the navigation guard blocks access to root system disaster recovery
- **AND** redirects the session to `#manager/home`

#### Scenario: Session restoration preserves role-specific landing route
- **WHEN** an authenticated browser session is reloaded or visits the root hash (`#` or `#login`)
- **THEN** the router directs an `admin` session to `#admin/home`, a `seller` session to `#seller/home`, and a `manager` session to `#manager/home`

