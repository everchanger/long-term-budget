#!/usr/bin/env node

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { config } from 'dotenv';
import pg from 'pg';

const { Client } = pg;

// Load environment variables
config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'budgetdb',
  user: process.env.DB_USER || 'budgetuser',
  password: process.env.DB_PASSWORD || 'budgetpass',
};

async function runMigrations() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get already applied migrations
    const appliedResult = await client.query('SELECT filename FROM schema_migrations');
    const appliedMigrations = new Set(appliedResult.rows.map(row => row.filename));

    // Read migration files
    const migrationsDir = join(process.cwd(), 'migrations');
    const files = await readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      if (appliedMigrations.has(file)) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        continue;
      }

      console.log(`🚀 Running migration: ${file}`);
      
      const migrationPath = join(migrationsDir, file);
      const sql = await readFile(migrationPath, 'utf-8');
      
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Successfully applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to apply ${file}:`, error.message);
        throw error;
      }
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
