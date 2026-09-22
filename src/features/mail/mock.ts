import { z } from "zod";

import mailboxFixture from "../../../fixtures/mail/mock-mailbox.json";
import { PortalError } from "../../core/portal/PortalError";
import { bodyToPlainText, makeSnippet } from "./logic/text";
import { sortMessages } from "./logic/sorting";
import {
  DEFAULT_PAGE_SIZE,
  type ListMessagesOptions,
  type MailProvider,
  type SearchMessagesOptions,
  type UndoToken,
} from "./provider";
import {
  type AttachmentContent,
  mailFolderSchema,
  mailMessageSchema,
  outgoingMessageSchema,
  type MailFolder,
  type MailMessage,
  type MailPage,
  type MailSummary,
  type OutgoingMessage,
} from "./schema";

// Fixture shape: counts and snippets are derived, so they can't drift from the data.
export const mailboxFixtureSchema = z.object({
  folders: z.array(mailFolderSchema.omit({ unreadCount: true, totalCount: true })),
  messages: z.array(mailMessageSchema.omit({ snippet: true, hasAttachments: true })),
});
export type MailboxFixture = z.infer<typeof mailboxFixtureSchema>;

export interface MockMailProviderOptions {
  /** Simulated network latency, so skeletons and refresh states are visible in demo mode. */
  latencyMs?: number;
  /** Dates are shifted so the newest message lands 20 minutes before this. */
  now?: Date;
}

const REBASE_GAP_MS = 20 * 60 * 1000;

/**
 * Demo-mode mailbox. Keeps its state in memory for the app session, so marking
 * read, deleting and sending behave like a real mailbox until the app restarts.
 */
export class MockMailProvider implements MailProvider {
  readonly id = "mock";
  private folders: Omit<MailFolder, "unreadCount" | "totalCount">[];
  private messages: MailMessage[];
  private readonly latencyMs: number;
  private pendingUndo: { token: UndoToken; previous: Map<string, string>; removed: MailMessage[] } | null =
    null;
  private nextId = 1;

  constructor(fixture: unknown = mailboxFixture, options: MockMailProviderOptions = {}) {
    const parsed = mailboxFixtureSchema.parse(fixture);
    this.latencyMs = options.latencyMs ?? 350;
    this.folders = parsed.folders;
    this.messages = rebaseDates(
      parsed.messages.map((m) => ({
        ...m,
        snippet: makeSnippet(m.body),
        hasAttachments: m.attachments.length > 0,
      })),
      options.now ?? new Date(),
    );
  }

  async listFolders(): Promise<MailFolder[]> {
    await this.delay();
    return this.folders.map((folder) => {
      const inFolder = this.messages.filter((m) => m.folderId === folder.id);
      return {
        ...folder,
        totalCount: inFolder.length,
        unreadCount: inFolder.filter((m) => !m.isRead).length,
      };
    });
  }

  async listMessages({ folderId, sort, cursor, pageSize }: ListMessagesOptions): Promise<MailPage> {
    await this.delay();
    if (!this.folders.some((f) => f.id === folderId)) {
      throw new PortalError("PORTAL_UNAVAILABLE", `Unknown folder "${folderId}".`);
    }
    return paginate(
      sortMessages(
        this.messages.filter((m) => m.folderId === folderId),
        sort,
      ),
      cursor,
      pageSize,
    );
  }

  async getMessage(id: string): Promise<MailMessage> {
    await this.delay();
    const message = this.messages.find((m) => m.id === id);
    if (!message) throw new PortalError("PORTAL_UNAVAILABLE", "That message no longer exists.");
    // A copy, so callers can never mutate the mailbox state directly.
    return JSON.parse(JSON.stringify(message)) as MailMessage;
  }

  async getAttachment(messageId: string, attachmentId: string): Promise<AttachmentContent> {
    await this.delay();
    const message = this.messages.find((m) => m.id === messageId);
    const attachment = message?.attachments.find((a) => a.id === attachmentId);
    if (!attachment) throw new PortalError("PORTAL_UNAVAILABLE", "That attachment is no longer available.");

    // Demo mode has no real bytes: synthesise readable placeholder content so the
    // download-and-share path can be exercised end to end without a server.
    const placeholder =
      `This is a placeholder for "${attachment.filename}" from the Guc Hub demo mailbox.\n` +
      `No real attachment content exists in demo mode.\n`;
    return { ...attachment, base64: toBase64(placeholder) };
  }

