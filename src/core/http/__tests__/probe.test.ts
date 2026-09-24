import { DisallowedHostError } from "../client";
import { parseAuthSchemes, parseCookieNames, probeUrl } from "../probe";

describe("parseAuthSchemes", () => {
  it("returns scheme names only, never realms or tokens", () => {
    expect(parseAuthSchemes('Negotiate, NTLM, Basic realm="secret-realm"')).toEqual([
      "Negotiate",
      "NTLM",
      "Basic",
    ]);
    expect(parseAuthSchemes("NTLM TlRMTVNTUAABAAAAB4IIogAAAAAAAAAAAAAAAAAAAAA=")).toEqual(["NTLM"]);
  });

  it("handles a missing header", () => {
    expect(parseAuthSchemes(null)).toEqual([]);
  });
});

describe("parseCookieNames", () => {
  it("returns cookie names without values or attributes", () => {
    const merged =
      "ASP.NET_SessionId=abc123; path=/; HttpOnly, .ASPXAUTH=zzz; expires=Wed, 21 Oct 2026 07:28:00 GMT; path=/";
    const names = parseCookieNames(merged);
    expect(names).toEqual(["ASP.NET_SessionId", ".ASPXAUTH"]);
    expect(names.join(" ")).not.toContain("abc123");
  });

  it("handles a missing header", () => {
    expect(parseCookieNames(null)).toEqual([]);
  });
});

describe("probeUrl", () => {
  it("refuses a host that is not on the allowlist before sending anything", async () => {
    await expect(probeUrl("https://evil.example.com/")).rejects.toBeInstanceOf(DisallowedHostError);
  });
});
