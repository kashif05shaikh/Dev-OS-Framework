/** Opens an external service as its own top-level browser tab. */
export function openExternal(url: string): boolean {
  if (typeof window === "undefined") return false;

  // This must run synchronously inside the click event. A new browsing context
  // created here is not the DevOS preview frame, so sites that forbid framing
  // (ChatGPT, Claude, Gemini, Copilot, Bolt) can render normally.
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return opened !== null;
}