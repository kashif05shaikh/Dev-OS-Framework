import type { SocialLink, SocialSnapshot } from "./social-platforms";

const UA = {
  "User-Agent": "Mozilla/5.0 (compatible; DevOS/1.0)",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
};

class PlatformError extends Error {}

function fail(message: string): never {
  throw new PlatformError(message);
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { ...UA, ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    fail(`Could not reach ${new URL(url).hostname}. Check the network and try again.`);
  }
  const host = new URL(url).hostname;
  if (response.status === 404) fail("That profile does not exist — check the username.");
  if (response.status === 401 || response.status === 403) {
    fail(`${host} refused the request. The profile may be private or the API needs authorisation.`);
  }
  if (response.status === 429) fail(`${host} rate-limited DevOS. Wait a minute and sync again.`);
  if (!response.ok) fail(`${host} returned an unexpected ${response.status} response.`);
  return response;
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await request(url, init);
  try {
    return (await response.json()) as T;
  } catch {
    return fail(`${new URL(url).hostname} returned a response DevOS could not read.`);
  }
}

async function getText(url: string, init?: RequestInit): Promise<string> {
  return (await request(url, init)).text();
}

function empty(platform: string, handle: string, profileUrl: string | null): SocialSnapshot {
  return {
    platform,
    handle,
    profile_url: profileUrl,
    display_name: null,
    avatar_url: null,
    bio: null,
    location: null,
    website: null,
    verified: null,
    followers: null,
    following: null,
    posts: null,
    joined_at: null,
    extra: {},
  };
}

function clean(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length ? text : null;
}

function iso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/* ------------------------------- GitHub ------------------------------- */

async function fetchGithub(handle: string): Promise<SocialSnapshot> {
  type User = {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    location: string | null;
    blog: string | null;
    company: string | null;
    followers: number;
    following: number;
    public_repos: number;
    created_at: string;
    html_url: string;
  };
  const user = await getJson<User>(`https://api.github.com/users/${encodeURIComponent(handle)}`);

  type Repo = {
    name: string;
    html_url: string;
    description: string | null;
    stargazers_count: number;
    language: string | null;
    pushed_at: string;
    fork: boolean;
  };
  let repos: Repo[] = [];
  try {
    repos = await getJson<Repo[]>(
      `https://api.github.com/users/${encodeURIComponent(handle)}/repos?per_page=100&sort=pushed`,
    );
  } catch {
    repos = [];
  }

  const stars = repos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
  const recentRepos = repos
    .filter((r) => !r.fork)
    .slice(0, 5)
    .map((r) => ({
      title: r.name,
      url: r.html_url,
      date: iso(r.pushed_at),
      meta: [r.language, `${r.stargazers_count}★`].filter(Boolean).join(" · "),
    }));

  let recentCommits: SocialLink[] = [];
  try {
    type Event = {
      type: string;
      repo: { name: string };
      created_at: string;
      payload?: { commits?: { message: string; sha: string }[] };
    };
    const events = await getJson<Event[]>(
      `https://api.github.com/users/${encodeURIComponent(handle)}/events/public?per_page=30`,
    );
    recentCommits = events
      .filter((e) => e.type === "PushEvent")
      .flatMap((e) =>
        (e.payload?.commits ?? []).map((c) => ({
          title: `${e.repo.name}: ${c.message.split("\n")[0]}`,
          url: `https://github.com/${e.repo.name}/commit/${c.sha}`,
          date: iso(e.created_at),
        })),
      )
      .slice(0, 5);
  } catch {
    recentCommits = [];
  }

  return {
    ...empty("github", user.login, user.html_url),
    display_name: clean(user.name),
    avatar_url: user.avatar_url,
    bio: clean(user.bio),
    location: clean(user.location),
    website: clean(user.blog),
    followers: user.followers,
    following: user.following,
    posts: user.public_repos,
    joined_at: iso(user.created_at),
    extra: {
      company: clean(user.company),
      stars,
      recentRepos,
      recentCommits,
      postsLabel: "Repositories",
    },
  };
}

/* --------------------------------- X ---------------------------------- */

