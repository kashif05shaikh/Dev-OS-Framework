/** True when DevOS is rendered inside an embedding frame (e.g. Lovable preview). */
export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
}

/** Best guess at the standalone (published) URL of this DevOS instance. */
export function standaloneAppUrl(path?: string): string {
  if (typeof window === "undefined") return "/";
  const { protocol, hostname, port, pathname } = window.location;
  // id-preview--<uuid>.lovable.app -> project--<uuid>.lovable.app (stable public host)
  const host = hostname.startsWith("id-preview--")
    ? hostname.replace("id-preview--", "project--")
    : hostname;
  const p = port && host === hostname ? `:${port}` : "";
  return `${protocol}//${host}${p}${path ?? pathname}`;
}

/** Copies text, resolving to whether it worked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}
