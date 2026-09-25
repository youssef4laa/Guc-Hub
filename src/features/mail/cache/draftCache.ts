import type { SQLiteDatabase } from "expo-sqlite";

import { createLogger } from "../../../core/logging";
import { openDatabase } from "../../../core/storage";
import { mailDraftSchema, type MailDraft } from "../schema";

const log = createLogger("mail-drafts");

/**
 * Drafts live only on the device (there is no server to sync them to yet), in
 * the feature's own SQLite tables. Like the message cache, every call fails soft:
 * losing a draft is bad, but crashing the compose screen is worse, so storage
 * errors are logged (never their contents) and reported as "nothing saved".
 */
async function withDb<T>(fallback: T, work: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  try {
    return await work(await openDatabase());
  } catch (error) {
    log.warn("draft storage unavailable", { error: error instanceof Error ? error.name : "unknown" });
    return fallback;
  }
}

export function saveDraft(draft: MailDraft): Promise<boolean> {
  return withDb(false, async (db) => {
    await db.runAsync("INSERT OR REPLACE INTO mail_drafts (id, data, updated_at) VALUES (?, ?, ?)", [
      draft.id,
      JSON.stringify(draft),
      Date.parse(draft.updatedAt) || Date.now(),
    ]);
    return true;
  });
}

export function loadDraft(id: string): Promise<MailDraft | null> {
  return withDb(null, async (db) => {
    const row = await db.getFirstAsync<{ data: string }>("SELECT data FROM mail_drafts WHERE id = ?", [id]);
    if (!row) return null;
    // A draft written by an older version that no longer matches the schema is
    // dropped rather than trusted into the compose screen.
    const parsed = mailDraftSchema.safeParse(JSON.parse(row.data));
    return parsed.success ? parsed.data : null;
  });
}

export function listDrafts(limit = 50): Promise<MailDraft[]> {
  return withDb([], async (db) => {
    const rows = await db.getAllAsync<{ data: string }>(
      "SELECT data FROM mail_drafts ORDER BY updated_at DESC LIMIT ?",
      [limit],
    );
    return rows
      .map((row) => mailDraftSchema.safeParse(JSON.parse(row.data)))
      .filter((result) => result.success)
      .map((result) => result.data);
  });
}

export function deleteDraft(id: string): Promise<void> {
  return withDb(undefined, async (db) => {
    await db.runAsync("DELETE FROM mail_drafts WHERE id = ?", [id]);
  });
}
