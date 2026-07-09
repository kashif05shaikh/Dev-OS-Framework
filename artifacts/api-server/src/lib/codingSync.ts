import { logger } from "./logger";

export interface CodingSyncResult {
  avatarUrl?: string | null;
  rating?: number | null;
  rank?: string | null;
  solvedCount?: number | null;
  maxRating?: number | null;
  country?: string | null;
  profileUrl: string;
  statsJson: Record<string, unknown>;
  ok: boolean;
  errorMessage?: string;
}

function profileUrlFor(platform: string, handle: string): string {
  switch (platform) {
    case "github":
      return `https://github.com/${handle}`;
    case "leetcode":
      return `https://leetcode.com/${handle}`;
    case "codeforces":
      return `https://codeforces.com/profile/${handle}`;
    case "codechef":
      return `https://www.codechef.com/users/${handle}`;
    case "atcoder":
      return `https://atcoder.jp/users/${handle}`;
    case "hackerrank":
      return `https://www.hackerrank.com/${handle}`;
    case "hackerearth":
      return `https://www.hackerearth.com/@${handle}`;
    case "geeksforgeeks":
      return `https://www.geeksforgeeks.org/user/${handle}`;
    case "cses":
      return `https://cses.fi/user/${handle}`;
    case "spoj":
      return `https://www.spoj.com/users/${handle}`;
    case "topcoder":
      return `https://www.topcoder.com/members/${handle}`;
    default:
      return "";
  }
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function syncGithub(handle: string): Promise<CodingSyncResult> {
  const user = await fetchJson(`https://api.github.com/users/${handle}`);
  const repos = await fetchJson(
    `https://api.github.com/users/${handle}/repos?per_page=100&sort=updated`,
  );
  const totalStars = Array.isArray(repos)
    ? repos.reduce((sum: number, r: any) => sum + (r.stargazers_count ?? 0), 0)
    : 0;
  return {
    ok: true,
    avatarUrl: user.avatar_url ?? null,
    solvedCount: user.public_repos ?? null,
    rank: null,
    rating: null,
    maxRating: null,
    country: user.location ?? null,
    profileUrl: user.html_url ?? profileUrlFor("github", handle),
    statsJson: {
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      totalStars,
      bio: user.bio,
      company: user.company,
      blog: user.blog,
      repos: Array.isArray(repos)
        ? repos.slice(0, 100).map((r: any) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
            description: r.description,
            url: r.html_url,
            stars: r.stargazers_count,
            forks: r.forks_count,
            language: r.language,
            pushedAt: r.pushed_at,
          }))
        : [],
    },
  };
}

async function syncLeetcode(handle: string): Promise<CodingSyncResult> {
  const query = {
    query: `query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking countryName reputation userAvatar }
        submitStatsGlobal { acSubmissionNum { difficulty count } }
      }
      userContestRanking(username: $username) { rating topPercentage }
    }`,
    variables: { username: handle },
  };
  const data = await fetchJson("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  const user = data?.data?.matchedUser;
  if (!user) throw new Error("User not found");
  const solvedAll = user.submitStatsGlobal?.acSubmissionNum?.find(
    (s: any) => s.difficulty === "All",
  );
  const contest = data?.data?.userContestRanking;
  return {
    ok: true,
    avatarUrl: user.profile?.userAvatar ?? null,
    rank: user.profile?.ranking ? `#${user.profile.ranking}` : null,
    solvedCount: solvedAll?.count ?? null,
    rating: contest?.rating ? Math.round(contest.rating) : null,
    maxRating: contest?.rating ? Math.round(contest.rating) : null,
    country: user.profile?.countryName ?? null,
    profileUrl: profileUrlFor("leetcode", handle),
    statsJson: {
      reputation: user.profile?.reputation,
      bySeverity: user.submitStatsGlobal?.acSubmissionNum,
      contestTopPercentage: contest?.topPercentage,
    },
  };
}

async function syncCodeforces(handle: string): Promise<CodingSyncResult> {
  const data = await fetchJson(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
  );
  const user = data?.result?.[0];
  if (!user) throw new Error("User not found");
  return {
    ok: true,
    avatarUrl: user.titlePhoto ?? null,
    rank: user.rank ?? null,
    rating: user.rating ?? null,
    maxRating: user.maxRating ?? null,
    solvedCount: null,
    country: user.country ?? null,
    profileUrl: profileUrlFor("codeforces", handle),
    statsJson: {
      maxRank: user.maxRank,
      contribution: user.contribution,
      friendOfCount: user.friendOfCount,
    },
  };
}

async function syncAtcoder(handle: string): Promise<CodingSyncResult> {
  const data = await fetchJson(
    `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`,
  );
  if (!Array.isArray(data) || data.length === 0) throw new Error("User not found");
  const last = data[data.length - 1];
  const maxRating = data.reduce((max: number, d: any) => Math.max(max, d.NewRating ?? 0), 0);
  return {
    ok: true,
    avatarUrl: null,
    rank: null,
    rating: last.NewRating ?? null,
    maxRating,
    solvedCount: null,
    country: null,
    profileUrl: profileUrlFor("atcoder", handle),
    statsJson: { contestsCount: data.length },
  };
}

const UNSUPPORTED_PLATFORMS = new Set([
  "hackerrank",
  "hackerearth",
  "geeksforgeeks",
  "cses",
  "spoj",
  "topcoder",
]);

export async function syncCodingProfilePlatform(
  platform: string,
  handle: string,
): Promise<CodingSyncResult> {
  if (UNSUPPORTED_PLATFORMS.has(platform)) {
    return {
      ok: false,
      profileUrl: profileUrlFor(platform, handle),
      statsJson: {},
      errorMessage: "This platform has no public API. Profile link is saved, but stats cannot be fetched automatically.",
    };
  }

  try {
    switch (platform) {
      case "github":
        return await syncGithub(handle);
      case "leetcode":
        return await syncLeetcode(handle);
      case "codeforces":
        return await syncCodeforces(handle);
      case "atcoder":
        return await syncAtcoder(handle);
      default:
        return {
          ok: false,
          profileUrl: profileUrlFor(platform, handle),
          statsJson: {},
          errorMessage: "Unsupported platform",
        };
    }
  } catch (err) {
    logger.warn({ err, platform, handle }, "Coding profile sync failed");
    return {
      ok: false,
      profileUrl: profileUrlFor(platform, handle),
      statsJson: {},
      errorMessage: err instanceof Error ? err.message : "Sync failed",
    };
  }
}

export { profileUrlFor };
