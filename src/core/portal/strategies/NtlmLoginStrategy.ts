import type { LoginResult, LoginStrategy, PortalCookieJar, PortalCredentials } from "../LoginStrategy";

/**
 * STUB — do not ship. NTLM is connection-oriented (a multi-step handshake bound to one
 * TCP socket) and React Native's `fetch` cannot express that. Candidates, to spike
 * against a real device before writing this for real (docs/DISCOVERY.md, Spike 1):
 *   1. A native module (Expo Modules API) wrapping NSURLSession / OkHttp, which both
 *      support NTLM natively.
 *   2. A pure-JS NTLM implementation over a raw TCP socket (needs a socket library;
 *      see also Spike 2, which needs the same primitive for IMAP/SMTP).
 *   3. A hidden WebView that performs the NTLM handshake via the OS network stack and
 *      hands back the resulting session cookie.
 * Whichever wins becomes this class; until then it must never be selected outside tests.
 */
export class NtlmLoginStrategy implements LoginStrategy {
  readonly id = "ntlm";

  async login(_credentials: PortalCredentials): Promise<LoginResult> {
    throw new Error("NtlmLoginStrategy is a stub. Resolve docs/DISCOVERY.md Spike 1 before implementing.");
  }

  async isSessionValid(_cookieJar: PortalCookieJar): Promise<boolean> {
    throw new Error("NtlmLoginStrategy is a stub.");
  }
}
