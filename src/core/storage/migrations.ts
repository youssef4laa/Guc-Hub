import type { SQLiteDatabase } from "expo-sqlite";

export interface Migration {
  /** Numbered within this feature only (1, 2, 3, ...) — never a global counter. */
  version: number;
  /** e.g. "custom_events" — shown in migration logs, prefixed with the feature id. */
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export interface FeatureMigrations {
  featureId: string;
  migrations: Migration[];
}

const TRACKING_TABLE = "_guc_hub_migrations";

/**
 * Each feature numbers its own migrations 1, 2, 3, ... independently — there is
 * no shared counter to collide on (a single SQLite `PRAGMA user_version` can't
 * express "feature A is at version 3, feature B is at version 1" at the same
 * time, so we don't use it). Applied migrations are tracked per
 * `(feature_id, version)` in `_guc_hub_migrations` instead.
 */
export async function runMigrations(db: SQLiteDatabase, features: FeatureMigrations[]): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      feature_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      applied_at INTEGER NOT NULL,
      PRIMARY KEY (feature_id, version)
    );`,
  );

  for (const { featureId, migrations } of features) {
    const sorted = [...migrations].sort((a, b) => a.version - b.version);
    const applied = await db.getAllAsync<{ version: number }>(
      `SELECT version FROM ${TRACKING_TABLE} WHERE feature_id = ?`,
      [featureId],
    );
    const appliedVersions = new Set(applied.map((row) => row.version));

    for (const migration of sorted) {
      if (appliedVersions.has(migration.version)) continue;
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await db.runAsync(
          `INSERT INTO ${TRACKING_TABLE} (feature_id, version, applied_at) VALUES (?, ?, ?)`,
          [featureId, migration.version, Date.now()],
        );
      });
    }
  }
}
