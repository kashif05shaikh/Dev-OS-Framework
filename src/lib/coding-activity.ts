/** Single source of truth for combined coding activity across every platform. */

export type DayBreakdown = { platform: string; count: number };

export type CombinedDay = {
  date: string;
  count: number;
  solved: number;
  byPlatform: DayBreakdown[];
};

export type CodingStreaks = {
  currentStreak: number;
  maxStreak: number;
  activeDays: number;
};

const DAY = 86_400_000;

/** Unwraps the versioned JSONB payload stored on coding_profiles.activity. */
export function storedActivity(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const days = (value as { days?: unknown }).days;
  return Array.isArray(days) ? days : value;
}

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function dayKey(ms: number = Date.now(), timeZone?: string): string {
  const tz = timeZone || getUserTimeZone();
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

export function maxEarthDayKey(ms: number = Date.now()): string {
  // Up to UTC+14 (Line Islands, Kiribati) is the furthest ahead timezone on Earth
  return dayKey(ms + 14 * 3600 * 1000, "UTC");
}

function normaliseDate(raw: string): string | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(raw).trim());
  if (!match) return null;
  return `${match[1]}-${match[2]!.padStart(2, "0")}-${match[3]!.padStart(2, "0")}`;
}

/** Reads the JSONB activity map stored on a coding_profiles row. */
export function activityMapOf(
  row: { activity?: unknown },
  userTimeZone?: string,
): Record<string, number> {
  const raw = row.activity;
  const today = dayKey(Date.now(), userTimeZone);
  if (Array.isArray(raw)) {
    const out: Record<string, number> = {};
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const value = item as Record<string, unknown>;
      const date = normaliseDate(String(value["date"] ?? ""));
      const count = Number(value["submissions"] ?? value["count"] ?? 0);
      if (date && date <= today && Number.isFinite(count) && count > 0) {
        out[date] = (out[date] ?? 0) + count;
      }
    }
    return out;
  }
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const date = normaliseDate(key);
    const count = Number(value);
    // Same date twice (padded + unpadded) must not double count: keep the max.
    if (date && date <= today && Number.isFinite(count) && count > 0) {
      out[date] = Math.max(out[date] ?? 0, count);
    }
  }
  return out;
}

function solvedMapOf(
  row: { activity?: unknown },
  userTimeZone?: string,
): Record<string, number> {
  if (!Array.isArray(row.activity)) return {};
  const out: Record<string, number> = {};
  const today = dayKey(Date.now(), userTimeZone);
  for (const item of row.activity) {
    if (!item || typeof item !== "object") continue;
    const value = item as Record<string, unknown>;
    const date = normaliseDate(String(value["date"] ?? ""));
    const solved = Number(value["solved"] ?? 0);
    if (date && date <= today && Number.isFinite(solved) && solved > 0) {
      out[date] = (out[date] ?? 0) + solved;
    }
  }
  return out;
}

/** Merges every platform's activity map into one deduplicated day map. */
export function aggregateCodingActivity(
  profiles: { platform: string; activity?: unknown }[],
  userTimeZone?: string,
): Map<string, CombinedDay> {
  const map = new Map<string, CombinedDay>();
  for (const profile of profiles) {
    const solvedByDate = solvedMapOf(profile, userTimeZone);
    for (const [date, count] of Object.entries(activityMapOf(profile, userTimeZone))) {
      const day = map.get(date) ?? { date, count: 0, solved: 0, byPlatform: [] };
      const existing = day.byPlatform.find((b) => b.platform === profile.platform);
      if (existing) {
        // Duplicate row for the same platform/date — keep the larger value.
        day.count += Math.max(0, count - existing.count);
        existing.count = Math.max(existing.count, count);
      } else {
        day.byPlatform.push({ platform: profile.platform, count });
        day.count += count;
        day.solved += solvedByDate[date] ?? 0;
      }
      map.set(date, day);
    }
  }
  for (const day of map.values()) day.byPlatform.sort((a, b) => b.count - a.count);
  return map;
}

/** Current / max streak and active days from a set of active calendar dates. */
export function calculateCodingStreaks(
  dates: Iterable<string>,
  userTimeZone?: string,
): CodingStreaks {
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

  const today = dayKey(Date.now(), userTimeZone);
  const yesterday = dayKey(Date.now() - DAY, userTimeZone);
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

export type CodingProfileRow = {
  platform: string;
  activity?: unknown;
  problems_solved?: number | null;
  contests_attended?: number | null;
  submissions_count?: number | null;
};

/** The single source of truth used by both Coding Profiles and the Dashboard. */
export function summariseCodingProfiles(
  rows: CodingProfileRow[],
  userTimeZone?: string,
) {
  const days = aggregateCodingActivity(
    rows.map((row) => ({ ...row, activity: storedActivity(row.activity) })),
    userTimeZone,
  );
  const streaks = calculateCodingStreaks(days.keys(), userTimeZone);
  return {
    days,
    ...streaks,
    solved: rows.reduce((sum, r) => sum + (r.problems_solved ?? 0), 0),
    contests: rows.reduce((sum, r) => sum + (r.contests_attended ?? 0), 0),
    submissions: rows.reduce((sum, r) => sum + (r.submissions_count ?? 0), 0),
  };
}