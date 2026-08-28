// Static reference directory of well-known AI tools. This is catalog/reference
// data (like a bookmarks list), not user data — per-user state (favorites) is
// stored in ai_tool_favorites and merged in at request time.
export interface AiToolCatalogEntry {
  id: string;
  name: string;
  category: "model" | "coding_assistant";
  url: string;
}

export const AI_TOOLS_CATALOG: AiToolCatalogEntry[] = [
  { id: "chatgpt", name: "ChatGPT", category: "model", url: "https://chat.openai.com" },
  { id: "claude", name: "Claude", category: "model", url: "https://claude.ai" },
  { id: "gemini", name: "Gemini", category: "model", url: "https://gemini.google.com" },
  { id: "perplexity", name: "Perplexity", category: "model", url: "https://www.perplexity.ai" },
  { id: "mistral", name: "Le Chat (Mistral)", category: "model", url: "https://chat.mistral.ai" },
  { id: "grok", name: "Grok", category: "model", url: "https://grok.com" },
  { id: "github-copilot", name: "GitHub Copilot", category: "coding_assistant", url: "https://github.com/features/copilot" },
  { id: "cursor", name: "Cursor", category: "coding_assistant", url: "https://cursor.com" },
  { id: "replit-agent", name: "Replit Agent", category: "coding_assistant", url: "https://replit.com" },
  { id: "windsurf", name: "Windsurf", category: "coding_assistant", url: "https://windsurf.com" },
  { id: "v0", name: "v0", category: "coding_assistant", url: "https://v0.dev" },
  { id: "bolt", name: "Bolt.new", category: "coding_assistant", url: "https://bolt.new" },
];
