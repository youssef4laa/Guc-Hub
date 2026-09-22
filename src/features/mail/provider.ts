import type { MailFolder, MailMessage, MailPage, MailSort, OutgoingMessage } from "./schema";

export interface ListMessagesOptions {
  folderId: string;
  sort: MailSort;
  /** From the previous page's `nextCursor`; omit or null for the first page. */
  cursor?: string | null;
  pageSize?: number;
}

export interface SearchMessagesOptions extends Omit<ListMessagesOptions, "folderId"> {
  query: string;
  /** Omit to search every folder. */
  folderId?: string;
}

/** Opaque handle returned by `deleteMessages`, passed back to `undoDelete`. */
export interface UndoToken {
  readonly id: string;
}

/**
 * Everything the mail UI needs from a mailbox, independent of protocol. The mock
 * implements it today; the real one lands after Spike 2
 * (docs/discovery/spike-2-mail-protocol.md) and must keep its session and
 * transport inside src/features/mail/ — see docs/PARALLEL_WORK.md.
 *
 * Failures throw `PortalError` (core/portal) so `ErrorState` renders them uniformly.
 */
export interface MailProvider {
  readonly id: string;
  listFolders(): Promise<MailFolder[]>;
  listMessages(options: ListMessagesOptions): Promise<MailPage>;
  getMessage(id: string): Promise<MailMessage>;
  search(options: SearchMessagesOptions): Promise<MailPage>;
  markRead(ids: string[], isRead: boolean): Promise<void>;
  /** Moves to Trash (or removes, if already there). Undoable until the next delete. */
  deleteMessages(ids: string[]): Promise<UndoToken>;
  undoDelete(token: UndoToken): Promise<void>;
  send(message: OutgoingMessage): Promise<void>;
}

export const DEFAULT_PAGE_SIZE = 20;
