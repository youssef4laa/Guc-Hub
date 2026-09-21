# Discovery spikes

Everything here is a genuine unknown — nobody on this project has instrumented the
real GUC portals yet. Each spike names the question, why it matters, and a concrete
way to find the answer on a real device with real (the spiker's own) credentials.
**Do not guess at the answer and write it into product code** — land the spike's
findings here first, then implement.

## Run these in order

1. **Spike 1 — Portal authentication**, on a real phone, with your own GUC
   credentials. Nothing else below can start until this resolves.
2. **Spike 3 — Cookie/session handling**, right after Spike 1, on the same
   device/login.
3. **Spike 2 — Mail protocol**, in parallel with 1/3 if a second person is
   available (it doesn't depend on the portal auth answer, only on the mail
   login, which may or may not be the same system — see below).
4. **Spike 6 — Transcript-locked detection**, once Spike 1 unblocks any real
   fetch and before `transcript` is implemented.
5. **Spike 5 — Background refresh limits**, low priority, can run any time
   there's a build on a real device left running for a few days.
6. **Spike 4 — HTML parser in Hermes**: already resolved, kept for the record.

## Spike 1 — Portal authentication (blocks: everything that logs in)

**Question:** Does the GUC student portal use NTLM (Windows Integrated Auth), a
plain HTML form + session cookie, or some SSO flow? Does the _mail_ login differ
from the _portal_ login (a different host, or an email address vs. a student ID)?

**Why it matters:** NTLM is connection-oriented — it's a multi-step handshake bound
to one TCP socket — and React Native's `fetch` has no way to express that. If it's
NTLM, `src/core/portal/strategies/NtlmLoginStrategy.ts` needs one of:

1. A native module (Expo Modules API) wrapping `NSURLSession` (iOS) / `OkHttp`
   (Android), both of which support NTLM out of the box.
2. A pure-JS NTLM implementation over a raw TCP socket (needs a socket library —
   see Spike 2, which needs the same primitive for IMAP/SMTP).
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

## Spike 2 — Mail protocol (blocks: `mail`)

**Question:** IMAP/SMTP, Exchange Web Services (EWS), or Microsoft Graph
(if GUC mail is Office 365)?

**Why it matters:** IMAP/SMTP need a raw TCP socket library on React Native (none
of this is plain HTTPS). EWS is SOAP-over-HTTPS — usable through `core/http`
directly. Graph is a clean REST API over HTTPS — also usable through `core/http`,
and by far the least work if it applies.

**How to find out:** Check whether GUC webmail is Office 365 / Outlook Web Access
(look at the webmail URL and page source for `outlook.office365.com` or similar).
If so, it's almost certainly Graph or EWS. If it's a bespoke webmail, capture its
network traffic the same way as Spike 1.

## Spike 3 — Cookie/session handling on iOS vs. Android (blocks: any live fetch)

**Question:** Once logged in, does the portal set a simple session cookie
`core/http`'s fetch wrapper can just resend, or does it also key sessions to
IP/user-agent/something else that behaves differently per platform?

**How to find out:** After Spike 1 produces a working login, make a second request
reusing the captured cookie from a different network condition (e.g. wifi to
cellular) and see if the session survives. Test on both a real iPhone and a real
Android device — `fetch`'s cookie jar behavior has historically differed slightly
between the two RN platforms.

## Spike 4 — HTML parser in Hermes (blocks: every `parser.ts`)

**Question:** Confirmed — see ADR-001. `node-html-parser` works in Hermes without
polyfills; `cheerio` needs jQuery-like DOM APIs Hermes doesn't have.

**Status:** Resolved. Revisit only if a specific captured page needs a selector
`node-html-parser` can't express.

## Spike 5 — Background refresh limits (blocks: "next class changed" notifications)

**Question:** How infrequently does iOS actually invoke `expo-background-task` in
practice, and does that make silent schedule-change detection worth building?

**How to find out:** Ship a build with `registerBackgroundRefresh` logging a
timestamp to `AsyncStorage` every time it fires, install it on a real iPhone used
normally for a week, and read back the gaps.

## Spike 6 — Transcript-locked detection (blocks: `transcript`)

**Question:** What does the portal actually return when a student's transcript is
locked (registration hold, unpaid fees, etc.) — a distinct page/status, or the same
markup as a successful transcript but with an inline banner?

**Why it matters:** `TRANSCRIPT_LOCKED` must never be reported as `PARSE_FAILED` —
one is an expected, explainable state; the other means our parser broke. Getting
this wrong makes a normal "your transcript is on hold" message look like a bug.

**How to find out:** Capture the transcript page from an account known to have a
hold, alongside a normal one, and diff them.
