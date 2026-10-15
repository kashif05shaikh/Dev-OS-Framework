import type { PlatformVerificationMeta } from "./types";

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 DevOS/1.0",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
};

export const PLATFORM_VERIFICATION_CONFIGS: Record<string, PlatformVerificationMeta> = {
  leetcode: {
    platform: "leetcode",
    name: "LeetCode",
    fieldName: "Summary / About Me or Name",
    settingsUrl: "https://leetcode.com/profile/",
    instructions:
      "Go to your LeetCode Profile Settings, paste this verification code into your Summary / About Me or Name field, and save changes.",
    tips: "Changes on LeetCode take effect immediately. You can remove the code once verified.",
  },
  codeforces: {
    platform: "codeforces",
    name: "Codeforces",
    fieldName: "Last name, First name, or Organization",
    settingsUrl: "https://codeforces.com/settings/social",
    instructions:
      "Go to Codeforces Social Settings, paste this verification code into Last name (English), First name (English), or Organization, and click Save changes.",
    tips: "Changes on Codeforces save instantly. You can revert your settings once verified.",
  },
  atcoder: {
    platform: "atcoder",
    name: "AtCoder",
    fieldName: "Affiliation",
    settingsUrl: "https://atcoder.jp/settings",
    instructions:
      "Go to AtCoder General Settings, paste this verification code into the Affiliation field, and click Update at the bottom.",
    tips: "Make sure to click Update at the bottom of the AtCoder settings page.",
  },
  codechef: {
    platform: "codechef",
    name: "CodeChef",
    fieldName: "Your Name",
    settingsUrl: (handle: string) => `https://www.codechef.com/users/${encodeURIComponent(handle)}/edit/`,
    instructions:
      "Go to CodeChef Edit Profile, paste this verification code into Your Name, and save changes.",
    tips: "Your name is shown publicly on your CodeChef profile page.",
  },
  hackerrank: {
    platform: "hackerrank",
    name: "HackerRank",
    fieldName: "Headline or Name",
    settingsUrl: "https://www.hackerrank.com/profile",
    instructions:
      "Go to HackerRank Profile, edit your Personal Information dialog, paste this verification code into Headline or Name, and save.",
    tips: "You can find Personal Information right on your public HackerRank profile.",
  },
  gfg: {
    platform: "gfg",
    name: "GeeksforGeeks",
    fieldName: "Headline or Name",
    settingsUrl: "https://www.geeksforgeeks.org/profile/edit",
    instructions:
      "Go to GeeksforGeeks Edit Profile, paste this verification code into your Headline or Name, and click Save Changes.",
    tips: "Headline appears directly under your username on your public GeeksforGeeks profile.",
  },
  github: {
    platform: "github",
    name: "GitHub",
    fieldName: "Bio",
    settingsUrl: "https://github.com/settings/profile",
    instructions:
      "Go to GitHub Profile Settings, paste this verification code into your Bio, and click Update profile.",
    tips: "Your bio is immediately visible on your public GitHub profile.",
  },
};

export function getPlatformVerificationMeta(platform: string, handle: string): {
  platform: string;
  name: string;
  fieldName: string;
  settingsUrl: string;
  instructions: string;
  tips?: string | undefined;
} {
  const cfg = PLATFORM_VERIFICATION_CONFIGS[platform];
  if (!cfg) {
    throw new Error(`Platform "${platform}" does not support automatic ownership verification.`);
  }
  const settingsUrl =
    typeof cfg.settingsUrl === "function" ? cfg.settingsUrl(handle) : cfg.settingsUrl;
  return {
    platform: cfg.platform,
    name: cfg.name,
    fieldName: cfg.fieldName,
    settingsUrl,
    instructions: cfg.instructions,
    tips: cfg.tips,
  };
}

async function verifyLeetCode(handle: string, code: string): Promise<boolean> {
  const query = `query devosVerify($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        aboutMe
        school
        company
      }
    }
  }`;

  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": UA["User-Agent"],
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables: { username: handle } }),
  });

  if (!res.ok) return false;
  const json = (await res.json()) as {
    data?: {
      matchedUser?: {
        profile?: {
          realName?: string | null;
          aboutMe?: string | null;
          school?: string | null;
          company?: string | null;
        } | null;
      } | null;
    };
  };

  const p = json?.data?.matchedUser?.profile;
  if (!p) return false;
  const haystack = `${p.realName ?? ""} ${p.aboutMe ?? ""} ${p.school ?? ""} ${p.company ?? ""}`.toLowerCase();
  return haystack.includes(code.toLowerCase());
}

