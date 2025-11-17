import { test, expect } from "../fixtures";

test.describe("Person CRUD", () => {
  test("should create a new person", async ({ page, sessionCookie }) => {
    // Set auth cookie
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: sessionCookie,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    // Click "Add Member" button (might be "Add First Member" if no members exist)
    await page.getByTestId("add-person-button").click();

    // Wait for modal to open
    await expect(
      page.getByRole("heading", { name: "Lägg till medlem" })
    ).toBeVisible();

    // Fill in person details
    await page.getByTestId("person-name-input").fill("Jane Smith");
    await page.getByTestId("person-age-input").fill("28");

    // Submit form
    await page.getByTestId("person-modal-submit-button").click();

    // Wait for modal to close
    await expect(
      page.getByRole("heading", { name: "Lägg till medlem" })
    ).not.toBeVisible();

    // Verify new person appears in the list
    await expect(page.getByText("Jane Smith")).toBeVisible();
    await expect(page.getByText("Ålder: 28")).toBeVisible();
  });

  test("should delete a person", async ({ page, sessionCookie }) => {
    // Set auth cookie
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: sessionCookie,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/economy");
    await page.waitForLoadState("networkidle");

    // First, create a person to delete
    await page.getByTestId("add-person-button").click();
    await expect(
      page.getByRole("heading", { name: "Lägg till medlem" })
    ).toBeVisible();
    await page.getByTestId("person-name-input").fill("To Be Deleted");
    await page.getByTestId("person-age-input").fill("25");
    await page.getByTestId("person-modal-submit-button").click();
    await expect(
      page.getByRole("heading", { name: "Lägg till medlem" })
    ).not.toBeVisible();

    // Verify person was created
    await expect(page.getByText("To Be Deleted")).toBeVisible();

    // Find the person's delete button using a more specific selector
    // Since we just created this person, we need to find their ID from the manage button
    const manageButton = page
      .locator('[data-testid*="person-"][data-testid*="-manage-button"]')
      .filter({
        hasText: /hantera ekonomi/i,
      })
      .last();

    const testId = await manageButton.getAttribute("data-testid");
    const personId = testId?.match(/person-(\d+)-manage-button/)?.[1];

    if (!personId) {
      throw new Error("Could not find person ID");
    }

    // Click delete button for this person
    await page.getByTestId(`person-${personId}-delete-button`).click();

    // Wait for delete confirmation modal
    await expect(
      page.getByRole("heading", { name: "Ta bort medlem" })
    ).toBeVisible();

    // Confirm deletion
    await page.getByTestId("confirm-delete-person-button").click();

    // Wait for modal to close
    await expect(
      page.getByRole("heading", { name: "Ta bort medlem" })
    ).not.toBeVisible();

    // Verify person is no longer in the list
    await expect(page.getByText("To Be Deleted")).not.toBeVisible();
  });
});
