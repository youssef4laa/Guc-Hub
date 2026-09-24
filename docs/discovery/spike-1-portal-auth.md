# Spike 1 — Portal authentication

**Owner:** Track A. **Blocks:** everything that logs in (both tracks).

**Question:** Does the GUC student portal use NTLM (Windows Integrated Auth),
Basic, a plain HTML form + session cookie, or some SSO flow? Does the _mail_
login differ from the _portal_ login (host, or an email address vs. a student ID)?

**Known so far (from Track B's [ADR B-001](../adr/B-001-mail-protocol.md), on
their branch):** GUC mail is on-prem Exchange 2019. An unauthenticated probe of
`/EWS/Exchange.asmx` returns `401` with `WWW-Authenticate: Negotiate, NTLM` and
**no Basic**. So NTLM is already a certainty for mail — an NTLM transport gets
built regardless of what the portal turns out to be. Whether the _portal_ is
NTLM too is still unknown: do not infer it from mail. Only the probe output
decides. B-001 also states the
mail credential is the same username/password the portal uses (username without
a domain suffix), which this doc relies on below.

## Step 1 — run the probe (you, on a real phone, no credentials involved)

The probe sends **no credentials**. Its output is hosts, paths, auth scheme
_names_, and cookie _names_ only — never a value — so it is safe to paste.

1. In `.env.local` (gitignored, never paste it anywhere) set the portal host
   the way you'd type it in a browser, e.g. `EXPO_PUBLIC_GUC_PORTAL_HOST=<host>`.
   To probe the mail host too, also set `EXPO_PUBLIC_GUC_MAIL_HOST=<host>`.
2. Run a dev build (`pnpm start`; on Android `pnpm exec expo run:android`, on
   iOS use the EAS simulator/dev build — see README).
3. Open the probe: it lives at `/dev/auth-probe`. **Launch the app first and
   sign in via Try demo, then** deep link it (or type the route in the dev menu):
   - Android: `adb shell am start -a android.intent.action.VIEW -d "guchub:///dev/auth-probe"`
   - iOS simulator: `xcrun simctl openurl booted "guchub:///dev/auth-probe"`

   Do not use the deep link to cold-start the app on iOS: with the scene
   lifecycle enabled (`shared/ios-scene-lifecycle`, needed for iOS 27), SDK 57's
   `Linking.getInitialURL()` resolves to `null` on a cold start, so the link is
   silently dropped. Warm links (app already running) work.

4. The URL box is prefilled with `https://<portal host>/`. Tap **Run probe**.
   Long-press the output to select and copy it. Run it once for the portal's
   root, once for the URL you normally open to see your grades/schedule login
   page (if different), and once for the mail host.
5. Paste all outputs back to me.

## Step 2 — read the result

| You see                                                                                                                                | It means                                                                  | Next                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| A `401` hop with `WWW-Authenticate: NTLM` (and/or `Negotiate`)                                                                         | **NTLM.** Auth is bound to the TCP connection; RN `fetch` cannot drive it | Step 3 (NTLM options)                                                                                        |
| `401` with only `Basic`                                                                                                                | Basic auth — trivially `fetch` + header, but over TLS only                | `FormLoginStrategy`-like `BasicLoginStrategy`; no native code                                                |
| `200` (or redirects ending in `200`) on a login page, `Set-Cookie` names like `ASP.NET_SessionId` / `.ASPXAUTH`, no `WWW-Authenticate` | **Form login + session cookie**                                           | `FormLoginStrategy`; needs a real capture of the login page (field names, hidden tokens) via Capture tool    |
| Redirects to a different host (e.g. `login.microsoftonline.com`, an `adfs`/`sso` host)                                                 | **SSO**                                                                   | Stop and report; the probe stops at the first off-allowlist host so this is visible. Needs a separate design |
| `network-error`                                                                                                                        | Wrong host, no network, or a TLS problem                                  | Tell me the message. **Never** work around TLS errors                                                        |

An NTLM portal can also hand out a session cookie after the handshake. If the
probe shows `NTLM` _and_ cookie names on a later hop, session cookies may let us
avoid re-authenticating every request; if there's no cookie, **every** request
must go through the NTLM transport. That distinction decides how much the
transport's performance matters and is exactly what Spike 3 verifies.

## Step 3 — NTLM options (only if the probe says NTLM)

NTLM is a three-message handshake (Type 1 → 2 → 3) that authenticates the TCP
connection, not the request. It must happen on one connection and the same
connection must then be reused. RN's `fetch` gives us no control over that.

