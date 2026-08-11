import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const lookupCsesUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    const userId = String(input?.userId ?? "").replace(/\D/g, "");
    if (!userId) throw new Error("Enter your numeric CSES user id, e.g. 391136.");
    if (userId.length > 12) throw new Error("That CSES id looks invalid.");
    return { userId };
  })
  .handler(async ({ data }) => {
    const { fetchCsesPublicProfile } = await import("./cses-public.server");
    return fetchCsesPublicProfile(data.userId);
  });
