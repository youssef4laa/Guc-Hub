# `settings`

Owner: Track B (mail & experience).

Deliberately real, not stubbed (see ADR-003) — sign-out and the theme toggle are
load-bearing for demo mode to be usable at all, so building this alongside
`auth`/`schedule` in the foundation was cheaper than stubbing it and immediately
un-stubbing it in phase 1.

## What's here

- Theme preference (system / light / dark), persisted via `core/storage/kv`.
- Sign out (routes back to `/login`).
- Dev-only link to the `/dev/ui` component gallery.
- The "unofficial app" notice (also required on first launch — see docs/ROADMAP.md).

## Not here yet

- Biometric toggle, notification preferences, cache-clearing — add as their owning
  features (auth, notifications, mail) need them.
