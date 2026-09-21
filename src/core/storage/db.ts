import * as SQLite from "expo-sqlite";

import { createLogger } from "../logging";
import type { Migration } from "./migrations";
import { runMigrations } from "./migrations";

const log = createLogger("storage-db");

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Opens the single app database and applies every feature's migrations, in order.
 * Call once at startup with the merged list from all feature manifests
 * (the registry generator collects `migrations` exports the same way it collects
 * `manifest.ts`).
 */
export async function openDatabase(migrations: Migration[]): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync("guc-hub.db");
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await runMigrations(db, migrations);
  dbInstance = db;
  log.info("database ready", { migrationCount: migrations.length });
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
