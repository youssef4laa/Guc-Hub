# `exams`

Owner: Track A (portal). Source: GUCentral.

Stub only — manifest.enabled is `false`. Live source throws `NOT_IMPLEMENTED`; mock
source returns placeholder fake data so the app still boots in demo mode with this
feature visible.

## Blocked on

Spike 1 and Spike 3.

## Definition of done

- [ ] Schema defined and exported
- [ ] Mock source returns realistic fake data
- [ ] Live source parses at least one real (sanitized) fixture, with a passing test
- [ ] Loading / empty / error / `PARSE_FAILED` states all render
- [ ] `PARSE_FAILED` offers "Open original page"
- [ ] iOS + Android screenshots, light + dark
- [ ] Screen-reader labels on interactive elements
- [ ] `manifest.enabled` flipped to `true`
