/**
 * We don't yet know which auth scheme GUC's portals use (NTLM, form login, or SSO) —
 * see docs/DISCOVERY.md, Spike 1. Every candidate implements this same interface so
 * `PortalSession` never needs to know which one is active.
 */
export interface PortalCredentials {
  username: string;
  password: string;
}

export interface PortalCookieJar {
  /** Opaque, strategy-specific session state (cookies, NTLM handshake material, ...). */
  serialize(): string;
}

export interface LoginResult {
  cookieJar: PortalCookieJar;
  /** Best-effort expiry hint, when the strategy can tell; session re-login handles the rest. */
  expiresAt?: number;
}

export interface LoginStrategy {
  readonly id: string;
  login(credentials: PortalCredentials): Promise<LoginResult>;
  /** True if the jar this strategy produced is still usable for a lightweight probe request. */
  isSessionValid(cookieJar: PortalCookieJar): Promise<boolean>;
  /** Drop any strategy-held session state (e.g. authenticated native connections). */
  logout?(): Promise<void>;
}
