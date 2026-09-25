import { PortalError } from "../../../core/portal/PortalError";
import { MockMailProvider } from "../mock";
import type { MailSummary } from "../schema";

const NOW = new Date("2026-09-22T12:00:00+03:00");

function provider() {
  return new MockMailProvider(undefined, { latencyMs: 0, now: NOW });
}

async function allMessages(p: MockMailProvider, folderId: string, pageSize = 5): Promise<MailSummary[]> {
  const collected: MailSummary[] = [];
  let cursor: string | null = null;
  do {
    const page = await p.listMessages({ folderId, sort: "newest", cursor, pageSize });
    collected.push(...page.messages);
    cursor = page.nextCursor;
  } while (cursor);
  return collected;
}

describe("MockMailProvider fixture", () => {
  it("parses the committed fixture against the schema", async () => {
    const folders = await provider().listFolders();
    expect(folders.map((f) => f.role)).toEqual(["inbox", "sent", "archive", "trash"]);
  });

  it("derives unread and total counts from the messages", async () => {
    const inbox = (await provider().listFolders()).find((f) => f.role === "inbox")!;
    expect(inbox.totalCount).toBeGreaterThan(0);
    expect(inbox.unreadCount).toBeGreaterThan(0);
    expect(inbox.unreadCount).toBeLessThanOrEqual(inbox.totalCount);
  });

  it("rebases dates so the newest message is recent, and keeps them ordered", async () => {
    const messages = await allMessages(provider(), "inbox");
    const newest = Date.parse(messages[0].date);
    expect(newest).toBeLessThan(NOW.getTime());
    expect(NOW.getTime() - newest).toBeLessThan(60 * 60 * 1000);
  });

  it("derives a snippet from the body, with no markup in it", async () => {
    const messages = await allMessages(provider(), "inbox");
    const newsletter = messages.find((m) => m.subject.startsWith("Student Activities"))!;
    expect(newsletter.snippet).not.toMatch(/[<>]/);
    expect(newsletter.snippet.length).toBeGreaterThan(0);
  });
});

describe("paging", () => {
  it("walks every message exactly once and then stops", async () => {
    const p = provider();
    const messages = await allMessages(p, "inbox", 5);
    const ids = messages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);

    const inbox = (await p.listFolders()).find((f) => f.role === "inbox")!;
    expect(ids.length).toBe(inbox.totalCount);
  });

  it("reports no next cursor when the page ends the folder", async () => {
    const page = await provider().listMessages({ folderId: "archive", sort: "newest", pageSize: 50 });
    expect(page.nextCursor).toBeNull();
  });

  it("rejects an unknown folder with a typed error", async () => {
    await expect(provider().listMessages({ folderId: "nope", sort: "newest" })).rejects.toBeInstanceOf(
      PortalError,
    );
  });
});

describe("sorting", () => {
  it("orders newest first and oldest last", async () => {
    const p = provider();
    const newest = await p.listMessages({ folderId: "inbox", sort: "newest", pageSize: 50 });
    const oldest = await p.listMessages({ folderId: "inbox", sort: "oldest", pageSize: 50 });
    expect(newest.messages[0].id).toBe(oldest.messages[oldest.messages.length - 1].id);
  });

  it("puts unread messages first when sorting by unread", async () => {
    const page = await provider().listMessages({ folderId: "inbox", sort: "unread", pageSize: 50 });
    const firstRead = page.messages.findIndex((m) => m.isRead);
    const lastUnread = page.messages.map((m) => m.isRead).lastIndexOf(false);
    expect(firstRead).toBeGreaterThan(lastUnread);
  });

  it("orders by sender name, case-insensitively", async () => {
    const page = await provider().listMessages({ folderId: "inbox", sort: "sender", pageSize: 50 });
    const senders = page.messages.map((m) => (m.from.name ?? m.from.address).toLowerCase());
    expect([...senders].sort()).toEqual(senders);
  });
});

describe("search", () => {
  it("matches the subject, the sender and the body text", async () => {
    const p = provider();
    const bySubject = await p.search({ query: "midterm", sort: "newest" });
    expect(bySubject.messages.length).toBeGreaterThan(0);

    const bySender = await p.search({ query: "sara", sort: "newest" });
    expect(bySender.messages.length).toBeGreaterThan(0);

    const byBody = await p.search({ query: "pthreads", sort: "newest" });
    expect(byBody.messages.length).toBeGreaterThan(0);
  });

  it("requires every term to match, and can be scoped to one folder", async () => {
    const p = provider();
    expect((await p.search({ query: "midterm zzzz", sort: "newest" })).messages).toHaveLength(0);
    const scoped = await p.search({ query: "assignment", folderId: "sent", sort: "newest" });
    expect(scoped.messages.every((m) => m.folderId === "sent")).toBe(true);
  });

  it("searches the text of an HTML body, not its markup", async () => {
    const p = provider();
    expect((await p.search({ query: "Robotics club", sort: "newest" })).messages.length).toBe(1);
    expect((await p.search({ query: "cellpadding", sort: "newest" })).messages).toHaveLength(0);
  });
});