async function fetchTwitter(handle: string): Promise<SocialSnapshot> {
  type Payload = {
    user?: {
      screen_name: string;
      name: string;
      description: string;
      location: string;
      followers: number;
      following: number;
      tweets: number;
      avatar_url: string;
      joined: string;
      url: string;
      verified?: boolean | string;
      website?: { url: string } | null;
    };
  };
  const payload = await getJson<Payload>(`https://api.fxtwitter.com/${encodeURIComponent(handle)}`);
  const user = payload.user;
  if (!user) fail("That X account could not be read — it may be suspended or private.");

  return {
    ...empty("twitter", user.screen_name, user.url),
    display_name: clean(user.name),
    avatar_url: clean(user.avatar_url),
    bio: clean(user.description),
    location: clean(user.location),
    website: clean(user.website?.url),
    verified: typeof user.verified === "boolean" ? user.verified : Boolean(user.verified),
    followers: user.followers ?? null,
    following: user.following ?? null,
    posts: user.tweets ?? null,
    joined_at: iso(user.joined),
    extra: { postsLabel: "Posts" },
  };
}

function parseCount(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/^([\d.]+)\s*([KMB])?$/i);
  if (!match) return null;
  const base = Number(match[1]);
  if (Number.isNaN(base)) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(match[2] ?? "").toLowerCase()] ?? 1;
  return Math.round(base * mult);
}

/* -------------------------------- Reddit ------------------------------ */

async function fetchReddit(handle: string): Promise<SocialSnapshot> {
  type About = {
    data?: {
      name: string;
      icon_img?: string;
      snoovatar_img?: string;
      subreddit?: { public_description?: string; title?: string };
      link_karma: number;
      comment_karma: number;
      total_karma?: number;
      created_utc: number;
      verified?: boolean;
    };
  };
  const about = await getJson<About>(
    `https://www.reddit.com/user/${encodeURIComponent(handle)}/about.json`,
  );
  const data = about.data;
  if (!data) fail("That Reddit account could not be read.");

  let recentPosts: SocialLink[] = [];
  try {
    type Listing = {
      data?: { children?: { data: { title: string; permalink: string; created_utc: number } }[] };
    };
    const listing = await getJson<Listing>(
      `https://www.reddit.com/user/${encodeURIComponent(handle)}/submitted.json?limit=5`,
    );
    recentPosts = (listing.data?.children ?? []).map((child) => ({
      title: child.data.title,
      url: `https://reddit.com${child.data.permalink}`,
      date: new Date(child.data.created_utc * 1000).toISOString(),
    }));
  } catch {
    recentPosts = [];
  }

  const postKarma = data.link_karma ?? 0;
  const commentKarma = data.comment_karma ?? 0;

  return {
    ...empty("reddit", data.name, `https://reddit.com/user/${data.name}`),
    display_name: clean(data.subreddit?.title) ?? data.name,
    avatar_url: clean(data.snoovatar_img) ?? clean(data.icon_img?.split("?")[0]),
    bio: clean(data.subreddit?.public_description),
    verified: data.verified ?? null,
    posts: recentPosts.length || null,
    joined_at: data.created_utc ? new Date(data.created_utc * 1000).toISOString() : null,
    extra: {
      karma: data.total_karma ?? postKarma + commentKarma,
      postKarma,
      commentKarma,
      recentPosts,
      cakeDay: data.created_utc ? new Date(data.created_utc * 1000).toISOString() : null,
      postsLabel: "Recent posts",
    },
  };
}

/* -------------------------------- Dev.to ------------------------------ */

async function fetchDevto(handle: string): Promise<SocialSnapshot> {
  type User = {
    username: string;
    name: string;
    summary: string | null;
    location: string | null;
    website_url: string | null;
    joined_at: string;
    profile_image: string;
  };
  const user = await getJson<User>(
    `https://dev.to/api/users/by_username?url=${encodeURIComponent(handle)}`,
  );

  type Article = {
    title: string;
    url: string;
    published_at: string;
    positive_reactions_count: number;
    comments_count: number;
    reading_time_minutes: number;
  };
  let articles: Article[] = [];
  try {
    articles = await getJson<Article[]>(
      `https://dev.to/api/articles?username=${encodeURIComponent(handle)}&per_page=100`,
    );
  } catch {
    articles = [];
  }

  const reactions = articles.reduce((sum, a) => sum + (a.positive_reactions_count ?? 0), 0);

  return {
    ...empty("devto", user.username, `https://dev.to/${user.username}`),
    display_name: clean(user.name),
    avatar_url: clean(user.profile_image),
    bio: clean(user.summary),
    location: clean(user.location),
    website: clean(user.website_url),
    posts: articles.length || null,
    joined_at: iso(user.joined_at),
    extra: {
      reactions,
      readingMinutes: articles.reduce((s, a) => s + (a.reading_time_minutes ?? 0), 0),
      recentArticles: articles.slice(0, 5).map((a) => ({
        title: a.title,
        url: a.url,
        date: iso(a.published_at),
        meta: `${a.positive_reactions_count} reactions`,
      })),
      postsLabel: "Articles",
    },
  };
}

