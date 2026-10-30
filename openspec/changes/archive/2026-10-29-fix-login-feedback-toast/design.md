# Design

## Context

In the current codebase (`src/context/AuthContext.tsx` and `src/App.tsx`), a single `isLoading` boolean governs both initial startup session restoration (`hydrate()`) and active login/logout actions (`login()`, `logout()`). Because `POSApp` in `src/App.tsx` checks `if (isLoading) return <SplashScreen />` before rendering `LoginView`, calling `login()` sets `isLoading = true` and immediately unmounts `LoginView`. When `authService.login()` rejects 250ms later and sets `isLoading = false`, React mounts a fresh `LoginView` instance, destroying component state (`identifier`, `errorMessage`) and mimicking a full browser page refresh. See `proposal.md` for motivation and `specs/ui/toast-notifications/spec.md` for behavioral requirements.

## Goals / Non-Goals

**Goals:**
- Prevent `LoginView` from unmounting when `login()` is in-flight so form state, focus refs, and error handlers remain mounted.
- Provide a top-level `ToastProvider` and `FloatingToast` component styled after the pill design reference (`rounded-full`, circular left icon badge, medium white typography, right `X` dismiss button) with `error` (red) and `success` (green) states.
- Ensure the green success toast survives the transition from `LoginView` to `HomeDashboardView` (`#seller/home`).

**Non-Goals:**
- Multi-stack notification queues (only one active floating pill toast is displayed at a time, replacing any prior active toast).
- Replacing existing modal dialogs (`ReceiptModal`, `PaymentModal`, `CustomerModal`).

## Decisions

### 1. Split Initial Hydration State from Login Action State in `AuthContext`
- **Choice**: Keep `isLoading` in `AuthContext` strictly for initial startup session hydration (`hydrate()`). Manage in-flight submission status locally inside `LoginView` (e.g., `isSubmitting`) or via a separate `isAuthenticating` state that does not trigger the full-screen splash guard in `App.tsx`.
- **Rationale**: `App.tsx` only needs to block route rendering during initial session hydration on page load. Keeping `isLoading` false during `login()` guarantees `LoginView` stays mounted throughout the authentication lifecycle.
- **Alternatives Considered**:
  - *Storing failed login error in `AuthContext`*: Even if error were stored in context, unmounting and remounting `LoginView` would still wipe the local `identifier` input state and cause a jarring screen flash.

### 2. Application-Level `ToastProvider` Mounted Above Route Views
- **Choice**: Create `src/context/ToastContext.tsx` and `src/components/FloatingToast.tsx`, mounting `ToastProvider` at the top level in `src/App.tsx` wrapping `POSApp`.
- **Rationale**: When login succeeds, `LoginView` unmounts as `POSApp` transitions to `#seller/home`. A toast mounted locally inside `LoginView` would unmount immediately upon login success. Hosting the toast layer in `ToastProvider` above the view switch allows both the red error toast (on `/login`) and the green success toast (across `/login` -> `#seller/home`) to animate smoothly and persist for their full 4000ms duration.
- **Alternatives Considered**:
  - *Local state inside `LoginView` with delayed navigation*: Delaying navigation after successful login just to show a toast adds artificial latency to POS checkout operations.

### 3. Floating Pill Visual Geometry & Animation (`motion/react`)
- **Choice**: Use `AnimatePresence` and `motion.div` from `motion/react` with fixed top-center positioning (`fixed top-6 left-1/2 -translate-x-1/2 z-50`), pill geometry (`rounded-full px-5 py-2.5`), and semantic variants:
  - `error`: `bg-red-500 dark:bg-red-600 text-white shadow-lg shadow-red-500/30` with `AlertCircle` inside `bg-white/20 rounded-full`.
  - `success`: `bg-emerald-600 text-white shadow-lg shadow-emerald-600/30` with `CheckCircle2` inside `bg-white/20 rounded-full`.
- **Rationale**: Matches the reference image pixel-for-pixel while leveraging packages already installed in `package.json` (`motion`, `lucide-react`, `tailwindcss`).

## Risks / Trade-offs

- **[Risk] Rapid repeated form submissions creating overlapping timers** → **Mitigation**: Clear any existing `setTimeout` ref inside `showToast` before scheduling a new 4000ms auto-dismiss timer, and disable the submit button while `isSubmitting` is true.
- **[Risk] `Escape` key closing both an active modal and the toast** → **Mitigation**: The toast `Escape` listener only dismisses the active toast without preventing default modal handling if needed, or cleanly clears the toast state.

