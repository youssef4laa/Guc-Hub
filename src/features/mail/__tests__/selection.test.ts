import { bulkReadAction, isAllSelected, pruneSelection, toggleSelected } from "../logic/selection";
import type { MailSummary } from "../schema";

function summary(id: string, isRead = true): MailSummary {
  return {
    id,
    folderId: "inbox",
    subject: `Subject ${id}`,
    from: { address: "someone@example-guc.invalid" },
    to: [],
    date: "2026-09-22T10:00:00+03:00",
    snippet: "",
    isRead,
    isFlagged: false,
    hasAttachments: false,
  };
}

describe("toggleSelected", () => {
  it("adds then removes an id, without mutating the input", () => {
    const initial: string[] = [];
    const added = toggleSelected(initial, "a");
    expect(added).toEqual(["a"]);
    expect(toggleSelected(added, "a")).toEqual([]);
    expect(initial).toEqual([]);
  });
});

describe("pruneSelection", () => {
  it("drops ids that are no longer in the list", () => {
    expect(pruneSelection(["a", "gone"], [summary("a"), summary("b")])).toEqual(["a"]);
  });

  it("keeps the selection untouched when everything is still there", () => {
    expect(pruneSelection(["a", "b"], [summary("a"), summary("b")])).toEqual(["a", "b"]);
  });
});

describe("isAllSelected", () => {
  it("is true only when every visible message is selected", () => {
    const messages = [summary("a"), summary("b")];
    expect(isAllSelected(["a", "b"], messages)).toBe(true);
    expect(isAllSelected(["a"], messages)).toBe(false);
  });

  it("is false for an empty list, so 'select all' can't claim everything is chosen", () => {
    expect(isAllSelected([], [])).toBe(false);
  });
});

describe("bulkReadAction", () => {
  it("marks read when anything selected is unread", () => {
    const messages = [summary("a", false), summary("b", true)];
    expect(bulkReadAction(["a", "b"], messages)).toBe("read");
  });

  it("marks unread when everything selected is already read", () => {
    const messages = [summary("a", true), summary("b", true)];
    expect(bulkReadAction(["a", "b"], messages)).toBe("unread");
  });

  it("ignores messages that aren't selected", () => {
    const messages = [summary("a", true), summary("unselected", false)];
    expect(bulkReadAction(["a"], messages)).toBe("unread");
  });
});