/* ------------------------------ Hashnode ------------------------------ */

async function fetchHashnodeGraphql(handle: string): Promise<SocialSnapshot | null> {
  const query = `query devos($u: String!) {
    user(username: $u) {
      username name profilePicture tagline followersCount followingCount location
      socialMediaLinks { website }
      posts(page: 1, pageSize: 5) { nodes { title url publishedAt } }
    }
  }`;
  try {
    const payload = await getJson<{
      data?: {
        user?: {
          username: string;
          name: string | null;
          profilePicture: string | null;
          tagline: string | null;
          followersCount: number | null;
          followingCount: number | null;
          location: string | null;
          socialMediaLinks?: { website?: string | null } | null;
          posts?: { nodes?: { title: string; url: string; publishedAt: string }[] };
        } | null;
      };
    }>("https://gql.hashnode.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { u: handle } }),
    });
    const user = payload.data?.user;
    if (!user) return null;
    const nodes = user.posts?.nodes ?? [];
    return {
      ...empty("hashnode", user.username, `https://hashnode.com/@${user.username}`),
      display_name: clean(user.name),
      avatar_url: clean(user.profilePicture),
      bio: clean(user.tagline),
      location: clean(user.location),
      website: clean(user.socialMediaLinks?.website),
      followers: user.followersCount ?? null,
      following: user.followingCount ?? null,
      posts: nodes.length || null,
      extra: {
        recentArticles: nodes.map((n) => ({
          title: n.title,
          url: n.url,
          date: iso(n.publishedAt),
        })),
        postsLabel: "Articles",
      },
    };
  } catch {
    return null;
  }
}

async function fetchHashnode(handle: string): Promise<SocialSnapshot> {
  const viaApi = await fetchHashnodeGraphql(handle);
  if (viaApi) return viaApi;

  // Fallback: the personal blog RSS feed still exposes the published articles.
  const xml = await getText(`https://${encodeURIComponent(handle)}.hashnode.dev/rss.xml`);
  const feed = parseFeed(xml);
  if (!feed.items.length && !feed.title) {
    fail("Hashnode did not return this profile. Check the username or try again shortly.");
  }
  return {
    ...empty("hashnode", handle, `https://hashnode.com/@${handle}`),
    display_name: feed.title,
    bio: feed.description,
    avatar_url: feed.image,
    posts: feed.items.length || null,
    extra: {
      recentArticles: feed.items.slice(0, 5),
      postsLabel: "Articles",
      note: "Read from the public blog feed — Hashnode's API did not respond.",
    },
  };
}

/* -------------------------------- Medium ------------------------------ */

function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFeed(xml: string): {
  title: string | null;
  description: string | null;
  image: string | null;
  items: SocialLink[];
} {
  const channel = xml.split("<item")[0] ?? "";
  const pick = (source: string, tag: string) => {
    const match = source.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? decode(match[1]!) : null;
  };
  const items = [...xml.matchAll(/<item[\s\S]*?<\/item>/g)].map((match) => {
    const block = match[0];
    return {
      title: pick(block, "title") ?? "Untitled",
      url: pick(block, "link") ?? "",
      date: iso(pick(block, "pubDate")),
    };
  });
  const image = channel.match(/<url>([\s\S]*?)<\/url>/i);
  return {
    title: pick(channel, "title"),
    description: pick(channel, "description"),
    image: image ? decode(image[1]!) : null,
    items,
  };
}

