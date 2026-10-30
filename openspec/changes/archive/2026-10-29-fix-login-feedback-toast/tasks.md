# Tasks

## 1. Floating Pill Toast Notification System

- [x] 1.1 Create `src/components/FloatingToast.tsx` implementing the pill-shaped floating toast (`rounded-full`, top-center fixed positioning, `motion/react` `AnimatePresence` entrance/exit animations, circular `AlertCircle` icon for `error` in red and `CheckCircle2` for `success` in emerald green, `role="alert"`, and `X` dismiss button) and verify `npm run lint` passes with zero TypeScript errors.
- [x] 1.2 Create `src/context/ToastContext.tsx` exposing `ToastProvider` and `useToast()` hook (`showToast`, `dismissToast`, 4000ms auto-dismiss timer with cleanup on re-trigger/unmount, and `Escape` key dismissal) and verify `npm run lint` passes.
- [x] 1.3 Wrap the application tree in `src/App.tsx` with `ToastProvider` above route/view switching so active toasts survive navigation between `LoginView` and `#seller/home`, and verify `npm run build` succeeds.

## 2. Authentication Hydration Fix & Login Feedback Integration

- [x] 2.1 Update `src/context/AuthContext.tsx` so `isLoading` is only `true` during initial startup session hydration (`hydrate()`) and is not toggled to `true` during `login()` or `logout()`, preventing `App.tsx` from unmounting `LoginView` on failed login attempts, and verify `npm run lint` passes.
- [x] 2.2 Update `src/components/LoginView.tsx` to track local `isSubmitting` state, trigger a red error toast via `useToast()` on failed authentication with the specific rejection message while retaining `identifier`, clearing `passKey`, and focusing `passKeyInputRef`, and trigger a green success toast on valid login before navigating to `#seller/home`; verify with `npm run lint` and `npm run build`.

