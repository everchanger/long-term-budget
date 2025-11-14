import { test, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures";

const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Global Assumptions - Fast", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);
    await page.getByTestId("auth-submit-button").click();
    await page.waitForURL(/\/(dashboard)?$/);
    await page.goto(`${BASE_URL}/projections`);

    // Wait for the page to load by checking for the Global Assumptions card
    await expect(page.locator("text=Global Assumptions")).toBeVisible();
  });

  test("should toggle Global Assumptions and show/hide sliders", async ({
    page,
  }) => {
    // Check initial state (disabled)
    const toggle = page.getByRole("checkbox", { name: /Disabled|Enabled/ });
    await expect(toggle).toBeVisible();
    await expect(page.locator("text=Disabled").first()).toBeVisible();

    // Sliders should not be visible when disabled
    const globalAssumptionsCard = page
      .locator("text=Global Assumptions")
      .locator("..");
    const slidersInCard = globalAssumptionsCard.locator('input[type="range"]');
    expect(await slidersInCard.count()).toBe(0);

    // Enable the toggle
    await toggle.click();
    await expect(page.locator("text=Enabled").first()).toBeVisible();

    // Sliders should now be visible
    await expect(page.locator("text=Income Growth")).toBeVisible();
    await expect(page.locator("text=Expense Growth")).toBeVisible();
    await expect(page.locator("text=Investment Return")).toBeVisible();
  });

  test("should enable sliders and allow adjustments", async ({ page }) => {
    // Initially disabled - no sliders visible
    const initialSliders = await page.locator('input[type="range"]').count();
    expect(initialSliders).toBe(0);

    // Enable the toggle
    const toggle = page.getByRole("checkbox", { name: /Disabled/ });
    await toggle.click();

    // Wait for sliders to appear
    await expect(page.locator("text=Income Growth")).toBeVisible();
    await expect(page.locator("text=Expense Growth")).toBeVisible();
    await expect(page.locator("text=Investment Return")).toBeVisible();

    // Should now have sliders (Income Growth, Expense Growth, Investment Return)
    const enabledSliders = await page.locator('input[type="range"]').count();
    expect(enabledSliders).toBe(3);

    // Verify percentage values are displayed (any percentage)
    const percentageValues = await page.locator("text=/%/").count();
    expect(percentageValues).toBeGreaterThan(0);
  });

  test.skip("should show data table with flat income when disabled", async ({
    page,
  }) => {
    await page.waitForTimeout(1500); // Wait for onMounted initialization

    // Show the data table
    const showTableBtn = page.getByRole("button", { name: /Show Table/i });
    await showTableBtn.click();

    // Wait for table to be visible
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // Get Year 0, Year 1, and Year 9 income values
    const year0Income = await table
      .locator("tbody tr:nth-child(1) td:nth-child(2)")
      .textContent();
    const year1Income = await table
      .locator("tbody tr:nth-child(2) td:nth-child(2)")
      .textContent();
    const year9Income = await table
      .locator("tbody tr:nth-child(10) td:nth-child(2)")
      .textContent();

    const year0Value = parseFloat(year0Income?.replace(/[$,]/g, "") || "0");
    const year1Value = parseFloat(year1Income?.replace(/[$,]/g, "") || "0");
    const year9Value = parseFloat(year9Income?.replace(/[$,]/g, "") || "0");

    // Values should be reasonably close (accounting for rounding and calculations)
    // When global assumptions are disabled, there should be minimal variation
    expect(Math.abs(year1Value - year0Value)).toBeLessThan(year0Value * 0.1);
    expect(Math.abs(year9Value - year0Value)).toBeLessThan(year0Value * 0.1);

    // Should not show 3% growth pattern
    if (Math.abs(year0Value - 11000) < 1000) {
      expect(year1Value).not.toBeCloseTo(11330, -1);
      expect(year9Value).not.toBeCloseTo(14353, -1);
    }
  });

  test("should show projection data in table", async ({ page }) => {
    // Show the data table
    const showTableButton = page.getByRole("button", { name: /Show Table/i });
    await showTableButton.click();

    // Wait for table to appear
    await expect(page.locator("table")).toBeVisible();

    // Check that we have year rows (Year 0 through Year 9)
    await expect(page.locator("text=Year 0")).toBeVisible();
    await expect(page.locator("text=Year 9")).toBeVisible();

    // Check that table has financial data (look for currency values)
    const currencyValues = await page.locator('td:has-text("$")').count();
    expect(currencyValues).toBeGreaterThan(0);
  });

  test("should not scroll to top when adjusting sliders", async ({ page }) => {
    // Enable assumptions
    const toggle = page.getByRole("checkbox", { name: /Disabled/ });
    await toggle.click();
    await page.waitForTimeout(500);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollYBefore = await page.evaluate(() => window.scrollY);
    expect(scrollYBefore).toBeGreaterThan(0);

    // Adjust a slider
    const incomeSlider = page.locator('input[type="range"]').first();
    await incomeSlider.fill("5");
    await page.waitForTimeout(1000);

    // Check scroll position hasn't changed dramatically (allow for some movement)
    const scrollYAfter = await page.evaluate(() => window.scrollY);
    // If we scrolled down, we should still be somewhere in that area (not jumped to top)
    if (scrollYBefore > 100) {
      expect(scrollYAfter).toBeGreaterThan(100);
    }
  });
});
