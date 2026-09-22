import type { Migration } from "../../core/storage";

/**
 * Local mail cache (see cache/mailCache.ts). Numbered independently of every
 * other feature — core/storage tracks (feature_id, version) pairs.
 *
 * Rows hold the zod-validated JSON of a summary/message plus the few columns we
 * filter on. Sorting happens in JS with the same comparator as the provider, so
 * the cached list and the fresh list always agree on order.
 */
export const migrations: Migration[] = [
  {
    version: 1,
    name: "create_mail_cache",
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS mail_summaries (
          id TEXT PRIMARY KEY NOT NULL,
          folder_id TEXT NOT NULL,
          date_ms INTEGER NOT NULL,
          data TEXT NOT NULL,
          cached_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS mail_summaries_folder_date ON mail_summaries (folder_id, date_ms DESC);
        CREATE TABLE IF NOT EXISTS mail_messages (
          id TEXT PRIMARY KEY NOT NULL,
          data TEXT NOT NULL,
          cached_at INTEGER NOT NULL
        );
      `);
    },
  },
];
