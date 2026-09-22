# Spike 2 — Mail protocol and mail authentication

**Owner:** Track B. **Blocks:** the live `MailProvider` in `src/features/mail/`.

Phase-1 mail (list, read, search, sort, safe HTML rendering) is already built and
runs on `MockMailProvider`, so **this spike blocks only the live provider**, not
the UI. Nothing below may be guessed at and written into product code: land the
findings here first, then implement, then record the decision in
`docs/adr/B-001-mail-protocol.md`.

## The questions

1. **Where does GUC student mail actually live?** Microsoft 365 / Exchange
   Online, an on-premises Exchange server, or a plain IMAP/SMTP server?
2. **Is the mail login the same as the portal login?** Same username shape (email
   address vs. student ID), same password, same host?
3. If it is Microsoft 365: **can a student consent to a third-party app reading
   their mailbox, or does the tenant require an admin to approve it?**

## Why the answer decides everything

The facts below were checked on 2026-09-22 and are dated, because this area is
changing fast. Re-check them if this spike sits unresolved for more than a month.

- **Basic authentication (plain username + password) is already gone for IMAP,
  POP, EWS and ActiveSync in Exchange Online.** Microsoft removed it for those
  protocols; SMTP AUTH is the last holdout and is disabled by default for
  existing tenants at the end of December 2026, with final removal announced for
  the second half of 2027.
  ([Microsoft Learn: deprecation of Basic auth](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/deprecation-of-basic-authentication-exchange-online),
  [SMTP AUTH timeline update](https://techcommunity.microsoft.com/blog/exchange/updated-exchange-online-smtp-auth-basic-authentication-deprecation-timeline/4489835))
  → If GUC is on Microsoft 365, **"just send the student's password over IMAP"
  cannot work.** OAuth 2.0 is the only route.
- **EWS is being retired in Exchange Online.** It is blocked from 1 October 2026
  unless the tenant sets `EWSEnabled=True` with an app-ID allow list, and access
  is permanently removed after 1 April 2027. On-premises Exchange is unaffected.
  ([Microsoft Learn: deprecation of EWS](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/deprecation-of-ews-exchange-online),
  [EWSAllowedAppIDs](https://techcommunity.microsoft.com/blog/exchange/introducing-ewsallowedappids-preparing-for-the-final-phase-of-ews-retirement/4529471))
  → **Do not build on EWS for a cloud mailbox.** It would need the university's
  admins to allow-list our app ID, and it dies in April 2027 regardless.
- **`Mail.Read` is not a permission a student can consent to on their own.** It
  requires administrator consent by default in Entra ID.
  ([Overview of user and admin consent](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/user-admin-consent-overview),
  [Configure how users consent to applications](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/configure-user-consent))
  → If GUC is on Microsoft 365, we probably need GUC IT to approve an app
  registration. That is a conversation, not a coding task, and it may be refused.
- **IMAP still works against Exchange Online, but only with OAuth (XOAUTH2)**,
  using delegated scopes such as
  `https://outlook.office365.com/IMAP.AccessAsUser.All` and
  `https://outlook.office365.com/SMTP.Send`, from an app registration with public
  client flows enabled (no client secret, which suits a mobile app).
  ([Microsoft Learn: authenticate IMAP/POP/SMTP with OAuth](https://learn.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth))
  → Same consent problem: it is still an app registration in GUC's tenant.
- **If the mailbox is on-premises Exchange or a plain IMAP server**, none of the
  above applies: password login on the device may simply work, and the decision
  becomes a technical one (IMAP over TLS vs. on-prem EWS).

## What to check — no credentials needed for steps 1–3

Do these from a normal browser or terminal. **Steps 1–3 need only the mail
domain, not an account.** Where a command wants an address, use a made-up local
part such as `someone@<domain>` — do not paste a real student address, and do not
paste any password, token or cookie into this file or into chat.

1. **Where does the webmail login page end up?** Open GUC's webmail link in a
   private browser window and let it redirect. Record the **final** URL.
   - Lands on `login.microsoftonline.com` → Microsoft 365.
   - Lands on `outlook.office.com` / `outlook.office365.com` → Microsoft 365.
   - Lands on an `/owa/` path on a GUC-run host → Exchange, most likely
     on-premises.
   - Something else entirely → bespoke webmail; capture its network traffic the
     way [spike 1](spike-1-portal-auth.md) describes.
2. **Ask Microsoft whether the domain is one of theirs.** In a browser:
   `https://login.microsoftonline.com/<mail-domain>/.well-known/openid-configuration`
   - JSON with a tenant id → the domain is on Microsoft 365. Record the
     `issuer` line only; the tenant id is not a secret, but nothing else from
     this page is needed.
   - An error saying the tenant was not found → not Microsoft 365.
3. **Check the MX records** (terminal): `dig MX <mail-domain> +short`, or use any
   online MX lookup.
   - `*.mail.protection.outlook.com` → Microsoft 365.
   - A GUC-run host → self-hosted mail; note the hostname.
4. **Compare the two logins** (this one does involve your own account, on your
   own device — just record the _shape_ of the answer, never the values):
   - Is the mail username your email address, or the same student ID the portal
     uses?
   - Is the password the same one the portal takes?
   - Does the mail host differ from the portal host from
     [spike 1](spike-1-portal-auth.md)?
5. **Only if steps 1–3 say Microsoft 365:** ask GUC IT two questions — (a) does
   the tenant allow users to consent to third-party apps requesting `Mail.Read`,
   and (b) would they approve an app registration for a student-built,
   open-source, on-device client? The answer decides between options A and D
   below.

**Then stop and paste the non-secret results back** (final webmail URL, tenant
found yes/no, MX target, username shape, and IT's answer if you got one). The
choice between the options below follows from them; I should not pick one before
the facts are in.

## The options, once the facts are known

| Option                                | Applies when                              | Pros                                                                                    | Cons                                                                                                  | Extra native work                                                                  |
| ------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **A. Microsoft Graph + OAuth**        | Mailbox on Microsoft 365, consent granted | Clean REST over HTTPS; the only option Microsoft is investing in; no raw sockets needed | Needs an app registration and, in practice, GUC IT's admin consent; blocked entirely if they say no   | `expo-auth-session` + `expo-web-browser` (new deps, dev-client rebuild)            |
| **B. IMAP + SMTP over TLS, password** | On-prem Exchange or plain IMAP server     | No admin involvement; the student's own credentials, already stored on device           | Needs raw TCP+TLS sockets, which React Native has no built-in support for; more protocol code to own  | A TCP socket library (e.g. `react-native-tcp-socket`) — native, dev-client rebuild |
| **C. IMAP + SMTP with XOAUTH2**       | Microsoft 365, consent granted            | Reuses B's IMAP code with OAuth tokens instead of a password                            | Worst of both: sockets _and_ an app registration                                                      | Both of the above                                                                  |
| **D. Drive the OWA web session**      | Microsoft 365 but consent refused         | No admin approval needed                                                                | Fragile (breaks whenever Microsoft changes OWA), ethically and contractually murky, hard to keep safe | None beyond the existing WebView                                                   |
| **E. On-prem EWS (SOAP over HTTPS)**  | On-premises Exchange only                 | Plain HTTPS, no sockets; on-prem EWS is not being retired                               | Dead end for a cloud mailbox; SOAP is unpleasant                                                      | None                                                                               |

**Not an option:** EWS against Exchange Online (retiring — see above).

### How to test the winner on both platforms

- **A / C / E (HTTPS or OAuth):** testable in a dev client on both iOS and
  Android with no extra native modules beyond the auth-session packages. Verify
  the OAuth redirect comes back to the app's `guchub://` scheme on both.
- **B / C (sockets):** `react-native-tcp-socket` needs a dev-client rebuild on
  both platforms, and TLS behaviour differs (iOS ATS vs. Android network security
  config). Test against the real mail host on a real device on both, on Wi-Fi and
  cellular, before committing to it.
- Whatever wins, its transport lives **inside `src/features/mail/`** and applies
  the same host-allowlist discipline as `core/http`, with a test — see
  `docs/PARALLEL_WORK.md`, "Session/credentials boundary".

## After the spike

1. Record the findings in this file (replace the questions with answers).
2. Write `docs/adr/B-001-mail-protocol.md` with the decision and its consequences.
3. **Announce any new native dependency before merging it** — everyone has to
   rebuild their dev client (`docs/PARALLEL_WORK.md`, dependency protocol), and
   it goes in its own `shared/deps-<name>` PR.
4. Implement the provider behind the existing `MailProvider` interface; the UI
   should need no changes.
