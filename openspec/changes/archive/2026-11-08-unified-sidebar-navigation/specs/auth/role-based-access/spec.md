# auth/role-based-access Specification Delta

## MODIFIED Requirements

### Requirement: Administrative Sidebar Navigation Between Portal Views
The system SHALL allow authenticated administrators to switch between the Admin Home Dashboard (`#admin/home`), the User Management CRUD directory (`#admin/users`), and the Backup & Recovery center (`#admin/backup`) using the unified shared sidebar in both expanded (288px) and collapsed 80px icon-rail modes.

#### Scenario: Navigating from User Management to Admin Home via first sidebar icon
- **WHEN** an authenticated administrator on `#admin/users` clicks the first item (`Resumen y Logs`) in the unified sidebar
- **THEN** the router navigates to `#admin/home`, renders the Admin Home Dashboard, and highlights the `Resumen y Logs` item and icon as active

#### Scenario: Navigating from Admin Home to User Management via second sidebar icon
- **WHEN** an authenticated administrator on `#admin/home` clicks the second item (`Gestión de Usuarios`) in the unified sidebar
- **THEN** the router navigates to `#admin/users`, renders the User Management CRUD view, and highlights the `Gestión de Usuarios` item and icon as active

#### Scenario: Navigating to Backup & Recovery via third sidebar item
- **WHEN** an authenticated administrator clicks the third item (`Backup & Recovery`) in the unified sidebar
- **THEN** the router navigates to `#admin/backup`, renders the Admin Backup & Recovery view, and highlights the `Backup & Recovery` item and icon as active

