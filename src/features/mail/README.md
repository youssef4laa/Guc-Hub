# `mail`

Owner: Track B (mail & experience). Source: Unimail.

Phases 1 and 2 are built and run entirely on mock data. `manifest.enabled` stays `false`
until the owner approves it, so it ships merged-safe: reachable from "More" in a
dev build, absent from the tab bar.

## Status as of 22 September 2026 — read this first

**Code-complete, and not once run on a device or a simulator.** Phase 1 (list,
read, search, sort, safe HTML) and phase 2 (compose, attachments,
swipe-to-delete with undo, share, multi-select) are finished and the 171 unit
tests pass, but every one of those tests is a Node test of pure logic. No part of
this UI has rendered on real hardware.

Treat anything that only a device can exercise as unverified:

- the swipe gesture and its undo window (`ReanimatedSwipeable`),
- the document picker, the OS share sheet, and writing attachment bytes to the
  app cache,
- `KeyboardAvoidingView` in compose — the layout most likely to be wrong,
- draft autosave against a real SQLite database rather than the fail-soft stubs,
- every accessibility affordance: labels, the delete action, the undo
  announcement,
- the two-pane tablet layout.

What the unit tests _do_ cover is the part that would be dangerous to get wrong:
HTML and CSS sanitizing against a hostile fixture, the navigation policy,
attachment filename and type classification, recipient parsing, draft validation,
selection maths, sorting, and reminder planning.

**Why it is untested:** local iOS builds fail before the app starts. Under the
iOS 27 SDK, UIKit terminates any app that hasn't adopted the scene lifecycle, and
Expo SDK 57 keeps that adoption behind an opt-in. The fix is two commits on
`shared/ios-scene-lifecycle` (`expo-build-properties` with
`ios.enableSceneSupport`, plus the EAS project id that cloud builds need) and is
awaiting review. Nothing on this branch causes or can fix that — it is app-wide
native config in shared files.

**This is still safe to merge.** `manifest.enabled` is `false`, so none of it is
reachable from the tab bar; it changes no shared file and no Track A path. It
should not be enabled for anyone until it has been driven on a device.

**The live transport is decided.** [ADR A-001](../../../docs/adr/A-001-portal-auth.md)
makes `ntlmRequest` (`src/core/portal/ntlm/`) the one NTLM transport for both
the portal and mail, and its JS side is on `main`. It reads the stored
credential itself, so mail never handles the password and needs nothing from
`useAuth`; it also enforces the host allowlist and https on every hop. That
settles the two follow-ups [ADR B-001](../../../docs/adr/B-001-mail-protocol.md)
left open. `EwsMailProvider` can now be written against `ntlmRequest`, but it
can't run until the native half (`modules/guc-ntlm`) exists; until then
`ntlmRequest` throws `NOT_IMPLEMENTED`. None of this blocks this branch.

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
- `attachments/` — writes a downloaded attachment into the app's cache and hands
  it to the OS share sheet.

## Phase 2

- **Compose** (`screens/ComposeScreen.tsx`): to/cc/bcc, subject, body, and an
  attachment picker (`expo-document-picker`). Drafts autosave to SQLite 800ms
  after typing stops and again on unmount; an untouched draft is never written.
  `logic/recipients.ts` and `logic/draft.ts` hold the parsing and validation.
- **Attachments**: tapping one downloads it, caches it under a sanitised name and
  opens the share sheet — after a confirmation that warns about executables and
  double extensions. Nothing is ever opened or executed by the app.
- **Swipe to delete** with a six-second undo bar, backed by the provider's
  `deleteMessages`/`undoDelete`. Delete is also an accessibility action, since a
  swipe isn't reachable with a screen reader.
- **Share** a message as plain text (never its untrusted HTML).
- **Multi-select**: long-press to enter, bulk delete and bulk mark read/unread.
  The selection is derived from the visible list, so a message that disappears in
  a refresh drops out of it.

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
- Drafts are local only: there is no "Drafts" folder view yet, and drafts are
  never synced to the server (`listDrafts` exists but nothing lists them).
- Compose can't reply or forward yet, and sends plain text only.
- Attachments open through the share sheet rather than an in-app preview.

## Blocked on

- **[Spike 2](../../../docs/discovery/spike-2-mail-protocol.md) is resolved:**
  mail is on-premises Exchange 2019, and the transport is EWS
  ([ADR B-001](../../../docs/adr/B-001-mail-protocol.md)).
- **The NTLM transport is decided but not yet runnable.** The EWS endpoint
  offers only Negotiate/NTLM, which React Native's `fetch` cannot drive.
  [ADR A-001](../../../docs/adr/A-001-portal-auth.md) settles this with one
  shared transport, `ntlmRequest` in `src/core/portal/ntlm/`, whose JS side is
  on `main`. The remaining blocker is its native module, `modules/guc-ntlm/`,
  which Track A has not built yet; until it exists `ntlmRequest` throws
  `NOT_IMPLEMENTED` and `live.ts` stays a stub.

## Definition of done

- [x] Schema defined and exported from `schema.ts`
- [x] Mock source returns realistic (but fake) data
- [x] Loading / empty / error / cached-fallback states all render
- [x] Untrusted HTML rendering is sanitized, CSP'd, JS-disabled, and tested
- [x] Screen-reader labels on interactive elements _(written, never heard)_
- [x] Two-pane layout on tablets, single pane on phones _(never rendered)_
- [ ] Run on a device or simulator — blocked, see "Status" above
- [ ] Live provider (blocked on Spike 2)
- [ ] iOS + Android screenshots, light + dark
- [ ] `manifest.enabled` flipped to `true` (needs owner approval)
