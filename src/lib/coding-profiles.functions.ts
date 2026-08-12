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
  .handler(async ({ data }) => {
    const { fetchPlatformStats } = await import("./coding-profiles.server");
    return fetchPlatformStats(data.platform, data.username);
  });
