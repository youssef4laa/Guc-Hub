import type { LoginResult, LoginStrategy, PortalCookieJar, PortalCredentials } from "../LoginStrategy";

/**
 * STUB — do not ship. If the portal turns out to be a plain HTML form + session
 * cookie (no NTLM), this is likely the real implementation: POST credentials
 * (plus any CSRF token scraped from the login page) through `core/http`, then
 * store the `Set-Cookie` jar. Confirm the actual field names and any hidden
 * tokens via the in-app "Capture page" tool before writing the real parser —
 * see docs/DISCOVERY.md, Spike 1.
 */
export class FormLoginStrategy implements LoginStrategy {
  readonly id = "form";

  async login(_credentials: PortalCredentials): Promise<LoginResult> {
    throw new Error("FormLoginStrategy is a stub. Resolve docs/DISCOVERY.md Spike 1 before implementing.");
  }

  async isSessionValid(_cookieJar: PortalCookieJar): Promise<boolean> {
    throw new Error("FormLoginStrategy is a stub.");
  }
}
