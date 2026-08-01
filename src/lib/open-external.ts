/**
 * Opens a URL in a real new browser tab.
 *
 * window.open(url, "_blank", features) creates a popup window, and when the app
 * runs inside an iframe (the Lovable preview) some sites — chatgpt.com,
 * claude.ai — refuse that context with ERR_BLOCKED_BY_RESPONSE. Clicking a
 * detached anchor with target="_blank" opens a normal top-level tab instead.
 */
export function openExternal(url: string) {
  if (typeof document === "undefined") return;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}