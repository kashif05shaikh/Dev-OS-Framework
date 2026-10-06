import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Account Deletion", () => {
  it("uses the authenticated middleware", () => {
    const fnPath = path.resolve(process.cwd(), "src/lib/account.functions.ts");
    const content = fs.readFileSync(fnPath, "utf-8");
    
    expect(content).toContain("requireSupabaseAuth");
    expect(content).toContain(".middleware([requireSupabaseAuth])");
  });

  it("checks for rate limit on account deletion", () => {
    const fnPath = path.resolve(process.cwd(), "src/lib/account.functions.ts");
    const content = fs.readFileSync(fnPath, "utf-8");
    
    expect(content).toContain("checkUserRateLimit");
    expect(content).toContain("delete_account");
  });

  it("loops over storage buckets and deletes files for the user", () => {
    const fnPath = path.resolve(process.cwd(), "src/lib/account.functions.ts");
    const content = fs.readFileSync(fnPath, "utf-8");
    
    expect(content).toContain("supabaseAdmin.storage.from(bucket).list(userId)");
    expect(content).toContain("supabaseAdmin.storage.from(bucket).remove(paths)");
  });

  it("deletes user from auth provider", () => {
    const fnPath = path.resolve(process.cwd(), "src/lib/account.functions.ts");
    const content = fs.readFileSync(fnPath, "utf-8");
    
    expect(content).toContain("supabaseAdmin.auth.admin.deleteUser(userId)");
  });

  it("safely attempts to delete across tables filtering by user", () => {
    const fnPath = path.resolve(process.cwd(), "src/lib/account.functions.ts");
    const content = fs.readFileSync(fnPath, "utf-8");
    
    expect(content).toContain(".delete().eq(\"user_id\", userId)");
  });
});
