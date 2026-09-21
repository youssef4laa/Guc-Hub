const { sanitizeHtml, containsRealLookingEmail } = require("./sanitizeHtml");

describe("sanitizeHtml", () => {
  it("redacts email addresses", () => {
    const out = sanitizeHtml("<span>contact: ahmed.hassan@guc.edu.eg</span>");
    expect(out).not.toContain("ahmed.hassan@guc.edu.eg");
    expect(out).toContain("student@example-guc.invalid");
  });

  it("redacts GUC-shaped student IDs", () => {
    const out = sanitizeHtml("<td>48-1234</td><td>123456789</td>");
    expect(out).not.toContain("48-1234");
    expect(out).not.toContain("123456789");
  });

  it("redacts long token-looking attribute values but leaves short ones", () => {
    const out = sanitizeHtml('<input name="csrf_token" value="aVeryLongRandomLookingToken1234567890" />');
    expect(out).toContain('value="REDACTED"');
  });

  it("leaves ordinary markup untouched", () => {
    const html = '<div class="course-title">Computer Networks</div>';
    expect(sanitizeHtml(html)).toBe(html);
  });
});

describe("containsRealLookingEmail", () => {
  it("flags a real-looking email", () => {
    expect(containsRealLookingEmail("<p>ahmed@guc.edu.eg</p>")).toBe(true);
  });

  it("does not flag an already-sanitized email", () => {
    expect(containsRealLookingEmail("<p>student@example-guc.invalid</p>")).toBe(false);
  });

  it("does not flag markup with no email at all", () => {
    expect(containsRealLookingEmail("<p>no email here</p>")).toBe(false);
  });
});
