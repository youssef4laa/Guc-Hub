# ADR B-001: Mail transport — Exchange Web Services against on-premises Exchange

## Status

Accepted (transport). The **authentication mechanism is deliberately left open**
and is shared with Track A's [spike 1](../discovery/spike-1-portal-auth.md) — see
"Consequences".

Date: 2026-09-22. Track B.

## Context

[Spike 2](../discovery/spike-2-mail-protocol.md) is resolved. GUC student mail is
**on-premises Exchange**, not Microsoft 365:

| Evidence                                                    | Reading                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| Webmail is `https://mail.guc.edu.eg/owa/auth/logon.aspx`    | On-prem OWA with forms-based authentication                |
| `dig MX guc.edu.eg` → `ironport.guc.edu.eg`                 | Self-hosted Cisco IronPort gateway, not `*.outlook.com`    |
| `Server: Microsoft-IIS/10.0`, `X-FEServer: EXCH01`          | GUC-run Exchange front end                                 |
| `X-OWA-Version: 15.2.1748.10`                               | Exchange Server 2019 CU15 (released February 2025)         |
| `login.microsoftonline.com/guc.edu.eg/...` returns a tenant | GUC has an Entra ID tenant, but it is not where mail lives |

This matters because **every Microsoft 365 constraint from the spike falls away**:
Basic auth removal, admin consent for `Mail.Read`, and the EWS retirement (which
applies only to Exchange Online — Microsoft states no changes are being made to
EWS in on-premises Exchange). None of them apply here.

Unauthenticated probes of the public endpoints (no credentials were sent, and
none are stored anywhere) show which doors are actually open:

| Endpoint                         | Status | `WWW-Authenticate`                |
| -------------------------------- | ------ | --------------------------------- |
| `/EWS/Exchange.asmx`             | 401    | Negotiate, NTLM — **no Basic**    |
| `/Autodiscover/Autodiscover.xml` | 401    | Negotiate, NTLM, **Basic**        |
| `/Microsoft-Server-ActiveSync`   | 401    | **Basic only**                    |
| `/mapi/emsmdb`                   | 401    | Negotiate, NTLM                   |
| `/owa/`                          | 302    | Forms-based login page            |
| IMAP 993 / 143                   | —      | Closed or filtered                |
| SMTP 587                         | open   | `421 4.3.2 Service not available` |
| SMTP 465                         | open   | TLS handshake did not complete    |

So the real choice is a trade: **EWS gives an easy protocol behind hard
authentication; ActiveSync gives easy authentication behind a hard protocol.**

## Decision

**Use Exchange Web Services (SOAP over HTTPS) at
`https://mail.guc.edu.eg/EWS/Exchange.asmx` as the mail transport**, implemented
as an `EwsMailProvider` behind the existing `MailProvider` interface, entirely
inside `src/features/mail/`.

Every operation the interface already defines maps onto a documented EWS call,
which is the main reason for choosing it:

| `MailProvider`   | EWS                                                                    |
| ---------------- | ---------------------------------------------------------------------- |
| `listFolders`    | `FindFolder` on `msgfolderroot`                                        |
| `listMessages`   | `FindItem` + `IndexedPageItemView` (offset = our cursor) + `SortOrder` |
| `getMessage`     | `GetItem` with `BodyType: HTML` and attachment metadata                |
| `search`         | `FindItem` with an AQS `QueryString`                                   |
| `markRead`       | `UpdateItem` setting `IsRead`                                          |
| `deleteMessages` | `MoveItem` to `deleteditems` (so undo is a `MoveItem` back)            |
| `send`           | `CreateItem` with `MessageDisposition: SendAndSaveCopy`                |

Note that EWS also **sends** mail, so the blocked SMTP submission ports do not
matter.

### Rejected alternatives

- **IMAP + SMTP.** Ports 993/143 are closed from the public internet, so this is
  not available at all. It would also have needed a native TCP socket library.
  (Caveat: probed from one off-campus network; if IMAP turns out to be reachable
  from the campus network only, it is useless for an app students use anywhere.)
- **ActiveSync (EAS).** Tempting because it is the one endpoint advertising Basic
  auth, so the stored password would be enough. Rejected because EAS is a
  WBXML-encoded binary protocol with no maintained JavaScript client: we would be
  writing and owning a protocol implementation permanently, to dodge an
  authentication problem we have to solve anyway for the portal. It stays the
  fallback if EWS authentication proves impossible.
- **MAPI/HTTP.** Same NTLM requirement as EWS, with a far more complex and less
  documented protocol. No advantage.
- **Scraping the OWA session.** Fragile across cumulative updates, relies on
  internal endpoints and canary tokens, and is the option most likely to break
  silently or be considered abuse. Last resort only.
- **Asking GUC IT to enable Basic auth on the EWS virtual directory.** This would
  make everything trivial, but Basic sends the password on every single request
  and weakening a university's mail server to suit our app is the wrong ask. Not
  pursued.

## Consequences

- **Authentication is the open problem, and it is not ours alone.** EWS offers
  only Negotiate/NTLM. NTLM authenticates a _connection_, not a request, so
  React Native's `fetch` cannot drive the handshake reliably. The candidates are
  exactly those in [spike 1](../discovery/spike-1-portal-auth.md): a native
  module wrapping `NSURLSession`/`OkHttp` (both speak NTLM natively), or a hidden
  WebView that lets the OS network stack answer the challenge. **Two NTLM
  implementations in one app would be indefensible**, so whichever Track A lands
  for the portal should be reusable by mail. That is a `shared/` conversation to
  have before either side builds it, not something Track B decides alone.
- Until that exists, `live.ts` stays a stub and mail runs on `MockMailProvider`.
  The phase-1 UI is already complete and needs no changes when the provider
  lands.
- **The credential is the same one the portal uses** (username without a domain
  suffix, e.g. `firstname.lastname`), so mail needs no second login — but it does
  need read access to the stored credential, which `useAuth` does not currently
  expose. That is the `needs-track-a` request already noted in
  `docs/roadmap/track-b.md`.
- `mail.guc.edu.eg` is already declared in `src/features/mail/hosts.ts` via
  `EXPO_PUBLIC_GUC_MAIL_HOST`, so the allowlist needs only that env value set.
- **Parsing SOAP means an XML parser.** `node-html-parser` is not one.
  `fast-xml-parser` is pure JavaScript (no native code, so no dev-client
  rebuild), but it is still a dependency and belongs in its own
  `shared/deps-fast-xml-parser` PR.
- EWS is versioned: requests must declare a `RequestServerVersion`. Target
  `Exchange2013` or later for a 2019 CU15 server, and treat the server version as
  something to detect rather than assume.
- Exchange 2019 is near the end of its support life and GUC will eventually move
  to Exchange Server SE. EWS continues on-premises, so this decision survives that
  upgrade; the `X-OWA-Version` header is worth re-checking afterwards.