  async search({ query, folderId, sort, cursor, pageSize }: SearchMessagesOptions): Promise<MailPage> {
    await this.delay();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = this.messages.filter((m) => {
      if (folderId && m.folderId !== folderId) return false;
      const haystack = [m.subject, m.from.name ?? "", m.from.address, bodyToPlainText(m.body)]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
    return paginate(sortMessages(matches, sort), cursor, pageSize);
  }

  async markRead(ids: string[], isRead: boolean): Promise<void> {
    await this.delay();
    for (const message of this.messages) {
      if (ids.includes(message.id)) message.isRead = isRead;
    }
  }

  async deleteMessages(ids: string[]): Promise<UndoToken> {
    await this.delay();
    const trashId = this.folders.find((f) => f.role === "trash")?.id;
    const previous = new Map<string, string>();
    const removed: MailMessage[] = [];

    for (const message of this.messages.filter((m) => ids.includes(m.id))) {
      if (!trashId || message.folderId === trashId) {
        removed.push(message);
      } else {
        previous.set(message.id, message.folderId);
        message.folderId = trashId;
      }
    }
    this.messages = this.messages.filter((m) => !removed.includes(m));

    const token = { id: `undo-${this.nextId++}` };
    this.pendingUndo = { token, previous, removed };
    return token;
  }

  async undoDelete(token: UndoToken): Promise<void> {
    await this.delay();
    if (!this.pendingUndo || this.pendingUndo.token.id !== token.id) {
      throw new PortalError("PORTAL_UNAVAILABLE", "This delete can no longer be undone.");
    }
    const { previous, removed } = this.pendingUndo;
    for (const message of this.messages) {
      const folderId = previous.get(message.id);
      if (folderId) message.folderId = folderId;
    }
    this.messages.push(...removed);
    this.pendingUndo = null;
  }

  async send(message: OutgoingMessage): Promise<void> {
    const outgoing = outgoingMessageSchema.parse(message);
    await this.delay();
    const sentId = this.folders.find((f) => f.role === "sent")?.id ?? "sent";
    const body = { kind: "text" as const, text: outgoing.text };
    this.messages.push({
      id: `sent-${this.nextId++}`,
      folderId: sentId,
      subject: outgoing.subject,
      from: { name: "Demo Student", address: "demo.student@example-guc.invalid" },
      to: outgoing.to,
      cc: outgoing.cc,
      date: new Date().toISOString(),
      snippet: makeSnippet(body),
      isRead: true,
      isFlagged: false,
      hasAttachments: outgoing.attachments.length > 0,
      body,
      attachments: outgoing.attachments.map((a, i) => ({
        id: `sent-att-${i}`,
        filename: a.filename,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
      })),
    });
  }

  private delay(): Promise<void> {
    if (this.latencyMs <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }
}

/**
 * Hermes has no Buffer, and TextEncoder differs between Hermes and Node, so this
 * sticks to btoa over ASCII. Demo placeholder content only — a real provider will
 * return the server's own base64.
 */
function toBase64(text: string): string {
  return btoa(text.replace(/[^\x20-\x7e\n]/g, "?"));
}

function toSummary({
  cc: _cc,
  body: _body,
  attachments: _attachments,
  ...summary
}: MailMessage): MailSummary {
  return summary;
}

function paginate(sorted: MailMessage[], cursor?: string | null, pageSize = DEFAULT_PAGE_SIZE): MailPage {
  const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
  const slice = sorted.slice(offset, offset + pageSize);
  const nextOffset = offset + slice.length;
  return {
    messages: slice.map(toSummary),
    nextCursor: nextOffset < sorted.length ? String(nextOffset) : null,
  };
}

function rebaseDates(messages: MailMessage[], now: Date): MailMessage[] {
  if (messages.length === 0) return messages;
  const newest = Math.max(...messages.map((m) => Date.parse(m.date)));
  const shift = now.getTime() - REBASE_GAP_MS - newest;
  return messages.map((m) => ({ ...m, date: new Date(Date.parse(m.date) + shift).toISOString() }));
}
