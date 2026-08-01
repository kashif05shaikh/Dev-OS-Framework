import { createServerFn } from "@tanstack/react-start";

export type UpcomingContest = {
  id: string;
  platform: "codeforces" | "leetcode" | "codechef";
  name: string;
  url: string;
  /** ISO timestamp of the contest start. */
  startsAt: string;
  durationMinutes: number;
};

async function codeforces(): Promise<UpcomingContest[]> {
  const res = await fetch("https://codeforces.com/api/contest.list?gym=false");
  if (!res.ok) return [];
  const json = (await res.json()) as {
    result?: Array<{
      id: number;
      name: string;
      phase: string;
      durationSeconds: number;
      startTimeSeconds?: number;
    }>;
  };
  return (json.result ?? [])
    .filter((c) => c.phase === "BEFORE" && c.startTimeSeconds)
    .map((c) => ({
      id: `cf-${c.id}`,
      platform: "codeforces" as const,
      name: c.name,
      url: `https://codeforces.com/contests/${c.id}`,
      startsAt: new Date(c.startTimeSeconds! * 1000).toISOString(),
      durationMinutes: Math.round(c.durationSeconds / 60),
    }));
}

async function leetcode(): Promise<UpcomingContest[]> {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "{ upcomingContests { title titleSlug startTime duration } }",
    }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    data?: {
      upcomingContests?: Array<{
        title: string;
        titleSlug: string;
        startTime: number;
        duration: number;
      }>;
    };
  };
  return (json.data?.upcomingContests ?? []).map((c) => ({
    id: `lc-${c.titleSlug}`,
    platform: "leetcode" as const,
    name: c.title,
    url: `https://leetcode.com/contest/${c.titleSlug}/`,
    startsAt: new Date(c.startTime * 1000).toISOString(),
    durationMinutes: Math.round(c.duration / 60),
  }));
}

async function codechef(): Promise<UpcomingContest[]> {
  const res = await fetch("https://www.codechef.com/api/list/contests/all", {
    headers: { accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    future_contests?: Array<{
      contest_code: string;
      contest_name: string;
      contest_start_date_iso: string;
      contest_duration: string;
    }>;
  };
  return (json.future_contests ?? []).map((c) => ({
    id: `cc-${c.contest_code}`,
    platform: "codechef" as const,
    name: c.contest_name,
    url: `https://www.codechef.com/${c.contest_code}`,
    startsAt: new Date(c.contest_start_date_iso).toISOString(),
    durationMinutes: Number(c.contest_duration) || 0,
  }));
}

/** Public: upcoming programming contests across Codeforces, LeetCode and CodeChef. */
export const getUpcomingContests = createServerFn({ method: "GET" }).handler(async () => {
  const results = await Promise.allSettled([codeforces(), leetcode(), codechef()]);
  const contests = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const now = Date.now();
  return contests
    .filter((c) => new Date(c.startsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 25);
});