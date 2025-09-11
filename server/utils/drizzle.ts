import { Client } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "~~/database/schema";
export { sql, eq, and, or, inArray, desc, asc, count } from "drizzle-orm";

export const tables = schema;

// Singleton database connection
let _db: NodePgDatabase<typeof schema> | null = null;
let _client: Client | null = null;

function createDrizzleInstance() {
  if (_db) return _db;

  // Use environment variables directly to avoid Nuxt composable dependency
  _client = new Client({
    host: process.env.NUXT_DB_HOST,
    port: parseInt(process.env.NUXT_DB_PORT || ""),
    user: process.env.NUXT_DB_USER,
    password: process.env.NUXT_DB_PASSWORD,
    database: process.env.NUXT_DB_NAME,
    ssl: process.env.NUXT_DB_SSL === "true",
  });

  _client.connect().catch(console.error);
  _db = drizzle(_client, { schema });

  return _db;
}

export function useDrizzle() {
  return createDrizzleInstance();
}

// Export a direct instance for use in modules that can't use composables (like Better Auth)
export const db = createDrizzleInstance();

export type User = typeof schema.users.$inferSelect;
