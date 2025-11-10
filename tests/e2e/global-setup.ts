import { chromium, type FullConfig } from "@playwright/test";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

async function globalSetup(config: FullConfig) {
  console.log("Starting Playwright global setup...");

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
    // Clean up all test data (keeps schema, removes data)
    console.log("Cleaning database...");

    await pool.query("TRUNCATE TABLE savings_goal_accounts CASCADE");
    await pool.query("TRUNCATE TABLE savings_goals CASCADE");
    await pool.query("TRUNCATE TABLE broker_accounts CASCADE");
    await pool.query("TRUNCATE TABLE loans CASCADE");
    await pool.query("TRUNCATE TABLE savings_accounts CASCADE");
    await pool.query("TRUNCATE TABLE expenses CASCADE");
    await pool.query("TRUNCATE TABLE income_sources CASCADE");
    await pool.query("TRUNCATE TABLE persons CASCADE");
    await pool.query("TRUNCATE TABLE households CASCADE");
    await pool.query("TRUNCATE TABLE sessions CASCADE");
    await pool.query("TRUNCATE TABLE users CASCADE");

    console.log("Database cleaned successfully");

    // Create baseline test user via API
    console.log("Creating test user via API...");

    const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Wait for server to be ready
    let retries = 0;
    const maxRetries = 30;
    while (retries < maxRetries) {
      try {
        await page.goto(baseURL);
        break;
      } catch {
        retries++;
        if (retries === maxRetries) {
          throw new Error(`Server not ready after ${maxRetries} attempts`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Sign up test user
    const signUpResponse = await page.request.post(
      `${baseURL}/api/auth/sign-up/email`,
      {
        data: {
          name: "Test User",
          email: "test@test.com",
          password: "Test12345!",
          callbackURL: "/",
        },
      }
    );

    if (!signUpResponse.ok()) {
      throw new Error(`Sign-up failed: ${signUpResponse.status()}`);
    }

    const signUpData = await signUpResponse.json();
    console.log(`Created test user (ID: ${signUpData.user.id})`);

    await browser.close();
  } finally {
    await pool.end();
  }

  console.log("Global setup complete");
}

export default globalSetup;
