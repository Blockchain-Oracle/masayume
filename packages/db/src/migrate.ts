import { getDb } from "./client";
import { SCHEMA_SQL } from "./schema";

let migrated = false;

/**
 * Applies the schema once per process.
 *
 * The schema is idempotent, so this is safe to call on every request and there is
 * no migration tool to run before a social surface works — a fresh `DATABASE_URL`
 * is enough. That holds while every statement is `CREATE IF NOT EXISTS`; the moment
 * a change has to alter existing rows, this becomes a real migration story.
 */
export async function ensureSchema(): Promise<void> {
  if (migrated) return;
  const db = getDb();
  if (!db) return;
  await db.unsafe(SCHEMA_SQL);
  migrated = true;
}
