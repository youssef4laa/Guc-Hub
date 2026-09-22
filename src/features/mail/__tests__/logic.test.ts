import { formatBytes, formatFullDate, formatListDate } from "../logic/format";
import { sortMessages } from "../logic/sorting";
import { bodyToPlainText, makeSnippet } from "../logic/text";
import { mailLayoutFor } from "../hooks/useMailLayout";
import { rowToSummary, summaryToRow } from "../cache/rows";
import type { MailSummary } from "../schema";

function summary(overrides: Partial<MailSummary> = {}): MailSummary {
  return {
    id: "1",
    folderId: "inbox",
    subject: "Subject",
    from: { name: "Zoe Example", address: "zoe@example-guc.invalid" },
    to: [{ address: "demo.student@example-guc.invalid" }],
    date: "2026-09-21T10:00:00+03:00",
    snippet: "snippet",
    isRead: true,
    isFlagged: false,
    hasAttachments: false,
    ...overrides,
  };
}

describe("bodyToPlainText", () => {
  it("reads text out of HTML without markup, script or style content", () => {
    const text = bodyToPlainText({
      kind: "html",
      html: "<style>p{color:red}</style><script>alert(1)</script><p>Hello <b>there</b></p>",
    });
    expect(text).toBe("Hello there");
  });

  it("decodes the entities that show up in real email", () => {
    expect(bodyToPlainText({ kind: "html", html: "<p>A&nbsp;&amp;&nbsp;B</p>" })).toBe("A & B");
  });

  it("passes plain text through, collapsing whitespace", () => {
    expect(bodyToPlainText({ kind: "text", text: "line one\n\n   line two" })).toBe("line one line two");
  });
});

describe("makeSnippet", () => {
  it("truncates with an ellipsis and never exceeds the limit", () => {
    const snippet = makeSnippet({ kind: "text", text: "x".repeat(300) }, 50);
    expect(snippet).toHaveLength(50);
    expect(snippet.endsWith("…")).toBe(true);
  });

  it("leaves a short body untouched", () => {
    expect(makeSnippet({ kind: "text", text: "short" }, 50)).toBe("short");
  });
});

describe("sortMessages", () => {
  const older = summary({
    id: "older",
    date: "2026-09-20T10:00:00+03:00",
    from: { name: "Amy", address: "a@x.invalid" },
  });
  const newer = summary({
    id: "newer",
    date: "2026-09-21T10:00:00+03:00",
    from: { name: "zoe", address: "z@x.invalid" },
  });
  const unread = summary({ id: "unread", date: "2026-09-19T10:00:00+03:00", isRead: false });

  it("does not mutate the input array", () => {
    const input = [older, newer];
    sortMessages(input, "newest");
    expect(input.map((m) => m.id)).toEqual(["older", "newer"]);
  });

  it("sorts newest, oldest, sender and unread-first", () => {
    expect(sortMessages([older, newer], "newest").map((m) => m.id)).toEqual(["newer", "older"]);
    expect(sortMessages([newer, older], "oldest").map((m) => m.id)).toEqual(["older", "newer"]);
    expect(sortMessages([newer, older], "sender").map((m) => m.id)).toEqual(["older", "newer"]);
    expect(sortMessages([older, unread, newer], "unread")[0].id).toBe("unread");
  });

  it("falls back to the address when the sender has no name", () => {
    const anonymous = summary({ id: "anon", from: { address: "aaa@x.invalid" } });
    expect(sortMessages([summary({ id: "named" }), anonymous], "sender")[0].id).toBe("anon");
  });
});

describe("date and size formatting", () => {
  const now = new Date("2026-09-21T18:00:00+03:00");

  it("shows only the time for a message from today in Cairo", () => {
    expect(formatListDate("2026-09-21T10:05:00+03:00", now)).toBe("10:05 AM");
  });

  it("shows day and month within the same year, adding the year outside it", () => {
    expect(formatListDate("2026-09-02T10:00:00+03:00", now)).toBe("Sep 2");
    expect(formatListDate("2025-09-02T10:00:00+03:00", now)).toBe("Sep 2, 2025");
  });

  it("uses Cairo time regardless of the instant's own offset", () => {
    // 23:30 UTC on Sep 20 is 02:30 on Sep 21 in Cairo (UTC+3 during summer time).
    expect(formatListDate("2026-09-20T23:30:00Z", now)).toBe("2:30 AM");
  });

  it("formats a full date for the reader header", () => {
    expect(formatFullDate("2026-09-21T10:05:00+03:00")).toBe("Mon, Sep 21, 2026, 10:05 AM");
  });

  it("formats attachment sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1_500_000)).toBe("1.4 MB");
  });
});

describe("mailLayoutFor", () => {
  it("uses one pane on a phone and two on a tablet", () => {
    expect(mailLayoutFor(390, false).twoPane).toBe(false);
    expect(mailLayoutFor(1024, true).twoPane).toBe(true);
  });

  it("keeps the list pane within readable bounds", () => {
    expect(mailLayoutFor(1366, true).listPaneWidth).toBeLessThanOrEqual(400);
    expect(mailLayoutFor(768, true).listPaneWidth).toBeGreaterThanOrEqual(300);
  });
});

describe("cache rows", () => {
  it("round-trips a summary", () => {
    const original = summary();
    expect(rowToSummary(summaryToRow(original, 0))).toEqual(original);
  });

  it("stores a sortable timestamp alongside the json", () => {
    expect(summaryToRow(summary(), 123).date_ms).toBe(Date.parse("2026-09-21T10:00:00+03:00"));
  });

  it("returns null for corrupted or outdated rows instead of trusting them", () => {
    expect(rowToSummary({ data: "not json" })).toBeNull();
    expect(rowToSummary({ data: JSON.stringify({ id: "1" }) })).toBeNull();
  });
});
