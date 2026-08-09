export type PlatformActivity = {
  date: string;
  submissions: number;
  solved: number;
  submissionIds?: string[];
};

export type FetchedStats = {
  platform: string;
  username: string;
  profile_url: string | null;
  rating: number | null;
  rank_label: string | null;
  problems_solved: number | null;
  contests_attended: number | null;
  submissions: number;
  current_streak: number;
  max_streak: number;
  activity: PlatformActivity[];
  lastSyncedAt: string;
};

const UA = {
  "User-Agent": "Mozilla/5.0 (compatible; DevOS/1.0)",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
};

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, headers: { ...UA, ...(init?.headers ?? {}) } });
  if (!response.ok) {
    throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  }
  return response.json();
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  return getJson(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function base(platform: string, username: string, profile_url: string | null): FetchedStats {
  return {
    platform,
    username,
    profile_url,
    rating: null,
    rank_label: null,
    problems_solved: null,
    contests_attended: null,
    submissions: 0,
    current_streak: 0,
    max_streak: 0,
    activity: [],
    lastSyncedAt: new Date().toISOString(),
  };
}

const DAY = 86_400_000;

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function addDay(activity: Record<string, number>, key: string, count = 1): void {
  activity[key] = (activity[key] ?? 0) + count;
}

/** Normalises loose dates like "2026-3-4" into "2026-03-04". */
function normaliseDate(raw: string): string | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw.trim());
  if (!match) return null;
  return `${match[1]}-${match[2]!.padStart(2, "0")}-${match[3]!.padStart(2, "0")}`;
}

/** Keeps only the last 366 days so the stored JSON stays small. */
function trimActivity(activity: Record<string, number>): Record<string, number> {
  const cutoff = dayKey(Date.now() - 366 * DAY);
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(activity)) {
    if (key >= cutoff && value > 0) out[key] = value;
  }
  return out;
}

function activityRows(
  activity: Record<string, { submissions: number; solved: number; ids?: Set<string> }>,
): PlatformActivity[] {
  const cutoff = dayKey(Date.now() - 366 * DAY);
  return Object.entries(activity)
    .filter(([date, value]) => date >= cutoff && value.submissions > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      date,
      submissions: value.submissions,
      solved: value.solved,
      ...(value.ids?.size ? { submissionIds: Array.from(value.ids) } : {}),
    }));
}

function addSubmission(
  activity: Record<string, { submissions: number; solved: number; ids?: Set<string> }>,
  date: string,
  solved: boolean,
  id?: string,
): void {
  const row = activity[date] ?? { submissions: 0, solved: 0, ids: new Set<string>() };
  if (id && row.ids?.has(id)) return;
  if (id) row.ids?.add(id);
  row.submissions += 1;
  if (solved) row.solved += 1;
  activity[date] = row;
}

function activityMap(rows: PlatformActivity[]): Record<string, number> {
  return Object.fromEntries(rows.map((row) => [row.date, row.submissions]));
}

/** Current and longest streak of consecutive active days from an activity map. */
function streaksFrom(activity: Record<string, number>): { current: number; max: number } {
  const days = Object.keys(activity)
    .filter((d) => (activity[d] ?? 0) > 0)
    .sort();
  if (days.length === 0) return { current: 0, max: 0 };

  let max = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = Date.parse(`${days[i - 1]}T00:00:00Z`);
    const curr = Date.parse(`${days[i]}T00:00:00Z`);
    run = curr - prev === DAY ? run + 1 : 1;
    if (run > max) max = run;
  }

  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - DAY);
  const last = days.at(-1)!;
  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = days.length - 1; i > 0; i -= 1) {
      const prev = Date.parse(`${days[i - 1]}T00:00:00Z`);
      const curr = Date.parse(`${days[i]}T00:00:00Z`);
      if (curr - prev === DAY) current += 1;
      else break;
    }
  }
  return { current, max: Math.max(max, current) };
}

