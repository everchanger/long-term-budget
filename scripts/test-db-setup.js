#!/usr/bin/env node
import { Client } from 'pg';
import { execSync } from 'child_process';

const TEST_DB_NAME = 'budgetdb_test';

async function setupTestDatabase() {
  console.log('🔧 Setting up test database...');
  
  // Create a client connection to PostgreSQL (not to a specific database)
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'budgetuser',
    password: process.env.DB_PASSWORD || 'budgetpass',
    database: 'postgres', // Connect to default postgres database first
  });

  try {
    await adminClient.connect();
    console.log('📡 Connected to PostgreSQL');

    // Drop test database if it exists
    try {
      // First, terminate any active connections to the test database
      await adminClient.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${TEST_DB_NAME}' AND pid <> pg_backend_pid()
      `);
      console.log('🔌 Terminated active connections to test database');
      
      await adminClient.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
      console.log('🗑️  Dropped existing test database (if any)');
    } catch (error) {
      console.log('ℹ️  Error dropping test database:', error.message);
      // Continue anyway, maybe the database doesn't exist
    }

    // Create fresh test database
    try {
      await adminClient.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
      console.log(`✅ Created test database: ${TEST_DB_NAME}`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log('⚠️  Database already exists, trying to drop with force...');
        // Force drop with active connection termination
        await adminClient.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = '${TEST_DB_NAME}' AND pid <> pg_backend_pid()
        `);
        await adminClient.query(`DROP DATABASE "${TEST_DB_NAME}"`);
        await adminClient.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
        console.log(`✅ Force-created test database: ${TEST_DB_NAME}`);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // Run migrations on the test database
  try {
    console.log('🔄 Running migrations on test database...');
    execSync('npm run db:push', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NUXT_DB_NAME: TEST_DB_NAME,
        NUXT_DB_HOST: process.env.DB_HOST || 'localhost',
        NUXT_DB_PORT: process.env.DB_PORT || '5432',
        NUXT_DB_USER: process.env.DB_USER || 'budgetuser',
        NUXT_DB_PASSWORD: process.env.DB_PASSWORD || 'budgetpass'
      }
    });
    console.log('✅ Test database schema created');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    process.exit(1);
  }

  console.log('🎉 Test database setup complete!');
}

setupTestDatabase().catch((error) => {
  console.error('❌ Test database setup failed:', error);
  process.exit(1);
});
