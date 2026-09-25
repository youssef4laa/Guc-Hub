import { DisallowedHostError } from "../../../http/client";
import {
  isNtlmCircuitTripped,
  resetNtlmCircuitBreaker,
  tripNtlmCircuitBreaker,
} from "../../ntlm/ntlmCircuitBreaker";
import { getNativeNtlm } from "../../ntlm/nativeBinding";
import { PortalError } from "../../PortalError";
import { NtlmLoginStrategy } from "../NtlmLoginStrategy";

jest.mock("../../ntlm/nativeBinding", () => ({ getNativeNtlm: jest.fn() }));

const URL = "https://portal.test.invalid/";
const creds = { username: "first.last", password: "not-real" };

function strategyReturning(impl: jest.Mock) {
  return new NtlmLoginStrategy(() => URL, impl);
}

beforeEach(() => {
  resetNtlmCircuitBreaker();
});

describe("NtlmLoginStrategy", () => {
  it("signs in when the authenticated GET of the portal root succeeds", async () => {
    const request = jest.fn().mockResolvedValue({ status: 200, headers: {}, body: "<html/>" });
    const result = await strategyReturning(request).login(creds);
    expect(result.cookieJar.serialize()).toBe("ntlm-native-session");
    expect(request).toHaveBeenCalledWith(creds, { url: URL, method: "GET" });
  });

  it("passes AUTH_INVALID from the transport through (wrong password)", async () => {
    const request = jest.fn().mockRejectedValue(new PortalError("AUTH_INVALID", "rejected"));
    await expect(strategyReturning(request).login(creds)).rejects.toMatchObject({ code: "AUTH_INVALID" });
  });

  it("refuses empty credentials without a network call", async () => {
    const request = jest.fn();
    await expect(strategyReturning(request).login({ username: "", password: "" })).rejects.toMatchObject({
      code: "AUTH_INVALID",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("reports a redirect to a non-allowlisted host clearly instead of pretending to sign in", async () => {
    const request = jest.fn().mockRejectedValue(new DisallowedHostError("apps.guc.edu.eg"));
    await expect(strategyReturning(request).login(creds)).rejects.toMatchObject({
      code: "PORTAL_UNAVAILABLE",
      message: expect.stringContaining("apps.guc.edu.eg"),
    });
  });

  it("does not treat a server error as a successful sign-in", async () => {
    const request = jest.fn().mockResolvedValue({ status: 500, headers: {}, body: "" });
    await expect(strategyReturning(request).login(creds)).rejects.toMatchObject({
      code: "PORTAL_UNAVAILABLE",
    });
  });

  it("clears the native session on logout, and tolerates a build without the module", async () => {
    const clearSession = jest.fn();
    (getNativeNtlm as jest.Mock).mockReturnValue({ clearSession });
    await new NtlmLoginStrategy(() => URL, jest.fn()).logout();
    expect(clearSession).toHaveBeenCalled();

    (getNativeNtlm as jest.Mock).mockReturnValue(null);
    await expect(new NtlmLoginStrategy(() => URL, jest.fn()).logout()).resolves.toBeUndefined();
  });

  it("resets the ntlm circuit breaker once a fresh sign-in succeeds", async () => {
    tripNtlmCircuitBreaker();
    const request = jest.fn().mockResolvedValue({ status: 200, headers: {}, body: "<html/>" });
    await strategyReturning(request).login(creds);
    expect(isNtlmCircuitTripped()).toBe(false);
  });

  it("leaves the circuit breaker tripped when the fresh sign-in also fails", async () => {
    tripNtlmCircuitBreaker();
    const request = jest.fn().mockRejectedValue(new PortalError("AUTH_INVALID", "rejected"));
    await expect(strategyReturning(request).login(creds)).rejects.toMatchObject({ code: "AUTH_INVALID" });
    expect(isNtlmCircuitTripped()).toBe(true);
  });
});
