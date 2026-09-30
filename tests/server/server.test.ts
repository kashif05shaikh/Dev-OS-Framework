import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fetchSocialProfile } from "../../src/lib/social.functions";

describe("Server Functions Security & Secret Leak Audit", () => {
  it("fetchSocialProfile should enforce authentication middleware", async () => {
    const fnAny = fetchSocialProfile as any;
    // Check options.middleware, middleware property, or the file declaration
    const content = fs.readFileSync(path.resolve(process.cwd(), "src/lib/social.functions.ts"), "utf-8");
    const hasMiddlewareImport = content.includes("requireSupabaseAuth");
    const attachesMiddleware = content.includes(".middleware([requireSupabaseAuth])");
    
    expect(hasMiddlewareImport && attachesMiddleware, "fetchSocialProfile must have requireSupabaseAuth middleware attached").toBe(true);
  });

  it("Client-side route files must NEVER import or use supabaseAdmin", () => {
    const learningPath = path.resolve(process.cwd(), "src/routes/_authenticated.learning.tsx");
    const resumePath = path.resolve(process.cwd(), "src/routes/_authenticated.resume.tsx");

    const learningCode = fs.readFileSync(learningPath, "utf-8");
    const resumeCode = fs.readFileSync(resumePath, "utf-8");

    const learningHasAdmin = learningCode.includes("supabaseAdmin");
    const resumeHasAdmin = resumeCode.includes("supabaseAdmin");

    expect(learningHasAdmin, "src/routes/_authenticated.learning.tsx leaks supabaseAdmin to client").toBe(false);
    expect(resumeHasAdmin, "src/routes/_authenticated.resume.tsx leaks supabaseAdmin to client").toBe(false);
  });
});
