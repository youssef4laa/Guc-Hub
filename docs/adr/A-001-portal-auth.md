# ADR A-001: Portal authentication — NTLM via a native transport

## Status

Accepted: the auth scheme (NTLM/Negotiate) and the transport shape (a native
module). **Proposed, awaiting approval:** the Android TLS fix for
`student.guc.edu.eg` (see "Prerequisite: the incomplete certificate chain").
**Open:** the Android NTLM implementation (see "Android NTLM").

Date: 2026-09-24. Track A.

## Context

Evidence, all gathered without sending credentials:

| Source                                           | Finding                                                                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unauthenticated `curl` from a Mac, redirects off | `student.guc.edu.eg/`, `apps.guc.edu.eg/`, `apps.guc.edu.eg/student_ext/index.aspx`, `cms.guc.edu.eg/` all return `401` with `WWW-Authenticate: Negotiate, NTLM`. No redirects, no Basic   |
| User, real browser                               | `student.guc.edu.eg` shows the browser's native "This site is asking you to sign in" dialog, not an HTML form                                                                              |
| User, normal login                               | `student.guc.edu.eg` is the host the student portal is actually reached on, not `apps.guc.edu.eg`                                                                                          |
| Track B, [ADR B-001](B-001-mail-protocol.md)     | Exchange EWS (`mail.guc.edu.eg/EWS/Exchange.asmx`) also answers `401 Negotiate, NTLM`, no Basic. OWA (`/owa/`) is a separate forms login and does **not** predict the EWS or portal scheme |
| User                                             | Mail and portal share **one** credential (same username and password)                                                                                                                      |

So the portal uses IIS Windows authentication. NTLM authenticates the TCP
connection with a three-message handshake, not individual requests. React
Native's `fetch` can't pin a connection across those three requests, so it
can't drive NTLM reliably.

`cms.guc.edu.eg` also challenges with NTLM. That matters for the `cms` feature
later, but it isn't allowlisted yet and is out of scope for this ADR.

## Decision

1. **Scheme:** the portal (`student.guc.edu.eg`) authenticates with NTLM. We
   offer only NTLM to the server. Negotiate/Kerberos is refused on the client
   side so the stack falls back to NTLM: a student phone has no Kerberos
   ticket.
2. **Transport:** one native module, built once by Track A and used by both
   the portal and Track B's EWS mail provider. Its JS surface lives in
   `src/core/portal/ntlm/`:

   ```ts
   ntlmRequest({ url, method, headers?, body? }): Promise<{ status, headers, body }>
   ```

   - It enforces the same host allowlist as `core/http`, inside the call.
   - It reads the single stored credential from `core/storage/secureStore`
     itself. Callers, including mail, never see the password, and `useAuth`
     doesn't need to expose it.
   - Text bodies only in v1. EWS attachments are base64 inside the SOAP XML.
   - Errors map to `PortalError`: `401` after the handshake is `AUTH_INVALID`;
     network and TLS failures are `PORTAL_UNAVAILABLE`.

3. **iOS:** `URLSession`, answering `NSURLAuthenticationMethodNTLM` challenges
   with a per-session `URLCredential`, and rejecting the Negotiate protection
   space. This is the OS's own NTLM implementation.
4. **`LoginStrategy`:** `NtlmLoginStrategy.login()` does an authenticated GET of
   the portal root through the transport. `200` means valid credentials;
   `401` means `AUTH_INVALID`. There's no cookie jar to keep: each new
   connection re-handshakes inside the native layer. Spike 3 checks whether
   the portal also issues a session cookie that could spare repeat handshakes.
5. **Placement:** Expo autolinks native modules from the repo-root `modules/`
   directory, which is outside Track A's scope. A small `shared/` PR adds
   `modules/guc-ntlm/**` to Track A in `.github/scope.json` and CODEOWNERS
   before any native code lands.

### Android NTLM (open)

Android's stack (OkHttp, `HttpURLConnection`) has no NTLM. Options:

