import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertUserRateLimit } from "@/lib/rate-limit.server";

export const startVerificationChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: string; handle: string }) => {
    const platform = String(input?.platform ?? "").trim().toLowerCase();
    const handle = String(input?.handle ?? "").trim();
    if (!platform) throw new Error("Platform is required.");
    if (!handle) throw new Error("Handle is required.");
    if (handle.length > 100) throw new Error("Handle is too long.");
    return { platform, handle };
  })
  .handler(async ({ data, context }) => {
    assertUserRateLimit(context.userId, { maxRequests: 20, windowMs: 60_000 });
    const { startVerification } = await import("./verification/server");
    return startVerification(context.userId, data.platform, data.handle, context.supabase);
  });

export const checkVerificationChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: string; handle: string }) => {
    const platform = String(input?.platform ?? "").trim().toLowerCase();
    const handle = String(input?.handle ?? "").trim();
    if (!platform) throw new Error("Platform is required.");
    if (!handle) throw new Error("Handle is required.");
    return { platform, handle };
  })
  .handler(async ({ data, context }) => {
    assertUserRateLimit(context.userId, { maxRequests: 20, windowMs: 60_000 });
    const { checkVerification } = await import("./verification/server");
    return checkVerification(context.userId, data.platform, data.handle, context.supabase);
  });

export const cancelVerificationChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { platform: string }) => {
    const platform = String(input?.platform ?? "").trim().toLowerCase();
    if (!platform) throw new Error("Platform is required.");
    return { platform };
  })
  .handler(async ({ data, context }) => {
    assertUserRateLimit(context.userId, { maxRequests: 20, windowMs: 60_000 });
    const { cancelVerification } = await import("./verification/server");
    return cancelVerification(context.userId, data.platform, context.supabase);
  });

