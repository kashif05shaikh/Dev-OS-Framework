export type FetchedStats = {
  platform: string;
  username: string;
  profile_url: string | null;
  rating: number | null;
  rank_label: string | null;
  problems_solved: number;
  contests_attended: number;
  current_streak: number;
  max_streak: number;
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

function base(platform: string, username: string, profile_url: string | null): FetchedStats {
  return {
    platform,
    username,
    profile_url,
    rating: null,
    rank_label: null,
    problems_solved: 0,
    contests_attended: 0,
    current_streak: 0,
    max_streak: 0,
  };
}

async function fetchLeetCode(username: string): Promise<FetchedStats> {
  const query = `query devos($username: String!) {
    matchedUser(username: $username) {
      username
      profile { ranking reputation }
      submitStatsGlobal { acSubmissionNum { difficulty count } }
      userCalendar { streak }
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
        userCalendar?: { streak?: number };
      } | null;
      userContestRanking?: { attendedContestsCount?: number; rating?: number } | null;
    };
  };

  const user = payload.data?.matchedUser;
  if (!user) throw new Error(`No LeetCode user called "${username}".`);

  const all = user.submitStatsGlobal?.acSubmissionNum?.find((s) => s.difficulty === "All");
  const contest = payload.data?.userContestRanking;
  const stats = base("leetcode", username, `https://leetcode.com/u/${username}/`);
  stats.problems_solved = all?.count ?? 0;
  stats.contests_attended = contest?.attendedContestsCount ?? 0;
  stats.rating = contest?.rating ? Math.round(contest.rating) : null;
  stats.current_streak = user.userCalendar?.streak ?? 0;
  stats.max_streak = stats.current_streak;
  stats.rank_label = user.profile?.ranking ? `Global #${user.profile.ranking}` : null;
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
      result?: { verdict?: string; problem?: { contestId?: number; index?: string } }[];
    };
    const solved = new Set<string>();
    for (const sub of submissions.result ?? []) {
      if (sub.verdict === "OK" && sub.problem) {
        solved.add(`${sub.problem.contestId ?? "x"}-${sub.problem.index ?? ""}`);
      }
    }
    stats.problems_solved = solved.size;
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
  stats.problems_solved = user.public_repos ?? 0;
  stats.rank_label = `${user.followers ?? 0} followers`;
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

  return stats;
}

const FETCHERS: Record<string, (username: string) => Promise<FetchedStats>> = {
  leetcode: fetchLeetCode,
  codeforces: fetchCodeforces,
  github: fetchGitHub,
  codechef: fetchCodeChef,
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
