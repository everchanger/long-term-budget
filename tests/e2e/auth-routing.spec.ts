import { test, expect } from "@playwright/test";
import { TEST_USER } from "./fixtures";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Authentication and Route Guards", () => {
  test.describe("Unauthenticated User Behavior", () => {
    test("should allow access to index page without authentication", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      // Should see the landing page content
      const title = page.getByRole("heading").first();
      await expect(title).toBeVisible();
    });

    test("should allow access to auth page without authentication", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState("networkidle");

      // Should see the auth page
      const signInButton = page.getByTestId("auth-submit-button");
      await expect(signInButton).toBeVisible();
    });

    test("should redirect unauthenticated user from /economy to /auth", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/economy`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to auth page
      expect(page.url()).toContain("/auth");
    });

    test("should redirect unauthenticated user from /dashboard to /auth", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to auth page
      expect(page.url()).toContain("/auth");
    });

    test("should redirect unauthenticated user from /scenarios to /auth", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/scenarios`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to auth page
      expect(page.url()).toContain("/auth");
    });

    test("should redirect unauthenticated user from /financial-health to /auth", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/financial-health`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to auth page
      expect(page.url()).toContain("/auth");
    });

    test("should redirect unauthenticated user from /projections to /auth", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to auth page
      expect(page.url()).toContain("/auth");
    });

    test("should redirect unauthenticated user from /financial-story to /auth", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/financial-story`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to auth page
      expect(page.url()).toContain("/auth");
    });

    test("should redirect unauthenticated user from /settings to /auth", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to auth page
      expect(page.url()).toContain("/auth");
    });
  });

  test.describe("Sign-up and Login Flow", () => {
    test("should redirect to /economy after successful sign-up", async ({
      page,
    }) => {
      const uniqueEmail = `test-${Date.now()}@test.com`;

      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState("networkidle");

      // Find the card and click the sign-up button inside it
      const card = page
        .locator('[class*="rounded"]')
        .filter({
          has: page.getByRole("button", { name: /Registrera|Sign Up/i }),
        })
        .first();
      const signUpButton = card
        .getByRole("button", { name: /Registrera|Sign Up/i })
        .first();
      await signUpButton.click();
      await page.waitForTimeout(500);

      // Fill sign-up form
      await page.getByLabel(/E-post|Email/, { exact: true }).fill(uniqueEmail);
      await page
        .getByLabel(/Lösenord|Password/, { exact: true })
        .fill("Test12345!");
      await page.getByLabel(/Namn|Name/, { exact: true }).fill("Test User");

      // Submit form
      const submitButton = page.getByTestId("auth-submit-button");
      await submitButton.click();

      // Wait for redirect to /economy
      await page.waitForURL("**/economy", { timeout: 10000 });
      expect(page.url()).toContain("/economy");
    });

    test("should redirect to /economy after successful login", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState("networkidle");

      // Fill login form with test credentials
      await page
        .getByLabel(/E-post|Email/, { exact: true })
        .fill(TEST_USER.email);
      await page
        .getByLabel(/Lösenord|Password/, { exact: true })
        .fill(TEST_USER.password);

      // Submit form
      const submitButton = page.getByTestId("auth-submit-button");
      await submitButton.click();

      // Wait for redirect to /economy
      await page.waitForURL("**/economy", { timeout: 10000 });
      expect(page.url()).toContain("/economy");
    });
  });

  test.describe("Authenticated User Behavior", () => {
    test.beforeEach(async ({ page }) => {
      // Log in before each test
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState("networkidle");

      // Fill login form
      await page
        .getByLabel(/E-post|Email/, { exact: true })
        .fill(TEST_USER.email);
      await page
        .getByLabel(/Lösenord|Password/, { exact: true })
        .fill(TEST_USER.password);

      // Submit form
      const submitButton = page.getByTestId("auth-submit-button");
      await submitButton.click();

      // Wait for redirect to /economy
      await page.waitForURL("**/economy", { timeout: 10000 });
    });

    test("should redirect authenticated user from / to /economy", async ({
      page,
    }) => {
      // Navigate to home page
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to /economy
      await page.waitForURL("**/economy", { timeout: 5000 });
      expect(page.url()).toContain("/economy");
    });

    test("should redirect authenticated user from /auth to /economy", async ({
      page,
    }) => {
      // Navigate to auth page
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState("networkidle");

      // Should be redirected to /economy
      await page.waitForURL("**/economy", { timeout: 5000 });
      expect(page.url()).toContain("/economy");
    });

    test("should allow authenticated user to access /economy", async ({
      page,
    }) => {
      // Should already be on /economy from beforeEach
      expect(page.url()).toContain("/economy");
    });

    test("should allow authenticated user to access /dashboard", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState("networkidle");

      // Should not redirect
      expect(page.url()).toContain("/dashboard");
    });

    test("should allow authenticated user to access /scenarios", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/scenarios`);
      await page.waitForLoadState("networkidle");

      // Should not redirect
      expect(page.url()).toContain("/scenarios");
    });

    test("should allow authenticated user to access /financial-health", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/financial-health`);
      await page.waitForLoadState("networkidle");

      // Should not redirect
      expect(page.url()).toContain("/financial-health");
    });

    test("should allow authenticated user to access /projections", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/projections`);
      await page.waitForLoadState("networkidle");

      // Should not redirect
      expect(page.url()).toContain("/projections");
    });

    test("should allow authenticated user to access /financial-story", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/financial-story`);
      await page.waitForLoadState("networkidle");

      // Should not redirect
      expect(page.url()).toContain("/financial-story");
    });

    test("should allow authenticated user to access /settings", async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}/settings`);
      await page.waitForLoadState("networkidle");

      // Should not redirect
      expect(page.url()).toContain("/settings");
    });
  });

  test.describe("Navbar Active State Highlighting", () => {
    test.beforeEach(async ({ page }) => {
      // Log in before each test
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState("networkidle");

      // Fill login form
      await page
        .getByLabel(/E-post|Email/, { exact: true })
        .fill(TEST_USER.email);
      await page
        .getByLabel(/Lösenord|Password/, { exact: true })
        .fill(TEST_USER.password);

      // Submit form
      const submitButton = page.getByTestId("auth-submit-button");
      await submitButton.click();

      // Wait for redirect to /economy
      await page.waitForURL("**/economy", { timeout: 10000 });
    });

    test("should display UHeader navbar when authenticated", async ({
      page,
    }) => {
      // Should be on /economy page
      expect(page.url()).toContain("/economy");

      // UHeader should be visible using role=banner (semantic <header>)
      const header = page.getByRole("banner");
      await expect(header).toBeVisible();

      // Logo/brand link should be visible
      const brandLink = header.getByRole("link").first();
      await expect(brandLink).toBeVisible();
    });

    test("should display navigation links in UNavigationMenu when authenticated", async ({
      page,
    }) => {
      // Should be on /economy page
      expect(page.url()).toContain("/economy");

      // Find header
      const header = page.getByRole("banner");

      // Overview/Economy navigation link should be visible
      const overviewLink = header.getByRole("link", {
        name: /Översikt|Overview/i,
      });
      await expect(overviewLink.first()).toBeVisible();

      // Projections link should be visible
      const projectionsLink = header.getByRole("link", {
        name: /Prognoser|Projections/i,
      });
      await expect(projectionsLink.first()).toBeVisible();
    });

    test("should have aria-current on active navigation link", async ({
      page,
    }) => {
      // Should be on /economy page
      expect(page.url()).toContain("/economy");

      // Get the Overview/Economy link
      const header = page.getByRole("banner");
      const overviewLink = header
        .getByRole("link", { name: /Översikt|Overview/i })
        .first();

      // Link should be visible
      await expect(overviewLink).toBeVisible();

      // Check for aria-current="page" attribute (UNavigationMenu standard)
      const ariaCurrent = await overviewLink.getAttribute("aria-current");
      expect(ariaCurrent).toBe("page");
    });

    test("should navigate to Projections when clicking Projections link", async ({
      page,
    }) => {
      // Should be on /economy page
      expect(page.url()).toContain("/economy");

      // Click Projections link
      const header = page.getByRole("banner");
      const projectionsLink = header
        .getByRole("link", { name: /Prognoser|Projections/i })
        .first();
      await projectionsLink.click();

      // Should navigate to /projections
      await page.waitForURL("**/projections", { timeout: 10000 });
      expect(page.url()).toContain("/projections");

      // Projections link should now have aria-current="page"
      const ariaCurrent = await projectionsLink.getAttribute("aria-current");
      expect(ariaCurrent).toBe("page");
    });

    test("should hide navbar navigation for unauthenticated users", async ({
      page,
    }) => {
      // Navigate to auth page
      await page.goto(`${BASE_URL}/auth`);
      await page.waitForLoadState("networkidle");

      // Header should still exist (logo, sign in button)
      const header = page.getByRole("banner");
      await expect(header).toBeVisible();

      // But Overview and Projections nav links should not be visible
      const overviewLink = header.getByRole("link", {
        name: /Översikt|Overview/i,
      });
      await expect(overviewLink).not.toBeVisible();

      const projectionsLink = header.getByRole("link", {
        name: /Prognoser|Projections/i,
      });
      await expect(projectionsLink).not.toBeVisible();
    });
  });
});
