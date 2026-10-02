import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

let testUrl = "";
let testKey = "";
const envTestPath = path.resolve(process.cwd(), ".env.test");
if (fs.existsSync(envTestPath)) {
  const content = fs.readFileSync(envTestPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
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

if (testUrl.includes("bppvwdbrmyvgqqgpbjqe") || !testUrl.includes("mwfajiaszgwtopuyjjkd")) {
  throw new Error("SECURITY GUARD: E2E tests cannot run against production database!");
}

export default {
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  metadata: {},
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_SUPABASE_URL: testUrl,
      VITE_SUPABASE_PUBLISHABLE_KEY: testKey,
      SUPABASE_URL: testUrl,
      SUPABASE_PUBLISHABLE_KEY: testKey,
    },
  },
};
