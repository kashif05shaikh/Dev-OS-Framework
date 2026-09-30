import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Access Control & IDOR Checks across Server Functions", () => {
  it("Every createServerFn that accesses user data must enforce requireSupabaseAuth", () => {
    const serverFnFiles = [
      "src/lib/coding-connections.functions.ts",
      "src/lib/coding-profiles.functions.ts",
      "src/lib/social.functions.ts",
      "src/lib/contests.functions.ts",
    ];

    const results: Record<string, boolean> = {};

    for (const relPath of serverFnFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, "utf-8");
      const hasAuthImport = content.includes("requireSupabaseAuth");
      const appliesMiddleware = content.includes(".middleware([requireSupabaseAuth])");
      results[relPath] = hasAuthImport && appliesMiddleware;
    }

    expect(results["src/lib/coding-connections.functions.ts"]).toBe(true);
    expect(results["src/lib/coding-profiles.functions.ts"]).toBe(true);
    // Real bug: social.functions has NO auth middleware!
    expect(
      results["src/lib/social.functions.ts"],
      "social.functions.ts is missing auth middleware",
    ).toBe(true);
  });

  it("Coding connections server logic binds strictly to context.userId and prevents User A from querying User B", () => {
    const connServerPath = path.resolve(process.cwd(), "src/lib/coding-connections.server.ts");
    const content = fs.readFileSync(connServerPath, "utf-8");

    expect(content).toContain('.eq("user_id", userId)');
    // Matches .delete() followed by .eq("user_id", userId) across whitespace/newlines
    expect(/\.delete\(\)\s*\.eq\("user_id",\s*userId\)/.test(content)).toBe(true);
  });

  it("Coding profiles server logic does not bypass RLS using user-supplied IDs", () => {
    const profServerPath = path.resolve(process.cwd(), "src/lib/coding-profiles.server.ts");
    const content = fs.readFileSync(profServerPath, "utf-8");
    expect(content).not.toContain("supabaseAdmin.from('profiles').delete()");
  });

  it("Auth middleware enforces Bearer token structure and rejects forged or missing headers", () => {
    const middlewarePath = path.resolve(
      process.cwd(),
      "src/integrations/supabase/auth-middleware.ts",
    );
    const content = fs.readFileSync(middlewarePath, "utf-8");

    expect(content).toContain("Unauthorized: No authorization header provided");
    expect(content).toContain("Unauthorized: Only Bearer tokens are supported");
    expect(content).toContain("Unauthorized: No token provided");
    expect(content).toContain('token.split(".").length !== 3');
  });
});
