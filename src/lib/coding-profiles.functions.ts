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
    const { getConnection, markConnectionExpired } = await import("./coding-connections.server");
    // Connector platforms (CSES) sync through the signed-in user's own connection.
    const connection =
      data.platform === "cses" ? await getConnection(context.userId, "cses") : null;
    // Fall back to the connected account's numeric id when the stored handle isn't one.
    const handle =
      data.platform === "cses" && !/\d/.test(data.username) && connection?.platformUserId
        ? connection.platformUserId
        : data.username;
    const stats = await fetchPlatformStats(data.platform, handle, connection?.secret);
    if (connection && stats.problems_solved === null) {
      await markConnectionExpired(context.userId, "cses");
    }
    return stats;
  });