async function fetchLeetCode(username: string): Promise<FetchedStats> {
  const query = `query devos($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking reputation }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
      userCalendar { streak submissionCalendar }
    }
    userContestRanking(username: $username) { attendedContestsCount rating globalRanking }
  }`;

  const payload = (await getJson("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { username } }),
  })) as {
    data?: {
      matchedUser?: {
        profile?: { ranking?: number };
        submitStatsGlobal?: { acSubmissionNum?: { difficulty: string; count: number }[] };
        userCalendar?: { streak?: number; submissionCalendar?: string };
      } | null;
      userContestRanking?: { attendedContestsCount?: number; rating?: number } | null;
    };
  };

  const user = payload.data?.matchedUser;
  if (!user) throw new Error(`No LeetCode user called "${username}".`);

  const all = user.submitStatsGlobal?.acSubmissionNum?.find((s) => s.difficulty === "All");
  const contest = payload.data?.userContestRanking;
  const stats = base("leetcode", username, `https://leetcode.com/u/${username}/`);
  stats.problems_solved = all?.count ?? null;
  stats.contests_attended = contest?.attendedContestsCount ?? null;
  stats.rating = contest?.rating ? Math.round(contest.rating) : null;
  stats.current_streak = user.userCalendar?.streak ?? 0;
  stats.max_streak = stats.current_streak;
  stats.rank_label = user.profile?.ranking ? `Global #${user.profile.ranking}` : null;

  try {
    const calendar = JSON.parse(user.userCalendar?.submissionCalendar ?? "{}") as Record<
      string,
      number
    >;
    const activity: Record<string, number> = {};
    for (const [epoch, count] of Object.entries(calendar)) {
      addDay(activity, dayKey(Number(epoch) * 1000), Number(count) || 0);
    }
    stats.activity = Object.entries(trimActivity(activity)).map(([date, submissions]) => ({
      date,
      submissions,
      solved: 0,
    }));
    stats.submissions = stats.activity.reduce((sum, row) => sum + row.submissions, 0);
    const streaks = streaksFrom(activityMap(stats.activity));
    stats.current_streak = Math.max(stats.current_streak, streaks.current);
    stats.max_streak = Math.max(stats.max_streak, streaks.max);
  } catch {
    /* calendar is optional */
  }

  return stats;
}

async function fetchCodeforces(username: string): Promise<FetchedStats> {
  const info = (await getJson(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`,
  )) as { status: string; result?: { rating?: number; maxRating?: number; rank?: string }[] };
  const user = info.result?.[0];
  if (info.status !== "OK" || !user) throw new Error(`No Codeforces user called "${username}".`);

  const stats = base("codeforces", username, `https://codeforces.com/profile/${username}`);
  stats.rating = user.rating ?? null;
  stats.rank_label = user.rank ? user.rank.replace(/\b\w/g, (c) => c.toUpperCase()) : null;

  try {
    const rated = (await getJson(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(username)}`,
    )) as { result?: unknown[] };
    stats.contests_attended = rated.result?.length ?? 0;
  } catch {
    /* contests are optional */
  }

  try {
    const submissions = (await getJson(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=5000`,
    )) as {
      result?: {
        verdict?: string;
        id?: number;
        creationTimeSeconds?: number;
        problem?: { contestId?: number; index?: string };
      }[];
    };
    const solved = new Set<string>();
    const activity: Record<string, { submissions: number; solved: number; ids?: Set<string> }> = {};
    for (const sub of submissions.result ?? []) {
      if (sub.creationTimeSeconds) {
        addSubmission(
          activity,
          dayKey(sub.creationTimeSeconds * 1000),
          sub.verdict === "OK",
          sub.id === undefined ? undefined : String(sub.id),
        );
      }
      if (sub.verdict === "OK" && sub.problem) {
        solved.add(`${sub.problem.contestId ?? "x"}-${sub.problem.index ?? ""}`);
      }
    }
    stats.problems_solved = solved.size;
    stats.activity = activityRows(activity);
    stats.submissions = stats.activity.reduce((sum, row) => sum + row.submissions, 0);
    const streaks = streaksFrom(activityMap(stats.activity));
    stats.current_streak = streaks.current;
    stats.max_streak = streaks.max;
  } catch {
    /* solved count is optional */
  }

  return stats;
}

async function fetchGitHub(username: string): Promise<FetchedStats> {
  const user = (await getJson(`https://api.github.com/users/${encodeURIComponent(username)}`)) as {
    login?: string;
    public_repos?: number;
    followers?: number;
  };
  if (!user.login) throw new Error(`No GitHub user called "${username}".`);
  const stats = base("github", username, `https://github.com/${username}`);
  stats.problems_solved = user.public_repos ?? null;
  stats.rank_label = `${user.followers ?? 0} followers`;

  try {
    const response = await fetch(
      `https://github.com/users/${encodeURIComponent(username)}/contributions`,
      { headers: UA },
    );
    if (response.ok) {
      const html = await response.text();
      const activity: Record<string, number> = {};
      const dayIds = new Map<string, string>();
      const cellRe = /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"[^>]*>/g;
      for (let m = cellRe.exec(html); m; m = cellRe.exec(html)) {
        if (m[2] && m[1]) dayIds.set(m[2], m[1]);
      }
      const tipRe = /<tool-tip[^>]*for="([^"]+)"[^>]*>\s*(?:No|(\d[\d,]*))\s*contribution/g;
      for (let m = tipRe.exec(html); m; m = tipRe.exec(html)) {
        const date = m[1] ? dayIds.get(m[1]) : undefined;
        if (!date) continue;
        const count = m[2] ? Number.parseInt(m[2].replace(/,/g, ""), 10) : 0;
        if (count > 0) addDay(activity, date, count);
      }
      stats.activity = Object.entries(trimActivity(activity)).map(([date, submissions]) => ({
        date,
        submissions,
        solved: 0,
      }));
      stats.submissions = stats.activity.reduce((sum, row) => sum + row.submissions, 0);
      const streaks = streaksFrom(activityMap(stats.activity));
      stats.current_streak = streaks.current;
      stats.max_streak = streaks.max;
    }
  } catch {
    /* contribution graph is optional */
  }

  return stats;
}

