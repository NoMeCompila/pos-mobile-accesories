# layout/unified-sidebar-navigation Specification Delta

## MODIFIED Requirements

### Requirement: Role-Based Navigation Link Filtering
The system SHALL dynamically filter and display only the navigation routes authorized for the currently authenticated user's role.

#### Scenario: Filtering navigation links for administrator role
- **WHEN** the authenticated user has role `admin`
- **THEN** the sidebar displays administrative links (`Resumen y Logs` -> `#admin/home`, `Gestión de Usuarios` -> `#admin/users`, and `Backup & Recovery` -> `#admin/backup`)
- **AND** hides cashier-only POS checkout routes (`#pos`, `#drawer`, `#history`)

#### Scenario: Filtering navigation links for cashier or seller role
- **WHEN** the authenticated user has role `cashier` or `seller`
- **THEN** the sidebar displays POS operational links (`Home` -> `#seller/home`, `Terminal de Venta` -> `#pos`, `Catálogo y Stock` -> `#catalog`, `Apertura/cierre de Caja` -> `#drawer`, and `Historial de Mis Ventas` -> `#history`)
- **AND** hides administrative routes (`#admin/*`)

#### Scenario: Filtering navigation links for manager role
- **WHEN** the authenticated user has role `manager`
- **THEN** the sidebar displays managerial and operational links (`Control Comercial` -> `#manager/home`, `Reportes BI` -> `#manager/sales-bi`, `Proveedores e Insumos` -> `#manager/suppliers`, `Gestión de Personal` -> `#admin/users`, `Catálogo y Stock` -> `#catalog`, and `Terminal de Venta` -> `#pos`)
- **AND** hides root system disaster recovery routes (`#admin/backup`)

