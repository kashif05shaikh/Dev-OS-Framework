import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchSocialProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: string; handle: string }) => {
    const platform = String(input?.platform ?? "").trim();
    const handle = String(input?.handle ?? "").trim();
    if (!platform) throw new Error("Platform is required.");
    if (!handle) throw new Error("Username is required.");
    if (handle.length > 300) throw new Error("That username or URL looks invalid.");
    return { platform, handle };
  })
  .handler(async ({ data }) => {
    const { fetchSocialSnapshot } = await import("./social.server");
    return fetchSocialSnapshot(data.platform, data.handle);
  });
