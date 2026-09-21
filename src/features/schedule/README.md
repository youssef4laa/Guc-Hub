# `schedule`

Owner: Track A (portal). Source: GUCentral. Phase 0 reference slice — copy this
feature's shape, not `_template`'s, when in doubt about how the pieces fit together.

## What's real vs stubbed

- **Mock (`mock.ts`)**: a full fake weekly schedule, fully working end to end —
  next-class card, day list (phone) / week view (tablet), local class reminders.
- **Live (`live.ts` / `parser.ts`)**: stub. Throws `NOT_IMPLEMENTED` — nobody has
  seen the real schedule page yet.

## Blocked on

- **Spike 1** (auth) — can't fetch anything live without a working `LoginStrategy`.
- **Spike 3** (cookie/session handling) — needed once auth works, before the real
  fetch in `live.ts` can succeed.
- Capturing the real schedule page with the in-app "Capture page" tool, then
  `pnpm sanitize-fixture`, then writing the real `parser.ts` against it.

## Definition of done

- [x] Schema defined and exported
- [x] Mock source returns a realistic fake weekly schedule
- [x] Loading / empty / error / `PARSE_FAILED` states all render
- [x] `PARSE_FAILED` offers "Open original page"
- [x] Local class reminders scheduled from the fetched schedule
- [x] Week view (tablet) and day list (phone) via `useResponsiveLayout`
- [ ] Live source parses a real (sanitized) fixture — blocked, see above
- [ ] iOS + Android screenshots, light + dark
