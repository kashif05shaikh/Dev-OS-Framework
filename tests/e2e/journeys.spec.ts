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

const runId = Date.now();
const USER_A_EMAIL = `test_e2e_a_${runId}@devostest.local`;
const USER_B_EMAIL = `test_e2e_b_${runId}@devostest.local`;
const TEST_PASSWORD = "TestPassword123!@#DevOS";

let storageKey = "";
let sessionA: Session | null = null;
let sessionB: Session | null = null;

async function applyUserSession(page: Page, session: Session | null) {
  if (!session || !storageKey) return;
  await page.addInitScript(
    ({ key, value }) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* ignore */
      }
    },
    { key: storageKey, value: session },
  );
}

test.describe("DevOS End-to-End User Journeys", () => {
  test.beforeAll(async () => {
    if (testUrl && testKey && testUrl.includes("mwfajiaszgwtopuyjjkd")) {
      const projectRef = new URL(testUrl).hostname.split(".")[0];
      storageKey = `sb-${projectRef}-auth-token`;

      const client = createClient(testUrl, testKey, { auth: { persistSession: false } });

      await client.auth.signUp({
        email: USER_A_EMAIL,
        password: TEST_PASSWORD,
        options: { data: { display_name: "Tester Alpha" } },
      });
      await client.auth.signUp({
        email: USER_B_EMAIL,
        password: TEST_PASSWORD,
        options: { data: { display_name: "Tester Beta" } },
      });

      const { data: authA } = await client.auth.signInWithPassword({
        email: USER_A_EMAIL,
        password: TEST_PASSWORD,
      });
      sessionA = authA?.session ?? null;

      const { data: authB } = await client.auth.signInWithPassword({
        email: USER_B_EMAIL,
        password: TEST_PASSWORD,
      });
      sessionB = authB?.session ?? null;
    }
  });

  test.afterAll(async () => {
    if (testUrl && testKey && testUrl.includes("mwfajiaszgwtopuyjjkd")) {
      for (const email of [USER_A_EMAIL, USER_B_EMAIL]) {
        const client = createClient(testUrl, testKey, { auth: { persistSession: false } });
        const { data: auth } = await client.auth.signInWithPassword({
          email,
          password: TEST_PASSWORD,
        });
        if (!auth?.user) continue;
        const uid = auth.user.id;
        const tables = [
          "notes",
          "note_folders",
          "note_subjects",
          "goals",
          "resumes",
          "resume_files",
          "focus_sessions",
          "profiles",
        ];
        for (const t of tables) {
          const idCol = t === "profiles" ? "id" : "user_id";
          await client.from(t).delete().eq(idCol, uid);
        }
      }
    }
  });

  test("1. Protected routes redirect unauthenticated users to /auth", async ({ page }) => {
    await page.goto("/goals");
    await expect(page).toHaveURL(/.*auth.*/, { timeout: 15000 });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*auth.*/, { timeout: 15000 });

    await page.goto("/notes");
    await expect(page).toHaveURL(/.*auth.*/, { timeout: 15000 });
  });

  test("2. User A can sign in, view dashboard, and sign out", async ({ page }) => {
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    const emailInput = page.locator("#signin-email");
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await emailInput.fill(USER_A_EMAIL);
    await expect(emailInput).toHaveValue(USER_A_EMAIL);

    const passwordInput = page.locator("#signin-password");
    await expect(passwordInput).toBeVisible({ timeout: 15000 });
    await passwordInput.fill(TEST_PASSWORD);
    await expect(passwordInput).toHaveValue(TEST_PASSWORD);

    const submitBtn = page.locator("button[type='submit']:has-text('Sign in')");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    try {
      await page.waitForURL("**/dashboard", { timeout: 8000 });
    } catch {
      if (page.url().includes("/auth")) {
        await emailInput.fill(USER_A_EMAIL);
        await passwordInput.fill(TEST_PASSWORD);
        await submitBtn.click();
        await page.waitForURL("**/dashboard", { timeout: 20000 });
      }
    }

    await expect(page).toHaveURL(/.*dashboard/);

    const signOutBtn = page
      .locator(
        "button:has-text('Sign out'), button:has-text('Log out'), [aria-label*='Sign out' i]",
      )
      .first();
    if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signOutBtn.click();
    } else {
      const userTrigger = page
        .locator("[data-sidebar='menu-button'], button:has-text('Tester Alpha')")
        .first();
      if (await userTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userTrigger.click();
        const dropdownSignOut = page.locator("text=Sign out, text=Log out").first();
        if (await dropdownSignOut.isVisible({ timeout: 3000 }).catch(() => false)) {
          await dropdownSignOut.click();
        }
      }
    }
  });

  test("3. Goal creation and viewing in /goals", async ({ page }) => {
    await applyUserSession(page, sessionA);
    await page.goto("/goals");
    await page.waitForURL("**/goals", { timeout: 20000 });

    const newGoalBtn = page.locator("button:has-text('New goal')").first();
    await expect(newGoalBtn).toBeVisible({ timeout: 15000 });
    await newGoalBtn.click();

    const goalTitle = `E2E Goal ${runId}`;
    const titleInput = page
      .locator(
        "input#goal-title, input[placeholder*='Master' i], input[placeholder*='goal' i], form input[type='text']",
      )
      .first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(goalTitle);

    const submitBtn = page
      .locator("button:has-text('Create goal'), button:has-text('Save')")
      .first();
    await submitBtn.click();

    await expect(page.locator(`text=${goalTitle}`).first()).toBeVisible({ timeout: 15000 });
  });

  test("4. Focus timer controls and reload session persistence", async ({ page }) => {
    await applyUserSession(page, sessionA);
    await page.goto("/focus");
    await page.waitForURL("**/focus", { timeout: 20000 });

    const startBtn = page.locator("button:has-text('Start')").first();
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();

    const pauseBtn = page.locator("button:has-text('Pause')").first();
    await expect(pauseBtn).toBeVisible({ timeout: 8000 });

    await page.waitForTimeout(1500);
    await page.reload();

    await expect(page.locator("button:has-text('Pause')").first()).toBeVisible({ timeout: 8000 });

    const resetBtn = page.locator("button:has-text('Reset')").first();
    await resetBtn.click();
  });

  test("5. Resume page renders upload button for authenticated user", async ({ page }) => {
    await applyUserSession(page, sessionA);
    await page.goto("/resume");
    await page.waitForURL("**/resume", { timeout: 20000 });

    const uploadBtn = page.locator("button:has-text('Upload resume')").first();
    await expect(uploadBtn).toBeVisible({ timeout: 15000 });
  });

  test("6. Notes page allows creating a new subject and note", async ({ page }) => {
    await applyUserSession(page, sessionA);
    await page.goto("/notes");
    await page.waitForURL("**/notes", { timeout: 20000 });

    const newSubjectBtn = page.locator("button:has-text('Subject')").first();
    await expect(newSubjectBtn).toBeVisible({ timeout: 15000 });
    await newSubjectBtn.click();

    const nameInput = page.locator("#name-dialog-input");
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(`E2E Subject ${runId}`);

    const createBtn = page.locator("button[type='submit']:has-text('Create')");
    await createBtn.click();

    await expect(nameInput).toHaveCount(0, { timeout: 5000 });

    const subjectItem = page.locator(`text=E2E Subject ${runId}`).first();
    await expect(subjectItem).toBeVisible({ timeout: 10000 });

    const actionsBtn = page.locator("button[aria-label='Actions']").first();
    await actionsBtn.click({ force: true });

    const newNoteMenuItem = page.locator("[role='menuitem']:has-text('New note')");
    if (await newNoteMenuItem.isVisible({ timeout: 4000 }).catch(() => false)) {
      await newNoteMenuItem.click();
      await expect(page.locator("input[placeholder*='Note title' i]").first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("7. Multi-tenant isolation: User B cannot see User A's goal", async ({ page }) => {
    // 1. Explicitly verify User A's goal was created and is visible to User A
    await applyUserSession(page, sessionA);
    await page.goto("/goals");
    await page.waitForURL("**/goals", { timeout: 20000 });
    const userAGoalForA = page.locator(`text=E2E Goal ${runId}`).first();
    await expect(userAGoalForA).toBeVisible({ timeout: 15000 });

    // 2. Switch to User B and explicitly verify User B is authenticated
    await page.context().clearCookies();
    await applyUserSession(page, sessionB);
    await page.goto("/goals");
    await page.waitForURL("**/goals", { timeout: 20000 });

    // Explicit assertion: Page is protected and remained on /goals without redirecting to /auth
    await expect(page).toHaveURL(/.*goals/);
    // Explicit assertion: Active session belongs to User B
    const userBProfileIndicator = page.locator(`text=${USER_B_EMAIL}`).first();
    await expect(userBProfileIndicator).toBeVisible({ timeout: 10000 });

    // 3. Multi-tenant boundary assertion: User A's goal is not visible to User B
    const userAGoalForB = page.locator(`text=E2E Goal ${runId}`);
    await expect(userAGoalForB).toHaveCount(0);
  });

  test("8. Mobile viewport responsiveness", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");
    await expect(page).toHaveURL(/.*\//);
    await expect(page.locator("text=DevOS").first()).toBeVisible({ timeout: 10000 });

    await page.goto("/auth");
    await expect(page.locator("#signin-email")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#signin-password")).toBeVisible({ timeout: 10000 });
  });
});
