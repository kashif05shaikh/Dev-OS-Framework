import { test, expect, type Page } from "@playwright/test";
import { createClient, type Session } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

let testUrl = "";
let testKey = "";
const envPath = path.resolve(process.cwd(), ".env.test");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const l of lines) {
    const trimmed = l.trim();
    if (trimmed.startsWith("SUPABASE_TEST_URL=")) {
      testUrl = trimmed
        .split("=")[1]
        .replace(/["'\r]/g, "")
        .trim();
    }
    if (trimmed.startsWith("SUPABASE_TEST_ANON_KEY=")) {
      testKey = trimmed
        .split("=")[1]
        .replace(/["'\r]/g, "")
        .trim();
    }
  }
}

if (
  !testUrl ||
  !testUrl.includes("mwfajiaszgwtopuyjjkd") ||
  testUrl.includes("bppvwdbrmyvgqqgpbjqe")
) {
  throw new Error(
    "SECURITY GUARD: E2E tests must run against DevOS-Test ONLY (mwfajiaszgwtopuyjjkd)!",
  );
}

const runId = Date.now();
const USER_EMAIL = `test_mobile_${runId}@devostest.local`;
const TEST_PASSWORD = "TestPassword123!@#DevOS";

let storageKey = "";
let session: Session | null = null;

async function applyUserSession(page: Page, sess: Session | null) {
  if (!sess || !storageKey) return;
  await page.addInitScript(
    ({ key, value }) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* ignore */
      }
    },
    { key: storageKey, value: sess },
  );
}

test.describe("Mobile responsiveness at 375px and 768px", () => {
  test.beforeAll(async () => {
    const projectRef = new URL(testUrl).hostname.split(".")[0];
    storageKey = `sb-${projectRef}-auth-token`;

    const client = createClient(testUrl, testKey, { auth: { persistSession: false } });

    await client.auth.signUp({
      email: USER_EMAIL,
      password: TEST_PASSWORD,
      options: { data: { display_name: "Mobile Tester" } },
    });

    const { data: authData } = await client.auth.signInWithPassword({
      email: USER_EMAIL,
      password: TEST_PASSWORD,
    });
    session = authData.session;
  });

  const routes = [
    { name: "learning", path: "/learning" },
    { name: "calendar", path: "/calendar" },
    { name: "notes", path: "/notes" },
  ];

  for (const r of routes) {
    test(`No horizontal overflow on ${r.path} at 375px and 768px`, async ({ page }) => {
      await applyUserSession(page, session);

      // Check 375px
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(r.path, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      const overflow375 = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        return {
          rootScroll: root.scrollWidth,
          rootClient: root.clientWidth,
          bodyScroll: body.scrollWidth,
          windowWidth: window.innerWidth,
          hasOverflow: root.scrollWidth > root.clientWidth || body.scrollWidth > window.innerWidth,
        };
      });

      await page.screenshot({ path: `test-results/after-${r.name}-375.png`, fullPage: false });
      expect(overflow375.hasOverflow).toBe(false);

      // Check 768px
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      const overflow768 = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        return {
          rootScroll: root.scrollWidth,
          rootClient: root.clientWidth,
          bodyScroll: body.scrollWidth,
          windowWidth: window.innerWidth,
          hasOverflow: root.scrollWidth > root.clientWidth || body.scrollWidth > window.innerWidth,
        };
      });

      await page.screenshot({ path: `test-results/after-${r.name}-768.png`, fullPage: false });
      expect(overflow768.hasOverflow).toBe(false);
    });
  }

  test("Notes editor view and back navigation at 375px", async ({ page }) => {
    if (!session) return;
    const client = createClient(testUrl, testKey, { auth: { persistSession: false } });

    // Seed a test subject and note
    const { data: subject } = await client
      .from("subjects")
      .insert({ user_id: session.user.id, name: "Mobile Subject", color: "#6366f1" })
      .select()
      .single();

    if (subject) {
      await client.from("notes").insert({
        user_id: session.user.id,
        subject_id: subject.id,
        title: "Mobile Test Note",
        content_markdown: "Hello from mobile test",
        tags: ["mobile"],
      });
    }

    await applyUserSession(page, session);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/notes", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Expand subject and click note
    const noteRow = page.getByText("Mobile Test Note");
    if (await noteRow.isVisible()) {
      await noteRow.click();
      await page.waitForTimeout(500);

      const overflowEditor = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        return root.scrollWidth > root.clientWidth || body.scrollWidth > window.innerWidth;
      });
      expect(overflowEditor).toBe(false);

      // Verify back button works
      const backBtn = page.getByRole("button", { name: /Notes/ });
      await expect(backBtn).toBeVisible();
      await backBtn.click();
      await page.waitForTimeout(500);
      await expect(page.getByText("Mobile Subject")).toBeVisible();
    }
  });
});
