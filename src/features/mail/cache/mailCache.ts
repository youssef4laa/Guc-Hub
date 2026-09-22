import type { SQLiteDatabase } from "expo-sqlite";

import { createLogger } from "../../../core/logging";
import { openDatabase } from "../../../core/storage";
import { sortMessages } from "../logic/sorting";
import type { MailMessage, MailSort, MailSummary } from "../schema";
import { rowToMessage, rowToSummary, summaryToRow } from "./rows";

const log = createLogger("mail-cache");

/** How many recent summaries per folder are kept for the instant first paint. */
const CACHED_PER_FOLDER = 50;

/**
 * The cache is an optimisation, never a source of truth: every function here
 * swallows storage errors (logging only the error type, never message content)
 * and falls back to "nothing cached".
 */
async function withDb<T>(fallback: T, work: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  try {
    return await work(await openDatabase());
  } catch (error) {
    log.warn("mail cache unavailable", { error: error instanceof Error ? error.name : "unknown" });
    return fallback;
  }
}

export function readCachedSummaries(folderId: string, sort: MailSort): Promise<MailSummary[]> {
  return withDb([], async (db) => {
    const rows = await db.getAllAsync<{ data: string }>(
      "SELECT data FROM mail_summaries WHERE folder_id = ? ORDER BY date_ms DESC LIMIT ?",
      [folderId, CACHED_PER_FOLDER],
    );
    const summaries = rows.map(rowToSummary).filter((s): s is MailSummary => s !== null);
    return sortMessages(summaries, sort);
  });
}

/**
 * `replaceFolder` is set for a fresh first page: the folder's cached rows are
 * swapped for it, so messages deleted elsewhere don't linger in the cache.
 */
export function writeCachedSummaries(
  folderId: string,
  summaries: MailSummary[],
  { replaceFolder }: { replaceFolder: boolean },
): Promise<void> {
  return withDb(undefined, async (db) => {
    const now = Date.now();
    await db.withTransactionAsync(async () => {
      if (replaceFolder) await db.runAsync("DELETE FROM mail_summaries WHERE folder_id = ?", [folderId]);
      for (const summary of summaries) {
        const row = summaryToRow(summary, now);
        await db.runAsync(
          "INSERT OR REPLACE INTO mail_summaries (id, folder_id, date_ms, data, cached_at) VALUES (?, ?, ?, ?, ?)",
          [row.id, row.folder_id, row.date_ms, row.data, row.cached_at],
        );
      }
    });
  });
}

export function readCachedMessage(id: string): Promise<MailMessage | null> {
  return withDb(null, async (db) => {
    const row = await db.getFirstAsync<{ data: string }>("SELECT data FROM mail_messages WHERE id = ?", [id]);
    return row ? rowToMessage(row) : null;
  });
}

export function writeCachedMessage(message: MailMessage): Promise<void> {
  return withDb(undefined, async (db) => {
    await db.runAsync("INSERT OR REPLACE INTO mail_messages (id, data, cached_at) VALUES (?, ?, ?)", [
      message.id,
      JSON.stringify(message),
      Date.now(),
    ]);
  });
}

/** Keeps the cached read-state in step with an optimistic mark-read. */
export function updateCachedReadState(ids: string[], isRead: boolean): Promise<void> {
  return withDb(undefined, async (db) => {
    for (const id of ids) {
      for (const table of ["mail_summaries", "mail_messages"] as const) {
        const row = await db.getFirstAsync<{ data: string }>(`SELECT data FROM ${table} WHERE id = ?`, [id]);
        if (!row) continue;
        const updated = { ...JSON.parse(row.data), isRead };
        await db.runAsync(`UPDATE ${table} SET data = ? WHERE id = ?`, [JSON.stringify(updated), id]);
      }
    }
  });
}
