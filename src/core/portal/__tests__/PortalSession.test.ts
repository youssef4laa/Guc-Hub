import { deleteCredentials, saveCredentials } from "../../storage/secureStore";
import type { LoginResult, LoginStrategy, PortalCookieJar } from "../LoginStrategy";
import { PortalSession } from "../PortalSession";

jest.mock("../../storage/secureStore", () => ({
  saveCredentials: jest.fn().mockResolvedValue(undefined),
  loadCredentials: jest.fn(),
  deleteCredentials: jest.fn().mockResolvedValue(undefined),
}));

class FakeCookieJar implements PortalCookieJar {
  serialize(): string {
    return "fake";
  }
}

function fakeStrategy(overrides?: Partial<LoginStrategy>): LoginStrategy {
  return {
    id: "fake",
    login: jest.fn<Promise<LoginResult>, Parameters<LoginStrategy["login"]>>().mockResolvedValue({
      cookieJar: new FakeCookieJar(),
    }),
    isSessionValid: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (saveCredentials as jest.Mock).mockResolvedValue(undefined);
  (deleteCredentials as jest.Mock).mockResolvedValue(undefined);
});

describe("PortalSession.login", () => {
  it("marks isStoredCredential false and persists on a default (typed) login", async () => {
    const strategy = fakeStrategy();
    const session = new PortalSession(strategy);
    await session.login({ username: "u", password: "p" });
    expect(strategy.login).toHaveBeenCalledWith(
      { username: "u", password: "p" },
      { isStoredCredential: false },
    );
    expect(saveCredentials).toHaveBeenCalledWith({ username: "u", password: "p" });
  });

  it("marks isStoredCredential true and does not persist when persist: false", async () => {
    const strategy = fakeStrategy();
    const session = new PortalSession(strategy);
    await session.login({ username: "u", password: "p" }, { persist: false });
    expect(strategy.login).toHaveBeenCalledWith(
      { username: "u", password: "p" },
      { isStoredCredential: true },
    );
    expect(saveCredentials).not.toHaveBeenCalled();
  });

  it("calls onLoginSucceeded only after saveCredentials has resolved", async () => {
    const order: string[] = [];
    (saveCredentials as jest.Mock).mockImplementation(async () => {
      // Simulate real keychain I/O taking a tick, so a naive "reset before save"
      // implementation would call onLoginSucceeded first if it existed.
      await Promise.resolve();
      order.push("saveCredentials");
    });
    const strategy = fakeStrategy({
      onLoginSucceeded: jest.fn(() => order.push("onLoginSucceeded")),
    });
    const session = new PortalSession(strategy);
    await session.login({ username: "u", password: "p" });
    expect(order).toEqual(["saveCredentials", "onLoginSucceeded"]);
  });

  it("still calls onLoginSucceeded when persist is false (nothing to save)", async () => {
    const strategy = fakeStrategy({ onLoginSucceeded: jest.fn() });
    const session = new PortalSession(strategy);
    await session.login({ username: "u", password: "p" }, { persist: false });
    expect(strategy.onLoginSucceeded).toHaveBeenCalled();
  });

  it("tolerates a strategy with no onLoginSucceeded hook", async () => {
    const strategy = fakeStrategy();
    const session = new PortalSession(strategy);
    await expect(session.login({ username: "u", password: "p" })).resolves.toBeUndefined();
  });
});
