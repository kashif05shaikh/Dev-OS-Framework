import type { SocialLink, SocialSnapshot } from "./social-platforms";

const UA = {
  "User-Agent": "Mozilla/5.0 (compatible; DevOS/1.0; +https://lovable.dev)",
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
  const payload = await getJson<Payload>(
    `https://api.fxtwitter.com/${encodeURIComponent(handle)}`,
  );
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

/* ------------------------------ Instagram ----------------------------- */

async function fetchInstagram(handle: string): Promise<SocialSnapshot> {
  const user = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
  if (!user || /[^A-Za-z0-9._]/.test(user)) {
    fail("Enter a valid Instagram username, for example natgeo.");
  }

  type Payload = {
    data?: {
      user?: {
        username: string;
        full_name: string;
        biography: string;
        profile_pic_url_hd?: string;
        profile_pic_url?: string;
        external_url: string | null;
        is_verified: boolean;
        is_private: boolean;
        edge_followed_by?: { count: number };
        edge_follow?: { count: number };
        edge_owner_to_timeline_media?: { count: number };
      };
    };
  };
  // Instagram frequently rate-limits datacenter IPs, so retry briefly before
  // falling back to the public profile page metadata.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(user)}`,
        {
          headers: {
            ...UA,
            "x-ig-app-id": "936619743392459",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
          },
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (response.status === 404) fail("That Instagram account does not exist.");
      if (response.ok) {
        const profile = ((await response.json()) as Payload).data?.user;
        if (profile) {
          return {
            ...empty("instagram", profile.username, `https://instagram.com/${profile.username}`),
            display_name: clean(profile.full_name),
            avatar_url: clean(profile.profile_pic_url_hd ?? profile.profile_pic_url),
            bio: clean(profile.biography),
            website: clean(profile.external_url),
            verified: profile.is_verified,
            followers: profile.edge_followed_by?.count ?? null,
            following: profile.edge_follow?.count ?? null,
            posts: profile.edge_owner_to_timeline_media?.count ?? null,
            extra: { private: profile.is_private, postsLabel: "Posts" },
          };
        }
      }
    } catch (error) {
      if (error instanceof PlatformError) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
  }

  try {
    return await fetchInstagramFromPage(user);
  } catch (error) {
    if (error instanceof PlatformError && /does not exist/.test(error.message)) throw error;
    // Instagram blocks automated reads from server IPs; keep the verified link.
    return {
      ...empty("instagram", user, `https://instagram.com/${user}`),
      extra: {
        postsLabel: "Posts",
        unavailable: true,
        note: "Instagram is currently blocking automated profile reads, so DevOS keeps the verified link only. Open the profile to view stats.",
      },
    };
  }
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

async function fetchInstagramFromPage(user: string): Promise<SocialSnapshot> {
  const html = await getText(`https://www.instagram.com/${encodeURIComponent(user)}/`, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });
  const meta = (property: string) => {
    const match = html.match(
      new RegExp(`<meta property="${property}" content="([^"]*)"`, "i"),
    );
    return match ? decode(match[1]!) : null;
  };
  const description = meta("og:description");
  if (!description) fail("Instagram did not return profile metadata.");
  const stats = description.match(
    /([\d.,]+[KMB]?)\s+Followers,\s+([\d.,]+[KMB]?)\s+Following,\s+([\d.,]+[KMB]?)\s+Posts/i,
  );
  const title = meta("og:title") ?? "";
  const name = title.split("(")[0]?.trim() || null;
  const bio = description.includes(" - ") ? description.split(" - ").slice(1).join(" - ") : null;

  return {
    ...empty("instagram", user, `https://instagram.com/${user}`),
    display_name: name,
    avatar_url: meta("og:image"),
    bio: bio && !bio.startsWith("See Instagram photos") ? bio : null,
    followers: parseCount(stats?.[1]),
    following: parseCount(stats?.[2]),
    posts: parseCount(stats?.[3]),
    extra: {
      postsLabel: "Posts",
      note: "Read from Instagram's public profile page — the private API was rate-limited.",
    },
  };
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
  // LinkedIn gates most profiles behind auth, but public ones still expose
  // Open Graph metadata through a read proxy.
  try {
    const response = await fetch(`https://r.jina.ai/${profileUrl}`, {
      headers: { "x-return-format": "html", ...UA },
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) {
      const html = await response.text();
      const meta = (property: string) => {
        const match = html.match(new RegExp(`og:${property}" content="([^"]*)"`, "i"));
        return match ? decode(match[1]!) : null;
      };
      const title = meta("title");
      if (title) {
        const name = title.split(/ [-|] /)[0]?.trim() || vanity;
        const headline = title.includes(" - ")
          ? title.split(" - ").slice(1).join(" - ").replace(/ \| LinkedIn$/, "").trim()
          : null;
        const followers = parseCount(
          (html.match(/([\d.,KMB]+)\s+followers/i) ?? [])[1]?.trim(),
        );
        const connections = parseCount(
          (html.match(/([\d.,KMB]+)\+?\s+connections/i) ?? [])[1]?.trim(),
        );
        return {
          ...empty("linkedin", vanity, profileUrl),
          display_name: name,
          avatar_url: meta("image"),
          bio: clean(meta("description")) ?? clean(headline),
          followers,
          following: connections,
          extra: { headline, postsLabel: "Posts" },
        };
      }
    }
  } catch {
    // fall through to the link-only snapshot
  }

  return {
    ...empty("linkedin", vanity, profileUrl),
    extra: {
      note: "LinkedIn does not expose profile data without an approved Marketing API partnership, so DevOS keeps the verified link only.",
      unavailable: true,
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
  instagram: fetchInstagram,
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
