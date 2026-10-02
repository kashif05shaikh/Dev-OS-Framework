import { test, expect } from "@playwright/test";

test.describe("Core User Journeys (E2E)", () => {
  test("Unauthenticated user navigating to /goals is redirected to /auth", async ({ page }) => {
    await page.goto("/goals");
    await expect(page).toHaveURL(/.*auth.*/, { timeout: 15000 });
  });
});
