import * as SQLite from "expo-sqlite";

import { createLogger } from "../logging";
import { featureMigrations } from "./migrations.generated";
import { runMigrations } from "./migrations";

const log = createLogger("storage-db");

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Opens the single app database and applies every feature's migrations (from
 * `migrations.generated.ts`, which `tools/gen-registry.js` builds by statically
 * importing each feature's own `migrations.ts` — nobody edits a shared list).
 */
export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync("guc-hub.db");
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await runMigrations(db, featureMigrations);
  dbInstance = db;
  log.info("database ready", { featureCount: featureMigrations.length });
  return db;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) throw new Error("openDatabase() must be awaited before getDatabase().");
  return dbInstance;
}

/** Test-only: forgets the cached instance so a fresh in-memory DB can be opened. */
export function __resetForTests(): void {
  dbInstance = null;
}
