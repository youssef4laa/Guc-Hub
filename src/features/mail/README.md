# `mail`

Owner: Track B (mail & experience). Source: Unimail.

Stub only — manifest.enabled is `false`. Live source throws `NOT_IMPLEMENTED`; mock
source returns placeholder fake data so the app still boots in demo mode with this
feature visible.

## Blocked on

Spike 2 (mail protocol: IMAP/SMTP vs Exchange EWS vs Microsoft Graph, and whether the email login differs from the portal login) and Spike 4 confirmation for HTML parsing in Hermes. Rendering must use a WebView with JavaScript disabled and remote content blocked by default (see docs/DISCOVERY.md).

## Definition of done

- [ ] Schema defined and exported
- [ ] Mock source returns realistic fake data
- [ ] Live source parses at least one real (sanitized) fixture, with a passing test
- [ ] Loading / empty / error / `PARSE_FAILED` states all render
- [ ] `PARSE_FAILED` offers "Open original page"
- [ ] iOS + Android screenshots, light + dark
- [ ] Screen-reader labels on interactive elements
- [ ] `manifest.enabled` flipped to `true`
