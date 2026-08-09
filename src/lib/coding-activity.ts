/** Single source of truth for combined coding activity across every platform. */

export type DayBreakdown = { platform: string; count: number };

export type CombinedDay = {
  date: string;
  count: number;
  byPlatform: DayBreakdown[];
};

export type CodingStreaks = {
  currentStreak: number;
  maxStreak: number;
  activeDays: number;
};

const DAY = 86_400_000;

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function normaliseDate(raw: string): string | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(raw).trim());
  if (!match) return null;
  return `${match[1]}-${match[2]!.padStart(2, "0")}-${match[3]!.padStart(2, "0")}`;
}

/** Reads the JSONB activity map stored on a coding_profiles row. */
export function activityMapOf(row: { activity?: unknown }): Record<string, number> {
  const raw = row.activity;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const date = normaliseDate(key);
    const count = Number(value);
    // Same date twice (padded + unpadded) must not double count: keep the max.
    if (date && Number.isFinite(count) && count > 0) {
      out[date] = Math.max(out[date] ?? 0, count);
    }
  }
  return out;
}

/** Merges every platform's activity map into one deduplicated day map. */
export function aggregateCodingActivity(
  profiles: { platform: string; activity?: unknown }[],
): Map<string, CombinedDay> {
  const map = new Map<string, CombinedDay>();
  for (const profile of profiles) {
    for (const [date, count] of Object.entries(activityMapOf(profile))) {
      const day = map.get(date) ?? { date, count: 0, byPlatform: [] };
      const existing = day.byPlatform.find((b) => b.platform === profile.platform);
      if (existing) {
        // Duplicate row for the same platform/date — keep the larger value.
        day.count += Math.max(0, count - existing.count);
        existing.count = Math.max(existing.count, count);
      } else {
        day.byPlatform.push({ platform: profile.platform, count });
        day.count += count;
      }
      map.set(date, day);
    }
  }
  for (const day of map.values()) day.byPlatform.sort((a, b) => b.count - a.count);
  return map;
}

/** Current / max streak and active days from a set of active calendar dates. */
export function calculateCodingStreaks(dates: Iterable<string>): CodingStreaks {
  const unique = Array.from(
    new Set(
      Array.from(dates)
        .map((d) => normaliseDate(d))
        .filter((d): d is string => Boolean(d)),
    ),
  ).sort();

  if (unique.length === 0) return { currentStreak: 0, maxStreak: 0, activeDays: 0 };

  let maxStreak = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const prev = Date.parse(`${unique[i - 1]}T00:00:00Z`);
    const curr = Date.parse(`${unique[i]}T00:00:00Z`);
    run = curr - prev === DAY ? run + 1 : 1;
    if (run > maxStreak) maxStreak = run;
  }

  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - DAY);
  const last = unique.at(-1)!;
  let currentStreak = 0;
  if (last === today || last === yesterday) {
    currentStreak = 1;
    for (let i = unique.length - 1; i > 0; i -= 1) {
      const prev = Date.parse(`${unique[i - 1]}T00:00:00Z`);
      const curr = Date.parse(`${unique[i]}T00:00:00Z`);
      if (curr - prev === DAY) currentStreak += 1;
      else break;
    }
  }

  return { currentStreak, maxStreak: Math.max(maxStreak, currentStreak), activeDays: unique.length };
}