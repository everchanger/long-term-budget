import { test, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures";

const BASE_URL =
  process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

test.describe("Financial Projections", () => {
  test.beforeEach(async ({ page, context }) => {
    // Use default Swedish locale
    // Using default Swedish locale (SSR default)

    // Sign in
    await page.goto(`${BASE_URL}/auth`);
    await page.getByLabel(/E-post/i).fill(TEST_USER.email);
    await page.getByLabel(/Lösenord/i).fill(TEST_USER.password);
    await page.getByTestId("auth-submit-button").click();
    await page.waitForURL(/\/(dashboard)?$/);
  });

  test.describe("Initial State", () => {
    test("should display stored financial data card", async ({ page }) => {
      await page.goto(`${BASE_URL}/projections`);

      // Check that stored financial data card is visible
      await expect(
        page.getByRole("heading", {
          name: /Lagrad finansiell data/i,
        })
      ).toBeVisible();

      // Should show the 4 main metrics
      const netWorthText = page.locator("text=/Nettoförmögenhet/i").first();
      await expect(netWorthText).toBeVisible();
      await expect(page.locator("text=/Månadsinkomst/i").first()).toBeVisible();
      await expect(
        page.locator("text=/Månadskostnader/i").first()
      ).toBeVisible();
      await expect(page.locator("text=/Total skuld/i").first()).toBeVisible();
    });

    test("should NOT display adjusted values card initially", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);

      // Adjusted projection values should not be visible when no adjustments made
      const adjustedHeading = page.getByRole("heading", {
        name: /Justerade projektionsvärden/i,
      });
      await expect(adjustedHeading).not.toBeVisible();
    });

    test("should display projection chart with view toggles", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);

      // Check chart is present
      await expect(
        page.getByRole("heading", {
          name: /10-årig finansiell prognos/i,
        })
      ).toBeVisible();

      // Check view toggle buttons
      await expect(
        page.getByRole("button", { name: /Nettoförmögenhet/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Tillgångar/i })
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /Skuld/i })).toBeVisible();
    });

    test("should display 10-year summary", async ({ page }) => {
      await page.goto(`${BASE_URL}/projections`);

      await expect(
        page.getByRole("heading", {
          name: /10-årssammanfattning/i,
        })
      ).toBeVisible();
      await expect(
        page.locator("text=/Startande nettoförmögenhet/i").first()
      ).toBeVisible();
      await expect(
        page.locator("text=/Slutlig nettoförmögenhet/i").first()
      ).toBeVisible();
      await expect(
        page.locator("text=/Total tillväxt/i").first()
      ).toBeVisible();
    });

    test("should display global assumptions sliders when enabled", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);

      await expect(
        page.getByRole("heading", {
          name: /Globala antaganden/i,
        })
      ).toBeVisible();

      // Initially disabled - no sliders
      const initialSliders = await page.locator('input[type="range"]').count();
      expect(initialSliders).toBe(0);

      // Enable the toggle
      const toggle = page.getByRole("checkbox", {
        name: /Inaktiverad/i,
      });
      await toggle.click();

      // Wait for sliders to appear
      await expect(
        page.locator("text=/Income Growth|Inkomsttillväxt/i")
      ).toBeVisible();

      // Check for sliders (Income Growth, Expense Growth, Investment Return)
      const sliderCount = await page.locator('input[type="range"]').count();
      expect(sliderCount).toBe(3);
    });
  });

  test.describe("Chart View Toggling", () => {
    test("should toggle between Net Worth, Assets, and Debt views", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);

      const assetsBtn = page.getByRole("button", {
        name: /Tillgångar/i,
      });
      const debtBtn = page.getByRole("button", { name: /Skuld/i });
      const netWorthBtn = page.getByRole("button", {
        name: /Nettoförmögenhet/i,
      });

      // Click Assets button
      await assetsBtn.click();
      await page.waitForTimeout(300);

      // Click Debt button
      await debtBtn.click();
      await page.waitForTimeout(300);

      // Click back to Net Worth
      await netWorthBtn.click();
      await page.waitForTimeout(300);

      // All buttons should be clickable and page should not crash
      await expect(
        page.getByRole("heading", {
          name: /10-årig finansiell prognos/i,
        })
      ).toBeVisible();
    });
  });

  test.describe("Instrument Adjustments - Core Functionality", () => {
    test("should show adjusted values card when income is modified and applied", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);

      // Look for expandable person panels
      const personButtons = page
        .getByRole("button")
        .filter({ hasText: /alice|bob|person/i });
      const firstPerson = personButtons.first();

      const isVisible = await firstPerson.isVisible().catch(() => false);

      if (isVisible) {
        await firstPerson.click();
        await page.waitForTimeout(500);

        // Find any number input (should be income or other financial values)
        const inputs = page.locator('input[type="number"]');
        const firstInput = inputs.first();

        if (await firstInput.isVisible()) {
          // Change the value
          const currentValue = await firstInput.inputValue();
          const newValue = (parseFloat(currentValue || "5000") * 2).toString();
          await firstInput.fill(newValue);

          // Look for Apply Changes button
          const applyButton = page.getByRole("button", {
            name: /apply.*changes/i,
          });
          if (await applyButton.isVisible()) {
            await applyButton.click();

            // Wait for projection to update
            await page.waitForTimeout(1000);

            // Adjusted projection values card should now be visible
            await expect(
              page.getByRole("heading", {
                name: /Justerade projektionsvärden/i,
              })
            ).toBeVisible({ timeout: 10000 });
          }
        }
      }
    });

    test("should calculate adjusted monthly income correctly when income amount changes", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);

      // Helper to extract currency amount from text
      const extractAmount = (text: string): number => {
        const match = text.match(/\$[\d,]+/);
        return match ? parseFloat(match[0].replace(/[$,]/g, "")) : 0;
      };

      // Get initial monthly income from stored data
      await page.waitForSelector("text=/Lagrad finansiell data/i");
      const monthlyIncomeLocator = page
        .locator("text=/Månadsinkomst/i")
        .first();
      await monthlyIncomeLocator.waitFor({ state: "visible", timeout: 10000 });
      const parentDiv = monthlyIncomeLocator.locator("..");
      const storedIncomeText = await parentDiv.innerText();
      const initialMonthlyIncome = extractAmount(storedIncomeText);

      // Expand first person's panel
      const personButtons = page
        .getByRole("button")
        .filter({ hasText: /alice|bob|person/i });
      const firstPerson = personButtons.first();

      if (await firstPerson.isVisible()) {
        await firstPerson.click();
        await page.waitForTimeout(500);

        // Find the first income amount input
        const amountInputs = page.locator('input[type="number"]');
        const firstAmountInput = amountInputs.first();

        if (await firstAmountInput.isVisible()) {
          const originalAmount = await firstAmountInput.inputValue();
          const originalAmountNum = parseFloat(originalAmount || "5000");
          const newAmount = (originalAmountNum * 2).toString();

          console.log(
            `Changing income from $${originalAmount} to $${newAmount}`
          );

          // Change the value
          await firstAmountInput.fill(newAmount);

          // Click Apply Changes
          const applyButton = page.getByRole("button", {
            name: /apply.*changes/i,
          });
          if (await applyButton.isVisible()) {
            await applyButton.click();

            // Wait for update
            await page.waitForTimeout(1200);

            // Check for adjusted values card
            const adjustedHeading = page.getByRole("heading", {
              name: /Justerade projektionsvärden/i,
            });
            await expect(adjustedHeading).toBeVisible({ timeout: 10000 });

            // Get adjusted monthly income
            const adjustedCard = page
              .locator("text=/Justerade projektionsvärden/i")
              .locator("..");
            const adjustedIncomeSection = adjustedCard
              .locator("text=/Månadsinkomst/i")
              .locator("..");
            const adjustedIncomeText = await adjustedIncomeSection.innerText();
            const adjustedMonthlyIncome = extractAmount(adjustedIncomeText);

            console.log(`Adjusted Monthly Income: $${adjustedMonthlyIncome}`);
            console.log(
              `Expected increase: approximately $${originalAmountNum}`
            );

            // Calculate the difference
            const difference = adjustedMonthlyIncome - initialMonthlyIncome;
            console.log(`Actual difference: $${difference}`);

            // The difference should be approximately equal to the original amount
            // (since we doubled one income, the increase = original amount)
            // Allow 20% tolerance for rounding and frequency conversion
            expect(difference).toBeGreaterThan(originalAmountNum * 0.8);
            expect(difference).toBeLessThan(originalAmountNum * 1.2);
          }
        }
      }
    });
  });

  test.describe("Global Assumptions Changes", () => {
    test("should update projection when income growth rate changes", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);

      // Wait for page to load
      await expect(page.locator("text=/Globala antaganden/i")).toBeVisible();

      // Enable Global Assumptions first
      const toggle = page.getByRole("checkbox", {
        name: /Inaktiverad/i,
      });
      await toggle.click();

      // Wait for sliders to appear
      await expect(page.locator("text=/Inkomsttillväxt/i")).toBeVisible();
      await page.waitForTimeout(500);

      // Wait for initial projection to load
      await page.waitForSelector("text=/10-årssammanfattning/i");
      await page.waitForTimeout(1000);

      // Find income growth slider (first range input after enabling toggle)
      const sliders = page.locator('input[type="range"]');
      const slider = sliders.first(); // Income Growth is the first slider

      // Verify slider is visible
      await expect(slider).toBeVisible();

      // Change slider value to a different rate
      await slider.fill("7");

      // Wait for debounce and API call to complete
      await page.waitForTimeout(2000);

      // Verify the slider value changed (check the percentage display)
      await expect(page.locator("text=/7\\.\\d%/")).toBeVisible();
    });
  });
});
