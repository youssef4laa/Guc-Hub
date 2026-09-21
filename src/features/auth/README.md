# `auth`

Owner: shared (both tracks review changes here). Source: both Unimail and GUCentral
require the same GUC sign-in.

Deviates from the standard feature triad (see ADR S-003) in two ways:

1. There's no page to parse, so there's no `source.ts` / `live.ts` / `mock.ts` /
   `parser.ts` — just a login form.
2. The session itself — `AuthProvider` / `useAuth`, `selectLoginStrategy`, the
   `PortalSession` singleton — lives in **`core/portal`**, not here. Sign-in state is
   cross-cutting (settings needs `logout`, the root layout needs `isAuthenticated`
   for route guarding) exactly like theme/query, and the ESLint boundaries rule
   forbids one feature importing another's internals. This folder owns only the
   `LoginScreen` UI, which calls into `core/portal`'s `useAuth()`.

Credentials never leave `core/storage/secureStore.ts`.

## Blocked on

- **Spike 1** (docs/DISCOVERY.md): which real strategy (NTLM native module / JS NTLM
  over a socket / hidden WebView) GUC's portal actually needs. Until resolved, only
  `mock` is implemented; `ntlm` and `form` throw.

## Definition of done

- [x] Demo mode fully usable end to end
- [x] Credentials only ever touch `expo-secure-store`
- [x] Biometric unlock gated on stored credentials existing
- [ ] Real `LoginStrategy` (blocked on Spike 1)
- [ ] iOS + Android screenshots, light + dark
