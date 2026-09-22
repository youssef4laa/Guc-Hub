# `mail`

Owner: Track B (mail & experience). Source: Unimail.

Phase 1 is built and runs entirely on mock data. `manifest.enabled` stays `false`
until the owner approves it, so it ships merged-safe: reachable from "More" in a
dev build, absent from the tab bar.

## Shape

This feature deviates from the `_template` triad: there is no `parser.ts`,
because mail is an API/protocol, not an HTML page to scrape. The seam is a
`MailProvider` instead.

- `provider.ts` — the protocol-neutral interface (folders, paged list, get,
  search, mark read, delete/undo, send with attachments).
- `mock.ts` — `MockMailProvider`, backed by `fixtures/mail/mock-mailbox.json`.
  In-memory and mutable for the app session, so reads/deletes/sends behave like a
  real mailbox until restart. Fixture dates are rebased so the newest message is
  always recent.
- `live.ts` — throws `NOT_IMPLEMENTED` until Spike 2 picks the protocol.
- `source.ts` — demo mode picks mock, otherwise live. Screens only call this.
- `schema.ts` — zod schemas; `logic/` — pure sorting, text and formatting
  helpers; `cache/` — the local SQLite cache; `store.ts` — TanStack Query hooks.
- `security/` — see below. `components/`, `screens/`, `hooks/` — UI.

## Rendering untrusted email safely

Email is attacker-controlled content. Three independent layers, each tested:

1. **`security/sanitizeHtml.ts`** removes scripts, frames, objects, forms,
   inputs, svg, `meta refresh`, `base`, every `on*` handler, and every unsafe URL
   scheme. It sanitizes CSS too (`@import`, `expression()`, behaviours,
   `url()`), including tricks that hide a URL behind a comment or a CSS escape.
   It never throws: if parsing fails, the body comes back empty rather than raw.
2. **The WebView** (`components/SafeEmailView.tsx`) runs with JavaScript
   disabled, no cookies, no storage, no file access, and `incognito`. Note
   `originWhitelist={["*"]}`: react-native-webview hands any URL _outside_ the
   whitelist straight to `Linking.openURL` without asking, so allowing everything
   through the whitelist is what routes navigation into our own handler.
3. **A Content-Security-Policy** (`security/emailDocument.ts`) on the generated
   document: `default-src 'none'`, images limited to `data:` unless the reader
   allowed remote content for that message.

**Remote content is blocked by default** — remote images are how senders track
opens, IPs and read times. "Load images" is per message and never persists.
**Links never navigate on their own**: `security/navigationPolicy.ts` allows only
our own document, and http(s)/mailto links open externally only after the reader
confirms a dialog showing the real destination host and full URL.

## Local cache

`migrations.ts` (version 1) creates `mail_summaries` and `mail_messages`;
`cache/mailCache.ts` reads and writes them. The cache is an optimisation only:
every call fails soft to "nothing cached", and rows that don't match the current
schema are dropped rather than trusted. The list shows cached messages instantly,
then refreshes; the reader falls back to the cached copy when the provider can't
be reached.

## Known gaps

- **The cache is not cleared on sign-out.** Sign-out lives in `core/portal` /
  `settings`, and features may not import each other, so this needs either a
  logout hook in `core/portal` or a `core/storage` "clear feature data" API —
  a shared change, requested in `docs/roadmap/track-b.md`. Only fake demo data is
  cached today.
- Mail queries are also persisted by the shared TanStack AsyncStorage persister,
  so bodies would be stored twice once mail is live. Needs a `shared/` change to
  let a feature opt out of persistence.
- Attachments are listed but can't be opened yet (phase 2).
- Compose, swipe-to-delete with undo, share and multi-select are phase 2. The
  provider already defines `send`, `deleteMessages` and `undoDelete`, with tests.

## Blocked on

- **[Spike 2](../../../docs/discovery/spike-2-mail-protocol.md) is resolved:**
  mail is on-premises Exchange 2019, and the transport is EWS
  ([ADR B-001](../../../docs/adr/B-001-mail-protocol.md)).
- **Still blocked on NTLM authentication.** The EWS endpoint offers only
  Negotiate/NTLM, which React Native's `fetch` cannot drive; the mechanism is
  shared with Track A's spike 1 and must not be implemented twice. Until it
  exists, `live.ts` stays a stub.

## Definition of done

- [x] Schema defined and exported from `schema.ts`
- [x] Mock source returns realistic (but fake) data
- [x] Loading / empty / error / cached-fallback states all render
- [x] Untrusted HTML rendering is sanitized, CSP'd, JS-disabled, and tested
- [x] Screen-reader labels on interactive elements
- [x] Two-pane layout on tablets, single pane on phones
- [ ] Live provider (blocked on Spike 2)
- [ ] iOS + Android screenshots, light + dark
- [ ] `manifest.enabled` flipped to `true` (needs owner approval)
