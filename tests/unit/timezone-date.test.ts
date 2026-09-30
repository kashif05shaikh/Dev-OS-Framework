import { describe, it, expect, vi, afterEach } from "vitest";
import {
  calculateCodingStreaks,
  activityMapOf,
  dayKey,
  getUserTimeZone,
} from "../../src/lib/coding-activity";
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
        activity: [{ date: "2026-10-01", submissions: 3 }],
      };

      const map = activityMapOf(userActivityRow, "Asia/Tokyo");

      // In local time, 2026-10-01 is today and MUST be included in the user's activity map.
      // Currently, dayKey(Date.now()) returns '2026-09-30' (UTC yesterday).
      // Because activityMapOf checks `date <= today`, '2026-10-01' <= '2026-09-30' is false,
      // and today's activity is completely dropped!
      expect(map["2026-10-01"], "Today's local submission must not be dropped by UTC dayKey").toBe(
        3,
      );
    });

    it("Correctly computes local dayKey and activity for India at 11:30 PM and 12:30 AM local", () => {
      // India is UTC+05:30
      // 11:30 PM IST on 2026-09-30 corresponds to 18:00:00 UTC on 2026-09-30
      const india1130PM = Date.parse("2026-09-30T18:00:00.000Z");
      // 12:30 AM IST on 2026-10-01 corresponds to 19:00:00 UTC on 2026-09-30
      const india1230AM = Date.parse("2026-09-30T19:00:00.000Z");

      expect(dayKey(india1130PM, "Asia/Kolkata")).toBe("2026-09-30");
      expect(dayKey(india1230AM, "Asia/Kolkata")).toBe("2026-10-01");
      expect(getUserTimeZone()).toBeDefined();

      // Verify activityMapOf with India timezone
      vi.spyOn(Date, "now").mockReturnValue(india1230AM);
      const row = {
        activity: [
          { date: "2026-09-30", submissions: 4 },
          { date: "2026-10-01", submissions: 2 },
        ],
      };
      const map = activityMapOf(row, "Asia/Kolkata");
      expect(map["2026-09-30"]).toBe(4);
      expect(map["2026-10-01"]).toBe(2);
    });
  });

  it("Strictly enforces user's local date and rejects future submissions (tomorrow locally)", () => {
    // Local time in Asia/Kolkata at 12:00 UTC is Sept 30th 17:30 IST
    const fixedTime = Date.parse("2026-09-30T12:00:00.000Z");
    vi.spyOn(Date, "now").mockReturnValue(fixedTime);

    const userActivityRow = {
      activity: [
        { date: "2026-09-30", submissions: 5 },
        { date: "2026-10-01", submissions: 2 }, // future relative to user local day!
      ],
    };

    const map = activityMapOf(userActivityRow, "Asia/Kolkata");
    expect(map["2026-09-30"]).toBe(5);
    expect(
      map["2026-10-01"],
      "Future dates relative to user local timezone must be dropped",
    ).toBeUndefined();
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
