import { logger } from "./logger";

export interface UrlMetadataResult {
  url: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  siteName: string | null;
}

function extractMeta(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      return match[1]
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
    }
  }
  return null;
}

/**
 * Fetches a URL's HTML and extracts OpenGraph/basic metadata via regex.
 * Kept dependency-free (no cheerio) since we only need a handful of tags.
 */
export async function fetchUrlMetadata(url: string): Promise<UrlMetadataResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DevOSBot/1.0; +https://replit.com)",
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await response.text();

    const title = extractMeta(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i,
      /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i,
      /<title[^>]*>([^<]*)<\/title>/i,
    ]);
    const description = extractMeta(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
      /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
    ]);
    const thumbnailUrl = extractMeta(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i,
      /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i,
    ]);
    const siteName = extractMeta(html, [
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i,
    ]);

    return { url, title, description, thumbnailUrl, siteName };
  } catch (err) {
    logger.warn({ err, url }, "Failed to fetch URL metadata");
    return { url, title: null, description: null, thumbnailUrl: null, siteName: null };
  }
}
