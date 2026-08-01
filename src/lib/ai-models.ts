/** Chat models a saved prompt can be sent to, with their brand logo + chat URL. */
export type AiModelTarget = {
  id: string;
  label: string;
  /** simple-icons slug used for the brand logo. */
  icon: string;
  color: string;
  /** Builds the chat URL, prefilling the prompt when the product supports it. */
  url: (prompt: string) => string;
  /** True when the prompt is prefilled in the URL (otherwise the user pastes it). */
  prefills: boolean;
};

const enc = (p: string) => encodeURIComponent(p.slice(0, 1800));

export const AI_MODEL_TARGETS: AiModelTarget[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: "openai",
    color: "#10a37f",
    url: (p) => `https://chatgpt.com/?q=${enc(p)}`,
    prefills: true,
  },
  {
    id: "claude",
    label: "Claude",
    icon: "anthropic",
    color: "#d97757",
    url: (p) => `https://claude.ai/new?q=${enc(p)}`,
    prefills: true,
  },
  {
    id: "gemini",
    label: "Gemini",
    icon: "googlegemini",
    color: "#8ab4f8",
    url: () => "https://gemini.google.com/app",
    prefills: false,
  },
  {
    id: "perplexity",
    label: "Perplexity",
    icon: "perplexity",
    color: "#20b8cd",
    url: (p) => `https://www.perplexity.ai/search?q=${enc(p)}`,
    prefills: true,
  },
  {
    id: "grok",
    label: "Grok",
    icon: "x",
    color: "#e5e7eb",
    url: (p) => `https://grok.com/?q=${enc(p)}`,
    prefills: true,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    icon: "deepseek",
    color: "#4d6bfe",
    url: () => "https://chat.deepseek.com/",
    prefills: false,
  },
  {
    id: "copilot",
    label: "Copilot",
    icon: "githubcopilot",
    color: "#a78bfa",
    url: (p) => `https://copilot.microsoft.com/?q=${enc(p)}`,
    prefills: true,
  },
  {
    id: "mistral",
    label: "Le Chat",
    icon: "mistralai",
    color: "#fa520f",
    url: () => "https://chat.mistral.ai/chat",
    prefills: false,
  },
];