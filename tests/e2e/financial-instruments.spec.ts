import { test, expect, createTestData, cleanupTestData } from "./fixtures";

/**
 * E2E tests for financial instruments management
 *
 * Tests the complete flow of managing income sources, savings accounts,
 * and loans for household members using proper Playwright patterns.
 */

test.describe("Financial Instruments Management", () => {
  test("should successfully navigate to Economy page and view financial overview", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to Economy page
    await page.goto("/economy");

    // Verify we're on the Economy page
    await expect(page).toHaveURL("/economy");
    await expect(
      page.getByRole("heading", { name: "Your Economy Overview" })
    ).toBeVisible();

    // Verify financial overview sections are present
    await expect(page.getByText("Monthly Income")).toBeVisible();
    await expect(page.getByText("Total Savings")).toBeVisible();
    await expect(page.getByText("Total Debt")).toBeVisible();
  });

  test("should update person's income source", async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await expect(page).toHaveURL(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Wait for page and data to load
      await expect(
        page.getByRole("heading", { name: testData.person.name, exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Income Sources", selected: true })
      ).toBeVisible();

      // Wait for income data to load
      await page.waitForSelector(
        `[data-testid="income-${testData.income.id}-edit-button"]`
      );

      // Verify initial income amount
      await expect(page.getByText(/\$5,?000/).first()).toBeVisible();

      // Click edit button for the income source
      await page
        .getByTestId(`income-${testData.income.id}-edit-button`)
        .click();

      // Wait for modal to open
      await expect(
        page.getByRole("heading", { name: "Edit Income Source" })
      ).toBeVisible({ timeout: 10000 });

      // Update the amount from $5000 to $5500
      const amountInput = page.getByTestId("income-amount-input");
      await amountInput.clear();
      await amountInput.fill("5500.00");

      // Submit the form
      await page.getByTestId("income-modal-submit-button").click();

      // Wait for modal to close
      await expect(
        page.getByRole("heading", { name: "Edit Income Source" })
      ).not.toBeVisible();

      // Verify the income was updated
      await expect(page.getByText("$5500.00 monthly")).toBeVisible();

      // Verify the monthly income summary was updated
      await expect(page.getByText("Monthly Income")).toBeVisible();
      await expect(page.getByText("$5500.00").first()).toBeVisible();
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should update person's savings account", async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await expect(page).toHaveURL(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Click on Savings tab
      await page.getByRole("tab", { name: "Savings" }).click();

      // Wait for savings data to load
      await page.waitForSelector(
        `[data-testid="savings-${testData.savings.id}-edit-button"]`
      );

      // Verify initial monthly deposit
      await expect(page.getByText("Monthly Deposit: $300")).toBeVisible();

      // Click edit button for the savings account
      await page
        .getByTestId(`savings-${testData.savings.id}-edit-button`)
        .click();

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

      // Verify the monthly deposit was updated to $400
      await expect(page.getByText("Monthly Deposit: $400")).toBeVisible({
        timeout: 5000,
      });
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should update person's loan", async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await expect(page).toHaveURL(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Click on Loans & Debts tab
      await page.getByRole("tab", { name: "Loans & Debts" }).click();

      // Wait for loan data to load
      await page.waitForSelector(
        `[data-testid="loan-${testData.loan.id}-edit-button"]`
      );

      // Verify initial monthly payment
      await expect(page.getByText("Monthly Payment: $400")).toBeVisible();

      // Click edit button for the loan
      await page.getByTestId(`loan-${testData.loan.id}-edit-button`).click();

      // Wait for modal to open
      await expect(
        page.getByRole("heading", { name: "Edit Loan/Debt" })
      ).toBeVisible();

      // Update the monthly payment from $400 to $450
      const monthlyPaymentInput = page.getByTestId(
        "loan-monthly-payment-input"
      );
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
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should complete full flow: modify all financial instruments", async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await expect(page).toHaveURL(`/persons/${testData.person.id}`);

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Step 1: Update Income
      await expect(
        page.getByRole("tab", { name: "Income Sources", selected: true })
      ).toBeVisible();
      await page.waitForSelector(
        `[data-testid="income-${testData.income.id}-edit-button"]`
      );
      await page
        .getByTestId(`income-${testData.income.id}-edit-button`)
        .click();
      await page.getByTestId("income-amount-input").fill("5500.00");
      await page.getByTestId("income-modal-submit-button").click();
      await expect(page.getByText("$5500.00 monthly")).toBeVisible();

      // Step 2: Update Savings
      await page.getByRole("tab", { name: "Savings" }).click();
      await page.waitForSelector(
        `[data-testid="savings-${testData.savings.id}-edit-button"]`
      );
      await page
        .getByTestId(`savings-${testData.savings.id}-edit-button`)
        .click();
      await page.getByTestId("savings-monthly-deposit-input").fill("400.00");
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/savings-accounts/") &&
            response.status() === 200
        ),
        page.getByTestId("savings-modal-submit-button").click(),
      ]);

      // Verify the monthly deposit was updated to $400
      await expect(page.getByText("Monthly Deposit: $400")).toBeVisible({
        timeout: 5000,
      });

      // Step 3: Update Loan
      await page.getByRole("tab", { name: "Loans & Debts" }).click();
      await page.waitForSelector(
        `[data-testid="loan-${testData.loan.id}-edit-button"]`
      );
      await page.getByTestId(`loan-${testData.loan.id}-edit-button`).click();
      await page.getByTestId("loan-monthly-payment-input").fill("450.00");
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/loans/") && response.status() === 200
        ),
        page.getByTestId("loan-modal-submit-button").click(),
      ]);
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
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });
});
