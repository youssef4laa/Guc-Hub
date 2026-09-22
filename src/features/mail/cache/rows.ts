import { mailMessageSchema, mailSummarySchema, type MailMessage, type MailSummary } from "../schema";

export interface SummaryRow {
  id: string;
  folder_id: string;
  date_ms: number;
  data: string;
  cached_at: number;
}

export function summaryToRow(summary: MailSummary, now: number): SummaryRow {
  return {
    id: summary.id,
    folder_id: summary.folderId,
    date_ms: Date.parse(summary.date),
    data: JSON.stringify(summary),
    cached_at: now,
  };
}

/** Rows written by an older app version (or corrupted) are skipped, never trusted. */
export function rowToSummary(row: Pick<SummaryRow, "data">): MailSummary | null {
  return parseJson(row.data, mailSummarySchema.safeParse);
}

export function rowToMessage(row: { data: string }): MailMessage | null {
  return parseJson(row.data, mailMessageSchema.safeParse);
}

function parseJson<T>(raw: string, safeParse: (value: unknown) => { success: boolean; data?: T }): T | null {
  try {
    const result = safeParse(JSON.parse(raw));
    return result.success ? (result.data ?? null) : null;
  } catch {
    return null;
  }
}
