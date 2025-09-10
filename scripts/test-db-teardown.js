#!/usr/bin/env node
import { Client } from 'pg';

const TEST_DB_NAME = 'budgetdb_test';

async function teardownTestDatabase() {
  console.log('🧹 Tearing down test database...');
  
  // Create a client connection to PostgreSQL
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'budgetuser',
    password: process.env.DB_PASSWORD || 'budgetpass',
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await adminClient.connect();
    console.log('📡 Connected to PostgreSQL');

    // Drop test database
    await adminClient.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
    console.log(`🗑️  Dropped test database: ${TEST_DB_NAME}`);

  } catch (error) {
    console.error('❌ Failed to teardown test database:', error);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  console.log('✅ Test database teardown complete!');
}

teardownTestDatabase().catch((error) => {
  console.error('❌ Test database teardown failed:', error);
  process.exit(1);
});
