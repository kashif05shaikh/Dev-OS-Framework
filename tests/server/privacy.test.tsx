import { describe, it, expect, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../../src/hooks/use-auth";
import { describeError } from "../../src/lib/devos-queries";

describe("Privacy & Data Exposure Audits", () => {
  it("Social snapshot fetcher returns strictly public fields and omits secrets", async () => {
    const socialServerPath = path.resolve(process.cwd(), "src/lib/social.server.ts");
    const content = fs.readFileSync(socialServerPath, "utf-8");

    expect(content).not.toContain("password_hash");
    expect(content).not.toContain("access_token");
    expect(content).not.toContain("session_token");
  });

  it("REAL BEHAVIOR: Signing out must clear TanStack Query cache to prevent cross-user data leakage", async () => {
    const testQueryClient = new QueryClient();
    testQueryClient.setQueryData(["goals"], [{ id: "userA-private-goal", title: "Secret Goal" }]);
    testQueryClient.setQueryData(["notes"], [{ id: "userA-private-note", content: "Confidential Note" }]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={testQueryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    // BEHAVIORAL ASSERTION:
    // If signOut() properly clears cache on logout, getQueryData must be undefined!
    // Currently signOut() in use-auth.tsx only calls supabase.auth.signOut() and leaves cache intact!
    const goalsAfterLogout = testQueryClient.getQueryData(["goals"]);
    const notesAfterLogout = testQueryClient.getQueryData(["notes"]);

    expect(goalsAfterLogout, "Query cache for 'goals' must be cleared on logout").toBeUndefined();
    expect(notesAfterLogout, "Query cache for 'notes' must be cleared on logout").toBeUndefined();
  });

  it("Error formatting must sanitize sensitive database internals from user toasts", () => {
    const sensitiveErr = new Error("Connection failed at postgresql://postgres:sb_secret_12345@db.supabase.co:5432");
    const message = describeError(sensitiveErr);

    expect(message).not.toContain("sb_secret");
    expect(message).not.toContain("postgresql://");
  });
});
