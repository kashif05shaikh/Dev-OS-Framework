import { describe, it, expect, vi, afterEach } from "vitest";
import { calculateCodingStreaks, activityMapOf } from "../../src/lib/coding-activity";
import { formatLastUsed } from "../../src/lib/ai-usage";

describe("Timezone and Date Edge Cases", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Coding Activity & Streak Date Math", () => {
    it("Calculates streaks correctly across month and leap year boundaries", () => {
      const dates = ["2024-02-28", "2024-02-29", "2024-03-01"];
      const streaks = calculateCodingStreaks(dates);
      expect(streaks.maxStreak).toBe(3);
    });

    it("Handles duplicate dates with mixed padding (e.g. 2026-9-5 and 2026-09-05)", () => {
      const row = {
        activity: {
          "2026-9-5": 3,
          "2026-09-05": 5,
        },
      };
      const map = activityMapOf(row);
      expect(map["2026-09-05"]).toBe(5);
    });

    it("Ignores malformed date strings gracefully in activity maps", () => {
      const row = {
        activity: [
          { date: "not-a-date", submissions: 5 },
          { date: "2026-09-15", submissions: 2 },
          null,
          undefined,
        ],
      };
      const map = activityMapOf(row);
      expect(map["2026-09-15"]).toBe(2);
      expect(map["not-a-date"]).toBeUndefined();
    });

    it("Fails when user is ahead of UTC (e.g. India/Tokyo morning) because UTC dayKey drops today's submissions", () => {
      // Timezone Bug Demonstration:
      // At 2:00 AM on Oct 1st in Tokyo/India (+05:30/+09:00), UTC is still Sept 30th 17:00:00Z.
      const morningTime = Date.parse("2026-09-30T17:00:00.000Z");
      vi.spyOn(Date, "now").mockReturnValue(morningTime);

      // The user solved a problem on their local day: Oct 1st (2026-10-01)
      const userActivityRow = {
        activity: [
          { date: "2026-10-01", submissions: 3 }
        ]
      };

      const map = activityMapOf(userActivityRow);

      // In local time, 2026-10-01 is today and MUST be included in the user's activity map.
      // Currently, dayKey(Date.now()) returns '2026-09-30' (UTC yesterday).
      // Because activityMapOf checks `date <= today`, '2026-10-01' <= '2026-09-30' is false,
      // and today's activity is completely dropped!
      expect(map["2026-10-01"], "Today's local submission must not be dropped by UTC dayKey").toBe(3);
    });
  });

  describe("formatLastUsed Date Formatting", () => {
    it("Returns 'Never opened' for null or undefined timestamps", () => {
      expect(formatLastUsed(undefined)).toBe("Never opened");
      expect(formatLastUsed("")).toBe("Never opened");
    });

    it("Formats today and yesterday relative to user local time", () => {
      const now = new Date().toISOString();
      expect(formatLastUsed(now)).toContain("Today");

      const yesterday = new Date(Date.now() - 86_400_000).toISOString();
      expect(formatLastUsed(yesterday)).toContain("Yesterday");
    });

    it("Gracefully handles corrupted or unparseable ISO strings without throwing", () => {
      const result = formatLastUsed("invalid-date-string");
      expect(typeof result).toBe("string");
    });
  });
});
