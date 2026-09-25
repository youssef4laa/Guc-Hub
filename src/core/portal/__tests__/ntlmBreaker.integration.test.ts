import {
  isNtlmCircuitTripped,
  isStoredCredentialConfirmed,
  resetNtlmCircuitBreaker,
} from "../ntlm/ntlmCircuitBreaker";
import { getNativeNtlm, type NativeNtlmRequest, type NativeNtlmResponse } from "../ntlm/nativeBinding";
import { ntlmRequest } from "../ntlm/ntlmRequest";
import { PortalSession } from "../PortalSession";
import { NtlmLoginStrategy } from "../strategies/NtlmLoginStrategy";

/**
 * The real PortalSession + NtlmLoginStrategy + ntlmRequest + circuit breaker, with
 * only the native module, secure storage and the allowlist faked. Each native call
 * is held open until the test settles it, so interleavings are exact rather than
 * timer-dependent. Every call that reaches the fake native module is a call that
 * would reach GUC's server.
 */

jest.mock("../../http/config", () => ({
  HTTP_ALLOWLIST: ["portal.test.invalid"],
  HTTP_CONFIG: {
    perHostConcurrency: 4,
    minRequestIntervalMs: 0,
    maxRetries: 0,
    retryBaseDelayMs: 0,
    cacheTtlMs: 0,
  },
}));

const mockStore: { credentials: { username: string; password: string } | null } = { credentials: null };
jest.mock("../../storage/secureStore", () => ({
  loadCredentials: jest.fn(async () => mockStore.credentials),
  saveCredentials: jest.fn(async (credentials: { username: string; password: string }) => {
    mockStore.credentials = credentials;
  }),
  deleteCredentials: jest.fn(async () => {
    mockStore.credentials = null;
  }),
}));
jest.mock("../ntlm/nativeBinding", () => ({ getNativeNtlm: jest.fn() }));

const PORTAL = "https://portal.test.invalid/";
const OLD = "old-password-not-real";
const NEW = "new-password-not-real";

interface PendingCall {
  password: string;
  answer: (status: number) => void;
  fail: (error: Error) => void;
}

let pending: PendingCall[];
let native: jest.Mock<Promise<NativeNtlmResponse>, [NativeNtlmRequest]>;

/** Let queued promise work run (including the host queue) before asserting. */
async function settle() {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  resetNtlmCircuitBreaker();
  mockStore.credentials = { username: "first.last", password: OLD };
  pending = [];
  native = jest.fn(
    (request: NativeNtlmRequest) =>
      new Promise<NativeNtlmResponse>((resolve, reject) => {
        pending.push({
          password: request.password,
          answer: (status) => resolve({ status, headers: {}, body: "" }),
          fail: reject,
        });
      }),
  );
  (getNativeNtlm as jest.Mock).mockReturnValue({ request: native, clearSession: jest.fn() });
});

const call = () => ntlmRequest({ url: PORTAL, method: "GET" }).catch((error: unknown) => error);

describe("NTLM circuit breaker, end to end", () => {
  it("a burst whose first attempt times out still sends the password only once when the server comes back", async () => {
    const calls = Array.from({ length: 6 }, call);
    await settle();
    expect(native).toHaveBeenCalledTimes(1);

    // The first attempt dies of a timeout: nothing about the password is known yet.
    pending[0].fail(new Error("timed out"));
    await settle();

    // Exactly one waiter takes over; the other four keep waiting.
    expect(native).toHaveBeenCalledTimes(2);

    // The server is reachable now and rejects the stored password.
    pending[1].answer(401);
    const results = await Promise.all(calls);

    expect(native).toHaveBeenCalledTimes(2);
    expect(pending.filter((p) => p.password === OLD)).toHaveLength(2);
    expect(results[0]).toMatchObject({ code: "PORTAL_UNAVAILABLE" });
    for (const result of results.slice(1)) {
      expect(result).toMatchObject({ code: "AUTH_INVALID" });
    }
    expect(isNtlmCircuitTripped()).toBe(true);
  });

  it("a stale 401 landing after a successful sign-in doesn't re-trip the breaker", async () => {
    // A background call goes out with the old password (changed on the web since).
    const stale = call();
    await settle();
    expect(pending[0].password).toBe(OLD);

    // Meanwhile the user signs in with the new password, and it succeeds.
    const session = new PortalSession(new NtlmLoginStrategy(() => PORTAL));
    const login = session.login({ username: "first.last", password: NEW });
    await settle();
    expect(pending[1].password).toBe(NEW);
    pending[1].answer(200);
    await login;
    expect(mockStore.credentials?.password).toBe(NEW);

    // Only now does the old request's 401 land.
    pending[0].answer(401);
    expect(await stale).toMatchObject({ code: "AUTH_INVALID" });
    expect(isNtlmCircuitTripped()).toBe(false);

    // The new password still works.
    const next = ntlmRequest({ url: PORTAL, method: "GET" });
    await settle();
    expect(pending[2].password).toBe(NEW);
    pending[2].answer(200);
    await expect(next).resolves.toMatchObject({ status: 200 });
  });

  it("once the stored password is confirmed, calls run concurrently again", async () => {
    const first = call();
    await settle();
    pending[0].answer(200);
    await first;
    expect(isStoredCredentialConfirmed()).toBe(true);

    const calls = Array.from({ length: 3 }, call);
    await settle();
    expect(native).toHaveBeenCalledTimes(4);
    pending.slice(1).forEach((p) => p.answer(200));
    await Promise.all(calls);
  });

  it("a successful sign-in confirms the password it just stored", async () => {
    const session = new PortalSession(new NtlmLoginStrategy(() => PORTAL));
    const login = session.login({ username: "first.last", password: NEW });
    await settle();
    pending[0].answer(200);
    await login;
    expect(isStoredCredentialConfirmed()).toBe(true);
    expect(isNtlmCircuitTripped()).toBe(false);
  });

  it("signing out clears the confirmation", async () => {
    const first = call();
    await settle();
    pending[0].answer(200);
    await first;
    expect(isStoredCredentialConfirmed()).toBe(true);

    await new PortalSession(new NtlmLoginStrategy(() => PORTAL)).logout();
    expect(isStoredCredentialConfirmed()).toBe(false);
  });
});
