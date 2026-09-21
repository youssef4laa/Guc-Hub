import { createLogger } from "../logger";
import { redactString, redactValue } from "../redact";

describe("redact", () => {
  it("masks password-shaped values in strings", () => {
    expect(redactString("password: hunter2")).not.toContain("hunter2");
    expect(redactString("Authorization: Bearer abc.def.ghi")).not.toContain("abc.def.ghi");
  });

  it("masks known-sensitive object keys recursively", () => {
    const out = redactValue({
      username: "student1",
      password: "hunter2",
      session: { token: "xyz", cookie: "abc" },
    }) as Record<string, unknown>;
    expect(out.username).toBe("student1");
    expect(out.password).toBe("[REDACTED]");
    expect((out.session as Record<string, unknown>).token).toBe("[REDACTED]");
    expect((out.session as Record<string, unknown>).cookie).toBe("[REDACTED]");
  });

  it("never lets a real credential string reach the console", () => {
    const secret = "s3cr3t-guc-password-42";
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createLogger("test");
    logger.debug("logging in", { password: secret });
    const allOutput = spy.mock.calls.flat().map(String).join("\n");
    expect(allOutput).not.toContain(secret);
    spy.mockRestore();
  });
});
