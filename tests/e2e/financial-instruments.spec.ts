import { test, expect } from "@playwright/test";

/**
 * E2E tests for financial instruments management
 *
 * Prerequisites:
 * - Database seeded with test user (test@test.com / Test12345!)
 * - Test user has household with Alice and Bob
 * - Alice has:
 *   - Income: Software Engineer Salary ($5000/month)
 *   - Savings: Emergency Fund ($15000, 2.5%, $300/month)
 *   - Loan: Student Loan ($20000 balance, 4.5%, $400/month)
 */

const TEST_USER = {
  email: "test@test.com",
  password: "Test12345!",
};

test.describe("Financial Instruments Management", () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage to ensure clean state
    await context.clearCookies();
    await context.clearPermissions();

    // Navigate directly to the auth page
    await page.goto("/auth");

    // Wait for auth page to load and Vue to be hydrated
    await expect(page).toHaveURL("/auth");
    await page.waitForLoadState("networkidle");

    // Fill in credentials
    await page.getByTestId("auth-email-input").fill(TEST_USER.email);
    await page.getByTestId("auth-password-input").fill(TEST_USER.password);

    // Click submit button (don't wait for navigation with Promise.all since it's async)
    await page.getByTestId("auth-submit-button").click();

    // Wait for navigation to complete (the auth handler will redirect)
    await page.waitForURL("/", { timeout: 10000 });

    // Verify user is logged in (use first() since name appears in both desktop and mobile nav)
    await expect(page.getByText("Test User").first()).toBeVisible();
  });

  test("should successfully login and navigate to Economy page", async ({
    page,
  }) => {
    // Navigate to Economy page
    await page.getByRole("link", { name: "Economy" }).click();

    // Verify we're on the Economy page
    await expect(page).toHaveURL("/economy");
    await expect(
      page.getByRole("heading", { name: "Your Economy Overview" })
    ).toBeVisible();

    // Verify Alice and Bob are displayed
    await expect(page.getByText("Alice")).toBeVisible();
    await expect(page.getByText("Bob")).toBeVisible();

    // Verify financial overview
    await expect(page.getByText("Monthly Income")).toBeVisible();
    await expect(page.getByText("Total Savings")).toBeVisible();
    await expect(page.getByText("Total Debt")).toBeVisible();
  });

  test("should update Alice's income source", async ({ page }) => {
    // Navigate to Economy page
    await page.getByRole("link", { name: "Economy" }).click();
    await expect(page).toHaveURL("/economy");

    // Wait for members to load
    await expect(page.getByText("Alice")).toBeVisible();

    // Click on Manage Finances for Alice (person ID 1)
    await page.getByTestId("person-1-manage-button").click();
    await expect(page).toHaveURL("/persons/1");

    // Wait for Alice's detail page and data to load
    await expect(
      page.getByRole("heading", { name: "Alice", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Income Sources", selected: true })
    ).toBeVisible();

    // Wait for income data to load
    await page.waitForSelector('[data-testid="income-1-edit-button"]', {
      timeout: 10000,
    });

    // Verify initial income amount exists (use first() to avoid strict mode violation)
    await expect(page.getByText(/\$5,?000/).first()).toBeVisible();

    // Click edit button for the income source (assuming ID 1)
    await page.getByTestId("income-1-edit-button").click();

    // Wait for modal to open
    await expect(
      page.getByRole("heading", { name: "Edit Income Source" })
    ).toBeVisible();

    // Update the amount from $5000 to $5500
    const amountInput = page.getByTestId("income-amount-input");
    await amountInput.clear();
    await amountInput.fill("5500.00");

    // Submit the form
    await page.getByTestId("income-modal-submit-button").click();

    // Wait for modal to close and page to update
    await expect(
      page.getByRole("heading", { name: "Edit Income Source" })
    ).not.toBeVisible();

    // Verify the income was updated
    await expect(page.getByText("$5500.00 monthly")).toBeVisible();

    // Verify the monthly income summary was updated
    await expect(page.getByText("Monthly Income")).toBeVisible();
    await expect(page.getByText("$5500.00").first()).toBeVisible();

    // Navigate back to Economy to verify aggregate totals
    await page.getByRole("link", { name: "Back to Economy" }).click();
    await expect(page).toHaveURL("/economy");

    // Verify the total monthly income was updated ($5500 + $6000 = $11,500)
    await expect(page.getByText("$11,500")).toBeVisible();
    await expect(page.getByText("$138,000 annually")).toBeVisible();
  });

  test("should update Alice's savings account", async ({ page }) => {
    // Navigate to Economy page
    await page.getByRole("link", { name: "Economy" }).click();
    await expect(page).toHaveURL("/economy");

    // Wait for members to load
    await expect(page.getByText("Alice")).toBeVisible();

    // Navigate to Alice's finances
    await page.getByTestId("person-1-manage-button").click();
    await expect(page).toHaveURL("/persons/1");

    // Click on Savings tab
    await page.getByRole("tab", { name: "Savings" }).click();

    // Wait for savings data to load
    await page.waitForSelector('[data-testid="savings-1-edit-button"]', {
      timeout: 10000,
    });

    // Verify we're on the Savings tab
    await expect(
      page.getByRole("tab", { name: "Savings", selected: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Emergency Fund" })
    ).toBeVisible();

    // Verify initial monthly deposit
    await expect(page.getByText("Monthly Deposit: $300")).toBeVisible();

    // Click edit button for the savings account (assuming ID 1)
    await page.getByTestId("savings-1-edit-button").click();

    // Wait for modal to open
    await expect(
      page.getByRole("heading", { name: "Edit Savings Account" })
    ).toBeVisible();

    // Update the monthly deposit from $300 to $400
    const monthlyDepositInput = page.getByTestId(
      "savings-monthly-deposit-input"
    );
    await monthlyDepositInput.clear();
    await monthlyDepositInput.fill("400.00");

    // Submit the form and wait for the network request
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/savings-accounts/") &&
          response.status() === 200
      ),
      page.getByTestId("savings-modal-submit-button").click(),
    ]);

    // Wait for modal to close
    await expect(
      page.getByRole("heading", { name: "Edit Savings Account" })
    ).not.toBeVisible();

    // Reload the page to ensure fresh data
    await page.reload({ waitUntil: "domcontentloaded" });

    // Navigate back to savings tab
    await page.getByRole("tab", { name: "Savings" }).click();

    // Verify the monthly deposit was updated
    await expect(page.getByText(/Monthly Deposit:\s*\$\s*400/)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should update Alice's loan", async ({ page }) => {
    // Navigate to Economy page
    await page.getByRole("link", { name: "Economy" }).click();
    await expect(page).toHaveURL("/economy");

    // Wait for members to load
    await expect(page.getByText("Alice")).toBeVisible();

    // Navigate to Alice's finances
    await page.getByTestId("person-1-manage-button").click();
    await expect(page).toHaveURL("/persons/1");

    // Click on Loans & Debts tab
    await page.getByRole("tab", { name: "Loans & Debts" }).click();

    // Wait for loans data to load
    await page.waitForSelector('[data-testid="loan-1-edit-button"]', {
      timeout: 10000,
    });

    // Verify we're on the Loans & Debts tab
    await expect(
      page.getByRole("tab", { name: "Loans & Debts", selected: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Student Loan" })
    ).toBeVisible();

    // Verify initial monthly payment
    await expect(page.getByText("Monthly Payment: $400")).toBeVisible();

    // Click edit button for the loan (assuming ID 1)
    await page.getByTestId("loan-1-edit-button").click();

    // Wait for modal to open
    await expect(
      page.getByRole("heading", { name: "Edit Loan/Debt" })
    ).toBeVisible();

    // Update the monthly payment from $400 to $450
    const monthlyPaymentInput = page.getByTestId("loan-monthly-payment-input");
    await monthlyPaymentInput.clear();
    await monthlyPaymentInput.fill("450.00");

    // Submit the form and wait for the network request
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/loans/") && response.status() === 200
      ),
      page.getByTestId("loan-modal-submit-button").click(),
    ]);

    // Wait for modal to close
    await expect(
      page.getByRole("heading", { name: "Edit Loan/Debt" })
    ).not.toBeVisible();

    // Verify the monthly payment was updated
    await expect(page.getByText(/Monthly Payment.*450/)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should complete full flow: login -> view economy -> modify all Alice's instruments", async ({
    page,
  }) => {
    // Navigate to Economy
    await page.getByRole("link", { name: "Economy" }).click();
    await expect(page).toHaveURL("/economy");

    // Wait for members to load
    await expect(page.getByText("Alice")).toBeVisible();

    // Navigate to Alice's finances
    await page.getByTestId("person-1-manage-button").click();
    await expect(page).toHaveURL("/persons/1");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Step 1: Update Income
    await expect(
      page.getByRole("tab", { name: "Income Sources", selected: true })
    ).toBeVisible();
    await page.waitForSelector('[data-testid="income-1-edit-button"]', {
      timeout: 10000,
    });
    await page.getByTestId("income-1-edit-button").click();
    await page.getByTestId("income-amount-input").fill("5500.00");
    await page.getByTestId("income-modal-submit-button").click();
    await expect(page.getByText("$5500.00 monthly")).toBeVisible();

    // Step 2: Update Savings
    await page.getByRole("tab", { name: "Savings" }).click();
    await page.waitForSelector('[data-testid="savings-1-edit-button"]', {
      timeout: 10000,
    });
    await page.getByTestId("savings-1-edit-button").click();
    await page.getByTestId("savings-monthly-deposit-input").fill("400.00");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/savings-accounts/") &&
          response.status() === 200
      ),
      page.getByTestId("savings-modal-submit-button").click(),
    ]);
    // Reload to get fresh data
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: "Savings" }).click();
    await expect(page.getByText(/Monthly Deposit:\s*\$\s*400/)).toBeVisible({
      timeout: 10000,
    });

    // Step 3: Update Loan
    await page.getByRole("tab", { name: "Loans & Debts" }).click();
    await page.waitForSelector('[data-testid="loan-1-edit-button"]', {
      timeout: 10000,
    });
    await page.getByTestId("loan-1-edit-button").click();
    await page.getByTestId("loan-monthly-payment-input").fill("450.00");
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/loans/") && response.status() === 200
      ),
      page.getByTestId("loan-modal-submit-button").click(),
    ]);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("tab", { name: "Loans & Debts" }).click();
    await expect(page.getByText(/Monthly Payment.*450/)).toBeVisible({
      timeout: 10000,
    });

    // Step 4: Verify all changes persisted
    await page.getByRole("tab", { name: "Income Sources" }).click();
    await expect(page.getByText("$5500.00 monthly")).toBeVisible();

    await page.getByRole("tab", { name: "Savings" }).click();
    await expect(page.getByText("Monthly Deposit: $400")).toBeVisible();

    await page.getByRole("tab", { name: "Loans & Debts" }).click();
    await expect(page.getByText("Monthly Payment: $450")).toBeVisible();

    // Step 5: Navigate back and verify aggregate calculations
    await page.getByRole("link", { name: "Back to Economy" }).click();
    await expect(page).toHaveURL("/economy");

    // Verify total monthly income updated ($5500 + Bob's $6000 = $11,500)
    await expect(page.getByText("$11,500")).toBeVisible();
  });
});
