import { DisallowedHostError, gucFetch } from "../client";
import { HTTP_ALLOWLIST } from "../config";

describe("gucFetch host allowlist", () => {
  it("rejects a host that is not on the allowlist", async () => {
    expect(HTTP_ALLOWLIST).not.toContain("evil.example.com");
    await expect(gucFetch("https://evil.example.com/steal")).rejects.toBeInstanceOf(DisallowedHostError);
  });

  it("rejects even a look-alike GUC subdomain that was never added", async () => {
    await expect(gucFetch("https://guc-portal.evil.example.com/")).rejects.toBeInstanceOf(
      DisallowedHostError,
    );
  });
});
