# Roadmap

## Phases

| Feature                                                                          | Source                    | Track  | Phase                        | Status                                                        |
| -------------------------------------------------------------------------------- | ------------------------- | ------ | ---------------------------- | ------------------------------------------------------------- |
| auth: login, stored credentials, silent re-login, biometric unlock, demo mode    | both                      | shared | 0                            | **Built** (mock strategy only — see DISCOVERY Spike 1)        |
| schedule (week/day view, "next class", local reminders)                          | GUCentral                 | A      | 0 (reference slice), then 1  | **Built in mock mode**; live is a stub                        |
| settings (theme, sign out, unofficial notice)                                    | —                         | B      | 0 (built early, see ADR-003) | **Built**                                                     |
| grades (colour-coded, custom names, weights)                                     | GUCentral                 | A      | 1                            | Stub                                                          |
| mail: list, read, search, sort, safe HTML rendering                              | Unimail                   | B      | 1                            | Stub                                                          |
| transcript (filter by year, locked detection)                                    | GUCentral                 | A      | 2                            | Stub                                                          |
| cms (filter by type, unseen count, in-app open)                                  | GUCentral                 | A      | 2                            | Stub                                                          |
| exams, attendance, staff contacts                                                | GUCentral                 | A      | 2                            | Stub                                                          |
| mail: compose, attachments, swipe-delete with undo, share, multi-select          | Unimail                   | B      | 2                            | Stub                                                          |
| evaluations (fast submit)                                                        | GUCentral                 | A      | 2                            | Stub                                                          |
| local reminders (classes, exams, custom events) + best-effort background refresh | both                      | B      | 2                            | Class reminders built (schedule); exams/custom events not yet |
| home-screen widgets (WidgetKit / Glance)                                         | GUCentral                 | B      | 3                            | Not started                                                   |
| flappy game (on-device, personal best)                                           | GUCentral (replaces Dino) | B      | 3                            | Stub                                                          |
| offline polish, Arabic/RTL, tablet layouts                                       | new                       | B      | 3                            | Responsive layout hook built; RTL/offline polish not yet      |

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
