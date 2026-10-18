# Spec Delta

## Purpose

Provides secure operator authentication, route guarding, session lifecycle management, and credential validation for the Retail POS application.

## ADDED Requirements

### Requirement: Initial Session Routing and Navigation Guard
The system SHALL evaluate operator authentication status upon application startup and URL navigation, redirecting unauthenticated sessions to the login view and allowing authenticated sessions to access protected POS routes.

#### Scenario: Unauthenticated access redirects to login
- **WHEN** an unauthenticated operator accesses the application root (`/` or `#`) or any protected route
- **THEN** the router guard immediately redirects the user to the `/login` view
- **AND** renders the POS login card with terminal metadata and credential inputs

#### Scenario: Valid active session bypasses login to seller home
- **WHEN** an operator with an existing valid session in storage accesses or reloads the application URL
- **THEN** the router guard bypasses the login view
- **AND** directs the user directly to the seller operational view (`/seller/home` or `#home` / `#pos`)

### Requirement: Operator Credential Authentication
The system SHALL validate operator credentials through the authentication provider, setting active operator identity upon success or presenting actionable error feedback upon failure.

#### Scenario: Successful seller authentication
- **WHEN** the user inputs `"vendedor"` as Operator ID, `"123"` as Operating Password, and submits the form
- **THEN** the authentication provider resolves the session with `role: "seller"` and `isAuthenticated: true`
- **AND** persists the session according to the remember terminal setting
- **AND** redirects the operator to the seller dashboard

#### Scenario: Authentication failure with invalid credentials
- **WHEN** the user enters credentials differing from the valid registered operators and submits
- **THEN** the authentication provider rejects the credentials
- **AND** the system displays `"Credenciales inválidas. Verifique su usuario y contraseña"`
- **AND** clears the password input field while retaining the entered username
- **AND** keeps the operator on the login view

### Requirement: Login Form Input Validation and Focus Management
The system SHALL enforce mandatory field validation prior to provider dispatch and provide keyboard navigation shortcuts matching POS hardware conventions.

#### Scenario: Missing mandatory fields prevents submission
- **WHEN** the user attempts to submit the login form with an empty Operator ID or Password
- **THEN** form submission is aborted without calling the authentication provider
- **AND** the interface displays inline validation messages specifying the missing required fields

#### Scenario: Keyboard shortcut focus and Enter submission
- **WHEN** the operator presses `F1` or `F2` on the login view
- **THEN** keyboard focus moves directly to Operator ID (`F1`) or Password (`F2`) input
- **AND** pressing `Enter` within any active credential field triggers form submission

### Requirement: Device Session Persistence and Remember Preference
The system SHALL respect the operator's preference to persist the terminal session across browser reloads or close events.

#### Scenario: Remember terminal preference enabled
- **WHEN** an operator authenticates with `"Recordar terminal"` checked
- **THEN** the session payload and operator profile are stored in persistent storage
- **AND** subsequent browser sessions restore the active session without re-prompting credentials

#### Scenario: Session termination on logout
- **WHEN** an authenticated operator triggers the logout action from the POS interface
- **THEN** the active session token and authentication flags are cleared from storage
- **AND** the application immediately navigates back to the `/login` view

### Requirement: Responsive Presentation and Touch Ergonomics
The login card and interactive elements SHALL adapt fluidly to screen dimensions, maintaining touch-friendly targets for tablet and mobile POS devices.

#### Scenario: Mobile viewport layout adaptation
- **WHEN** the login view renders in a viewport narrower than 640px
- **THEN** the card width adapts fluidly to 100% of the viewport container with safe margins
- **AND** all interactive inputs, toggles, and submit buttons maintain a minimum touch target height of 44px
- **AND** terminal status pills and footer metadata stack without causing horizontal overflow
