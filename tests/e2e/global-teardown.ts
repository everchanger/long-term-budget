import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

async function globalTeardown() {
  console.log("Starting Playwright global teardown...");

  // Get database connection details from environment
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    user: process.env.DB_USER || "budgetuser",
    password: process.env.DB_PASSWORD || "budgetpass",
    database: process.env.DB_NAME || "budgetdb",
  };

  // Connect to database
  const pool = new Pool(dbConfig);

  try {
    // Optional: Clean up test data after all tests
    // (or leave it for inspection/debugging)
    console.log("Teardown complete (data preserved for inspection)");
  } finally {
    await pool.end();
  }
}

export default globalTeardown;
