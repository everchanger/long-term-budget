import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "~~/database/schema";
export { sql, eq, and, or, inArray, desc, asc, count } from "drizzle-orm";

export const tables = schema;

export function useDrizzle() {
  const config = useRuntimeConfig();
  const client = new Client({
    host: config.dbHost,
    port: +config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    ssl: config.dbSsl,
  });

  console.log(
    "config",
    config.dbHost,
    config.dbPort,
    config.dbUser,
    config.dbName,
    config.dbSsl
  );

  return drizzle(client, { schema });
}

export type User = typeof schema.users.$inferSelect;
