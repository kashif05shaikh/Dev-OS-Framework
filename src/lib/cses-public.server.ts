/**
 * Password-free CSES lookup.
 * cses.fi/user/{id} is fully public — it exposes the account name, submission
 * count, first/last submission timestamps and language breakdown without any
 * login. That is everything we can honestly read for a user, so DevOS uses it
 * instead of asking for CSES credentials.
 */
const UA = {
  "User-Agent": "Mozilla/5.0 (compatible; DevOS/1.0)",
  Accept: "text/html,application/xhtml+xml",
};

export type CsesPublicProfile = {
  userId: string;
  handle: string;
  submissions: number | null;
  firstSubmission: string | null;
  lastSubmission: string | null;
  languages: { name: string; submissions: number }[];
  profileUrl: string;
};

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export async function fetchCsesPublicProfile(rawId: string): Promise<CsesPublicProfile> {
  const id = rawId.replace(/\D/g, "");
  if (!id) throw new Error("Enter your numeric CSES user id, e.g. 391136.");
  const response = await fetch(`https://cses.fi/user/${id}`, {
    headers: UA,
    signal: AbortSignal.timeout(12_000),
  }).catch(() => {
    throw new Error("CSES did not respond in time. Try again in a moment.");
  });
  if (!response.ok) throw new Error(`CSES returned ${response.status}.`);
  const html = await response.text();
  if (/CSES - 404/.test(html)) throw new Error(`No CSES user with id ${id}.`);

  const handle = /<title>CSES - User ([^<]+)<\/title>/.exec(html)?.[1]?.trim() ?? id;
  const submissions = /Submission count:<\/td><td[^>]*>\s*(\d+)/.exec(html)?.[1];
  const first = /First submission:<\/td><td[^>]*>\s*([\d: -]+)/.exec(html)?.[1]?.trim() ?? null;
  const last = /Last submission:<\/td><td[^>]*>\s*([\d: -]+)/.exec(html)?.[1]?.trim() ?? null;

  const languages: { name: string; submissions: number }[] = [];
  const table = /<h2>Languages<\/h2>([\s\S]*?)<\/table>/.exec(html)?.[1] ?? "";
  for (const row of table.matchAll(/<tr>(?!\s*<th)([\s\S]*?)<\/tr>/g)) {
    const cells = Array.from(row[1]!.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map((c) =>
      text(c[1]!),
    );
    if (cells.length >= 2 && cells[0]) {
      languages.push({ name: cells[0], submissions: Number.parseInt(cells[1] ?? "0", 10) || 0 });
    }
  }

  return {
    userId: id,
    handle,
    submissions: submissions ? Number.parseInt(submissions, 10) : null,
    firstSubmission: first,
    lastSubmission: last,
    languages,
    profileUrl: `https://cses.fi/user/${id}`,
  };
}
