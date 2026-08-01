import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { describeError } from "@/lib/devos-queries";

export type SocialAccount = Tables<"social_accounts">;
export type SocialProfileCache = Tables<"social_profile_cache">;

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(describeError(result.error));
  return (result.data ?? []) as T;
}

export const socialAccountsQuery = () =>
  queryOptions({
    queryKey: ["social_accounts"],
    queryFn: async (): Promise<SocialAccount[]> =>
      unwrap(
        await supabase
          .from("social_accounts")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const socialProfileCacheQuery = () =>
  queryOptions({
    queryKey: ["social_profile_cache"],
    queryFn: async (): Promise<SocialProfileCache[]> =>
      unwrap(await supabase.from("social_profile_cache").select("*")),
  });
