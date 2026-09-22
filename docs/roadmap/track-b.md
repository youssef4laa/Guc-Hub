# Roadmap — Track B (Mail & Experience)

| Feature                                                                 | Source                    | Phase | Status                                                                                |
| ----------------------------------------------------------------------- | ------------------------- | ----- | ------------------------------------------------------------------------------------- |
| mail: list, read, search, sort, safe HTML rendering                     | Unimail                   | 1     | **Built on mock data** behind `enabled: false`; live provider blocked on Spike 2      |
| mail: compose, attachments, swipe-delete with undo, share, multi-select | Unimail                   | 2     | Stub                                                                                  |
| local reminders (exams, custom events) + best-effort background refresh | —                         | 2     | Class reminders already built under `schedule` (Track A); exams/custom events not yet |
| home-screen widgets (WidgetKit / Glance)                                | GUCentral                 | 3     | Not started — see [spike-widgets.md](../discovery/spike-widgets.md)                   |
| flappy game (on-device, personal best)                                  | GUCentral (replaces Dino) | 3     | Stub                                                                                  |
| offline polish, Arabic/RTL, tablet layouts                              | new                       | 3     | Responsive layout hook built; RTL/offline polish not yet                              |

## Shared changes this track needs

Both are small `shared/` PRs, to be announced and reviewed before they land
(see [PARALLEL_WORK.md](../PARALLEL_WORK.md)). Neither blocks phase 1, because
only fake demo data is cached today:

1. **Clear feature data on sign-out.** `core/portal`'s `logout()` has no hook, so
   the mail cache (and the persisted TanStack cache) survive signing out. Needs a
   logout hook in `core/portal` or a "clear feature data" API in `core/storage`.
2. **Let a feature opt out of the persisted query cache.** `core/query` persists
   every successful query to AsyncStorage; mail already caches bodies in SQLite,
   so once it is live they would be stored twice.

See [docs/DISCOVERY.md](../DISCOVERY.md) for the spikes blocking mail (Spike 2)
and background refresh (Spike 5), and [docs/ROADMAP.md](../ROADMAP.md) for the
shared phase-0 rows (`auth`, `settings`) and what's deliberately out of scope
(including why the Flappy leaderboard's backend isn't in this list).
