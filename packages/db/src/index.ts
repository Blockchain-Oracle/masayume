/**
 * Optional Postgres (Neon via Drizzle) for social/copilot/ops data only — chain truth is never stored here.
 * Schema, client, and the degradation table land in Epic 2 (Story 2.1).
 */
export const DB_PACKAGE = "@masayume/db" as const;
