import { test, expect, createTestData, cleanupTestData } from "../fixtures";

/**
 * E2E tests for financial instruments CRUD operations
 *
 * Tests creating, reading, updating, and deleting income sources, savings accounts, and loans
 */

test.describe("Financial Instruments CRUD", () => {
  test("should successfully navigate to Economy page and view core elements", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/economy");
    await expect(
      page.getByRole("heading", { name: "Your Economy Overview" })
    ).toBeVisible();

    // Verify core sections are present (these are always visible regardless of data)
    await expect(
      page.getByRole("heading", { name: "Members", exact: true })
    ).toBeVisible();
    await expect(page.getByText("Fixed Monthly Expenses")).toBeVisible();

    // Verify "Add First Member" button is visible for empty household
    await expect(page.getByTestId("add-person-button")).toBeVisible();
  });

  // ===== INCOME SOURCE TESTS =====

  test("should create a new income source", async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Should be on Income Sources tab by default
      await expect(
        page.getByRole("tab", { name: "Income Sources", selected: true })
      ).toBeVisible();

      // Click "Add Income Source" button
      await page.getByTestId("add-income-button").click();

      // Wait for modal to open
      await expect(
        page.getByRole("heading", { name: /add income source/i })
      ).toBeVisible();

      // Fill in income details
      await page.getByTestId("income-source-input").fill("New Salary");
      await page.getByTestId("income-amount-input").fill("6000");
      // Select frequency
      await page.selectOption("#income-frequency", "monthly");

      // Submit form
      await page.getByTestId("income-modal-submit-button").click();

      // Wait for modal to close
      await expect(
        page.getByRole("heading", { name: /add income source/i })
      ).not.toBeVisible();

      // Verify new income source appears in the list (use heading to avoid toast notification)
      await expect(
        page.getByRole("heading", { name: "New Salary", exact: true })
      ).toBeVisible();
      await expect(
        page.getByText("$6000.00 monthly", { exact: true })
      ).toBeVisible();
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should delete an income source", async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Verify income exists
      await page.waitForSelector(
        `[data-testid="income-${testData.income.id}-edit-button"]`
      );
      await expect(page.getByText("$5000.00 monthly")).toBeVisible();

      // Click delete button for income
      await page
        .getByTestId(`income-${testData.income.id}-delete-button`)
        .click();

      // Verify income is removed (no confirmation dialog - deletes immediately)
      await expect(page.getByText("$5000.00 monthly")).not.toBeVisible();
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should update an income source", async ({
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

  // ===== SAVINGS ACCOUNT TESTS =====

  test("should create a new savings account", async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Click Savings tab
      await page.getByRole("tab", { name: "Savings" }).click();

      // Click "Add Savings Account" button
      await page.getByTestId("add-savings-button").click();

      // Wait for modal to open
      await expect(
        page.getByRole("heading", { name: /add savings account/i })
      ).toBeVisible();

      // Fill in savings account details
      await page.getByTestId("savings-name-input").fill("New Savings");
      await page.getByTestId("savings-current-balance-input").fill("10000.00");
      await page.getByTestId("savings-monthly-deposit-input").fill("500.00");
      await page.getByTestId("savings-interest-rate-input").fill("2.5");

      // Submit form
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/savings-accounts") &&
            response.status() === 200
        ),
        page.getByTestId("savings-modal-submit-button").click(),
      ]);

      // Wait for modal to close
      await expect(
        page.getByRole("heading", { name: /add savings account/i })
      ).not.toBeVisible();

      // Verify new savings account appears
      await expect(
        page.getByRole("heading", { name: "New Savings" })
      ).toBeVisible();
      await expect(page.getByText(/\$10,?000/)).toBeVisible();
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should delete a savings account", async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Click Savings tab
      await page.getByRole("tab", { name: "Savings" }).click();

      // Wait for savings account to load
      await page.waitForSelector(
        `[data-testid="savings-${testData.savings.id}-delete-button"]`
      );
      await expect(page.getByText("Test Savings")).toBeVisible();

      // Click delete button
      await page
        .getByTestId(`savings-${testData.savings.id}-delete-button`)
        .click();

      // Verify savings account is removed (no confirmation dialog)
      await expect(
        page.getByRole("heading", { name: "Test Savings" })
      ).not.toBeVisible();
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should update a savings account", async ({
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

  // ===== LOAN TESTS =====

  test("should create a new loan", async ({ page, request, sessionCookie }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Click Loans & Debts tab
      await page.getByRole("tab", { name: "Loans & Debts" }).click();

      // Click "Add Loan" button
      await page.getByTestId("add-loan-button").click();

      // Wait for modal to open
      await expect(
        page.getByRole("heading", { name: /add loan/i })
      ).toBeVisible();

      // Fill in loan details
      await page.getByTestId("loan-name-input").fill("New Loan");
      await page.getByTestId("loan-principal-input").fill("30000.00");
      // Current balance is also required (ID: loan-current-balance)
      await page.locator("#loan-current-balance").fill("30000.00");
      await page.getByTestId("loan-monthly-payment-input").fill("500.00");
      await page.getByTestId("loan-interest-rate-input").fill("3.5");

      // Submit form
      await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes("/api/loans") && response.status() === 200
        ),
        page.getByTestId("loan-modal-submit-button").click(),
      ]);

      // Wait for modal to close
      await expect(
        page.getByRole("heading", { name: /add loan/i })
      ).not.toBeVisible();

      // Verify new loan appears
      await expect(
        page.getByRole("heading", { name: "New Loan" })
      ).toBeVisible();
      await expect(page.getByText(/\$30,?000/)).toBeVisible();
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should delete a loan", async ({ page, request, sessionCookie }) => {
    const testData = await createTestData(request, sessionCookie);

    try {
      // Navigate to person's page
      await page.goto(`/persons/${testData.person.id}`);
      await page.waitForLoadState("networkidle");

      // Click Loans & Debts tab
      await page.getByRole("tab", { name: "Loans & Debts" }).click();

      // Wait for loan to load
      await page.waitForSelector(
        `[data-testid="loan-${testData.loan.id}-delete-button"]`
      );
      await expect(page.getByText("Test Loan")).toBeVisible();

      // Click delete button
      await page.getByTestId(`loan-${testData.loan.id}-delete-button`).click();

      // Verify loan is removed (no confirmation dialog)
      await expect(
        page.getByRole("heading", { name: "Test Loan" })
      ).not.toBeVisible();
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });

  test("should update a loan", async ({ page, request, sessionCookie }) => {
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

  // ===== FULL FLOW TEST =====

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
