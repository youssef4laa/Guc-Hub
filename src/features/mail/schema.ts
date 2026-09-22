import { z } from "zod";

// The mail feature's data shapes, owned only here. Protocol-neutral on purpose:
// whichever transport Spike 2 picks (Graph, EWS, IMAP, OWA) maps into these.

export const mailAddressSchema = z.object({
  name: z.string().optional(),
  address: z.string(),
});
export type MailAddress = z.infer<typeof mailAddressSchema>;

export const mailFolderRoleSchema = z.enum(["inbox", "sent", "drafts", "archive", "trash", "junk", "other"]);
export type MailFolderRole = z.infer<typeof mailFolderRoleSchema>;

export const mailFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: mailFolderRoleSchema,
  unreadCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
});
export type MailFolder = z.infer<typeof mailFolderSchema>;

export const attachmentMetaSchema = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().min(0),
});
export type AttachmentMeta = z.infer<typeof attachmentMetaSchema>;

/** What the list needs — never the body, so a page of these stays small. */
export const mailSummarySchema = z.object({
  id: z.string(),
  folderId: z.string(),
  subject: z.string(),
  from: mailAddressSchema,
  to: z.array(mailAddressSchema),
  /** ISO 8601 with offset. */
  date: z.iso.datetime({ offset: true }),
  snippet: z.string(),
  isRead: z.boolean(),
  isFlagged: z.boolean(),
  hasAttachments: z.boolean(),
});
export type MailSummary = z.infer<typeof mailSummarySchema>;

/** Email bodies are untrusted: `html` is only ever rendered after `security/sanitizeHtml.ts`. */
export const mailBodySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("html"), html: z.string() }),
  z.object({ kind: z.literal("text"), text: z.string() }),
]);
export type MailBody = z.infer<typeof mailBodySchema>;

export const mailMessageSchema = mailSummarySchema.extend({
  cc: z.array(mailAddressSchema),
  body: mailBodySchema,
  attachments: z.array(attachmentMetaSchema),
});
export type MailMessage = z.infer<typeof mailMessageSchema>;

export const mailPageSchema = z.object({
  messages: z.array(mailSummarySchema),
  /** Opaque to callers; null when there are no more pages. */
  nextCursor: z.string().nullable(),
});
export type MailPage = z.infer<typeof mailPageSchema>;

export const mailSortSchema = z.enum(["newest", "oldest", "sender", "unread"]);
export type MailSort = z.infer<typeof mailSortSchema>;

export const outgoingAttachmentSchema = z.object({
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().min(0),
  /** Local file URI (e.g. from expo-document-picker). Never a remote URL. */
  uri: z.string(),
});
export type OutgoingAttachment = z.infer<typeof outgoingAttachmentSchema>;

export const outgoingMessageSchema = z.object({
  to: z.array(mailAddressSchema).min(1),
  cc: z.array(mailAddressSchema),
  bcc: z.array(mailAddressSchema),
  subject: z.string(),
  /** Plain text only for now; compose is phase 2. */
  text: z.string(),
  attachments: z.array(outgoingAttachmentSchema),
});
export type OutgoingMessage = z.infer<typeof outgoingMessageSchema>;
