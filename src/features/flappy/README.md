# `flappy` ("Glide")

Owner: Track B (mail & experience). Status: **built, enabled.**

A small on-device tap-to-flap game with an original name and art (not Flappy
Bird's). Nothing leaves the phone: the personal best is stored locally through
`core/storage/kv`.

- `game.ts` — pure, React-free game logic (physics, pipe spawning, collision,
  scoring), unit-tested in `__tests__/game.test.ts`.
- `screens/FlappyScreen.tsx` — a `requestAnimationFrame` loop rendering plain
  `View`s.
- The shared seasonal leaderboard was **not built**; it needs a backend, which is
  out of scope (see `docs/ROADMAP.md`).
