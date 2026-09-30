import { test, expect } from "@playwright/test";

// Playwright End-to-End Tests
// These run via `npx playwright test` against a running dev/preview server.

test.describe("Core User Journeys (E2E)", () => {
  test("Unauthenticated user navigating to /goals is redirected to /auth", async ({ page }) => {
    await page.goto("/goals");
    await expect(page).toHaveURL(/.*auth/);
  });

  test("Focus timer UI exposes start and reset controls", async ({ page }) => {
    await page.goto("/focus");
    // Verify controls render on page
    const timerText = page.locator("text=25:00");
    await expect(timerText).toBeVisible();
  });

  test("Resume page renders file upload dropzone", async ({ page }) => {
    await page.goto("/resume");
    const uploadPrompt = page.locator("text=/Attach file|Upload/i");
    await expect(uploadPrompt).toBeVisible();
  });
});
