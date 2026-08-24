/** Shared, browser-safe metadata for the Network module. */

export type SocialAuthMode = "oauth" | "username" | "url" | "api-key";

export type SocialPlatformMeta = {
  id: string;
  label: string;
  /** simple-icons slug used for the logo. */
  icon: string;
  color: string;
  /** Override when simple-icons has no logo for the brand. */
  logoUrl?: string;
  /** How an account is linked in DevOS today. */
  authMode: SocialAuthMode;
  inputLabel: string;
  placeholder: string;
  profileUrl: (handle: string) => string;
  /** Honest note about what the public API can and cannot return. */
  limitation?: string;
};

export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  {
    id: "github",
    label: "GitHub",
    icon: "github",
    color: "#e6edf3",
    authMode: "username",
    inputLabel: "GitHub username",
    placeholder: "octocat",
    profileUrl: (h) => `https://github.com/${h}`,
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    icon: "x",
    color: "#e5e7eb",
    authMode: "username",
    inputLabel: "X handle",
    placeholder: "jack",
    profileUrl: (h) => `https://x.com/${h}`,
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "instagram",
    color: "#e1306c",
    authMode: "username",
    inputLabel: "Instagram username",
    placeholder: "instagram",
    profileUrl: (h) => `https://instagram.com/${h}`,
    limitation:
      "Public profile read only. Private accounts and rate-limited requests return no metrics.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "linkedin",
    color: "#0a66c2",
    logoUrl: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=64",
    authMode: "username",
    inputLabel: "LinkedIn profile URL or username",
    placeholder: "linkedin.com/in/williamhgates",
    profileUrl: (h) => `https://www.linkedin.com/in/${h}`,
    limitation:
      "DevOS verifies your profile and pulls your public name, photo and headline. LinkedIn publishes no follower counts to any app.",
  },
];

export function socialPlatform(id: string): SocialPlatformMeta | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.id === id);
}

export function socialLogo(p: SocialPlatformMeta): string {
  if (p.logoUrl) return p.logoUrl;
  return `https://cdn.simpleicons.org/${p.icon}/${p.color.replace("#", "")}`;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Normalised profile snapshot returned by the sync server function. */
export type SocialSnapshot = {
  platform: string;
  handle: string;
  profile_url: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  verified: boolean | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  joined_at: string | null;
  extra: Record<string, JsonValue>;
};

export type SocialLink = { title: string; url: string; date?: string | null };
