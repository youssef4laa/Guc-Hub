import type { Migration } from "../../core/storage";

/**
 * This feature's own SQLite migrations, numbered 1, 2, 3, ... independently of
 * every other feature (see core/storage/migrations.ts — there is no shared
 * counter). `tools/gen-registry.js` collects this into `migrations.generated.ts`.
 * Leave the array empty if this feature has no local data yet.
 */
export const migrations: Migration[] = [
  // {
  //   version: 1,
  //   name: "create_items_table",
  //   up: async (db) => {
  //     await db.execAsync(`CREATE TABLE IF NOT EXISTS template_items (id TEXT PRIMARY KEY, title TEXT NOT NULL);`);
  //   },
  // },
];