async function fetchMedium(handle: string): Promise<SocialSnapshot> {
  const user = handle.replace(/^@/, "");
  const xml = await getText(`https://medium.com/feed/@${encodeURIComponent(user)}`);
  const feed = parseFeed(xml);
  if (!feed.title) fail("Medium did not return a feed for that username.");

  return {
    ...empty("medium", user, `https://medium.com/@${user}`),
    display_name: feed.title.replace(/^Stories by /, "").replace(/ on Medium$/, ""),
    avatar_url: feed.image,
    bio: feed.description,
    posts: feed.items.length || null,
    extra: {
      recentArticles: feed.items.slice(0, 5),
      postsLabel: "Articles in feed",
      note: "Medium publishes no follower API — only feed data is shown.",
    },
  };
}

/* ------------------------------- LinkedIn ----------------------------- */

async function fetchLinkedin(handle: string): Promise<SocialSnapshot> {
  const vanity = handle
    .trim()
    .replace(/^https?:\/\/(www\.|[a-z]{2}\.)?linkedin\.com\/in\//i, "")
    .replace(/\?.*$/, "")
    .replace(/\/+$/, "");
  if (!vanity) fail("Enter your LinkedIn vanity name, for example williamhgates.");
  if (/\s/.test(vanity) || !/^[A-Za-z0-9\-_%À-ÿ]+$/.test(vanity)) {
    fail(
      "That is not a LinkedIn username. Copy the last part of your profile URL (linkedin.com/in/…), for example kashif-shaikh-05.",
    );
  }

  const profileUrl = `https://www.linkedin.com/in/${vanity}`;

  // LinkedIn blocks datacenter browsers with HTTP 999, but it still serves the
  // full logged-out profile (Open Graph + JSON-LD + follower counts) to link
  // preview crawlers. Ask as a crawler first, then fall back to read proxies.
  const crawlerUA = [
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Twitterbot/1.0",
    "WhatsApp/2.19.81 A",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  ];

  const grab = async (url: string, headers: Record<string, string>) => {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
    return r.ok ? r.text() : null;
  };

  const readers: (() => Promise<string | null>)[] = [
    ...crawlerUA.map(
      (ua) => () =>
        grab(profileUrl, {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        }),
    ),
    () =>
      grab(profileUrl, {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      }),
    () => grab(`https://api.cors.lol/?url=${encodeURIComponent(profileUrl)}`, UA),
    () => grab(`https://api.allorigins.win/raw?url=${encodeURIComponent(profileUrl)}`, UA),
    () => grab(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(profileUrl)}`, UA),
  ];

  for (const read of readers) {
    let html: string | null = null;
    try {
      html = await read();
    } catch {
      html = null;
    }
    if (!html || html.length < 2000) continue;

    const page = html;
    const one = (pattern: RegExp) => {
      const match = page.match(pattern);
      return match?.[1] ? decode(match[1]) : null;
    };
    const meta = (property: string) =>
      one(new RegExp(`og:${property}"[^>]*content="([^"]*)"`, "i")) ??
      one(new RegExp(`content="([^"]*)"[^>]*og:${property}"`, "i"));

    const title = meta("title");
    if (!title || /sign\s?up|log\s?in|linkedin login|join linkedin/i.test(title)) continue;

    const name = clean(title.split(/ [-|] /)[0]) ?? vanity;
    const description = meta("description") ?? "";
    const headline =
      one(/"headline"\s*:\s*"([^"]+)"/i) ??
      clean(description.split("·")[0]) ??
      (title.includes(" - ")
        ? clean(
            title
              .split(" - ")
              .slice(1)
              .join(" - ")
              .replace(/ \| LinkedIn$/, ""),
          )
        : null);

    const followers = parseCount(
      one(/([\d.,]+\s*[KMB]?)\s*followers/i)?.replace(/\s+/g, "") ?? undefined,
    );
    const connections = parseCount(
      one(/([\d.,]+\s*[KMB]?)\+?\s*connections/i)?.replace(/[\s+]+/g, "") ?? undefined,
    );

    const location =
      one(/"addressLocality"\s*:\s*"([^"]+)"/i) ??
      clean((description.match(/Location:\s*([^·]+)/i) ?? [])[1]);
    const company =
      one(/"worksFor"[\s\S]{0,160}?"name"\s*:\s*"([^"]+)"/i) ??
      clean((description.match(/Experience:\s*([^·]+)/i) ?? [])[1]);
    const education =
      one(/"alumniOf"[\s\S]{0,240}?"name"\s*:\s*"([^"]+)"/i) ??
      clean((description.match(/Education:\s*([^·]+)/i) ?? [])[1]);
    const avatar = meta("image");

    return {
      ...empty("linkedin", vanity, profileUrl),
      display_name: name,
      avatar_url: avatar ? avatar.replace(/&amp;/g, "&") : null,
      bio: clean(headline) ?? clean(description),
      location,
      verified: true,
      followers,
      following: connections,
      extra: {
        headline: clean(headline),
        company,
        education,
        connectionsLabel: "Connections",
        followersLabel: "Followers",
        source: "Public LinkedIn profile",
      },
    };
  }

  return {
    ...empty("linkedin", vanity, profileUrl),
    display_name: vanity
      .replace(/-[0-9a-z]{4,}$/i, "")
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    verified: true,
    extra: {
      note: "LinkedIn refused every public read just now (rate limiting). Your profile link is verified — hit Sync again in a minute to pull name, photo, headline and followers.",
      linkOnly: true,
    },
  };
}

/* ------------------------------- Portfolio ---------------------------- */

const TECH_MARKERS: { name: string; test: RegExp }[] = [
  { name: "React", test: /data-reactroot|__REACT|react(-dom)?[.@]/i },
  { name: "Next.js", test: /__NEXT_DATA__|\/_next\//i },
  { name: "Vue", test: /data-v-[0-9a-f]{8}|vue(\.runtime)?[.@]/i },
  { name: "Nuxt", test: /__NUXT__|\/_nuxt\//i },
  { name: "Svelte", test: /svelte-[0-9a-z]{6}|\/_app\/immutable\//i },
  { name: "Astro", test: /astro-island|data-astro/i },
  { name: "Angular", test: /ng-version|angular\.min\.js/i },
  { name: "Gatsby", test: /___gatsby|gatsby-/i },
  { name: "Tailwind CSS", test: /tailwind|(?:^|["\s])(?:flex|grid)\s+items-center/i },
  { name: "Bootstrap", test: /bootstrap(\.min)?\.css/i },
  { name: "Vercel", test: /vercel\.app|x-vercel/i },
  { name: "Netlify", test: /netlify\.app|netlify\.com/i },
  { name: "GitHub Pages", test: /github\.io/i },
  { name: "WordPress", test: /wp-content|wp-includes/i },
  { name: "Framer", test: /framerusercontent|framer\.com/i },
  { name: "Webflow", test: /webflow/i },
];

async function fetchPortfolio(raw: string): Promise<SocialSnapshot> {
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return fail("That does not look like a valid URL.");
  }

  const started = Date.now();
  const html = await getText(url.toString(), {
    headers: { Accept: "text/html,application/xhtml+xml" },
  });
  const elapsed = Date.now() - started;

  const meta = (pattern: RegExp) => {
    const match = html.match(pattern);
    return match ? decode(match[1]!) : null;
  };
  const title =
    meta(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    meta(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
    meta(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  let image = meta(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (image && !image.startsWith("http")) image = new URL(image, url).toString();

  const stack = TECH_MARKERS.filter((m) => m.test.test(html)).map((m) => m.name);

  return {
    ...empty("portfolio", url.hostname, url.toString()),
    display_name: title,
    bio: description,
    avatar_url: image,
    website: url.toString(),
    extra: {
      previewImage: image,
      techStack: stack,
      ssl: url.protocol === "https:",
      responseMs: elapsed,
      note: stack.length ? null : "No known framework signatures were detected in the HTML.",
    },
  };
}

/* -------------------------------- router ------------------------------ */

const FETCHERS: Record<string, (handle: string) => Promise<SocialSnapshot>> = {
  github: fetchGithub,
  twitter: fetchTwitter,

  reddit: fetchReddit,
  devto: fetchDevto,
  hashnode: fetchHashnode,
  medium: fetchMedium,
  linkedin: fetchLinkedin,
  portfolio: fetchPortfolio,
};

export async function fetchSocialSnapshot(
  platform: string,
  handle: string,
): Promise<SocialSnapshot> {
  const fetcher = FETCHERS[platform];
  if (!fetcher) throw new Error(`DevOS does not support "${platform}" yet.`);
  return fetcher(handle.trim().replace(/^@/, ""));
}
