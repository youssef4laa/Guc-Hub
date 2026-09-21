import type { SQLiteDatabase } from "expo-sqlite";

export interface Migration {
  /** Monotonically increasing; used only to sort, not to skip-detect (SQLite user_version handles that). */
  version: number;
  /** e.g. "schedule.custom_events" — shown in migration logs. */
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * Each feature exports its own `Migration[]` from its folder (no shared schema file —
 * see ARCHITECTURE.md). `runMigrations` merges every feature's list, sorts by
 * version, and applies whichever are newer than the DB's current `user_version`.
 */
export async function runMigrations(db: SQLiteDatabase, migrations: Migration[]): Promise<void> {
  const sorted = [...migrations].sort((a, b) => a.version - b.version);
  const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let current = result?.user_version ?? 0;

  for (const migration of sorted) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
    current = migration.version;
  }
}
