import type { LoginResult, LoginStrategy, PortalCookieJar, PortalCredentials } from "../LoginStrategy";
import { PortalError } from "../PortalError";

class MockCookieJar implements PortalCookieJar {
  constructor(private readonly username: string) {}
  serialize(): string {
    return `mock-session:${this.username}`;
  }
}

/**
 * Demo-mode strategy: accepts any non-empty credentials, used by "Try demo" and
 * by default in dev (`EXPO_PUBLIC_MODE=mock`). Never talks to the network.
 */
export class MockLoginStrategy implements LoginStrategy {
  readonly id = "mock";

  async login(credentials: PortalCredentials): Promise<LoginResult> {
    if (!credentials.username || !credentials.password) {
      throw new PortalError("AUTH_INVALID", "Username and password are required.");
    }
    return {
      cookieJar: new MockCookieJar(credentials.username),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    };
  }

  async isSessionValid(): Promise<boolean> {
    return true;
  }
}
