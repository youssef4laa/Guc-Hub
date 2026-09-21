# Spike 1 — Portal authentication

**Owner:** Track A. **Blocks:** everything that logs in (both tracks).

**Run this first, on a real phone, with your own GUC credentials.** Nothing
else in `docs/discovery/` can proceed until this resolves.

**Question:** Does the GUC student portal use NTLM (Windows Integrated Auth), a
plain HTML form + session cookie, or some SSO flow? Does the _mail_ login differ
from the _portal_ login (a different host, or an email address vs. a student ID)?

**Why it matters:** NTLM is connection-oriented — it's a multi-step handshake bound
to one TCP socket — and React Native's `fetch` has no way to express that. If it's
NTLM, `src/core/portal/strategies/NtlmLoginStrategy.ts` needs one of:

1. A native module (Expo Modules API) wrapping `NSURLSession` (iOS) / `OkHttp`
   (Android), both of which support NTLM out of the box.
2. A pure-JS NTLM implementation over a raw TCP socket (needs a socket library —
   see [spike-2-mail-protocol.md](spike-2-mail-protocol.md), which needs the
   same primitive for IMAP/SMTP).
3. A hidden WebView that performs the handshake via the OS network stack and hands
   back the resulting session cookie.

If it's a plain form, `FormLoginStrategy.ts` is much simpler: POST credentials (plus
any CSRF token scraped from the login page) through `core/http`, store the
`Set-Cookie` jar.

**How to find out:** On a real device, open the portal login page in a plain
browser with a proxy (e.g. mitmproxy or Charles) recording the traffic. Look at the
`WWW-Authenticate` response header on the first request (`NTLM` or `Negotiate`
means NTLM/Kerberos; a normal login form means option 2). Note the exact login URL,
form field names, and any hidden tokens.

**Next:** once resolved, run
[spike-3-cookies-session.md](spike-3-cookies-session.md) on the same
device/login, and record the answer as a new `docs/adr/A-00N-*.md`.
