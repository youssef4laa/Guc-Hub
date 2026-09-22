import { MAX_ATTACHMENT_BYTES } from "../security/attachments";
import type { MailDraft, OutgoingAttachment, OutgoingMessage } from "../schema";
import { parseRecipients } from "./recipients";

/** Total size we're willing to hand to a mail server in one message. */
export const MAX_TOTAL_ATTACHMENT_BYTES = MAX_ATTACHMENT_BYTES;

export function createDraft(id: string, now: Date = new Date()): MailDraft {
  return {
    id,
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    text: "",
    attachments: [],
    updatedAt: now.toISOString(),
  };
}

/** Nothing worth keeping — used to avoid saving an untouched draft, or to discard on close. */
export function isDraftEmpty(draft: MailDraft): boolean {
  return (
    draft.to.trim() === "" &&
    draft.cc.trim() === "" &&
    draft.bcc.trim() === "" &&
    draft.subject.trim() === "" &&
    draft.text.trim() === "" &&
    draft.attachments.length === 0
  );
}

export function totalAttachmentBytes(attachments: OutgoingAttachment[]): number {
  return attachments.reduce((total, attachment) => total + attachment.sizeBytes, 0);
}

export type DraftProblem =
  | { code: "no-recipients" }
  | { code: "invalid-address"; entries: string[] }
  | { code: "attachments-too-large"; totalBytes: number; limitBytes: number };

export type DraftValidation =
  { ok: true; message: OutgoingMessage; warnings: DraftProblem[] } | { ok: false; problems: DraftProblem[] };

/**
 * Turns a draft into something `MailProvider.send` will accept, or explains why
 * it can't. An empty subject or body is allowed (people do send those); a
 * malformed recipient is not, because it would fail silently at the server.
 */
export function validateDraft(draft: MailDraft): DraftValidation {
  const to = parseRecipients(draft.to);
  const cc = parseRecipients(draft.cc);
  const bcc = parseRecipients(draft.bcc);

  const problems: DraftProblem[] = [];
  const invalid = [...to.invalid, ...cc.invalid, ...bcc.invalid];
  if (invalid.length > 0) problems.push({ code: "invalid-address", entries: invalid });
  if (to.addresses.length === 0) problems.push({ code: "no-recipients" });

  const totalBytes = totalAttachmentBytes(draft.attachments);
  if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
    problems.push({
      code: "attachments-too-large",
      totalBytes,
      limitBytes: MAX_TOTAL_ATTACHMENT_BYTES,
    });
  }

  if (problems.length > 0) return { ok: false, problems };

  return {
    ok: true,
    warnings: [],
    message: {
      to: to.addresses,
      cc: cc.addresses,
      bcc: bcc.addresses,
      subject: draft.subject.trim(),
      text: draft.text,
      attachments: draft.attachments,
    },
  };
}
