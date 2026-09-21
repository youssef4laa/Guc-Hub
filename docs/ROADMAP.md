# Roadmap

Per-track detail lives in its own file so both tracks can edit their own roadmap
without touching a shared one: [roadmap/track-a.md](roadmap/track-a.md) (Portal),
[roadmap/track-b.md](roadmap/track-b.md) (Mail & Experience). This file holds
only what's genuinely shared: phase 0, and what's permanently out of scope.

## Phase 0 (shared, built in the foundation)

| Feature                                                                       | Owner                                                                    | Status                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| auth: login, stored credentials, silent re-login, biometric unlock, demo mode | shared                                                                   | **Built** (mock strategy only — see [DISCOVERY](DISCOVERY.md) Spike 1) |
| settings (theme, sign out, unofficial notice)                                 | Track B, built early (see [ADR S-003](adr/S-003-feature-conventions.md)) | **Built**                                                              |

## Deliberately out of scope for this foundation

- **Real push notifications.** There is no backend, so no APNs/FCM. What we have:
  local notifications scheduled from on-device data, and best-effort background
  refresh (`expo-background-task`) that iOS runs opportunistically, not on a
  schedule. Never promise "instant new-mail alerts" anywhere in the UI copy.
- **The Flappy leaderboard's backend.** The game itself (including a personal best)
  is fully on-device. A shared seasonal leaderboard needs a small opt-in backend —
  a managed service (e.g. a serverless function + a tiny database) that receives
  **only a score and a display name the student chooses**, never credentials or any
  portal data. Build this only once the on-device game is solid.
- **Any real live parser.** Every feature ships mock-first; live parsers get written
  against sanitized fixtures captured with the in-app tool, one at a time, gated on
  the DISCOVERY spikes that unblock them (see each feature's README).

## Adding to the roadmap

A row that's genuinely shared (affects both tracks, or is core infrastructure)
goes here. Everything else goes in your own track's file.
