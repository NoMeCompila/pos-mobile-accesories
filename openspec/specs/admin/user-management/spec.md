# admin/user-management Specification

## Purpose

Provides an administrative portal for viewing, searching, filtering, creating, and managing POS operator profiles, role assignments, branch allocations, and account activation statuses.

## Requirements

### Requirement: Administrative User Directory and Operational KPIs
The system SHALL display an administrative user directory containing summary KPI cards for Total Users, Active Users, Cashiers & Terminals, and Active Shift Sessions alongside a tabular list of all registered user profiles.

#### Scenario: KPI cards reflect current user directory counts
- **WHEN** an authenticated administrator opens the User Management view (`#admin/users`)
- **THEN** the system renders 4 KPI metric cards displaying the total count of users, count of active users (`status = true`), count of cashiers (`role = cashier`), and count of active terminal sessions
- **AND** renders the user table displaying each user's avatar initials, full name, email, truncated UUID with copy action, role badge, assigned branch, phone number, active status badge, timestamps, and action buttons

### Requirement: Multi-Criteria Directory Search and Filtering
The system SHALL allow administrators to filter the user directory in real time using a text search input and dropdown selectors for Role, Branch, and Account Status.

#### Scenario: Real-time text search across user identity fields
- **WHEN** the administrator types a search term into the directory search input
- **THEN** the table immediately filters rows matching the query case-insensitively against first name, last name, email, phone number, or UUID
- **AND** updates the displayed rows without requiring a page reload

#### Scenario: Combined role, branch, and status filtering
- **WHEN** the administrator selects specific values in the Role, Branch, or Status filter selectors
- **THEN** the user directory displays only the user records satisfying all active filter criteria simultaneously
- **AND** shows an empty state with a filter reset action if no user profiles match

### Requirement: PostgreSQL Schema Metadata Inspection Drawer
The system SHALL provide a collapsible schema inspection panel on the User Management view that displays the column structure and constraints of the `public.user_profiles` table.

#### Scenario: Toggling the schema inspection panel
- **WHEN** the administrator clicks the `"Cols Schema (10)"` toggle button in the filter bar
- **THEN** the system expands the schema metadata banner showing all 10 column definitions (`id`, `email`, `first_name`, `last_name`, `role`, `branch_id`, `phone`, `status`, `created_at`, `updated_at`) with their data types and nullability rules
- **AND** collapses the panel when the close button or toggle button is clicked again

### Requirement: New User Creation Modal and Form Validation
The system SHALL open a modal dialog when the administrator clicks `"+ Nuevo Usuario"`, allowing creation of a new user profile with required email and role selection.

#### Scenario: Opening and dismissing the New User modal
- **WHEN** the administrator clicks the `"+ Nuevo Usuario"` button on the User Management view
- **THEN** the system displays the centered `"Nuevo Usuario"` modal dialog over a blurred backdrop with focus on the email input
- **AND** closes the modal and resets all form fields when the administrator clicks `"Cancelar"`, the close icon (`X`), or presses `Escape`

#### Scenario: Selecting operator role via interactive pill cards
- **WHEN** the administrator clicks one of the role pill options (`Cajero`, `Supervisor`, `Stock`, `Admin`) inside the creation modal
- **THEN** the selected pill card highlights as active and updates the form's `role` value

#### Scenario: Creating a valid new user profile
- **WHEN** the administrator enters a valid email, optional first and last name, role, branch assignment, optional phone number, initial status toggle, and clicks `"+ Crear Usuario"`
- **THEN** the system generates a unique UUID and timestamps for the new user record, adds the user to the directory state, updates the KPI counters, and closes the modal

#### Scenario: Preventing submission with missing or invalid email
- **WHEN** the administrator attempts to submit the `"Nuevo Usuario"` form with an empty or malformed email address or duplicate email
- **THEN** the system aborts creation, keeps the modal open, and displays an inline validation error message

### Requirement: User Profile Editing and Status Toggling
The system SHALL allow administrators to edit existing user profile details or toggle an operator's active status directly from the directory table.

#### Scenario: Editing an existing user profile
- **WHEN** the administrator clicks the `"Editar"` button on a user row, modifies profile fields, and saves changes
- **THEN** the system updates the user record and `updated_at` timestamp in the directory state and refreshes the table row and KPI counters

