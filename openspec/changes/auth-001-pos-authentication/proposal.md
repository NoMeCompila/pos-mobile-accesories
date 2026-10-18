# Proposal

## Why

The Retail POS currently launches directly into the terminal without operator identity verification, leaving point-of-sale operations, inventory adjustments, and cash drawer settlements unprotected. Introducing a robust initial authentication flow with session guarding ensures only authorized operators access the sales terminal, establishes operator accountability, and prepares the frontend for multi-role workflows and future Supabase Auth integration.

## What Changes

- **Authentication Session Guard & Routing**: Enforce navigation guards on initial application launch; unauthenticated users are redirected to the dedicated login view, while active valid sessions bypass login to the seller dashboard.
- **POS Operator Login Interface**: Implement a centered POS modal card inspired by the Kinetic v4.2 design system featuring terminal metadata badges (Terminal #04, TLS 1.3), F1/F2 shortcut hints, credential fields with inline icons, password visibility toggle, "Recordar terminal" persistence toggle, and fluid responsive styling.
- **Extensible Authentication Service Abstraction (`IAuthService`)**: Define clean contracts (`UserProfile`, `AuthSession`, `IAuthService`) and provide a client-side mock provider validating default seller credentials (`"vendedor"` / `"123"`) with role `"seller"`.
- **Validation and Feedback**: Add field-level validation for empty inputs, clear error messaging on invalid credentials, and focus management for keyboard shortcuts.
- **Session Persistence**: Manage session state and "Remember Device" preference in local storage.

## Capabilities

### New Capabilities
- `auth/session-management`: Covers operator credential authentication, session lifecycle, client-side route guarding, and extensible authentication service contracts for POS terminals.

### Modified Capabilities
*(None - this is the foundational authentication capability for the system)*

## Impact

- **Affected Code**: `src/App.tsx`, `src/types/auth.ts`, `src/services/authService.ts`, `src/components/LoginView.tsx`, `src/components/TopBar.tsx`.
- **Dependencies**: Uses existing React 19, Lucide icons, Tailwind CSS v4, and `@tanstack/react-query`. No new runtime packages required.
- **Breaking Changes**: None. Authenticated state transitions seamlessly into existing POS tabs.
