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
    const { getConnectionSecret, markConnectionExpired } = await import(
      "./coding-connections.server"
    );
    // Connector platforms (CSES) sync through the signed-in user's own connection.
    const session =
      data.platform === "cses"
        ? ((await getConnectionSecret(context.userId, "cses")) ?? undefined)
        : undefined;
    const stats = await fetchPlatformStats(data.platform, data.username, session);
    if (data.platform === "cses" && session && stats.problems_solved === null) {
      await markConnectionExpired(context.userId, "cses");
    }
    return stats;
  });
