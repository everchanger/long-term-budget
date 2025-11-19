import { test as base, expect } from "@playwright/test";
import type { Page, APIRequestContext } from "@playwright/test";

// Test credentials
export const TEST_USER = {
  email: "test@test.com",
  password: "Test12345!",
};

/**
 * Helper to create test data via API
 */
export async function createTestData(
  request: APIRequestContext,
  sessionCookie: string
) {
  const baseURL =
    process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

  // Get household
  const householdsResponse = await request.get(`${baseURL}/api/households`, {
    headers: { Cookie: `better-auth.session_token=${sessionCookie}` },
  });
  const householdsData = await householdsResponse.json();
  const household = householdsData.data[0];

  // Create person
  const personResponse = await request.post(`${baseURL}/api/persons`, {
    headers: { Cookie: `better-auth.session_token=${sessionCookie}` },
    data: {
      name: `TestPerson-${Date.now()}`,
      age: 30,
      householdId: household.id,
    },
  });
  const personData = await personResponse.json();
  const person = personData.data;

  // Create income source
  const incomeResponse = await request.post(`${baseURL}/api/income-sources`, {
    headers: { Cookie: `better-auth.session_token=${sessionCookie}` },
    data: {
      personId: person.id,
      name: "Test Income",
      amount: "5000.00",
      frequency: "monthly",
      isActive: true,
    },
  });
  const income = (await incomeResponse.json()).data;

  // Create savings account
  const savingsResponse = await request.post(
    `${baseURL}/api/savings-accounts`,
    {
      headers: { Cookie: `better-auth.session_token=${sessionCookie}` },
      data: {
        personId: person.id,
        name: "Test Savings",
        currentBalance: "15000.00",
        monthlyDeposit: "300.00",
        interestRate: "2.5",
        accountType: "savings",
      },
    }
  );
  const savings = (await savingsResponse.json()).data;

  // Create loan
  const loanResponse = await request.post(`${baseURL}/api/loans`, {
    headers: { Cookie: `better-auth.session_token=${sessionCookie}` },
    data: {
      personId: person.id,
      name: "Test Loan",
      originalAmount: "20000.00",
      currentBalance: "20000.00",
      interestRate: "4.5",
      monthlyPayment: "400.00",
      loanType: "student",
    },
  });
  const loan = (await loanResponse.json()).data;

  // Create savings goal
  const goalResponse = await request.post(`${baseURL}/api/savings-goals`, {
    headers: { Cookie: `better-auth.session_token=${sessionCookie}` },
    data: {
      householdId: household.id,
      name: "Test Goal",
      description: "Test savings goal",
      targetAmount: "20000.00",
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      priority: "high",
      category: "emergency",
    },
  });
  const goal = (await goalResponse.json()).data;

  return {
    household,
    person,
    income,
    savings,
    loan,
    goal,
  };
}

/**
 * Helper to cleanup test data via API
 */
export async function cleanupTestData(
  request: APIRequestContext,
  sessionCookie: string,
  personId: number
) {
  const baseURL =
    process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

  // Delete person (cascades to all related financial data)
  await request.delete(`${baseURL}/api/persons/${personId}`, {
    headers: { Cookie: `better-auth.session_token=${sessionCookie}` },
  });
}

/**
 * Extended test fixture with authentication
 */
export const test = base.extend<{
  authenticatedPage: Page;
  sessionCookie: string;
}>({
  sessionCookie: async ({ page }, use) => {
    // Login once and extract session cookie
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("auth-email-input").fill(TEST_USER.email);
    await page.getByTestId("auth-password-input").fill(TEST_USER.password);
    await page.getByTestId("auth-submit-button").click();

    await page.waitForURL("**/economy", { timeout: 10000 });

    // Extract session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "better-auth.session_token"
    );

    if (!sessionCookie) {
      throw new Error("No session cookie found after login");
    }

    await use(sessionCookie.value);
  },

  authenticatedPage: async ({ page, sessionCookie }, use) => {
    // Set the session cookie
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: sessionCookie,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Navigate to home page (already authenticated)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for the user preferences to load
    // The useUserPreferences composable fetches on mount, so give it time
    // await page.waitForTimeout(1000);

    // // Reload to ensure preferences are fully applied
    // await page.reload({ waitUntil: "networkidle" });

    await use(page);
  },
});

export { expect };
