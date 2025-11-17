import { test, expect } from "./fixtures";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Settings Page", () => {
  test("should display settings page with language and currency options", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");

    // Check for settings title
    await expect(
      page.getByRole("heading", { name: "Inställningar" })
    ).toBeVisible();

    // Check for language label
    await expect(page.getByText("Språk").first()).toBeVisible();

    // Check for currency label
    await expect(page.getByText("Valuta").first()).toBeVisible();

    // Check for save button (should be disabled initially)
    const saveButton = page.getByRole("button", {
      name: "Spara ändringar",
    });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeDisabled();
  });

  test("should display current language selection", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");

    // Check that language select shows 'sv' (test user's saved preference)
    const languageSelect = page.getByTestId("language-select");
    await expect(languageSelect).toBeVisible();
    // Check the selected value, not the text content
    const selectedValue = await languageSelect.inputValue();
    expect(selectedValue).toBe("sv");
  });

  test("should display current currency selection", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");

    // Check that currency select shows 'SEK' (test user's saved preference)
    const currencySelect = page.getByTestId("currency-select");
    await expect(currencySelect).toBeVisible();
    await expect(currencySelect).toContainText("SEK");
  });

  test("should have working preferences API endpoint", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");

    // Call the preferences API
    const response = await page.request.get(`${BASE_URL}/api/user/preferences`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("locale");
    expect(data.data).toHaveProperty("currency");

    // Verify valid values
    expect(["en", "sv"]).toContain(data.data.locale);
    expect(["USD", "SEK"]).toContain(data.data.currency);
  });

  test("should disable save button when no changes are made", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState("networkidle");

    // Save button should be disabled initially
    const saveButton = page.getByRole("button", {
      name: /Spara ändringar/i,
    });
    await expect(saveButton).toBeDisabled();
  });

  test("should have settings link in navigation for authenticated users", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState("networkidle");

    // Should have settings link in navigation
    const settingsLink = page.getByRole("link", {
      name: /Inställningar/i,
    });
    await expect(settingsLink).toBeVisible();

    // Click it and verify we go to settings page
    await settingsLink.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/settings/);
    await expect(
      page.getByRole("heading", { name: "Inställningar" })
    ).toBeVisible();
  });
});
