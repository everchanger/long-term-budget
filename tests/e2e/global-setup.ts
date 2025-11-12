import { chromium, type FullConfig } from "@playwright/test";
import "dotenv/config";
import { db, tables } from "../../server/utils/drizzle";

async function globalSetup(config: FullConfig) {
  console.log("Starting Playwright global setup...");

  try {
    // Clean up all test data using Drizzle (keeps schema, removes data)
    console.log("Cleaning database...");

    // Delete all data in correct order (respecting foreign key constraints)
    await db.delete(tables.savingsGoalAccounts);
    await db.delete(tables.savingsGoals);
    await db.delete(tables.brokerAccounts);
    await db.delete(tables.loans);
    await db.delete(tables.savingsAccounts);
    await db.delete(tables.expenses);
    await db.delete(tables.incomeSources);
    await db.delete(tables.persons);
    await db.delete(tables.households);
    await db.delete(tables.sessions);
    await db.delete(tables.users);

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

    // Create a household with test data
    console.log("Creating test household with financial data...");

    // Insert household
    const [household] = await db
      .insert(tables.households)
      .values({
        name: "Test Household",
        userId: signUpData.user.id,
      })
      .returning();

    console.log(`Created household (ID: ${household.id})`);

    // Insert two persons (Alice and Bob)
    const [alice, bob] = await db
      .insert(tables.persons)
      .values([
        {
          name: "Alice",
          householdId: household.id,
        },
        {
          name: "Bob",
          householdId: household.id,
        },
      ])
      .returning();

    console.log(
      `Created persons: Alice (ID: ${alice.id}), Bob (ID: ${bob.id})`
    );

    // Insert income sources
    await db.insert(tables.incomeSources).values([
      {
        personId: alice.id,
        name: "Alice Salary",
        amount: "5000",
        frequency: "monthly",
      },
      {
        personId: bob.id,
        name: "Bob Salary",
        amount: "6000",
        frequency: "monthly",
      },
    ]);

    // Insert savings accounts
    await db.insert(tables.savingsAccounts).values([
      {
        personId: alice.id,
        name: "Alice Savings",
        currentBalance: "10000",
        interestRate: "4.0",
      },
      {
        personId: bob.id,
        name: "Bob Savings",
        currentBalance: "15000",
        interestRate: "4.0",
      },
    ]);

    // Insert loans
    await db.insert(tables.loans).values([
      {
        personId: alice.id,
        name: "Car Loan",
        originalAmount: "25000",
        currentBalance: "20000",
        interestRate: "5.0",
        monthlyPayment: "500",
        startDate: new Date("2024-01-01"),
      },
    ]);

    console.log("Test data created successfully");

    await browser.close();
  } catch (error) {
    console.error("Global setup failed:", error);
    throw error;
  }

  console.log("Global setup complete");
}

export default globalSetup;
