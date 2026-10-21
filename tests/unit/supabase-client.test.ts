import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
  vi.resetModules();
});

it("bounds requests while preserving the user's bearer token and cancellation", async () => {
  const deadline = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
  const caller = new AbortController();
  const fetchMock = vi.fn(async () => new Response("[]"));
  vi.stubGlobal("fetch", fetchMock);
  const { createSupabaseFetch } = await import("@/integrations/supabase/client");
  await createSupabaseFetch("sb_publishable_test")("https://workspace.supabase.co/rest/v1/notes", {
    headers: { Authorization: "Bearer user-jwt" },
    signal: caller.signal,
  });
  const options = (fetchMock.mock.calls[0] as unknown as [unknown, RequestInit])[1];
  expect(new Headers(options.headers).get("Authorization")).toBe("Bearer user-jwt");
  expect(new Headers(options.headers).get("apikey")).toBe("sb_publishable_test");
  expect(AbortSignal.timeout).toHaveBeenCalledWith(30_000);
  caller.abort();
  expect(options.signal?.aborted).toBe(true);
}, 15_000);

it("aborts a stalled fetch at the deadline and classifies it as a timeout", async () => {
  const deadline = new AbortController();
  vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_input, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
        }),
    ),
  );
  const { createSupabaseFetch } = await import("@/integrations/supabase/client");
  const pending = createSupabaseFetch("sb_publishable_test")(
    "https://workspace.supabase.co/rest/v1/notes",
  );
  const assertion = expect(pending).rejects.toThrow("timed out");
  deadline.abort(new DOMException("The request timed out", "TimeoutError"));
  await assertion;
  const { describeError } = await import("@/lib/devos-queries");
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(describeError("TimeoutError: https://workspace.supabase.co timed out")).toBe(
    "The request timed out. Please try again.",
  );
  expect(describeError("Failed to fetch https://workspace.supabase.co")).toBe(
    "Cannot reach the database. Check your connection and try again.",
  );
});

it("loads workspace rows while an auth user request is stalled", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://workspace.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  const user = { id: "test-user", aud: "authenticated", role: "authenticated" };
  localStorage.setItem(
    "sb-workspace-auth-token",
    JSON.stringify({
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }),
  );
  let releaseUser!: () => void;
  const stalledUser = new Promise<void>((resolve) => {
    releaseUser = resolve;
  });
  let userRequested!: () => void;
  const userStarted = new Promise<void>((resolve) => {
    userRequested = resolve;
  });
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).includes("/auth/v1/user")) {
      userRequested();
      await stalledUser;
      return new Response(JSON.stringify(user));
    }
    return new Response(JSON.stringify([{ id: "saved-note" }]));
  });
  vi.stubGlobal("fetch", fetchMock);
  const { supabase } = await import("@/integrations/supabase/client");
  await supabase.auth.getSession();
  const userRequest = supabase.auth.getUser();
  await userStarted;
  try {
    const rows = supabase.from("notes").select("id");
    const result = await Promise.race([
      Promise.resolve(rows),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 200)),
    ]);
    expect(result?.data).toEqual([{ id: "saved-note" }]);
  } finally {
    releaseUser();
    await userRequest;
    await supabase.auth.dispose();
  }
});
