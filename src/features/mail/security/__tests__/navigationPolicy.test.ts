import { decideNavigation, EMAIL_BASE_URL } from "../navigationPolicy";

describe("decideNavigation", () => {
  it("allows the document we loaded ourselves, and in-page anchors", () => {
    expect(decideNavigation(EMAIL_BASE_URL).action).toBe("allow");
    expect(decideNavigation(`${EMAIL_BASE_URL}#section`).action).toBe("allow");
  });

  it("asks before leaving for an external http(s) link, reporting the real host", () => {
    const decision = decideNavigation("https://example.org/path?a=1");
    expect(decision).toEqual({
      action: "confirm-external",
      url: "https://example.org/path?a=1",
      host: "example.org",
    });
  });

  it("asks before opening a mailto link", () => {
    const decision = decideNavigation("mailto:someone@example-guc.invalid");
    expect(decision.action).toBe("confirm-external");
  });

  it("blocks javascript:, data:, file: and anything unparseable", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,<script>", "file:///etc/passwd", "not a url"]) {
      expect(decideNavigation(url).action).toBe("block");
    }
  });

  it("does not treat a look-alike host as our own document", () => {
    expect(decideNavigation("https://about-blank.example.invalid/").action).toBe("confirm-external");
  });
});