| Option                                                                               | Licence    | Notes                                                                                                                                                |
| ------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vendor `NTLMEngineImpl` from Apache HttpClient**, behind an OkHttp `Authenticator` | Apache-2.0 | **Recommended.** Self-contained NTLMv2 (it carries its own MD4). A widely used OkHttp + NTLM pattern. We'd own one vendored file plus a NOTICE entry |
| jcifs-ng                                                                             | LGPL-2.1   | Mature, but LGPL inside an APK brings relinking obligations. Avoid                                                                                   |
| Write NTLMv2 ourselves from MS-NLMP                                                  | ours       | Crypto code we'd own and maintain. Rejected                                                                                                          |
| Hidden WebView (Chromium does NTLM natively)                                         | —          | Fallback only; awkward for EWS SOAP POSTs (see Spike 1)                                                                                              |

**Android risk to test on a real phone:** OkHttp must reuse the same connection
for the Type 1 → 2 → 3 exchange. Serialise requests per host and bound the
connection pool so the challenge and the answer can't land on different
sockets.

## Prerequisite: the incomplete certificate chain (Android)

`student.guc.edu.eg` sends only its leaf certificate and leaves out the
intermediate "Sectigo Public Server Authentication CA DV R36". It did this on
5 of 5 connections. `apps`, `cms` and `mail` send the full chain.

Browsers, and Apple's stack, quietly download the missing intermediate from
the leaf's AIA URL. Android apps don't, so every Android phone fails with
`Trust anchor for certification path not found` on this host. The phone's
clock or the emulator has nothing to do with it. GUC's server can't be fixed
from our side.

**Proposed fix (not built):** an Android Network Security Config that adds
exactly that intermediate as an extra trust anchor for `student.guc.edu.eg`
only, alongside the system trust store.

Verified offline with `openssl`:

- The intermediate at `http://crt.sectigo.com/SectigoPublicServerAuthenticationCADVR36.crt`
  (SHA-256 `8C:54:C3:34:B6:6B:A4:E4:26:77:2A:F4:A3:F9:13:6C:19:A1:AE:C7:29:FD:B2:8C:53:5C:07:A5:A4:EF:22:E0`)
  is byte-identical to the one `mail.guc.edu.eg` serves.
- It is issued by Sectigo Root R46, and is valid 2021-03-22 to 2036-03-21.
- The `student.guc.edu.eg` leaf verifies against it.
- A certificate from an unrelated site fails against it.

**How this differs from disabling validation (which stays banned):**

- **Still checked:** the leaf's signature must chain to that exact intermediate,
  the hostname must match, and the leaf must be in date.
- **Scope:** one host, `includeSubdomains="false"`. System anchors stay. No
  user-installed CAs, no `debug-overrides`, cleartext still off.
- **Weaker than normal:** Android doesn't check the intermediate's own link to
  the root, or its revocation. (Android doesn't check revocation by default for
  ordinary TLS either.)
- **Maintenance:** the current leaf expires 2027-03-14. If GUC's renewed
  certificate comes from a different intermediate, this host breaks on Android
  again until the pinned file is updated. If GUC starts serving the full
  chain, the system anchors cover it and nothing breaks.

**Cost:** native Android config (an XML resource, a raw cert resource and a
manifest attribute) written by a config plugin in `config/plugins.portal.js`.
That means **a dev client rebuild on Android**, announced before merging.

**iOS:** no change expected. The Mac's `curl` uses Apple's SecureTransport and
succeeded against this host, so Apple's trust evaluation found the
intermediate. Unverified on an iOS build.

**Unverified:** whether Android WebView (the "Open original page" fallback)
honours the Network Security Config trust anchor.

## Consequences

- The NTLM native module and the Network Security Config each need a dev client
  rebuild. They can land together to save one rebuild.
- Nothing about the portal can be tested on Android until the TLS fix exists.
- `PortalSession`'s cookie-jar model stays as it is. For NTLM the jar is empty
  and the native layer owns the connection.
- Track B's `EwsMailProvider` builds on `ntlmRequest` and needs nothing from
  `useAuth`.
