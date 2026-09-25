import { DisallowedHostError } from "../../http/client";
import type { LoginResult, LoginStrategy, PortalCookieJar, PortalCredentials } from "../LoginStrategy";
import { resetNtlmCircuitBreaker } from "../ntlm/ntlmCircuitBreaker";
import { getNativeNtlm } from "../ntlm/nativeBinding";
import { ntlmRequestWithCredentials, type NtlmRequest, type NtlmResponse } from "../ntlm/ntlmRequest";
import { PortalError } from "../PortalError";

type RequestWithCredentials = (
  credentials: PortalCredentials,
  request: NtlmRequest,
  options?: { isStoredCredential?: boolean },
) => Promise<NtlmResponse>;

/**
 * NTLM holds no JS-side session: the native transport authenticates each
 * connection itself and keeps any cookies in memory. This jar is just a marker.
 */
class NtlmSessionMarker implements PortalCookieJar {
  serialize(): string {
    return "ntlm-native-session";
  }
}

function defaultPortalUrl(): string {
  const host = process.env.EXPO_PUBLIC_GUC_PORTAL_HOST;
  if (!host) {
    throw new PortalError(
      "NOT_IMPLEMENTED",
      "Set EXPO_PUBLIC_GUC_PORTAL_HOST in .env.local to sign in for real.",
    );
  }
  return `https://${host}/`;
}

/**
 * ADR A-001: the portal uses IIS Windows authentication. Signing in = one
 * authenticated GET of the portal root through the NTLM transport:
 * - 401 after the handshake -> AUTH_INVALID (raised by the transport),
 * - 2xx (after allowlisted redirects) -> signed in,
 * - a redirect to a host that isn't allowlisted, or any other status ->
 *   PORTAL_UNAVAILABLE, naming what happened so it can be reported back.
 */
export class NtlmLoginStrategy implements LoginStrategy {
  readonly id = "ntlm";

  constructor(
    private readonly portalUrl: () => string = defaultPortalUrl,
    private readonly request: RequestWithCredentials = ntlmRequestWithCredentials,
  ) {}

  async login(
    credentials: PortalCredentials,
    options?: { isStoredCredential?: boolean },
  ): Promise<LoginResult> {
    if (!credentials.username || !credentials.password) {
      throw new PortalError("AUTH_INVALID", "Username and password are required.");
    }

    const url = this.portalUrl();
    let response: NtlmResponse;
    try {
      response = await this.request(credentials, { url, method: "GET" }, options);
    } catch (error) {
      if (error instanceof DisallowedHostError) {
        throw new PortalError(
          "PORTAL_UNAVAILABLE",
          `Signed-in portal redirected to a host that isn't allowlisted: ${error.message}`,
          { sourceUrl: url, cause: error },
        );
      }
      throw error;
    }

    if (response.status >= 200 && response.status < 300) {
      return { cookieJar: new NtlmSessionMarker() };
    }
    throw new PortalError("PORTAL_UNAVAILABLE", `Portal answered ${response.status} after sign-in.`, {
      sourceUrl: url,
    });
  }

  /** The native layer re-authenticates new connections itself, so there's no JS session to expire. */
  async isSessionValid(): Promise<boolean> {
    return true;
  }

  async logout(): Promise<void> {
    getNativeNtlm()?.clearSession();
  }

  /**
   * Called by PortalSession once a successful login's credential is fully persisted.
   * A stale in-flight read of the old stored credential can still trip the breaker
   * in the meantime; clearing it here, last, means that trip doesn't outlive this
   * successful sign-in — see the timing note on PortalSession.login.
   */
  onLoginSucceeded(): void {
    resetNtlmCircuitBreaker();
  }
}
