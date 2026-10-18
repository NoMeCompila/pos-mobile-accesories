# Tasks

## 1. Authentication Contracts & Service Layer

- [x] 1.1 Create `src/types/auth.ts` defining `UserRole`, `UserProfile`, `AuthSession`, and `IAuthService` interface contracts; verify types compile cleanly with `npm run lint`.
- [x] 1.2 Implement `MockAuthService` in `src/services/authService.ts` adhering to `IAuthService` validating credentials (`"vendedor"` / `"123"`), returning a seller `AuthSession`, and throwing standard error codes on invalid credentials.
- [x] 1.3 Implement `useAuth` state manager / hook managing session storage persistence (`localStorage` for remembered terminal, `sessionStorage` for temporary session), session hydration on launch, and logout action.

## 2. POS Login View (Kinetic v4.2 Design)

- [x] 2.1 Implement `src/components/LoginView.tsx` matching the reference UI mockup (terminal status badges `#04 Flagship Central`, `TLS 1.3`, logo container, `Retail POS` title, `Kinetic v4.2` subtitle, `F1` / `F2` shortcut chips, inputs with icons, visibility toggle, clear button, remember terminal checkbox, and telemetry footer).
- [x] 2.2 Add form validation and error handling in `LoginView.tsx` (empty field validation, invalid credentials error banner, clearing password input while retaining username).
- [x] 2.3 Add POS keyboard shortcuts (`F1` focuses username, `F2` focuses password, `Enter` triggers submission) and responsive styling ensuring touch targets >= 44px on viewports < 640px.

## 3. Route Guard & POS Shell Integration

- [x] 3.1 Integrate session navigation guard into `src/App.tsx`: redirect unauthenticated access to the login screen, and direct authenticated sessions to the seller operational terminal (`/seller/home` / `#pos`).
- [x] 3.2 Update `src/components/TopBar.tsx` to display the authenticated operator's name and role with a logout button that terminates the session and returns to login.
- [x] 3.3 The validation will be manually performed by the QA team. nothing to do here from your side
