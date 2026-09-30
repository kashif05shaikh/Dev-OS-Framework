import { test, expect } from "@playwright/test";

test.describe("Mobile Viewport & Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE viewport

  test("Dashboard does not have horizontal scrollbar blowout on mobile", async ({ page }) => {
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin for subpixel rendering
  });
});
