# `transcript`

Owner: Track A (portal). Source: GUCentral.

Stub only — manifest.enabled is `false`. Live source throws `NOT_IMPLEMENTED`; mock
source returns placeholder fake data so the app still boots in demo mode with this
feature visible.

## Blocked on

Spike 1, Spike 3, and Spike 6 (detecting a locked transcript vs. a parse failure) — a locked transcript must never be reported as PARSE_FAILED.

## Definition of done

- [ ] Schema defined and exported
- [ ] Mock source returns realistic fake data
- [ ] Live source parses at least one real (sanitized) fixture, with a passing test
- [ ] Loading / empty / error / `PARSE_FAILED` states all render
- [ ] `PARSE_FAILED` offers "Open original page"
- [ ] iOS + Android screenshots, light + dark
- [ ] Screen-reader labels on interactive elements
- [ ] `manifest.enabled` flipped to `true`
