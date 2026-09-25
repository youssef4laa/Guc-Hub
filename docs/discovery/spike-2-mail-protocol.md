# Spike 2 — Mail protocol and mail authentication

**Owner:** Track B. **Blocks:** the live `MailProvider` in `src/features/mail/`.

**Status: RESOLVED (2026-09-22).** GUC student mail is **on-premises Exchange
Server 2019**, not Microsoft 365. The transport decision is recorded in
[ADR B-001](../adr/B-001-mail-protocol.md): **Exchange Web Services**.
Authentication is still open and is shared with
[spike 1](spike-1-portal-auth.md) — see "What's still open".

## Findings

### Where the mail actually lives

| Check                                                                   | Result                                                                                                      |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Webmail login URL                                                       | `https://mail.guc.edu.eg/owa/auth/logon.aspx?replaceCurrent=1&url=...` — on-prem OWA, forms login           |
| `dig MX guc.edu.eg +short`                                              | `10 ironport.guc.edu.eg.` — self-hosted Cisco IronPort, **not** `*.mail.protection.outlook.com`             |
| `login.microsoftonline.com/guc.edu.eg/.well-known/openid-configuration` | Returns a valid tenant — GUC **does** have an Entra ID tenant                                               |
| Mail host vs. portal host                                               | `mail.guc.edu.eg`, separate from the portal host                                                            |
| Login format                                                            | Username only, no domain suffix (e.g. `firstname.lastname`) — **the same credential as the portal and CMS** |

**The Entra tenant is a red herring for mail.** GUC uses Entra ID for identity on
some web properties, but the MX record and the OWA login page both say the
mailboxes are hosted on GUC's own Exchange. So none of the Microsoft 365
blockers apply: no OAuth app registration, no admin consent for `Mail.Read`, and
the Exchange Online EWS retirement (October 2026 / April 2027) does not touch
on-premises Exchange.

### What the server says

Unauthenticated probes of the public endpoints. **No credentials were sent, and
none are recorded here or anywhere in the repo.**

```
Server: Microsoft-IIS/10.0
X-OWA-Version: 15.2.1748.10     → Exchange Server 2019 CU15 (February 2025)
X-FEServer: EXCH01
```

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

Three things follow:

1. **IMAP is not an option** — the ports aren't reachable, so the raw-socket
   plan is moot. (Probed from one off-campus network; if it turns out to be open
   on campus only, it's still useless for an app students use anywhere.)
2. **SMTP submission is not usable either**, which doesn't matter: EWS sends mail
   itself.
3. **The choice is a trade.** EWS is an easy protocol behind hard auth
   (NTLM/Negotiate only). ActiveSync is the reverse: Basic auth — the stored
   password would be enough — behind a WBXML binary protocol with no maintained
   JavaScript client. ADR B-001 takes EWS, because the auth problem has to be
   solved for the portal anyway, while an EAS implementation would be ours to own
   forever.

## What's still open

**Authentication, and it belongs to both tracks.** EWS offers only
Negotiate/NTLM, and NTLM authenticates a _connection_ rather than a request, so
React Native's `fetch` cannot drive the handshake reliably. The candidates are
the same ones [spike 1](spike-1-portal-auth.md) lists for the portal:

1. A native module (Expo Modules API) wrapping `NSURLSession` / `OkHttp`, both of
   which speak NTLM natively.
2. A hidden WebView that lets the OS network stack answer the challenge.

**Two NTLM implementations in one app would be indefensible.** Whatever Track A
lands for the portal should be reusable by mail, which makes this a `shared/`
conversation to have _before_ either side builds it.

Also still needed, and cheap once the above exists:

- Mail needs to read the stored credential. `useAuth` doesn't expose it today —
  the `needs-track-a` request in [track-b.md](../roadmap/track-b.md).
- Confirm the exact EWS `RequestServerVersion` to target by reading the server's
  response, rather than assuming from the CU.

## If the facts change

Re-run the probes if the webmail URL changes or GUC migrates to Exchange Online
(watch the MX record and `X-OWA-Version`). A migration to Microsoft 365 would
invalidate ADR B-001 entirely and bring back every constraint in the original
version of this spike: OAuth, admin consent, and the EWS retirement.