async function fetchCodeChef(username: string): Promise<FetchedStats> {
  const url = `https://www.codechef.com/users/${encodeURIComponent(username)}`;
  const response = await fetch(url, { headers: UA });
  if (response.status === 404) throw new Error(`No CodeChef user called "${username}".`);
  if (!response.ok) throw new Error(`CodeChef returned ${response.status}`);
  const html = await response.text();

  const stats = base("codechef", username, url);
  const rating = /class="rating-number">\s*([\d]+)/.exec(html);
  if (rating?.[1]) stats.rating = Number.parseInt(rating[1], 10);

  const starBlock = /class="rating-star">([\s\S]{0,600}?)<\/div>/.exec(html);
  const starCount = starBlock?.[1] ? (starBlock[1].match(/&#9733;/g) ?? []).length : 0;
  if (starCount > 0) stats.rank_label = `${starCount}\u2605`;

  const solved = /Total Problems Solved:\s*(?:<\/?[^>]+>\s*)*(\d+)/.exec(html);
  if (solved?.[1]) stats.problems_solved = Number.parseInt(solved[1], 10);

  const contests = /No\. of Contests Participated:\s*<b>(\d+)<\/b>/.exec(html);
  if (contests?.[1]) stats.contests_attended = Number.parseInt(contests[1], 10);

  try {
    const daily = /userDailySubmissionsStats\s*=\s*(\[[\s\S]*?\]);/.exec(html);
    if (daily?.[1]) {
      const rows = JSON.parse(daily[1]) as { date?: string; value?: number }[];
      const activity: Record<string, { submissions: number; solved: number }> = {};
      for (const row of rows) {
        const date = row.date ? normaliseDate(row.date) : null;
        const submissions = Number(row.value) || 0;
        if (date && submissions > 0) activity[date] = { submissions, solved: 0 };
      }
      stats.activity = activityRows(activity);
      stats.submissions = stats.activity.reduce((sum, row) => sum + row.submissions, 0);
      const streaks = streaksFrom(activityMap(stats.activity));
      stats.current_streak = streaks.current;
      stats.max_streak = streaks.max;
    }
  } catch {
    /* heatmap is optional */
  }

  return stats;
}

async function fetchHackerRank(username: string): Promise<FetchedStats> {
  const handle = encodeURIComponent(username);
  const profile = (await getJson(
    `https://www.hackerrank.com/rest/contests/master/hackers/${handle}/profile`,
  ).catch(() => null)) as { model?: { username?: string } } | null;
  if (!profile?.model?.username) throw new Error(`No HackerRank user called "${username}".`);

  const stats = base("hackerrank", username, `https://www.hackerrank.com/profile/${username}`);

  try {
    const badges = (await getJson(`https://www.hackerrank.com/rest/hackers/${handle}/badges`)) as {
      models?: { badge_name?: string; badge_type?: string; solved?: number; stars?: number }[];
    };
    const list = badges.models ?? [];
    stats.problems_solved = list.reduce((sum, b) => sum + (b.solved ?? 0), 0);
    const ps = list.find((b) => b.badge_type === "problem-solving");
    if (ps?.stars) stats.rank_label = `${ps.stars}\u2605 Problem Solving`;
  } catch {
    /* badges are optional */
  }

  try {
    const elo = (await getJson(
      `https://www.hackerrank.com/rest/hackers/${handle}/rating_histories_elo`,
    )) as { models?: { events?: { rating?: number; date?: string }[] }[] };
    const events = (elo.models ?? []).flatMap((m) => m.events ?? []);
    stats.contests_attended = events.length;
    const latest = events
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .at(-1);
    if (latest?.rating) stats.rating = Math.round(latest.rating);
  } catch {
    /* ratings are optional */
  }

  try {
    const recent = (await getJson(
      `https://www.hackerrank.com/rest/hackers/${handle}/recent_challenges?limit=100`,
    )) as { models?: { ch_slug?: string; created_at?: string }[] };
    const activity: Record<string, { submissions: number; solved: number; ids?: Set<string> }> = {};
    for (const challenge of recent.models ?? []) {
      const timestamp = challenge.created_at ? Date.parse(challenge.created_at) : Number.NaN;
      if (!Number.isFinite(timestamp)) continue;
      addSubmission(activity, dayKey(timestamp), true, challenge.ch_slug);
    }
    stats.activity = activityRows(activity);
    stats.submissions = stats.activity.reduce((sum, row) => sum + row.submissions, 0);
    const streaks = streaksFrom(activityMap(stats.activity));
    stats.current_streak = streaks.current;
    stats.max_streak = streaks.max;
  } catch {
    /* HackerRank may hide recent challenges for some profiles. */
  }

  return stats;
}

function readEmbeddedNumber(html: string, key: string): number | null {
  const match = new RegExp(`\\\\?"${key}\\\\?":\\s*(\\d+)`).exec(html);
  return match?.[1] ? Number.parseInt(match[1], 10) : null;
}

async function fetchGfg(username: string): Promise<FetchedStats> {
  const url = `https://www.geeksforgeeks.org/user/${encodeURIComponent(username)}/`;
  const response = await fetch(url, { headers: UA, redirect: "follow" });
  if (response.status === 404) throw new Error(`No GeeksforGeeks user called "${username}".`);
  if (!response.ok) throw new Error(`GeeksforGeeks returned ${response.status}`);
  const html = await response.text();

  const solved = readEmbeddedNumber(html, "total_problems_solved");
  if (solved === null) throw new Error(`No GeeksforGeeks user called "${username}".`);

  const stats = base("gfg", username, url);
  stats.problems_solved = solved;
  stats.rating = readEmbeddedNumber(html, "score");
  stats.current_streak = readEmbeddedNumber(html, "pod_solved_current_streak") ?? 0;
  stats.max_streak = readEmbeddedNumber(html, "pod_solved_longest_streak") ?? stats.current_streak;
  const rank = readEmbeddedNumber(html, "institute_rank");
  if (rank) stats.rank_label = `Institute #${rank}`;

  try {
    const submissions = (await postJson(
      "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/",
      { handle: username, requestType: "", year: "", month: "" },
    )) as {
      result?: Record<string, Record<string, { slug?: string; user_subtime?: string }>>;
    };
    const activity: Record<string, { submissions: number; solved: number; ids?: Set<string> }> = {};
    for (const difficulty of Object.values(submissions.result ?? {})) {
      for (const [submissionId, submission] of Object.entries(difficulty)) {
        const date = submission.user_subtime ? normaliseDate(submission.user_subtime) : null;
        if (date) addSubmission(activity, date, true, submissionId || submission.slug);
      }
    }
    stats.activity = activityRows(activity);
    stats.submissions = stats.activity.reduce((sum, row) => sum + row.submissions, 0);
    const streaks = streaksFrom(activityMap(stats.activity));
    stats.current_streak = streaks.current;
    stats.max_streak = Math.max(stats.max_streak, streaks.max);
  } catch {
    /* Profile totals remain valid when the public practice feed is unavailable. */
  }
  return stats;
}

function atcoderColor(rating: number): string {
  if (rating >= 2800) return "Red";
  if (rating >= 2400) return "Orange";
  if (rating >= 2000) return "Yellow";
  if (rating >= 1600) return "Blue";
  if (rating >= 1200) return "Cyan";
  if (rating >= 800) return "Green";
  if (rating >= 400) return "Brown";
  return "Gray";
}

async function fetchAtCoder(username: string): Promise<FetchedStats> {
  const handle = encodeURIComponent(username);
  const history = (await getJson(`https://atcoder.jp/users/${handle}/history/json`).catch(
    () => null,
  )) as { IsRated?: boolean; NewRating?: number }[] | null;
  if (!Array.isArray(history)) throw new Error(`No AtCoder user called "${username}".`);

  const stats = base("atcoder", username, `https://atcoder.jp/users/${username}`);
  stats.contests_attended = history.length;
  const rated = history.filter((h) => h.IsRated).at(-1);
  if (rated?.NewRating !== undefined) {
    stats.rating = rated.NewRating;
    stats.rank_label = atcoderColor(rated.NewRating);
  }

  try {
    const ac = (await getJson(
      `https://kenkoooo.com/atcoder/atcoder-api/v3/user/ac_rank?user=${handle}`,
    )) as { count?: number };
    stats.problems_solved = ac.count ?? 0;
  } catch {
    /* solved count is optional */
  }

  try {
    const from = Math.floor((Date.now() - 366 * DAY) / 1000);
    const subs = (await getJson(
      `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${handle}&from_second=${from}`,
    )) as { id?: number; epoch_second?: number; problem_id?: string; result?: string }[];
    const activity: Record<string, { submissions: number; solved: number; ids?: Set<string> }> = {};
    for (const sub of Array.isArray(subs) ? subs : []) {
      if (sub.epoch_second) {
        addSubmission(
          activity,
          dayKey(sub.epoch_second * 1000),
          sub.result === "AC",
          sub.id === undefined ? `${sub.problem_id ?? "unknown"}-${sub.epoch_second}` : String(sub.id),
        );
      }
    }
    stats.activity = activityRows(activity);
    stats.submissions = stats.activity.reduce((sum, row) => sum + row.submissions, 0);
    const streaks = streaksFrom(activityMap(stats.activity));
    stats.current_streak = streaks.current;
    stats.max_streak = streaks.max;
  } catch {
    /* heatmap is optional */
  }

  return stats;
}

async function fetchCses(username: string): Promise<FetchedStats> {
  const id = username.replace(/\D/g, "");
  if (!id) throw new Error("CSES needs your numeric user id, e.g. 391136.");
  const url = `https://cses.fi/user/${id}`;
  const response = await fetch(url, { headers: UA });
  if (!response.ok) throw new Error(`CSES returned ${response.status}`);
  const html = await response.text();
  if (/CSES - 404/.test(html)) throw new Error(`No CSES user with id ${id}.`);

  const stats = base("cses", id, `https://cses.fi/problemset/user/${id}/`);
  const name = /<title>CSES - User ([^<]+)<\/title>/.exec(html)?.[1]?.trim();
  const submissions = /Submission count:<\/td><td[^>]*>\s*(\d+)/.exec(html)?.[1];
  const first = /First submission:<\/td><td[^>]*>\s*([\d-]+)/.exec(html)?.[1];
  const last = /Last submission:<\/td><td[^>]*>\s*([\d-]+)/.exec(html)?.[1];
  if (submissions) {
    stats.submissions = Number.parseInt(submissions, 10);
    stats.rank_label = `${submissions} submissions`;
  }
  if (name) stats.username = id;
  // The public CSES user page exposes only totals plus first/last timestamps.
  // It does not expose per-submission rows or solved-task count without a logged-in session,
  // so these remain null rather than fabricating activity dates or equating submissions to solved.
  void first;
  void last;
  return stats;
}

const FETCHERS: Record<string, (username: string) => Promise<FetchedStats>> = {
  leetcode: fetchLeetCode,
  codeforces: fetchCodeforces,
  github: fetchGitHub,
  codechef: fetchCodeChef,
  hackerrank: fetchHackerRank,
  gfg: fetchGfg,
  atcoder: fetchAtCoder,
  cses: fetchCses,
};

export const SYNCABLE_PLATFORMS = Object.keys(FETCHERS);

export async function fetchPlatformStats(
  platform: string,
  username: string,
): Promise<FetchedStats> {
  const fetcher = FETCHERS[platform];
  if (!fetcher) {
    throw new Error(
      `Automatic sync isn't available for this platform yet — enter the numbers manually.`,
    );
  }
  const handle = username.trim();
  if (!handle) throw new Error("Enter a username first.");
  return fetcher(handle);
}