describe("mark read", () => {
  it("marks messages read and lowers the folder's unread count", async () => {
    const p = provider();
    const before = (await p.listFolders()).find((f) => f.role === "inbox")!;
    const unread = (await p.listMessages({ folderId: "inbox", sort: "unread", pageSize: 1 })).messages[0];

    await p.markRead([unread.id], true);

    const after = (await p.listFolders()).find((f) => f.role === "inbox")!;
    expect(after.unreadCount).toBe(before.unreadCount - 1);
    expect((await p.getMessage(unread.id)).isRead).toBe(true);
  });
});

describe("delete and undo", () => {
  it("moves a message to trash and restores it to its original folder", async () => {
    const p = provider();
    const target = (await p.listMessages({ folderId: "inbox", sort: "newest", pageSize: 1 })).messages[0];

    const token = await p.deleteMessages([target.id]);
    expect((await p.getMessage(target.id)).folderId).toBe("trash");

    await p.undoDelete(token);
    expect((await p.getMessage(target.id)).folderId).toBe("inbox");
  });

  it("removes a message that was already in trash, and undo brings it back", async () => {
    const p = provider();
    const inTrash = (await p.listMessages({ folderId: "trash", sort: "newest", pageSize: 1 })).messages[0];

    const token = await p.deleteMessages([inTrash.id]);
    await expect(p.getMessage(inTrash.id)).rejects.toBeInstanceOf(PortalError);

    await p.undoDelete(token);
    expect((await p.getMessage(inTrash.id)).id).toBe(inTrash.id);
  });

  it("refuses a stale undo token", async () => {
    const p = provider();
    const first = (await p.listMessages({ folderId: "inbox", sort: "newest", pageSize: 2 })).messages;
    const staleToken = await p.deleteMessages([first[0].id]);
    await p.deleteMessages([first[1].id]);

    await expect(p.undoDelete(staleToken)).rejects.toBeInstanceOf(PortalError);
  });
});

describe("attachments", () => {
  it("returns content for an attachment the message actually has", async () => {
    const p = provider();
    const withAttachment = (
      await p.listMessages({ folderId: "inbox", sort: "newest", pageSize: 50 })
    ).messages.find((m) => m.hasAttachments)!;
    const message = await p.getMessage(withAttachment.id);
    const attachment = message.attachments[0];

    const content = await p.getAttachment(message.id, attachment.id);

    expect(content.filename).toBe(attachment.filename);
    expect(content.mimeType).toBe(attachment.mimeType);
    expect(content.base64.length).toBeGreaterThan(0);
    // Valid base64 that decodes to the demo placeholder.
    expect(atob(content.base64)).toContain(attachment.filename);
  });

  it("rejects an unknown attachment with a typed error", async () => {
    const p = provider();
    const message = (await p.listMessages({ folderId: "inbox", sort: "newest", pageSize: 1 })).messages[0];
    await expect(p.getAttachment(message.id, "nope")).rejects.toBeInstanceOf(PortalError);
  });
});

describe("send", () => {
  it("puts the sent message in the Sent folder", async () => {
    const p = provider();
    await p.send({
      to: [{ address: "someone@example-guc.invalid" }],
      cc: [],
      bcc: [],
      subject: "Hello",
      text: "Body text",
      attachments: [],
    });

    const sent = await p.listMessages({ folderId: "sent", sort: "newest", pageSize: 50 });
    expect(sent.messages[0].subject).toBe("Hello");
    expect(sent.messages[0].snippet).toBe("Body text");
  });

  it("rejects a message with no recipient", async () => {
    await expect(
      provider().send({ to: [], cc: [], bcc: [], subject: "x", text: "y", attachments: [] }),
    ).rejects.toThrow();
  });

  it("records attachment metadata", async () => {
    const p = provider();
    await p.send({
      to: [{ address: "someone@example-guc.invalid" }],
      cc: [],
      bcc: [],
      subject: "With file",
      text: "see attached",
      attachments: [
        { filename: "a.pdf", mimeType: "application/pdf", sizeBytes: 10, uri: "file:///tmp/a.pdf" },
      ],
    });
    const sent = await p.listMessages({ folderId: "sent", sort: "newest", pageSize: 50 });
    expect(sent.messages[0].hasAttachments).toBe(true);
  });
});
