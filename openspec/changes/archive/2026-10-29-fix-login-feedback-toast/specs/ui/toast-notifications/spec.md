# Spec Delta

## Purpose

Provides non-blocking floating pill toast notifications and non-reloading form feedback for authentication and operational events in the Retail POS application.

## ADDED Requirements

### Requirement: Non-Reloading Login Submission and Input Preservation
The system SHALL process login credential submissions asynchronously without reloading the browser document or unmounting the active login form, preserving the operator's entered identifier when authentication fails.

#### Scenario: Failed login retains identifier and clears password without reload
- **WHEN** an operator enters a username or email (e.g., `"vendedor"` or `"user@example.com"`), enters an invalid password, and submits the login form
- **THEN** the application MUST NOT reload the page or unmount the login view
- **AND** the entered operator identifier remains populated in the input field
- **AND** the password field is cleared to an empty string and receives immediate keyboard focus

### Requirement: Floating Pill Error Toast on Authentication Failure
The system SHALL display a prominent red floating pill toast notification at the top-center of the viewport whenever login authentication fails.

#### Scenario: Invalid credentials trigger red error toast
- **WHEN** the authentication service rejects the submitted login credentials
- **THEN** the system renders a red floating pill toast displaying a circular alert icon, the error message (e.g., `"Invalid login credentials"`), and a manual dismiss button (`X`)
- **AND** exposes `role="alert"` for assistive technologies

### Requirement: Floating Pill Success Toast on Authentication Success
The system SHALL display a green floating pill toast notification upon successful login that remains visible across the route transition to the operator workspace.

#### Scenario: Valid credentials trigger green success toast across navigation
- **WHEN** the operator submits valid credentials (`"vendedor"` / `"123"`)
- **THEN** the system renders a green floating pill toast with a circular checkmark icon and a success message
- **AND** transitions the operator to `#seller/home` while keeping the toast visible until its dismissal timer completes or it is manually closed

### Requirement: Toast Dismissal Controls and Auto-Hide Timer
The system SHALL automatically dismiss active toast notifications after a configurable timeout and allow immediate manual dismissal via click or keyboard.

#### Scenario: Manual dismissal via close button or Escape key
- **WHEN** an error or success toast is visible and the operator clicks the `X` button or presses the `Escape` key
- **THEN** the toast immediately animates out and unmounts from the viewport

#### Scenario: Automatic dismissal after timeout
- **WHEN** an active toast notification remains open for 4000ms without user interaction
- **THEN** the toast automatically animates out and unmounts

