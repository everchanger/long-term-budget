import { test, expect } from "../fixtures";

/**
 * E2E tests for Budget Expenses CRUD operations
 *
 * Tests creating, reading, updating, and deleting budget expenses in the Economy page
 */

test.describe("Budget Expenses CRUD", () => {
  test("should display budget expenses section on Economy page", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to Economy page
    await page.goto("/economy");

    // Verify we're on the Economy page
    await expect(page).toHaveURL("/economy");

    // Verify Budget Expenses section is present
    await expect(
      page.getByRole("heading", { name: "Fixed Monthly Expenses" })
    ).toBeVisible();

    // Verify description text
    await expect(
      page.getByText("Rent, utilities, subscriptions, etc.")
    ).toBeVisible();

    // Verify Add Expense button is present
    await expect(page.getByTestId("add-budget-expense-button")).toBeVisible();
  });

  test("should create a new budget expense", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    // Click "Add Expense" button
    await page.getByTestId("add-budget-expense-button").click();

    // Wait for modal to open
    await expect(
      page.getByRole("heading", { name: "Add Budget Expense" })
    ).toBeVisible();

    // Fill in expense details
    await page.getByTestId("budget-expense-name-input").fill("Netflix");
    await page.getByTestId("budget-expense-amount-input").fill("15.99");

    // Submit form
    await page.getByTestId("budget-expense-modal-submit-button").click();

    // Wait for modal to close
    await expect(
      page.getByRole("heading", { name: "Add Budget Expense" })
    ).not.toBeVisible();

    // Verify new expense appears in the list (use more specific selector to avoid toast)
    const expenseCard = page
      .locator('[data-testid^="budget-expense-"]')
      .filter({ hasText: "Netflix" });
    await expect(expenseCard).toBeVisible();
    await expect(expenseCard.getByText("$15.99/month")).toBeVisible();
  });

  test("should update an existing budget expense", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    // First, create an expense to update
    await page.getByTestId("add-budget-expense-button").click();
    await expect(
      page.getByRole("heading", { name: "Add Budget Expense" })
    ).toBeVisible();
    await page.getByTestId("budget-expense-name-input").fill("Original Name");
    await page.getByTestId("budget-expense-amount-input").fill("50.00");
    await page.getByTestId("budget-expense-modal-submit-button").click();
    await expect(
      page.getByRole("heading", { name: "Add Budget Expense" })
    ).not.toBeVisible();

    // Now update it
    const firstExpense = page
      .locator('[data-testid^="budget-expense-"]')
      .first();
    await expect(firstExpense).toBeVisible();

    // Get the expense ID from the test ID
    const testId = await firstExpense.getAttribute("data-testid");
    const expenseId = testId?.match(/budget-expense-(\d+)/)?.[1];

    if (!expenseId) {
      throw new Error("Could not find expense ID");
    }

    // Click edit button
    await page.getByTestId(`edit-budget-expense-${expenseId}`).click();

    // Wait for modal to open
    await expect(
      page.getByRole("heading", { name: "Edit Budget Expense" })
    ).toBeVisible();

    // Update expense details
    await page.getByTestId("budget-expense-name-input").clear();
    await page.getByTestId("budget-expense-name-input").fill("Updated Expense");
    await page.getByTestId("budget-expense-amount-input").clear();
    await page.getByTestId("budget-expense-amount-input").fill("99.99");

    // Submit form
    await page.getByTestId("budget-expense-modal-submit-button").click();

    // Wait for modal to close
    await expect(
      page.getByRole("heading", { name: "Edit Budget Expense" })
    ).not.toBeVisible();

    // Verify expense is updated (use more specific selector to avoid toast)
    const expenseCard = page
      .locator('[data-testid^="budget-expense-"]')
      .filter({ hasText: "Updated Expense" });
    await expect(expenseCard).toBeVisible();
    await expect(expenseCard.getByText("$99.99/month")).toBeVisible();

    // Verify old name is gone
    await expect(
      page.getByText("Original Name", { exact: true })
    ).not.toBeVisible();
  });

  test("should delete a budget expense", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    // First, create an expense to delete
    await page.getByTestId("add-budget-expense-button").click();
    await expect(
      page.getByRole("heading", { name: "Add Budget Expense" })
    ).toBeVisible();
    await page.getByTestId("budget-expense-name-input").fill("To Delete");
    await page.getByTestId("budget-expense-amount-input").fill("25.00");
    await page.getByTestId("budget-expense-modal-submit-button").click();
    await expect(
      page.getByRole("heading", { name: "Add Budget Expense" })
    ).not.toBeVisible();

    // Wait for expense to appear
    const firstExpense = page
      .locator('[data-testid^="budget-expense-"]')
      .first();
    await expect(firstExpense).toBeVisible();

    // Get the expense ID
    const testId = await firstExpense.getAttribute("data-testid");
    const expenseId = testId?.match(/budget-expense-(\d+)/)?.[1];

    if (!expenseId) {
      throw new Error("Could not find expense ID");
    }

    // Set up dialog handler for confirmation
    page.on("dialog", (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("To Delete");
      dialog.accept();
    });

    // Click delete button
    await page.getByTestId(`delete-budget-expense-${expenseId}`).click();

    // Wait a bit for deletion to complete
    await page.waitForTimeout(500);

    // Verify expense is removed and empty state is shown
    await expect(
      page.getByText("To Delete", { exact: true })
    ).not.toBeVisible();
    await expect(page.getByText("No budget expenses yet")).toBeVisible();
  });

  test("should show empty state when no expenses exist", async ({
    page,
    request,
  }) => {
    // Create a fresh user with no budget expenses
    const signUpResponse = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Empty Budget User",
        email: `empty-budget-${Date.now()}@test.com`,
        password: "Test12345!",
        callbackURL: "/",
      },
    });

    const setCookieHeader = signUpResponse.headers()["set-cookie"];
    const newSessionMatch = setCookieHeader?.match(
      /better-auth\.session_token=([^;]+)/
    );
    const newSessionCookie = newSessionMatch?.[1];

    if (!newSessionCookie) {
      throw new Error("Failed to create new session");
    }

    // Set the new session cookie
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: newSessionCookie,
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    // Verify empty state
    await expect(page.getByText("No budget expenses yet")).toBeVisible();
    await expect(
      page.getByText("Add fixed monthly expenses like rent and utilities")
    ).toBeVisible();
  });

  test("should display total monthly expenses calculation", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    // Create multiple expenses with known amounts
    const expenses = [
      { name: "Expense 1", amount: "100" },
      { name: "Expense 2", amount: "200" },
      { name: "Expense 3", amount: "50.50" },
    ];

    for (const expense of expenses) {
      await page.getByTestId("add-budget-expense-button").click();
      await expect(
        page.getByRole("heading", { name: "Add Budget Expense" })
      ).toBeVisible();
      await page.getByTestId("budget-expense-name-input").fill(expense.name);
      await page
        .getByTestId("budget-expense-amount-input")
        .fill(expense.amount);
      await page.getByTestId("budget-expense-modal-submit-button").click();
      await expect(
        page.getByRole("heading", { name: "Add Budget Expense" })
      ).not.toBeVisible();
    }

    // Wait for all expenses to be visible (use more specific selectors to avoid toast)
    await expect(
      page
        .locator('[data-testid^="budget-expense-"]')
        .filter({ hasText: "Expense 1" })
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid^="budget-expense-"]')
        .filter({ hasText: "Expense 2" })
    ).toBeVisible();
    await expect(
      page
        .locator('[data-testid^="budget-expense-"]')
        .filter({ hasText: "Expense 3" })
    ).toBeVisible();

    // Verify total is displayed
    await expect(page.getByText("Total Monthly Expenses")).toBeVisible();

    // Calculate expected total
    const expectedTotal = 100 + 200 + 50.5;

    // Verify the total matches
    const totalText = await page
      .locator("text=/Total Monthly Expenses/")
      .locator("..")
      .locator(".font-bold")
      .textContent();

    if (totalText) {
      const displayedTotal = parseFloat(
        totalText.replace("$", "").replace(",", "")
      );
      expect(displayedTotal).toBe(expectedTotal);
    }
  });

  test("should validate required fields in expense modal", async ({
    authenticatedPage: page,
  }) => {
    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    // Open modal
    await page.getByTestId("add-budget-expense-button").click();
    await expect(
      page.getByRole("heading", { name: "Add Budget Expense" })
    ).toBeVisible();

    // Try to submit empty form
    const submitButton = page.getByTestId("budget-expense-modal-submit-button");

    // Submit button should be disabled when form is invalid
    await expect(submitButton).toBeDisabled();

    // Fill only name
    await page.getByTestId("budget-expense-name-input").fill("Test");
    await expect(submitButton).toBeDisabled();

    // Fill only amount (clear name first)
    await page.getByTestId("budget-expense-name-input").clear();
    await page.getByTestId("budget-expense-amount-input").fill("100");
    await expect(submitButton).toBeDisabled();

    // Fill both fields
    await page.getByTestId("budget-expense-name-input").fill("Test");
    await expect(submitButton).toBeEnabled();
  });
});
