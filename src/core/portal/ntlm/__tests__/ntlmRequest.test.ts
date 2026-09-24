import { DisallowedHostError } from "../../../http/client";
import { PortalError } from "../../PortalError";
import { getNativeNtlm, type NativeNtlmRequest, type NativeNtlmResponse } from "../nativeBinding";
import { ntlmRequest } from "../ntlmRequest";

jest.mock("../../../http/config", () => ({
  HTTP_ALLOWLIST: ["portal.test.invalid", "other.test.invalid"],
  HTTP_CONFIG: {
    perHostConcurrency: 4,
    minRequestIntervalMs: 0,
    maxRetries: 0,
    retryBaseDelayMs: 0,
    cacheTtlMs: 0,
  },
}));
jest.mock("../../../storage/secureStore", () => ({ loadCredentials: jest.fn() }));
jest.mock("../nativeBinding", () => ({ getNativeNtlm: jest.fn() }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadCredentials } = require("../../../storage/secureStore") as { loadCredentials: jest.Mock };
const mockedGetNative = getNativeNtlm as jest.Mock;

const SECRET = "s3cr3t-not-real";

function nativeReturning(...responses: NativeNtlmResponse[]) {
  const request = jest.fn<Promise<NativeNtlmResponse>, [NativeNtlmRequest]>();
  for (const r of responses) request.mockResolvedValueOnce(r);
  mockedGetNative.mockReturnValue({ request });
  return request;
}

beforeEach(() => {
  jest.resetAllMocks();
  loadCredentials.mockResolvedValue({ username: "first.last", password: SECRET });
});

describe("ntlmRequest", () => {
  it("refuses a non-allowlisted host before touching credentials or native code", async () => {
    const request = nativeReturning({ status: 200, headers: {}, body: "" });
    await expect(ntlmRequest({ url: "https://evil.example.com/", method: "GET" })).rejects.toBeInstanceOf(
      DisallowedHostError,
    );
    expect(request).not.toHaveBeenCalled();
    expect(loadCredentials).not.toHaveBeenCalled();
  });

  it("refuses plain http even on an allowlisted host", async () => {
    nativeReturning({ status: 200, headers: {}, body: "" });
    await expect(ntlmRequest({ url: "http://portal.test.invalid/", method: "GET" })).rejects.toBeInstanceOf(
      DisallowedHostError,
    );
  });

  it("reports NOT_IMPLEMENTED when the native module is not in the build", async () => {
    mockedGetNative.mockReturnValue(null);
    await expect(ntlmRequest({ url: "https://portal.test.invalid/", method: "GET" })).rejects.toMatchObject({
      code: "NOT_IMPLEMENTED",
    });
  });

  it("reports SESSION_EXPIRED when no credential is stored", async () => {
    nativeReturning({ status: 200, headers: {}, body: "" });
    loadCredentials.mockResolvedValue(null);
    await expect(ntlmRequest({ url: "https://portal.test.invalid/", method: "GET" })).rejects.toMatchObject({
      code: "SESSION_EXPIRED",
    });
  });

  it("passes the stored credential to native code and returns the response", async () => {
    const request = nativeReturning({
      status: 200,
      headers: { "content-type": "text/html" },
      body: "<html/>",
    });
    const res = await ntlmRequest({ url: "https://portal.test.invalid/x", method: "GET" });
    expect(res).toEqual({ status: 200, headers: { "content-type": "text/html" }, body: "<html/>" });
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      username: "first.last",
      password: SECRET,
      method: "GET",
    });
  });

  it("maps a 401 after the handshake to AUTH_INVALID", async () => {
    nativeReturning({ status: 401, headers: {}, body: "" });
    await expect(ntlmRequest({ url: "https://portal.test.invalid/", method: "GET" })).rejects.toMatchObject({
      code: "AUTH_INVALID",
    });
  });

  it("returns non-401 errors as-is (EWS SOAP faults are 500 with a body)", async () => {
    nativeReturning({ status: 500, headers: {}, body: "<soap:Fault/>" });
    const res = await ntlmRequest({ url: "https://portal.test.invalid/EWS", method: "POST", body: "<x/>" });
    expect(res.status).toBe(500);
  });

  it("follows GET redirects on allowlisted hosts, re-checking each hop", async () => {
    const request = nativeReturning(
      { status: 302, headers: {}, body: "", location: "https://other.test.invalid/next" },
      { status: 200, headers: {}, body: "ok" },
    );
    const res = await ntlmRequest({ url: "https://portal.test.invalid/", method: "GET" });
    expect(res.body).toBe("ok");
    expect(request.mock.calls[1]?.[0].url).toBe("https://other.test.invalid/next");
  });

  it("refuses a redirect to a non-allowlisted host", async () => {
    nativeReturning({ status: 302, headers: {}, body: "", location: "https://evil.example.com/" });
    await expect(ntlmRequest({ url: "https://portal.test.invalid/", method: "GET" })).rejects.toBeInstanceOf(
      DisallowedHostError,
    );
  });

  it("maps a native failure to PORTAL_UNAVAILABLE without leaking the credential", async () => {
    mockedGetNative.mockReturnValue({
      request: jest.fn().mockRejectedValue(new Error("TLS handshake failed")),
    });
    const error = await ntlmRequest({ url: "https://portal.test.invalid/", method: "GET" }).catch((e) => e);
    expect(error).toBeInstanceOf(PortalError);
    expect(error.code).toBe("PORTAL_UNAVAILABLE");
    expect(error.message).not.toContain(SECRET);
  });

  it("never writes the credential to the console", async () => {
    const spies = (["log", "info", "warn", "error"] as const).map((m) =>
      jest.spyOn(console, m).mockImplementation(() => undefined),
    );
    nativeReturning({ status: 401, headers: {}, body: "" });
    await ntlmRequest({ url: "https://portal.test.invalid/", method: "GET" }).catch(() => undefined);
    const printed = spies.flatMap((s) => s.mock.calls.flat().map(String)).join("\n");
    expect(printed).not.toContain(SECRET);
    spies.forEach((s) => s.mockRestore());
  });
});
