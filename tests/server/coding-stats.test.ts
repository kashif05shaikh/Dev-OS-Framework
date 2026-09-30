import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchPlatformStats } from "../../src/lib/coding-profiles.server";

describe("Coding Stats Parser (Success, Timeout, Error, Empty)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("Codeforces: Successfully parses rating, max_rating, rank_label, and problems_solved", async () => {
    const mockUserResponse = {
      status: "OK",
      result: [
        {
          handle: "tourist",
          rating: 3800,
          maxRating: 3979,
          rank: "legendary grandmaster",
        },
      ],
    };

    // Use recent timestamp so it is within the 365-day trimActivity window
    const recentTime = Math.floor(Date.now() / 1000) - 3600;

    const mockSubmissionsResponse = {
      status: "OK",
      result: [
        {
          id: 101,
          verdict: "OK",
          creationTimeSeconds: recentTime,
          problem: { contestId: 1, index: "A" },
        },
        {
          id: 102,
          verdict: "WRONG_ANSWER",
          creationTimeSeconds: recentTime + 60,
          problem: { contestId: 1, index: "B" },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("user.info")) {
        return new Response(JSON.stringify(mockUserResponse), { status: 200 });
      }
      if (url.includes("user.status")) {
        return new Response(JSON.stringify(mockSubmissionsResponse), { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    });

    const stats = await fetchPlatformStats("codeforces", "tourist");
    expect(stats.rating).toBe(3800);
    expect(stats.max_rating).toBe(3979);
    expect(stats.rank_label).toBe("Legendary Grandmaster");
    expect(stats.problems_solved).toBe(1);
    expect(stats.submissions).toBe(2);
  });

  it("Codeforces: Gracefully handles API timeout / network abort", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      throw abortError;
    });

    await expect(fetchPlatformStats("codeforces", "tourist")).rejects.toThrow();
  });

  it("Codeforces: Handles non-existent user (404 / FAILED status) with user-friendly error", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response(
        JSON.stringify({ status: "FAILED", comment: "handles: User not found" }),
        { status: 200 },
      );
    });

    await expect(fetchPlatformStats("codeforces", "non_existent_user_99999")).rejects.toThrow(
      'No Codeforces user called "non_existent_user_99999".',
    );
  });

  it("Codeforces: Handles empty data / result array safely without crashing", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ status: "OK", result: [] }), { status: 200 });
    });

    await expect(fetchPlatformStats("codeforces", "ghost_user")).rejects.toThrow(
      'No Codeforces user called "ghost_user".',
    );
  });

  it("LeetCode: Successfully parses solved problems and rating from GraphQL", async () => {
    const mockGraphQLResponse = {
      data: {
        matchedUser: {
          username: "testuser",
          profile: { ranking: 1234, reputation: 50 },
          submitStatsGlobal: {
            acSubmissionNum: [
              { difficulty: "All", count: 150 },
              { difficulty: "Easy", count: 80 },
              { difficulty: "Medium", count: 50 },
              { difficulty: "Hard", count: 20 },
            ],
          },
        },
        userContestRanking: {
          rating: 1850.5,
          attendedContestsCount: 15,
          badge: { name: "Knight" },
        },
      },
    };

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(mockGraphQLResponse), { status: 200 }));

    const stats = await fetchPlatformStats("leetcode", "testuser");
    expect(stats.problems_solved).toBe(150);
    expect(stats.rating).toBe(1851);
    expect(stats.contests_attended).toBe(15);
    expect(stats.rank_label).toBe("Global #1234");
  });

  it("LeetCode: Throws descriptive error when user is not found (matchedUser is null)", async () => {
    const mockNullUser = {
      data: {
        matchedUser: null,
      },
    };

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(mockNullUser), { status: 200 }));

    await expect(fetchPlatformStats("leetcode", "unknown_user")).rejects.toThrow(
      'No LeetCode user called "unknown_user".',
    );
  });
});