async function verifyCodeforces(handle: string, code: string): Promise<boolean> {
  const res = await fetch(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
    { headers: { "User-Agent": UA["User-Agent"] } },
  );
  if (!res.ok) return false;
  const json = (await res.json()) as {
    status?: string;
    result?: Array<{
      firstName?: string;
      lastName?: string;
      organization?: string;
      city?: string;
    }>;
  };

  const user = json?.result?.[0];
  if (!user) return false;
  const haystack = `${user.firstName ?? ""} ${user.lastName ?? ""} ${user.organization ?? ""} ${user.city ?? ""}`.toLowerCase();
  return haystack.includes(code.toLowerCase());
}

async function verifyAtCoder(handle: string, code: string): Promise<boolean> {
  const res = await fetch(`https://atcoder.jp/users/${encodeURIComponent(handle)}`, {
    headers: UA,
  });
  if (!res.ok) return false;
  const html = await res.text();
  return html.toLowerCase().includes(code.toLowerCase());
}

async function verifyCodeChef(handle: string, code: string): Promise<boolean> {
  const res = await fetch(`https://www.codechef.com/users/${encodeURIComponent(handle)}`, {
    headers: UA,
  });
  if (!res.ok) return false;
  const html = await res.text();
  return html.toLowerCase().includes(code.toLowerCase());
}

async function verifyHackerRank(handle: string, code: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.hackerrank.com/rest/contests/master/hackers/${encodeURIComponent(handle)}/profile`,
      { headers: UA },
    );
    if (res.ok) {
      const json = (await res.json()) as {
        model?: {
          jobs_headline?: string | null;
          short_bio?: string | null;
          name?: string | null;
          personal_first_name?: string | null;
          personal_last_name?: string | null;
          website?: string | null;
        };
      };
      const m = json?.model;
      if (m) {
        const haystack = `${m.jobs_headline ?? ""} ${m.short_bio ?? ""} ${m.name ?? ""} ${m.personal_first_name ?? ""} ${m.personal_last_name ?? ""} ${m.website ?? ""}`.toLowerCase();
        if (haystack.includes(code.toLowerCase())) return true;
      }
    }
  } catch {
    /* fallback to profile HTML */
  }

  try {
    const res = await fetch(`https://www.hackerrank.com/profile/${encodeURIComponent(handle)}`, {
      headers: UA,
    });
    if (res.ok) {
      const html = await res.text();
      return html.toLowerCase().includes(code.toLowerCase());
    }
  } catch {
    /* failed */
  }
  return false;
}

async function verifyGfg(handle: string, code: string): Promise<boolean> {
  const res = await fetch(`https://www.geeksforgeeks.org/user/${encodeURIComponent(handle)}/`, {
    headers: UA,
  });
  if (!res.ok) return false;
  const html = await res.text();
  return html.toLowerCase().includes(code.toLowerCase());
}

async function verifyGitHub(handle: string, code: string): Promise<boolean> {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
    headers: UA,
  });
  if (!res.ok) return false;
  const user = (await res.json()) as {
    bio?: string | null;
    name?: string | null;
  };
  const haystack = `${user.bio ?? ""} ${user.name ?? ""}`.toLowerCase();
  return haystack.includes(code.toLowerCase());
}

const VERIFIERS: Record<string, (handle: string, code: string) => Promise<boolean>> = {
  leetcode: verifyLeetCode,
  codeforces: verifyCodeforces,
  atcoder: verifyAtCoder,
  codechef: verifyCodeChef,
  hackerrank: verifyHackerRank,
  gfg: verifyGfg,
  github: verifyGitHub,
};

export async function verifyPlatformOwnership(
  platform: string,
  handle: string,
  challengeCode: string,
): Promise<boolean> {
  const verifier = VERIFIERS[platform];
  if (!verifier) {
    throw new Error(`Verification not supported for platform "${platform}".`);
  }
  return verifier(handle.trim(), challengeCode.trim());
}

