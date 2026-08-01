/** AI platforms available in the DevOS AI Workspace launcher. */
export type AiPlatform = {
  id: string;
  label: string;
  vendor: string;
  description: string;
  url: string;
  /** simple-icons slug, when the brand has one. */
  icon?: string;
  color: string;
};

export const AI_PLATFORMS: AiPlatform[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    vendor: "OpenAI",
    description: "Your everyday AI assistant for writing, coding and research.",
    url: "https://chatgpt.com",
    icon: "openai",
    color: "#10a37f",
  },
  {
    id: "claude",
    label: "Claude",
    vendor: "Anthropic",
    description: "Long-context reasoning and careful code review.",
    url: "https://claude.ai",
    icon: "anthropic",
    color: "#d97757",
  },
  {
    id: "gemini",
    label: "Gemini",
    vendor: "Google",
    description: "Multimodal assistant wired into Google's ecosystem.",
    url: "https://gemini.google.com",
    icon: "googlegemini",
    color: "#8ab4f8",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    vendor: "Perplexity AI",
    description: "Answer engine with live sources and citations.",
    url: "https://www.perplexity.ai",
    icon: "perplexity",
    color: "#20b8cd",
  },
  {
    id: "grok",
    label: "Grok",
    vendor: "xAI",
    description: "Realtime assistant with an X-native feed of context.",
    url: "https://grok.com",
    icon: "x",
    color: "#e5e7eb",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    vendor: "DeepSeek",
    description: "Strong open reasoning and coding models, free to chat.",
    url: "https://chat.deepseek.com",
    icon: "deepseek",
    color: "#4d6bfe",
  },
  {
    id: "copilot",
    label: "Microsoft Copilot",
    vendor: "Microsoft",
    description: "Everyday copilot across Windows, Edge and Office.",
    url: "https://copilot.microsoft.com",
    icon: "githubcopilot",
    color: "#a78bfa",
  },
  {
    id: "lovable",
    label: "Lovable",
    vendor: "Lovable",
    description: "Build and ship full-stack apps by chatting.",
    url: "https://lovable.dev",
    color: "#ff7759",
  },
  {
    id: "replit",
    label: "Replit AI",
    vendor: "Replit",
    description: "Cloud IDE with an agent that writes and runs code.",
    url: "https://replit.com",
    icon: "replit",
    color: "#f26207",
  },
  {
    id: "bolt",
    label: "Bolt.new",
    vendor: "StackBlitz",
    description: "Prompt-to-app builder running fully in the browser.",
    url: "https://bolt.new",
    color: "#3b82f6",
  },
  {
    id: "emergent",
    label: "Emergent",
    vendor: "Emergent",
    description: "Agentic workspace that ships apps end to end.",
    url: "https://app.emergent.sh",
    color: "#22d3ee",
  },
];

/** Primary logo URL (simple-icons when available). */
export function aiPlatformLogo(p: AiPlatform): string {
  return p.icon
    ? `https://cdn.simpleicons.org/${p.icon}/${p.color.replace("#", "")}`
    : aiPlatformFavicon(p);
}

/** Favicon fallback, used when the brand has no simple-icons entry. */
export function aiPlatformFavicon(p: AiPlatform): string {
  const host = new URL(p.url).hostname;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

/** Finds a platform by id or label (case-insensitive). */
export function findAiPlatform(value?: string | null): AiPlatform | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  return AI_PLATFORMS.find((m) => m.id === v || m.label.toLowerCase() === v);
}
