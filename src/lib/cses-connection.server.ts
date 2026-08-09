/**
 * CSES has no OAuth or public API, and its statistics pages require a login.
 * The safest supported approach is therefore a per-user session connection:
 * the user's credentials are posted straight to cses.fi once, only the
 * resulting PHPSESSID cookie is kept (encrypted, server-side), and the
 * password is never stored or returned anywhere.
 */
const UA = {
  "User-Agent": "Mozilla/5.0 (compatible; DevOS/1.0)",
  Accept: "text/html,application/xhtml+xml",
};

const ORIGIN = "https://cses.fi";

export type CsesSession = { cookie: string; userId: string; handle: string };

function readSetCookie(response: Response): string | null {
  const raw = response.headers.get("set-cookie");
  const match = raw ? /PHPSESSID=([^;]+)/.exec(raw) : null;
  return match?.[1] ?? null;
}

/** Confirms the cookie still maps to a logged-in CSES account. */
export async function verifyCsesSession(
  cookie: string,
): Promise<{ userId: string; handle: string } | null> {
  const response = await fetch(`${ORIGIN}/problemset/`, {
    headers: { ...UA, Cookie: `PHPSESSID=${cookie}` },
    redirect: "follow",
  });
  if (!response.ok) return null;
  const html = await response.text();
  // Logged-out pages show "Login"; logged-in pages link to the account and a logout action.
  if (!/\/logout/.test(html)) return null;
  const link = /<a[^>]+href="\/user\/(\d+)"[^>]*>([^<]*)<\/a>/.exec(html);
  const id = link?.[1] ?? /\/user\/(\d+)/.exec(html)?.[1];
  if (!id) return null;
  return { userId: id, handle: (link?.[2] ?? "").trim() || id };
}

/** Logs into CSES and returns a verified session. Throws a user-readable error. */
export async function loginToCses(username: string, password: string): Promise<CsesSession> {
  const page = await fetch(`${ORIGIN}/login`, { headers: UA });
  if (!page.ok) throw new Error(`CSES returned ${page.status} on the login page.`);
  const cookie = readSetCookie(page);
  const html = await page.text();
  const token = /name="csrf_token"\s+value="([^"]+)"/.exec(html)?.[1];
  if (!cookie || !token) throw new Error("Could not start a CSES login session.");

  const body = new URLSearchParams({ csrf_token: token, nick: username, pass: password });
  const login = await fetch(`${ORIGIN}/login`, {
    method: "POST",
    headers: {
      ...UA,
      Cookie: `PHPSESSID=${cookie}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${ORIGIN}/login`,
      Origin: ORIGIN,
    },
    body,
    redirect: "manual",
  });
  const sessionCookie = readSetCookie(login) ?? cookie;

  const verified = await verifyCsesSession(sessionCookie);
  if (!verified) throw new Error("CSES rejected those credentials.");
  return { cookie: sessionCookie, ...verified };
}