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
  /**
   * `isStoredCredential` marks a silent retry of an already-stored credential
   * (biometric unlock, PortalSession.withFreshSession) rather than one the user just
   * typed. A strategy that rate-limits repeated auth failures (see NTLM's circuit
   * breaker) keys off this, not off which caller invoked it — the same credential
   * can reach `login` from either place.
   */
  login(credentials: PortalCredentials, options?: { isStoredCredential?: boolean }): Promise<LoginResult>;
  /** True if the jar this strategy produced is still usable for a lightweight probe request. */
  isSessionValid(cookieJar: PortalCookieJar): Promise<boolean>;
  /** Drop any strategy-held session state (e.g. authenticated native connections). */
  logout?(): Promise<void>;
  /**
   * Called once the session has fully committed a successful login (after any
   * credential persistence), so a strategy can clear failure state it knows is now
   * stale without racing the persistence itself.
   */
  onLoginSucceeded?(): void;
}
