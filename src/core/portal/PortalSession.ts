import { createLogger } from "../logging";
import { deleteCredentials, loadCredentials, saveCredentials } from "../storage/secureStore";
import type { LoginStrategy, PortalCookieJar, PortalCredentials } from "./LoginStrategy";
import { PortalError } from "./PortalError";

const log = createLogger("portal-session");

/**
 * Owns login/session state for one `LoginStrategy`. Session expiry is handled once,
 * here: on a 401/expired signal, callers should call `withFreshSession`, which
 * silently re-logs in from the stored credentials and retries exactly once before
 * surfacing SESSION_EXPIRED (which routes to the login screen).
 */
export class PortalSession {
  private cookieJar: PortalCookieJar | null = null;

  constructor(private readonly strategy: LoginStrategy) {}

  get isAuthenticated(): boolean {
    return this.cookieJar !== null;
  }

  async login(credentials: PortalCredentials, options?: { persist?: boolean }): Promise<void> {
    const result = await this.strategy.login(credentials);
    this.cookieJar = result.cookieJar;
    if (options?.persist !== false) {
      await saveCredentials(credentials);
    }
    log.info("login succeeded", { strategy: this.strategy.id });
  }

  async logout(): Promise<void> {
    this.cookieJar = null;
    await deleteCredentials();
  }

  getCookieJar(): PortalCookieJar {
    if (!this.cookieJar) {
      throw new PortalError("SESSION_EXPIRED", "Not logged in.");
    }
    return this.cookieJar;
  }

  /** Runs `work`; on a SESSION_EXPIRED, re-logs in from stored credentials and retries once. */
  async withFreshSession<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (!(error instanceof PortalError) || error.code !== "SESSION_EXPIRED") throw error;

      const stored = await loadCredentials();
      if (!stored) throw error;

      log.info("session expired, attempting silent re-login");
      try {
        await this.login(stored, { persist: false });
      } catch {
        throw new PortalError("SESSION_EXPIRED", "Re-login failed; please sign in again.");
      }
      return work();
    }
  }
}
