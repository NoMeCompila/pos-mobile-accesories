# Design

## Context

The Retail POS currently functions as a single-page React 19 application relying on client-side hash routing (`window.location.hash`) and `@tanstack/react-query` for local state persistence. There is currently no authentication layer or session guard, meaning any user loading the application enters the sales and inventory terminal directly. See `proposal.md` for background motivation.

## Goals / Non-Goals

**Goals:**
- Provide a modular `IAuthService` adapter interface isolating authentication logic from the UI.
- Provide a default `MockAuthService` implementing `IAuthService` validating the predefined seller credentials (`vendedor` / `123`).
- Implement an authentication provider/hook (`useAuth`) supplying active session state (`user`, `isAuthenticated`, `isLoading`, `login`, `logout`) to the component tree.
- Create a pixel-aligned, responsive `LoginView` matching the Kinetic v4.2 POS design with keyboard shortcut bindings (`F1`, `F2`, `Enter`).
- Guard application routes in `App.tsx`, redirecting unauthenticated traffic to `/login` (or `#login`) and authenticated users to the seller dashboard (`/seller/home` / `#pos`).
- Integrate an operator session badge and logout trigger in `TopBar`.

**Non-Goals:**
- Connecting to a live Supabase project in this increment (the design prepares the adapter interface only).
- Complete password reset / recovery workflow (the "¿Olvidaste tu clave?" link displays an informational toast or placeholder modal).
- Multi-tier role permissions and supervisor overrides (scoped for subsequent increments).

## Decisions

### 1. Adapter Pattern for Authentication (`IAuthService`)
- **Choice**: Encapsulate credential verification and session fetching behind a typed TypeScript interface:
  ```typescript
  export interface IAuthService {
    login(credentials: { identifier: string; passKey: string; rememberDevice: boolean }): Promise<AuthSession>;
    logout(): Promise<void>;
    getCurrentSession(): Promise<AuthSession | null>;
  }
  ```
- **Rationale**: Keeps `LoginView` and `useAuth` decoupled from specific backend providers. When Supabase or another OAuth/JWT service is introduced, only a new `SupabaseAuthService` class implementing `IAuthService` needs to be provided.
- **Alternatives Considered**: Direct API calls or tightly coupling Supabase client inside React components. Rejected because it would complicate local development, testing, and offline POS capabilities.

### 2. Dual Storage Session Persistence Strategy
- **Choice**: If `"Recordar terminal"` is checked, write `AuthSession` to `localStorage` (`voltacc_pos_session_v1`). If unchecked, write to `sessionStorage` (`voltacc_pos_session_v1`). The initialization check checks `sessionStorage` first, then `localStorage`.
- **Rationale**: Shared POS terminals often require sessions to terminate when the browser window closes to avoid unauthorized usage by subsequent staff members, while dedicated single-operator devices benefit from persistence.
- **Alternatives Considered**: Always using `localStorage`. Rejected because it compromises security on multi-shift shared hardware.

### 3. Route Guarding via Reactive Hash Navigation
- **Choice**: Extend the existing hash-based navigation in `App.tsx` with an `isAuth` guard. If `!isAuthenticated`, `currentTab` is locked to `'login'`. When authentication succeeds, navigate to `'home'` / `'pos'`.
- **Rationale**: Respects the existing lightweight hash router architecture without introducing heavy routing dependencies while fulfilling the acceptance criteria.
- **Alternatives Considered**: Introducing `react-router-dom`. Rejected for this story to avoid changing the existing app architecture and breaking current tab states.

### 4. Visual Layout Architecture (Kinetic v4.2 System)
- **Choice**: Construct `LoginView.tsx` with a centered, elevation-shadowed card:
  - Top bar: Live terminal status pill (`Terminal #04 • Flagship Central`) and TLS badge (`TLS 1.3`).
  - Brand header: Register icon container, `Retail POS` headline, and `Acceso al Sistema • Kinetic v4.2` subtext.
  - Interactive inputs: Operator ID (`F1`) with user icon and clear action button; Password (`F2`) with lock icon and visibility toggle.
  - Controls: Custom checkbox for `"Recordar terminal"` and "¿Olvidaste tu clave?" link.
  - CTA button: Full-width high-contrast button `"Entrar al Sistema ->"`.
  - Footer: System telemetry status (`Nube Sincronizada`, `Ping 24ms`, `ID: KPOS-REG-04`).

## Risks / Trade-offs

- **[Risk] Client-side credential mock is inspectable**:
  - *Mitigation*: The `MockAuthService` is clearly segregated in `src/services/auth/` and marked as development/mock provider. Production configurations will swap the dependency injection to `SupabaseAuthService`.
- **[Risk] Hash conflicts with existing tabs**:
  - *Mitigation*: Add `'login'` to `NavigationTab` in `pos.ts` or as a distinct app-level route state (`auth` vs `operational`).
