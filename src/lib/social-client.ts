import type { SocialSnapshot } from "./social-platforms";

/**
 * Reddit blocks unauthenticated reads coming from datacenter IPs, so the
 * server-side fetch can fail with 403 while the same public endpoint works
 * fine from the user's own browser. This is the browser-side fallback.
 */
export async function fetchRedditFromBrowser(handle: string): Promise<SocialSnapshot> {
  const user = handle.trim().replace(/^u\//, "").replace(/^@/, "");
  const about = await fetch(`https://www.reddit.com/user/${encodeURIComponent(user)}/about.json`, {
    headers: { Accept: "application/json" },
  });
  if (about.status === 404) throw new Error("That Reddit account does not exist.");
  if (!about.ok) throw new Error(`Reddit returned ${about.status}. Try again in a minute.`);
  const data = (await about.json())?.data;
  if (!data) throw new Error("Reddit returned no profile data.");

  let recentPosts: { title: string; url: string; date: string | null }[] = [];
  try {
    const submitted = await fetch(
      `https://www.reddit.com/user/${encodeURIComponent(user)}/submitted.json?limit=5`,
    );
    const listing = await submitted.json();
    recentPosts = (listing?.data?.children ?? []).map(
      (child: { data: { title: string; permalink: string; created_utc: number } }) => ({
        title: child.data.title,
        url: `https://reddit.com${child.data.permalink}`,
        date: new Date(child.data.created_utc * 1000).toISOString(),
      }),
    );
  } catch {
    recentPosts = [];
  }

  const postKarma = data.link_karma ?? 0;
  const commentKarma = data.comment_karma ?? 0;
  const created = data.created_utc ? new Date(data.created_utc * 1000).toISOString() : null;

  return {
    platform: "reddit",
    handle: data.name,
    profile_url: `https://reddit.com/user/${data.name}`,
    display_name: data.subreddit?.title || data.name,
    avatar_url: (data.snoovatar_img || data.icon_img || "").split("?")[0] || null,
    bio: data.subreddit?.public_description || null,
    location: null,
    website: null,
    verified: data.verified ?? null,
    followers: null,
    following: null,
    posts: recentPosts.length || null,
    joined_at: created,
    extra: {
      karma: data.total_karma ?? postKarma + commentKarma,
      postKarma,
      commentKarma,
      recentPosts,
      cakeDay: created,
      postsLabel: "Recent posts",
    },
  };
}
