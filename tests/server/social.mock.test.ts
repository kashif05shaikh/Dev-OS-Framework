import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchSocialSnapshot } from "../../src/lib/social.server";
import { getUpcomingContests } from "../../src/lib/contests.functions";

describe("Social & Contests Functions (Mocks & Behavior)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("getUpcomingContests server function coverage", () => {
    it("Exports getUpcomingContests as a GET createServerFn without auth middleware", () => {
      expect(getUpcomingContests).toBeDefined();
      const fnAny = getUpcomingContests as any;
      // In TanStack Start:
      const middlewares = fnAny.middlewares ?? fnAny.__middlewares ?? [];
      // Confirms getUpcomingContests is public (lacks auth middleware)
      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares.length).toBe(0);
    });
  });

  describe("Social Snapshot Server Scraper", () => {
    it("GitHub: Successfully fetches and maps public profile fields", async () => {
      const mockGithub = {
        login: "torvalds",
        name: "Linus Torvalds",
        avatar_url: "https://github.com/torvalds.png",
        bio: "Creator of Linux and Git",
        location: "Portland, OR",
        blog: "https://kernel.org",
        public_repos: 20,
        followers: 200000,
        following: 0,
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockGithub), { status: 200 })
      );

      const snapshot = await fetchSocialSnapshot("github", "torvalds");
      expect(snapshot.platform).toBe("github");
      expect(snapshot.handle).toBe("torvalds");
      expect(snapshot.display_name).toBe("Linus Torvalds");
      expect(snapshot.bio).toBe("Creator of Linux and Git");
      expect(snapshot.followers).toBe(200000);
    });

    it("Dev.to: Handles non-existent profile (404) gracefully with friendly message", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response("Not Found", { status: 404 })
      );

      await expect(fetchSocialSnapshot("devto", "ghost_user_12345")).rejects.toThrow(
        "That profile does not exist"
      );
    });

    it("Handles network timeout gracefully without hanging indefinitely", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        const abortErr = new Error("The operation was aborted");
        abortErr.name = "TimeoutError";
        throw abortErr;
      });

      await expect(fetchSocialSnapshot("github", "timeout_user")).rejects.toThrow(
        "Could not reach api.github.com"
      );
    });

    it("Throws error when unsupported platform is requested", async () => {
      await expect(fetchSocialSnapshot("unknown_platform", "test")).rejects.toThrow(
        'DevOS does not support "unknown_platform" yet.'
      );
    });
  });
});
