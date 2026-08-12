import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchCodingStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: string; username: string }) => {
    const platform = String(input?.platform ?? "").trim();
    const username = String(input?.username ?? "").trim();
    if (!platform) throw new Error("Platform is required.");
    if (!username) throw new Error("Username is required.");
    if (username.length > 100) throw new Error("Username looks invalid.");
    return { platform, username };
  })
  .handler(async ({ data, context }) => {
    const { fetchPlatformStats } = await import("./coding-profiles.server");
    const stats = await fetchPlatformStats(data.platform, data.username);
    if (data.platform !== "cses") return stats;

    // CSES publishes no per-day submission history, so day-level heatmap entries
    // come from diffing the solved count against the previously stored one:
    // an increase is logged on today's date with the delta. Granularity is
    // therefore limited to the sync interval — that is expected, not a bug.
    const { data: row } = await context.supabase
      .from("coding_profiles")
      .select("problems_solved, activity")
      .eq("user_id", context.userId)
      .eq("platform", "cses")
      .maybeSingle();

    const stored = (row?.activity ?? null) as { days?: unknown } | null;
    const previousDays = Array.isArray(stored?.days)
      ? (stored.days as { date: string; submissions: number; solved: number }[])
      : [];
    const merged = new Map(previousDays.map((d) => [d.date, { ...d }]));
    for (const day of stats.activity) {
      const existing = merged.get(day.date);
      merged.set(day.date, {
        date: day.date,
        submissions: Math.max(existing?.submissions ?? 0, day.submissions),
        solved: Math.max(existing?.solved ?? 0, day.solved),
      });
    }

    const before = row?.problems_solved ?? 0;
    const now = stats.problems_solved;
    if (now !== null && now > before) {
      const today = new Date().toISOString().slice(0, 10);
      const existing = merged.get(today);
      const delta = now - before;
      merged.set(today, {
        date: today,
        submissions: Math.max(existing?.submissions ?? 0, delta),
        solved: Math.max(existing?.solved ?? 0, delta),
      });
    }

    stats.activity = Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));
    return stats;
  });
