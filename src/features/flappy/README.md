# `flappy`

Owner: Track B (mail & experience). Source: GUCentral (replaces the Dino game).

Stub only — manifest.enabled is `false`. Live source throws `NOT_IMPLEMENTED`; mock
source returns placeholder fake data so the app still boots in demo mode with this
feature visible.

## Blocked on

None for the on-device game itself. The shared seasonal leaderboard needs a small opt-in backend — deliberately out of scope for this foundation (see docs/ROADMAP.md). Must use original name/art/sound, never Flappy Bird's.

## Definition of done

- [ ] Schema defined and exported
- [ ] Mock source returns realistic fake data
- [ ] Live source parses at least one real (sanitized) fixture, with a passing test
- [ ] Loading / empty / error / `PARSE_FAILED` states all render
- [ ] `PARSE_FAILED` offers "Open original page"
- [ ] iOS + Android screenshots, light + dark
- [ ] Screen-reader labels on interactive elements
- [ ] `manifest.enabled` flipped to `true`
