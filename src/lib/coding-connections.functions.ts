import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCodingConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listConnections } = await import("./coding-connections.server");
    return listConnections(context.userId);
  });

export const connectCses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { username: string; password: string }) => {
    const username = String(input?.username ?? "").trim();
    const password = String(input?.password ?? "");
    if (!username) throw new Error("Enter your CSES username.");
    if (!password) throw new Error("Enter your CSES password.");
    if (username.length > 100) throw new Error("That username looks invalid.");
    return { username, password };
  })
  .handler(async ({ data, context }) => {
    const { loginToCses } = await import("./cses-connection.server");
    const { saveConnection } = await import("./coding-connections.server");
    const session = await loginToCses(data.username, data.password);
    await saveConnection(context.userId, "cses", {
      secret: session.cookie,
      handle: session.handle,
      platformUserId: session.userId,
    });
    // The password is never persisted; only the session cookie is kept, encrypted.
    return { handle: session.handle, platformUserId: session.userId };
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