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
  logo?: string;
};

/** Local official brand logos for AI models. */
const LOCAL_LOGOS: Record<string, string> = {
  chatgpt: "/icons/chatgpt.svg",
  claude: "/icons/claude.svg",
  gemini: "/icons/gemini.svg",
  perplexity: "/icons/perplexity.svg",
  grok: "/icons/grok.svg",
  deepseek: "/icons/deepseek.svg",
  copilot: "/icons/copilot.svg",
  replit: "/icons/replit.svg",
  bolt: "/icons/bolt.svg",
  emergent: "/icons/emergent.png",
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
    logo: "/icons/chatgpt.svg",
  },
  {
    id: "claude",
    label: "Claude",
    vendor: "Anthropic",
    description: "Long-context reasoning and careful code review.",
    url: "https://claude.ai",
    icon: "claude",
    color: "#d97757",
    logo: "/icons/claude.svg",
  },
  {
    id: "gemini",
    label: "Gemini",
    vendor: "Google",
    description: "Multimodal assistant wired into Google's ecosystem.",
    url: "https://gemini.google.com",
    icon: "googlegemini",
    color: "#8ab4f8",
    logo: "/icons/gemini.svg",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    vendor: "Perplexity AI",
    description: "Answer engine with live sources and citations.",
    url: "https://www.perplexity.ai",
    icon: "perplexity",
    color: "#20b8cd",
    logo: "/icons/perplexity.svg",
  },
  {
    id: "grok",
    label: "Grok",
    vendor: "xAI",
    description: "Realtime assistant with an X-native feed of context.",
    url: "https://grok.com",
    icon: "x",
    color: "#ffffff",
    logo: "/icons/grok.svg",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    vendor: "DeepSeek",
    description: "Strong open reasoning and coding models, free to chat.",
    url: "https://chat.deepseek.com",
    icon: "deepseek",
    color: "#4d6bfe",
    logo: "/icons/deepseek.svg",
  },
  {
    id: "copilot",
    label: "Microsoft Copilot",
    vendor: "Microsoft",
    description: "Everyday copilot across Windows, Edge and Office.",
    url: "https://copilot.microsoft.com",
    color: "#0078d4",
    logo: "/icons/copilot.svg",
  },
  {
    id: "replit",
    label: "Replit AI",
    vendor: "Replit",
    description: "Cloud IDE with an agent that writes and runs code.",
    url: "https://replit.com",
    icon: "replit",
    color: "#f26207",
    logo: "/icons/replit.svg",
  },
  {
    id: "bolt",
    label: "Bolt.new",
    vendor: "StackBlitz",
    description: "Prompt-to-app builder running fully in the browser.",
    url: "https://bolt.new",
    color: "#3b82f6",
    logo: "/icons/bolt.svg",
  },
  {
    id: "emergent",
    label: "Emergent",
    vendor: "Emergent",
    description: "Agentic workspace that ships apps end to end.",
    url: "https://app.emergent.sh",
    color: "#22d3ee",
    logo: "/icons/emergent.png",
  },
];

/** Primary logo URL (local official asset first, simple-icons fallback). */
export function aiPlatformLogo(p: AiPlatform): string {
  if (p.logo) return p.logo;
  const local = LOCAL_LOGOS[p.id];
  if (local) return local;
  return p.icon
    ? `https://cdn.simpleicons.org/${p.icon}/${p.color.replace("#", "")}`
    : aiPlatformFavicon(p);
}

/** Favicon fallback, used when the brand has no dedicated asset. */
export function aiPlatformFavicon(p: AiPlatform): string {
  const host = p.id === "emergent" ? "emergent.sh" : new URL(p.url).hostname;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
}

/** Finds a platform by id or label (case-insensitive). */
export function findAiPlatform(value?: string | null): AiPlatform | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  return AI_PLATFORMS.find((m) => m.id === v || m.label.toLowerCase() === v);
}
