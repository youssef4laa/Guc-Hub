import { PortalError } from "../../core/portal/PortalError";
import { parseSchedulePage } from "./parser";

describe("parseSchedulePage", () => {
  it("throws a typed NOT_IMPLEMENTED error instead of guessing at markup", () => {
    try {
      parseSchedulePage("<html></html>", "https://example.invalid/schedule");
      throw new Error("expected parseSchedulePage to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(PortalError);
      expect((error as PortalError).code).toBe("NOT_IMPLEMENTED");
    }
  });
});
