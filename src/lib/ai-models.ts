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
  /** Short label shown next to the model name in the navbar. */
  linkText: string;
};

export const AI_MODEL_TARGETS: AiModelTarget[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    icon: "openai",
    color: "#10a37f",
    url: () => "https://chatgpt.com/",
    prefills: false,
    linkText: "ChatGPT",
  },
  {
    id: "claude",
    label: "Claude",
    icon: "anthropic",
    color: "#d97757",
    url: () => "https://claude.ai/new",
    prefills: false,
    linkText: "New chat - Claude",
  },
  {
    id: "gemini",
    label: "Gemini",
    icon: "googlegemini",
    color: "#8ab4f8",
    url: () => "https://gemini.google.com/app",
    prefills: false,
    linkText: "Gemini",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    icon: "perplexity",
    color: "#20b8cd",
    url: () => "https://www.perplexity.ai/",
    prefills: false,
    linkText: "Perplexity",
  },
  {
    id: "grok",
    label: "Grok",
    icon: "x",
    color: "#e5e7eb",
    url: () => "https://grok.com/",
    prefills: false,
    linkText: "Grok",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    icon: "deepseek",
    color: "#4d6bfe",
    url: () => "https://chat.deepseek.com/",
    prefills: false,
    linkText: "DeepSeek",
  },
  {
    id: "copilot",
    label: "Copilot",
    icon: "githubcopilot",
    color: "#a78bfa",
    url: () => "https://copilot.microsoft.com/",
    prefills: false,
    linkText: "Copilot",
  },
  {
    id: "mistral",
    label: "Le Chat",
    icon: "mistralai",
    color: "#fa520f",
    url: () => "https://chat.mistral.ai/chat",
    prefills: false,
    linkText: "Le Chat",
  },
];
