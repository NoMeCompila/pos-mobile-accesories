# Proposal

## Why

When a POS operator attempts to log in with invalid credentials, `AuthContext.login()` sets the global `isLoading` flag to `true`, which causes `App.tsx` to unmount `LoginView` and render the full-screen startup loader. When the login promise rejects, `App.tsx` remounts a brand-new `LoginView` instance, wiping the operator's entered identifier, losing the caught error state, and producing the visual effect of a full page refresh with zero error feedback. Additionally, operators need high-visibility floating pill toast notifications (red on authentication failure, green on authentication success) that persist cleanly across state and route transitions.

## What Changes

- **Decouple Initial Hydration from Action Loading in `AuthContext`**: Separate initial session hydration state (`isHydrating` / initial `isLoading`) from in-flight authentication mutation state (`isAuthenticating` or local submission state) so `App.tsx` never unmounts `LoginView` during credential verification.
- **Floating Pill Toast Notification System (`FloatingToast` & `ToastProvider`)**: Implement a floating top-center pill toast system matching the visual reference specification:
  - **Error Toast (Red)**: Pill container (`rounded-full`), red surface, circular alert badge (`AlertCircle`), clear error message (e.g., `"Invalid login credentials"`), and manual close button (`X`).
  - **Success Toast (Green)**: Pill container (`rounded-full`), emerald green surface, circular check badge (`CheckCircle2`), success message, and manual close button (`X`) that persists across the route transition to `#seller/home`.
- **Login Form State Preservation & Focus Recovery**: Ensure `handleSubmit` prevents default browser reload, retains the entered operator identifier/email upon failure, clears only the password field, and immediately returns keyboard focus to the password input.

## Capabilities

### New Capabilities
- `ui/toast-notifications`: Floating pill toast notification system supporting error and success variants, auto-dismiss timers, manual dismissal, keyboard accessibility (`Escape`), and cross-route persistence during authentication flows.

### Modified Capabilities
*(None - `openspec/specs/` currently has no synced specs)*

## Impact

- **Affected Code**:
  - `src/context/AuthContext.tsx` (decouple initial session hydration from login action loading)
  - `src/context/ToastContext.tsx` / `src/components/FloatingToast.tsx` (new toast notification provider and floating pill UI component)
  - `src/components/LoginView.tsx` (integrate toast notifications, preserve identifier on failure, clear and refocus password input)
  - `src/services/authService.ts` (standardize error messages for invalid credentials)
  - `src/App.tsx` (mount `ToastProvider` above route views so toasts survive view transitions)
- **Dependencies**: Uses existing React 19, `lucide-react`, `motion`, and Tailwind CSS v4. No new external packages required.

