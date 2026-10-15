import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  summariseCodingProfiles,
  type CodingProfileRow,
} from "../../src/lib/coding-activity";
import { staleCodingProfiles } from "../../src/lib/use-coding-autosync";
import { generateChallengeCode } from "../../src/lib/verification/server";
import {
  PLATFORM_VERIFICATION_CONFIGS,
  getPlatformVerificationMeta,
  verifyPlatformOwnership,
} from "../../src/lib/verification/platforms";
import type { CodingProfile } from "../../src/lib/devos-types";

describe("Coding Profiles Anti-Fake Data & Ownership Verification", () => {
  describe("Problem 1: Deduplication and Verification in Aggregates", () => {
    it("deduplicates identical platform entries so Questions Solved is not inflated", () => {
      // User has two duplicate LeetCode rows (@Kashif05) with 379 problems solved each
      const rows: CodingProfileRow[] = [
        {
          platform: "leetcode",
          problems_solved: 379,
          contests_attended: 12,
          submissions_count: 500,
          verified_at: "2026-10-15T12:00:00Z",
          activity: [{ date: "2026-10-14", submissions: 5, solved: 3 }],
        },
        {
          platform: "leetcode",
          problems_solved: 379,
          contests_attended: 12,
          submissions_count: 500,
          verified_at: "2026-10-15T12:00:00Z",
          activity: [{ date: "2026-10-14", submissions: 5, solved: 3 }],
        },
      ];

      const summary = summariseCodingProfiles(rows);

      // Must be 379, NOT 758!
      expect(summary.solved).toBe(379);
      expect(summary.contests).toBe(12);
      expect(summary.submissions).toBe(500);
      expect(summary.activeDays).toBe(1);
    });

    it("excludes unverified profiles (verified_at === null) from all aggregate totals", () => {
      const rows: CodingProfileRow[] = [
        // Verified Codeforces profile
        {
          platform: "codeforces",
          problems_solved: 250,
          contests_attended: 20,
          submissions_count: 400,
          verified_at: "2026-10-15T10:00:00Z",
          activity: [{ date: "2026-10-14", submissions: 4, solved: 2 }],
        },
        // Unverified LeetCode profile (e.g. impersonated handle)
        {
          platform: "leetcode",
          problems_solved: 1200,
          contests_attended: 50,
          submissions_count: 2000,
          verified_at: null, // Unverified!
          activity: [{ date: "2026-10-14", submissions: 20, solved: 15 }],
        },
      ];

      const summary = summariseCodingProfiles(rows);

      // Must ONLY count the verified Codeforces profile
      expect(summary.solved).toBe(250);
      expect(summary.contests).toBe(20);
      expect(summary.submissions).toBe(400);
      expect(summary.days.get("2026-10-14")?.count).toBe(4);
    });

    it("staleCodingProfiles excludes unverified profiles from automatic sync", () => {
      const mockProfiles = [
        {
          id: "1",
          user_id: "u1",
          platform: "leetcode",
          username: "Kashif05",
          verified_at: null, // Unverified
          last_synced_at: null,
        } as unknown as CodingProfile,
        {
          id: "2",
          user_id: "u1",
          platform: "codeforces",
          username: "tourist",
          verified_at: "2026-10-15T10:00:00Z", // Verified
          last_synced_at: null, // Never synced -> stale
        } as unknown as CodingProfile,
      ];

      const stale = staleCodingProfiles(mockProfiles);
      expect(stale).toHaveLength(1);
      expect(stale[0]!.platform).toBe("codeforces");
    });
  });

  describe("Problem 2: Temporary Challenge Code Generation & Platform Adapters", () => {
    it("generates 15-minute challenge code starting with devos- and 8 hex characters", () => {
      const code1 = generateChallengeCode();
      const code2 = generateChallengeCode();

      expect(code1).toMatch(/^devos-[a-f0-9]{8}$/);
      expect(code2).toMatch(/^devos-[a-f0-9]{8}$/);
      expect(code1).not.toBe(code2);
    });

    it("provides accurate platform verification instructions and settings URLs for all 6 supported platforms", () => {
      const platforms = ["leetcode", "codeforces", "atcoder", "codechef", "hackerrank", "gfg"];

      for (const p of platforms) {
        expect(PLATFORM_VERIFICATION_CONFIGS[p]).toBeDefined();
        const meta = getPlatformVerificationMeta(p, "testuser");
        expect(meta.settingsUrl).toBeDefined();
        expect(meta.fieldName).toBeDefined();
        expect(meta.instructions).toBeDefined();
      }
    });

    describe("Mocked Platform Verification Checks", () => {
      const originalFetch = globalThis.fetch;

      beforeEach(() => {
        globalThis.fetch = originalFetch;
        vi.restoreAllMocks();
      });

      it("LeetCode: verifies when challenge code is present in aboutMe or realName", async () => {
        const challengeCode = "devos-a1b2c3d4";

        globalThis.fetch = vi.fn().mockImplementation(() =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                data: {
                  matchedUser: {
                    username: "testuser",
                    profile: {
                      realName: "Test User",
                      aboutMe: `Hello world, verifying DevOS: ${challengeCode}`,
                      school: null,
                      company: null,
                    },
                  },
                },
              }),
              { status: 200 },
            ),
          ),
        );

        const success = await verifyPlatformOwnership("leetcode", "testuser", challengeCode);
        expect(success).toBe(true);

        const fail = await verifyPlatformOwnership("leetcode", "testuser", "devos-wrongcode");
        expect(fail).toBe(false);
      });

      it("Codeforces: verifies when challenge code is present in user info fields", async () => {
        const challengeCode = "devos-99887766";

        globalThis.fetch = vi.fn().mockImplementation(() =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                status: "OK",
                result: [
                  {
                    handle: "cf_user",
                    firstName: "John",
                    lastName: challengeCode,
                    organization: "University",
                  },
                ],
              }),
              { status: 200 },
            ),
          ),
        );

        const success = await verifyPlatformOwnership("codeforces", "cf_user", challengeCode);
        expect(success).toBe(true);

        const fail = await verifyPlatformOwnership("codeforces", "cf_user", "devos-wrongcode");
        expect(fail).toBe(false);
      });

      it("AtCoder: verifies when challenge code is in public profile HTML", async () => {
        const challengeCode = "devos-atcoder1";

        globalThis.fetch = vi.fn().mockImplementation(() =>
          Promise.resolve(
            new Response(
              `<html><body><tr><th>Affiliation</th><td>${challengeCode}</td></tr></body></html>`,
              { status: 200 },
            ),
          ),
        );

        const success = await verifyPlatformOwnership("atcoder", "ac_user", challengeCode);
        expect(success).toBe(true);

        const fail = await verifyPlatformOwnership("atcoder", "ac_user", "devos-wrongcode");
        expect(fail).toBe(false);
      });

      it("CodeChef: verifies when challenge code is in public profile HTML", async () => {
        const challengeCode = "devos-codechef";

        globalThis.fetch = vi.fn().mockImplementation(() =>
          Promise.resolve(
            new Response(
              `<html><body><h1 class="h2-style">${challengeCode}</h1></body></html>`,
              { status: 200 },
            ),
          ),
        );

        const success = await verifyPlatformOwnership("codechef", "cc_user", challengeCode);
        expect(success).toBe(true);

        const fail = await verifyPlatformOwnership("codechef", "cc_user", "devos-wrongcode");
        expect(fail).toBe(false);
      });

      it("HackerRank: verifies when challenge code is in model headline or bio", async () => {
        const challengeCode = "devos-hackerrank";

        globalThis.fetch = vi.fn().mockImplementation(() =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                model: {
                  jobs_headline: challengeCode,
                  name: "Hacker Name",
                },
              }),
              { status: 200 },
            ),
          ),
        );

        const success = await verifyPlatformOwnership("hackerrank", "hr_user", challengeCode);
        expect(success).toBe(true);

        const fail = await verifyPlatformOwnership("hackerrank", "hr_user", "devos-wrongcode");
        expect(fail).toBe(false);
      });

      it("GeeksforGeeks: verifies when challenge code is in public profile HTML", async () => {
        const challengeCode = "devos-gfg12345";

        globalThis.fetch = vi.fn().mockImplementation(() =>
          Promise.resolve(
            new Response(
              `<html><head><title>${challengeCode} | GeeksforGeeks</title></head><body></body></html>`,
              { status: 200 },
            ),
          ),
        );

        const success = await verifyPlatformOwnership("gfg", "gfg_user", challengeCode);
        expect(success).toBe(true);

        const fail = await verifyPlatformOwnership("gfg", "gfg_user", "devos-wrongcode");
        expect(fail).toBe(false);
      });
    });
  });
});
