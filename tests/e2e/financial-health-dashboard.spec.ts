import { test, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures";

const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Financial Health Dashboard - Fast", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);
    await page.getByTestId("auth-submit-button").click();
    await page.waitForURL(/\/(dashboard)?$/);

    // Navigate to financial health and wait for data to load
    await page.getByRole("link", { name: "Financial Health" }).click();
    await page.waitForURL(`${BASE_URL}/financial-health`);

    // Wait for content to load by checking for the heading
    await expect(
      page.getByRole("heading", {
        name: "Financial Health Dashboard",
        level: 1,
      })
    ).toBeVisible();
  });

  test("should display all dashboard elements", async ({ page }) => {
    // Check page structure
    await expect(
      page.getByText("Track your overall financial wellness")
    ).toBeVisible();

    // Check all cards are present
    await expect(
      page.getByRole("heading", { name: "Overall Financial Health", level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Net Worth", level: 3 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cash Flow", level: 3 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Debt-to-Income Ratio", level: 3 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Emergency Fund", level: 3 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recommended Actions", level: 3 })
    ).toBeVisible();
  });

  test("should display card content with financial metrics", async ({
    page,
  }) => {
    // Wait for financial data to load by checking for Net Worth card
    await expect(
      page.getByRole("heading", { name: "Net Worth", level: 3 })
    ).toBeVisible();

    // Check for numeric/currency content (cards may have different exact labels)
    const hasContent = await page.locator("text=/\\$[\\d,]+/").count();
    expect(hasContent).toBeGreaterThan(0);

    // Should have some percentage values
    const hasPercent = await page.locator("text=/\\d+\\.\\d%/").count();
    expect(hasPercent).toBeGreaterThan(0);
  });

  // Removed - merged with "should display card content with financial metrics"

  test("should update when navigating back from economy page", async ({
    page,
  }) => {
    // Navigate away
    await page.getByRole("link", { name: "Economy" }).click();
    await page.waitForURL(`${BASE_URL}/economy`);

    // Navigate back
    await page.getByRole("link", { name: "Financial Health" }).click();
    await page.waitForURL(`${BASE_URL}/financial-health`);

    // Dashboard should still be visible
    await expect(
      page.getByRole("heading", { name: "Financial Health Dashboard" })
    ).toBeVisible();
  });

  test("should be responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Re-navigate to financial health with mobile viewport
    await page.goto(`${BASE_URL}/financial-health`);

    // Wait for heading to ensure page is loaded
    await expect(
      page.getByRole("heading", { name: "Financial Health Dashboard" })
    ).toBeVisible();

    // Check for card headings (use level to be more specific)
    await expect(
      page.getByRole("heading", { name: "Net Worth", level: 3 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Cash Flow", level: 3 })
    ).toBeVisible();
  });
});
