import { test, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures";

const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Global Assumptions", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in
    await page.goto(`${BASE_URL}/auth`);
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);
    await page.getByTestId("auth-submit-button").click();

    // Wait for auth to complete (may redirect to / or /dashboard)
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 10000 });

    // Navigate to projections
    await page.goto(`${BASE_URL}/projections`, { waitUntil: "networkidle" });
  });

  test.describe("Toggle Behavior", () => {
    test("should show 'Disabled' by default", async ({ page }) => {
      const toggle = page.getByRole("checkbox", { name: /Disabled|Enabled/ });
      await expect(toggle).toBeVisible();

      // Check the label text
      const label = page.locator("text=Disabled").first();
      await expect(label).toBeVisible();
    });

    test("should hide sliders when disabled", async ({ page }) => {
      // Sliders should not be visible when disabled
      // Check that the specific sliders are within a hidden section
      const globalAssumptionsCard = page
        .locator("text=Global Assumptions")
        .locator("..");
      const slidersInCard = globalAssumptionsCard.locator(
        'input[type="range"]'
      );
      const count = await slidersInCard.count();

      // When disabled, sliders should not be visible in the DOM or should be 0
      expect(count).toBe(0);
    });

    test("should show sliders when enabled", async ({ page }) => {
      const toggle = page.getByRole("checkbox", { name: /Disabled/ });
      await toggle.click();

      // Wait for the toggle to change
      await expect(page.locator("text=Enabled").first()).toBeVisible();

      // Check that sliders are now visible
      await expect(page.locator("text=Income Growth")).toBeVisible();
      await expect(page.locator("text=Expense Growth")).toBeVisible();
      await expect(page.locator("text=Investment Return")).toBeVisible();
    });
  });

  test.describe("API Request Validation", () => {
    test("should send 0 values when disabled", async ({ page }) => {
      // Listen for API requests
      const requests: Array<{ url: string; params: URLSearchParams }> = [];
      page.on("request", (request) => {
        if (
          request.url().includes("/api/households/") &&
          request.url().includes("/projections")
        ) {
          requests.push({
            url: request.url(),
            params: new URL(request.url()).searchParams,
          });
        }
      });

      // Reload to trigger initial API call
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Check that at least one request was made
      expect(requests.length).toBeGreaterThan(0);

      // Get the most recent request
      const lastRequest = requests[requests.length - 1];
      const params = lastRequest.params;

      // When disabled, should send 0 for all growth parameters
      expect(params.get("incomeGrowth")).toBe("0");
      expect(params.get("expenseGrowth")).toBe("0");
      expect(params.get("savingsRate")).toBe("0");
      expect(params.get("investmentReturn")).toBe("0");
    });

    test("should send actual percentage values when enabled", async ({
      page,
    }) => {
      // Enable the toggle first
      const toggle = page.getByRole("checkbox", { name: /Disabled/ });
      await toggle.click();
      await expect(page.locator("text=Enabled").first()).toBeVisible();

      // Listen for API requests after enabling
      const requests: Array<{ url: string; params: URLSearchParams }> = [];
      page.on("request", (request) => {
        if (
          request.url().includes("/api/households/") &&
          request.url().includes("/projections")
        ) {
          requests.push({
            url: request.url(),
            params: new URL(request.url()).searchParams,
          });
        }
      });

      // Wait for the debounced API call
      await page.waitForTimeout(1000);

      // Check that at least one request was made
      expect(requests.length).toBeGreaterThan(0);

      // Get the most recent request
      const lastRequest = requests[requests.length - 1];
      const params = lastRequest.params;

      // When enabled, should send actual percentage values
      expect(parseFloat(params.get("incomeGrowth") || "0")).toBeGreaterThan(0);
      expect(parseFloat(params.get("expenseGrowth") || "0")).toBeGreaterThan(0);
      // Savings rate is always 0 (we use individual account rates)
      expect(params.get("savingsRate")).toBe("0");
      expect(parseFloat(params.get("investmentReturn") || "0")).toBeGreaterThan(
        0
      );
    });
  });

  test.describe("Projection Values - Disabled vs Enabled", () => {
    test("should show lower 10-year projection when disabled", async ({
      page,
    }) => {
      // Get the 10-year projection value when disabled
      const projectionText = page
        .locator("text=Projected (10 Years)")
        .locator("..")
        .locator("div")
        .nth(1);
      await expect(projectionText).toBeVisible();

      const disabledValue = await projectionText.textContent();

      // Enable assumptions
      const toggle = page.getByRole("checkbox", { name: /Disabled/ });
      await toggle.click();
      await expect(page.locator("text=Enabled").first()).toBeVisible();

      // Wait for the API call and re-render
      await page.waitForTimeout(1500);

      // Get the new projection value
      const enabledValue = await projectionText.textContent();

      // Values should be different
      expect(disabledValue).not.toBe(enabledValue);

      // Parse the currency values and compare
      const disabledAmount = parseFloat(
        (disabledValue || "").replace(/[$,kM]/g, "")
      );
      const enabledAmount = parseFloat(
        (enabledValue || "").replace(/[$,kM]/g, "")
      );

      // Enabled should be higher due to growth assumptions
      expect(enabledAmount).toBeGreaterThan(disabledAmount);
    });

    test("should maintain consistent values when toggling back to disabled", async ({
      page,
    }) => {
      // Get initial disabled value
      const projectionText = page
        .locator("text=Projected (10 Years)")
        .locator("..")
        .locator("div")
        .nth(1);
      const initialValue = await projectionText.textContent();

      // Enable
      const toggle = page.getByRole("checkbox", { name: /Disabled/ });
      await toggle.click();
      await page.waitForTimeout(1500);

      // Disable again
      await toggle.click();
      await page.waitForTimeout(1500);

      // Get final disabled value
      const finalValue = await projectionText.textContent();

      // Should be the same as initial
      expect(finalValue).toBe(initialValue);
    });
  });

  test.describe("Data Table Validation", () => {
    test("should show correct Year 0 values with assumptions disabled", async ({
      page,
    }) => {
      // Show the data table
      const showTableBtn = page.getByRole("button", { name: "Show Table" });
      await showTableBtn.click();

      // Wait for table to appear
      const table = page.locator("table");
      await expect(table).toBeVisible();

      // Get Year 0 row (first data row after header)
      const year0Row = table.locator("tbody tr").first();
      const cells = year0Row.locator("td");

      // Extract values
      const year = await cells.nth(0).textContent();
      const netWorth = await cells.nth(1).textContent();
      const savings = await cells.nth(2).textContent();
      const debt = await cells.nth(4).textContent();
      const monthlyIncome = await cells.nth(5).textContent();
      const monthlyExpenses = await cells.nth(6).textContent();

      // Validate Year 0
      expect(year).toContain("Year 0");

      // These values should match the stored financial data
      // (approximately, since adjustments create slight differences)
      expect(netWorth).toMatch(/\$[\d,]+/);
      expect(savings).toMatch(/\$[\d,]+/);
      expect(debt).toMatch(/\$[\d,]+/);
      expect(monthlyIncome).toContain("$11,000"); // From test data
      expect(monthlyExpenses).toContain("$3,580"); // From test data
    });

    test("should show consistent table values with assumptions disabled", async ({
      page,
    }) => {
      // Show the data table
      const showTableBtn = page.getByRole("button", { name: "Show Table" });
      await showTableBtn.click();

      await page.waitForTimeout(500);

      // Get Year 5 values with assumptions disabled
      const table = page.locator("table");
      const year5Row = table.locator("tbody tr").nth(5);
      const year5NetWorth = await year5Row.locator("td").nth(1).textContent();

      // Enable assumptions
      const toggle = page.getByRole("checkbox", { name: /Disabled/ });
      await toggle.click();
      await page.waitForTimeout(1500);

      // Get Year 5 values with assumptions enabled
      const year5EnabledNetWorth = await year5Row
        .locator("td")
        .nth(1)
        .textContent();

      // Values should be different (enabled should be higher)
      expect(year5NetWorth).not.toBe(year5EnabledNetWorth);

      // Parse and compare
      const disabledAmount = parseFloat(
        (year5NetWorth || "").replace(/[$,]/g, "")
      );
      const enabledAmount = parseFloat(
        (year5EnabledNetWorth || "").replace(/[$,]/g, "")
      );

      expect(enabledAmount).toBeGreaterThan(disabledAmount);
    });

    test("should not show NaN or $0 for future years when disabled", async ({
      page,
    }) => {
      // Show the data table
      const showTableBtn = page.getByRole("button", { name: "Show Table" });
      await showTableBtn.click();

      await page.waitForTimeout(500);

      const table = page.locator("table");
      const rows = table.locator("tbody tr");
      const rowCount = await rows.count();

      // Check each row
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const cells = row.locator("td");

        const netWorth = await cells.nth(1).textContent();
        const savings = await cells.nth(2).textContent();

        // Should not contain NaN
        expect(netWorth).not.toContain("NaN");
        expect(savings).not.toContain("NaN");

        // For years 1-9, values should not be exactly $0 (there should be growth)
        if (i > 0) {
          expect(netWorth).not.toBe("$0");
          expect(savings).not.toBe("$0");
        }
      }
    });

    test("should show progressive growth in net worth over years (disabled)", async ({
      page,
    }) => {
      // Show the data table
      const showTableBtn = page.getByRole("button", { name: "Show Table" });
      await showTableBtn.click();

      await page.waitForTimeout(500);

      const table = page.locator("table");
      const rows = table.locator("tbody tr");

      // Get net worth for years 0, 3, 6, 9
      const years = [0, 3, 6, 9];
      const netWorths: number[] = [];

      for (const year of years) {
        const row = rows.nth(year);
        const netWorthText = await row.locator("td").nth(1).textContent();
        const amount = parseFloat((netWorthText || "").replace(/[$,]/g, ""));
        netWorths.push(amount);
      }

      // Each subsequent value should be greater than the previous
      // (even without growth assumptions, there's still savings accumulation)
      expect(netWorths[1]).toBeGreaterThan(netWorths[0]);
      expect(netWorths[2]).toBeGreaterThan(netWorths[1]);
      expect(netWorths[3]).toBeGreaterThan(netWorths[2]);
    });
  });

  test.describe("Chart and Table Consistency", () => {
    test("chart and table should show matching values", async ({ page }) => {
      // Get the 10-year summary ending net worth
      const summaryNetWorth = page
        .locator("text=Ending Net Worth")
        .locator("..")
        .locator("div")
        .nth(1);
      const summaryValue = await summaryNetWorth.textContent();

      // Show the data table
      const showTableBtn = page.getByRole("button", { name: "Show Table" });
      await showTableBtn.click();

      await page.waitForTimeout(500);

      // Get Year 9 net worth from table (last year in 10-year projection)
      const table = page.locator("table");
      const lastRow = table.locator("tbody tr").last();
      const tableNetWorth = await lastRow.locator("td").nth(1).textContent();

      // Parse both values
      const summaryAmount = parseFloat(
        (summaryValue || "").replace(/[$,kM]/g, "")
      );
      const tableAmount = parseFloat(
        (tableNetWorth || "").replace(/[$,]/g, "")
      );

      // Values should be approximately equal (allowing for rounding/formatting differences)
      // Convert summaryAmount if it's in millions
      let normalizedSummary = summaryAmount;
      if (summaryValue?.includes("M")) {
        normalizedSummary = summaryAmount * 1000000;
      } else if (summaryValue?.includes("k")) {
        normalizedSummary = summaryAmount * 1000;
      }

      // Allow 1% difference for rounding
      const difference = Math.abs(normalizedSummary - tableAmount);
      const percentDiff = (difference / tableAmount) * 100;

      expect(percentDiff).toBeLessThan(1);
    });
  });

  test.describe("Slider Changes", () => {
    test("should not scroll to top when adjusting sliders", async ({
      page,
    }) => {
      // Enable assumptions
      const toggle = page.getByRole("checkbox", { name: /Disabled/ });
      await toggle.click();
      await page.waitForTimeout(500);

      // Scroll down to the summary section
      await page.locator("text=10-Year Summary").scrollIntoViewIfNeeded();

      // Get initial scroll position
      const initialScroll = await page.evaluate(() => window.scrollY);
      expect(initialScroll).toBeGreaterThan(0);

      // Adjust a slider
      const incomeSlider = page
        .locator("text=Income Growth")
        .locator("..")
        .locator('input[type="range"]');
      await incomeSlider.fill("5");

      // Wait for debounce
      await page.waitForTimeout(1000);

      // Check scroll position hasn't changed significantly
      const finalScroll = await page.evaluate(() => window.scrollY);

      // Allow small differences but should be roughly the same
      expect(Math.abs(finalScroll - initialScroll)).toBeLessThan(100);
    });
  });

  test.describe("Regression Tests", () => {
    test("changing income should not affect debt in initial snapshot", async ({
      page,
    }) => {
      // Get initial debt value from stored data
      const debtLocator = page
        .locator("text=Total Debt")
        .locator("..")
        .locator("div")
        .nth(1);
      const initialDebt = await debtLocator.textContent();

      // Expand Alice's instruments
      const aliceBtn = page
        .locator("text=Alice's Financial Instruments")
        .locator("..")
        .locator("button")
        .first();
      await aliceBtn.click();

      // Wait for expansion
      await page.waitForTimeout(500);

      // Find and adjust Alice's income (look for an income field)
      // This is a placeholder - adjust based on actual UI structure
      const incomeInputs = page
        .locator('input[type="number"]')
        .filter({ hasText: "" });
      if ((await incomeInputs.count()) > 0) {
        const firstIncomeInput = incomeInputs.first();
        await firstIncomeInput.fill("10000");
        await firstIncomeInput.blur();

        // Wait for debounced update
        await page.waitForTimeout(1500);

        // Check that debt hasn't changed
        const finalDebt = await debtLocator.textContent();
        expect(finalDebt).toBe(initialDebt);
      }
    });
  });

  test.describe("Initial Load Behavior (Bug Fix Verification)", () => {
    test("should initialize with 0 growth rates on page load", async ({
      page,
    }) => {
      // Capture all API requests during initial page load
      const requests: Array<{ url: string; params: URLSearchParams }> = [];

      page.on("request", (request) => {
        if (
          request.url().includes("/api/households/") &&
          request.url().includes("/projections")
        ) {
          requests.push({
            url: request.url(),
            params: new URL(request.url()).searchParams,
          });
        }
      });

      // Reload the page to test initial load behavior
      await page.reload({ waitUntil: "networkidle" });

      // Wait for all requests to complete
      await page.waitForTimeout(1000);

      // There should be at least 2 requests:
      // 1. Initial fetch (might use defaults)
      // 2. onMounted initialization with 0 values
      expect(requests.length).toBeGreaterThanOrEqual(2);

      // The LAST request should have 0 values (from onMounted)
      const lastRequest = requests[requests.length - 1];
      const params = lastRequest.params;

      expect(params.get("incomeGrowth")).toBe("0");
      expect(params.get("expenseGrowth")).toBe("0");
      expect(params.get("savingsRate")).toBe("0");
      expect(params.get("investmentReturn")).toBe("0");
    });

    test("should show flat income values in table on initial load", async ({
      page,
    }) => {
      // Wait for page to fully load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // Wait for onMounted to trigger

      // Show the data table
      const showTableBtn = page.getByRole("button", {
        name: /Show Table/i,
      });
      await showTableBtn.click();

      // Wait for table to be visible
      const table = page.locator("table").first();
      await expect(table).toBeVisible();

      // Get all income cells (skip header)
      const incomeCells = table.locator("tbody tr td:nth-child(2)");
      const count = await incomeCells.count();

      // Extract all income values
      const incomeValues: number[] = [];
      for (let i = 0; i < count; i++) {
        const text = await incomeCells.nth(i).textContent();
        // Remove $ and commas, parse as number
        const value = parseFloat(text?.replace(/[$,]/g, "") || "0");
        incomeValues.push(value);
      }

      // Should have at least some rows
      expect(count).toBeGreaterThan(0);

      // All income values should be identical (no growth)
      const firstValue = incomeValues[0];

      // If there's no income data in test, skip this assertion
      if (firstValue > 0) {
        for (let i = 1; i < incomeValues.length; i++) {
          expect(incomeValues[i]).toBe(firstValue);
        }
      } else {
        console.log("No income data found - test user may need income sources");
      }
    });

    test("should NOT show 3% income growth when disabled on initial load", async ({
      page,
    }) => {
      // Wait for page to fully load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // Wait for onMounted to trigger

      // Show the data table
      const showTableBtn = page.getByRole("button", {
        name: /Show Table/i,
      });
      await showTableBtn.click();

      // Wait for table to be visible
      const table = page.locator("table").first();
      await expect(table).toBeVisible();

      // Get Year 0 and Year 1 income values
      const year0Income = table.locator(
        "tbody tr:nth-child(1) td:nth-child(2)"
      );
      const year1Income = table.locator(
        "tbody tr:nth-child(2) td:nth-child(2)"
      );

      const year0Text = await year0Income.textContent();
      const year1Text = await year1Income.textContent();

      const year0Value = parseFloat(year0Text?.replace(/[$,]/g, "") || "0");
      const year1Value = parseFloat(year1Text?.replace(/[$,]/g, "") || "0");

      // If there's income data, verify no growth
      if (year0Value > 0) {
        // Calculate what 3% growth would look like
        const expectedWith3PercentGrowth = year0Value * 1.03;

        // Year 1 should be the same as Year 0 (no growth)
        expect(year1Value).toBe(year0Value);

        // Year 1 should NOT be 3% higher
        expect(year1Value).not.toBeCloseTo(expectedWith3PercentGrowth, 0);
      } else {
        // If both are 0, that's still consistent (no growth from 0)
        expect(year1Value).toBe(year0Value);
      }
    });

    test("should verify specific income values remain constant across all years", async ({
      page,
    }) => {
      // Wait for page to fully load
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // Wait for onMounted to trigger

      // Show the data table
      const showTableBtn = page.getByRole("button", {
        name: /Show Table/i,
      });
      await showTableBtn.click();

      // Wait for table to be visible
      const table = page.locator("table").first();
      await expect(table).toBeVisible();

      // Get Year 0, Year 1, and Year 9 income values
      const year0Income = table.locator(
        "tbody tr:nth-child(1) td:nth-child(2)"
      );
      const year1Income = table.locator(
        "tbody tr:nth-child(2) td:nth-child(2)"
      );
      const year9Income = table.locator(
        "tbody tr:nth-child(10) td:nth-child(2)"
      );

      const year0Text = await year0Income.textContent();
      const year1Text = await year1Income.textContent();
      const year9Text = await year9Income.textContent();

      const year0Value = parseFloat(year0Text?.replace(/[$,]/g, "") || "0");
      const year1Value = parseFloat(year1Text?.replace(/[$,]/g, "") || "0");
      const year9Value = parseFloat(year9Text?.replace(/[$,]/g, "") || "0");

      // All three values should be identical
      expect(year1Value).toBe(year0Value);
      expect(year9Value).toBe(year0Value);

      // Verify we're not seeing the buggy values
      // Bug showed: Year 0: $11,000, Year 1: $11,330, Year 9: $14,353
      if (Math.abs(year0Value - 11000) < 1000) {
        // If income is around $11k, verify specific bug values are NOT present
        expect(year1Value).not.toBeCloseTo(11330, -1);
        expect(year9Value).not.toBeCloseTo(14353, -1);
      }
    });
  });
});