| Option                                                    | How                                                                                                                                                                                                                                                            | Pros                                                                                                                                                                            | Cons / unknowns                                                                                                                                                                                                                                                                                                                                                                                   | Test on both platforms                                                                                                                                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Native module (Expo Modules API) over the OS stack** | iOS: `URLSession` answers `NSURLAuthenticationMethodNTLM` challenges with a `URLCredential` in its delegate. Android: OkHttp + an NTLM `Authenticator`                                                                                                         | iOS side is the OS's own, well-tested NTLM. One API for portal HTML and Track B's EWS SOAP. Works even if the portal has no session cookie. Full control of headers/body/status | Needs a new dev client build (announce before merging). **Android is the risk**: OkHttp has no built-in NTLM, so we'd embed an NTLM message implementation (e.g. from jcifs-ng / Apache HttpClient's `NTLMEngine`), and OkHttp's connection reuse between the challenge and the retry must be verified, not assumed. NTLMv2 details (domain, workstation) may need tuning against the real server | Same request against the real host on an iPhone (EAS build) and an Android phone: expect `200` and the same body; then 20 sequential requests to prove connection reuse / no re-handshake storm |
| **B. Hidden WebView does the handshake**                  | `react-native-webview` (already a dependency) loads the target origin; the platform web engine answers the NTLM challenge (Android `onReceivedHttpAuthRequest`, iOS `WKNavigationDelegate` challenge). Then either read cookies or run `fetch` inside the page | No native code, no new dev client. Both engines implement NTLM themselves                                                                                                       | For HTML pages OK; for **EWS SOAP POSTs** we'd inject JS `fetch` in a same-origin page and bounce results over `postMessage`: slow, awkward, fragile. Credential supply to the WebView differs per platform (`basicAuthCredential` prop vs. delegate) and iOS behaviour for NTLM needs verifying. Only viable if a post-handshake cookie exists (else every request must run inside the WebView)  | Load a protected page on both platforms; confirm the WebView (not a login form) gets `200`; confirm whether a cookie is set and whether `fetch` from the app (outside the WebView) can reuse it |
| **C. JS NTLM implementation over `fetch`**                | Compute Type 1/3 messages in JS, send them as `Authorization: NTLM …` headers                                                                                                                                                                                  | No native code                                                                                                                                                                  | Needs the _same TCP connection_ across the 3 requests; RN `fetch`/OkHttp/NSURLSession give no guarantee (keep-alive pooling is best-effort). Likely to work intermittently, which is worse than failing. **Not recommended**                                                                                                                                                                      | Only worth testing as a cheap experiment: 50 attempts, count failures                                                                                                                           |

**Current lean (a hypothesis, not a decision):** Option A, because Track B's EWS
calls make a real request/response transport valuable, and it is the only option
that works whether or not a post-handshake cookie exists. Option B stays the
fallback if the Android NTLM work in A proves flaky _and_ the probe shows a
cookie. The probe output settles it; I will not build either before then.

## Shared NTLM surface for Track B (proposal, not yet agreed)

Track A builds the mechanism once; Track B's mail consumes it. Mail keeps its own
session/feature code. Proposed surface, in `src/core/portal/ntlm/` (Track A owns;
Track B reviews):

```ts
interface NtlmRequest {
  url: string; // host must be on the http allowlist; enforced inside
  method: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string; // EWS SOAP XML is text; binary out of scope for v1
}
interface NtlmResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}
/** Credentials are read from secure storage INSIDE the transport; callers never see a password. */
function ntlmRequest(req: NtlmRequest): Promise<NtlmResponse>;
```

Open questions to settle with Track B before building:

1. **One credential set or two? — confirmed: one.** The mail login is the same
   username and password as the portal login (assumed in B-001, confirmed by the
   user on 2026-09-24). So there is no second slot in `core/storage` and no
   `account` option. Mail does not need `useAuth` to expose the password either:
   the transport reads the stored credential itself, so nothing outside
   `core/portal` ever handles it. This answers B-001's `needs-track-a` request
   without widening `useAuth`. It says **nothing** about which auth scheme the
   portal uses — that stays open until the probe runs.
2. **Domain/workstation for NTLMv2:** unknown until we see a real challenge;
   the transport should accept an optional `domain` and default to parsing it
   from the username (`DOMAIN\user` or `user@domain`).
3. **Text only in v1** (SOAP XML). Attachments in EWS are base64 inside the XML,
   so no binary body is needed.
4. **Errors:** map to the existing `PortalError` codes (`AUTH_INVALID` for a 401
   after the handshake, `PORTAL_UNAVAILABLE` for network/TLS, `SESSION_EXPIRED`
   only if a cookie session is in play).

Mail's own allowlist requirement (docs/PARALLEL_WORK.md) is satisfied by the
transport enforcing the same allowlist internally, with a test.

## Step 4 — after the probe

Record the decision in `docs/adr/A-001-portal-auth.md`, implement the matching
`LoginStrategy` in `src/core/portal/strategies/`, and get a real sign-in
working. A native module means a new dev client for everyone: announced before
merging, never after.

**Next:** [spike-3-cookies-session.md](spike-3-cookies-session.md), on the same
device/login.
