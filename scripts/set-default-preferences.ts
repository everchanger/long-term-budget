#!/usr/bin/env tsx
/**
 * Script to set default locale and currency preferences for existing users
 * Run this after deploying the i18n changes to ensure all users have preferences set
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users } from "../database/schema/users";
import { isNull } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function setDefaultPreferences() {
  // Create database connection
  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "budget",
    ssl: process.env.DB_SSL === "true",
  });

  const db = drizzle(pool);

  try {
    console.log("Setting default preferences for users...");

    const result = await db
      .update(users)
      .set({
        locale: "en",
        currency: "USD",
        updatedAt: new Date(),
      })
      .where(isNull(users.locale));

    console.log("✓ Default preferences set for all existing users");
    console.log(`  Updated ${result.rowCount} users`);
  } catch (error) {
    console.error("Error setting default preferences:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setDefaultPreferences();
