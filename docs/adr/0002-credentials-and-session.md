# ADR-002: Credential storage and session model

## Status

Accepted

## Context

Guc Hub stores a real GUC password on the student's device, with no server to fall
back on for session management. This is the single highest-risk part of the app.

## Decision

- **Credentials live only in the OS secure store** (`expo-secure-store`: iOS
  Keychain / Android Keystore), behind exactly one module,
  `src/core/storage/secureStore.ts`. No other file reads or writes them. Biometric
  "reveal my password" (`expo-local-authentication`) gates the one place they're
  ever re-displayed to the user.
- **A `LoginStrategy` interface decouples the auth _mechanism_ from everything else**
  (`src/core/portal/LoginStrategy.ts`). `MockLoginStrategy` is real; `NtlmLoginStrategy`
  and `FormLoginStrategy` are stubs pending DISCOVERY Spike 1. Nothing outside
  `core/portal` needs to know which one is active.
- **A single `PortalSession` per app run** owns the live cookie/session state and
  handles expiry once, centrally: on `SESSION_EXPIRED`, it silently re-logs in from
  the stored credentials and retries the failed request exactly once before
  surfacing the error (which the UI maps to a redirect to `/login`). No feature
  implements its own retry-on-401 logic.
- **The session/auth state (`AuthProvider`/`useAuth`) lives in `core/portal`, not in
  the `auth` feature folder.** It's cross-cutting — `settings` needs `logout()`, the
  root layout needs `isAuthenticated` for route guarding — and the ESLint boundaries
  rule forbids one feature importing another's internals. `src/features/auth/` owns
  only the login screen UI. (This is also recorded in ADR-003 as a template
  deviation.)
- **A redaction wrapper on every logger call** (`core/logging/redact.ts`) strips
  anything shaped like a password, token, or cookie before it can reach a log line,
  as defense in depth against a future accidental `console.log(credentials)`.
- **The network allowlist is a separate, independent safeguard** (ADR-001's
  `core/http`): even if a bug somehow produced the wrong URL, `gucFetch` refuses any
  host not explicitly configured.

## Consequences

- Every feature that needs authenticated data goes through `PortalSession` via
  `core/http`, not its own fetch logic — this is enforced by the ESLint
  `no-restricted-globals` rule on `fetch`.
- "Try demo" and `EXPO_PUBLIC_MODE=mock` both route through `MockLoginStrategy`,
  which never touches SecureStore for a real credential (it accepts anything and
  returns a synthetic session), so the store-review "Try demo" flow can never leak
  a real password even by accident.
