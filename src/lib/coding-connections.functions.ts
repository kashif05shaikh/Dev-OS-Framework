import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCodingConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listConnections } = await import("./coding-connections.server");
    return listConnections(context.userId);
  });

export const disconnectPlatform = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: string }) => {
    const platform = String(input?.platform ?? "").trim();
    if (!platform) throw new Error("Platform is required.");
    return { platform };
  })
  .handler(async ({ data, context }) => {
    const { removeConnection } = await import("./coding-connections.server");
    await removeConnection(context.userId, data.platform);
    return { ok: true };
  });