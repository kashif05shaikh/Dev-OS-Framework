export interface SocialSyncResult {
  ok: boolean;
  followers?: number | null;
  postCount?: number | null;
  dataJson: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Only dev.to has a public, keyless API suitable for read-only profile sync.
 * Other platforms (LinkedIn, X/Twitter, YouTube, Hashnode, Medium) require
 * OAuth or paid API access, so we store the link only for those.
 */
export async function syncSocialPlatform(
  platform: string,
  handle: string | null,
): Promise<SocialSyncResult> {
  if (platform === "dev_to" && handle) {
    try {
      const res = await fetch(`https://dev.to/api/users/by_username?url=${encodeURIComponent(handle)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Dev.to API error ${res.status}`);
      const user: any = await res.json();
      const articlesRes = await fetch(
        `https://dev.to/api/articles?username=${encodeURIComponent(handle)}&per_page=1000`,
        { signal: AbortSignal.timeout(8000) },
      );
      const articles = articlesRes.ok ? await articlesRes.json() : [];
      return {
        ok: true,
        followers: null,
        postCount: Array.isArray(articles) ? articles.length : null,
        dataJson: { name: user.name, summary: user.summary, profileImage: user.profile_image },
      };
    } catch (err) {
      return { ok: false, dataJson: {}, errorMessage: err instanceof Error ? err.message : "Sync failed" };
    }
  }

  return {
    ok: false,
    dataJson: {},
    errorMessage: "This platform has no public read-only API. Link saved without live stats.",
  };
}
