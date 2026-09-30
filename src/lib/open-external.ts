/** True when DevOS is rendered inside an embedding frame. */
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
  const p = port ? `:${port}` : "";
  return `${protocol}//${hostname}${p}${path ?? pathname}`;
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
