import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchPlatformStats } from "@/lib/coding-profiles.server";
import { isProfileVerified } from "@/lib/coding-activity";
import {
  getPlatformVerificationMeta,
  verifyPlatformOwnership,
} from "./platforms";
import type { VerificationChallengeData, VerificationResult } from "./types";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type CodingProfileInsert = Database["public"]["Tables"]["coding_profiles"]["Insert"];
type CodingProfileUpdate = Database["public"]["Tables"]["coding_profiles"]["Update"];

const MAX_ATTEMPTS = 5;
const EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

interface InMemChallenge {
  id: string;
  user_id: string;
  platform: string;
  handle: string;
  challenge_code: string;
  attempts: number;
  expires_at: string;
}

// In-memory fallback if the verification_challenges table has not been migrated in the DB yet
const memoryChallenges = new Map<string, InMemChallenge>();

function challengeKey(userId: string, platform: string): string {
  return `${userId}:${platform}`;
}

export function generateChallengeCode(): string {
  return `devos-${crypto.randomBytes(4).toString("hex")}`;
}

export async function startVerification(
  userId: string,
  platform: string,
  handleRaw: string,
  userClient?: SupabaseClient<Database>,
): Promise<VerificationChallengeData> {
  const handle = handleRaw.trim();
  if (!handle) throw new Error("Handle / username is required.");
  if (handle.length > 100) throw new Error("Handle is too long.");

  const meta = getPlatformVerificationMeta(platform, handle);
  const db = userClient ?? supabaseAdmin;

  // 1. Check if user already has a VERIFIED profile for this platform
  try {
    const { data: existingUserProfiles } = await db
      .from("coding_profiles")
      .select("id, platform, username, activity")
      .eq("user_id", userId)
      .eq("platform", platform);

    const existingProfile = existingUserProfiles?.[0];
    if (existingProfile && isProfileVerified(existingProfile)) {
      throw new Error(
        `You already have a verified ${meta.name} profile (@${existingProfile.username}). DevOS permits at most one profile per platform.`,
      );
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("You already have a verified")) {
      throw err;
    }
    // Continue if DB read has transient issues
  }

  // 2. Check cross-account uniqueness:
  // Reject if another user has already verified this handle on this platform
  try {
    const { data: claimedProfiles } = await supabaseAdmin
      .from("coding_profiles")
      .select("id, user_id, platform, username, activity")
      .eq("platform", platform)
      .ilike("username", handle)
      .neq("user_id", userId);

    const verifiedOtherUser = (claimedProfiles ?? []).filter(isProfileVerified);
    if (verifiedOtherUser.length > 0) {
      throw new Error(
        `The handle @${handle} on ${meta.name} is already claimed by another DevOS account.`,
      );
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("is already claimed by another DevOS account")) {
      throw err;
    }
  }

  // 3. Generate challenge code and expiration
  const challengeCode = generateChallengeCode();
  const expiresAt = new Date(Date.now() + EXPIRATION_MS).toISOString();

  // 4. Store or update challenge: Try DB table first, fall back to in-memory store
  let savedInDb = false;
  try {
    const { error: upsertErr } = await supabaseAdmin
      .from("verification_challenges")
      .upsert(
        {
          user_id: userId,
          platform,
          handle,
          challenge_code: challengeCode,
          attempts: 0,
          expires_at: expiresAt,
        },
        { onConflict: "user_id,platform" },
      );

    if (!upsertErr) {
      savedInDb = true;
    }
  } catch {
    savedInDb = false;
  }

  // Always keep in memory cache as well for instant, fail-safe lookup
  memoryChallenges.set(challengeKey(userId, platform), {
    id: crypto.randomUUID(),
    user_id: userId,
    platform,
    handle,
    challenge_code: challengeCode,
    attempts: 0,
    expires_at: expiresAt,
  });

  return {
    platform,
    handle,
    challengeCode,
    expiresAt,
    attemptsRemaining: MAX_ATTEMPTS,
    settingsUrl: meta.settingsUrl,
    fieldName: meta.fieldName,
    instructions: meta.instructions,
  };
}

export async function checkVerification(
  userId: string,
  platform: string,
  handleRaw: string,
  userClient?: SupabaseClient<Database>,
): Promise<VerificationResult> {
  const handle = handleRaw.trim();
  const meta = getPlatformVerificationMeta(platform, handle);
  const key = challengeKey(userId, platform);
  const db = userClient ?? supabaseAdmin;

  // 1. Fetch challenge from DB or memory fallback
  let challenge: InMemChallenge | null = null;
  try {
    const { data: challenges } = await (userClient ?? supabaseAdmin)
      .from("verification_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", platform);

    if (challenges && challenges.length > 0) {
      challenge = challenges[0] as unknown as InMemChallenge;
    }
  } catch {
    // DB table might not exist yet, fallback to memory
  }

  if (!challenge) {
    challenge = memoryChallenges.get(key) ?? null;
  }

  if (!challenge) {
    return {
      verified: false,
      error: "No active verification challenge found. Please start a new verification.",
    };
  }

  // Verify handle matches
  if (challenge.handle.toLowerCase() !== handle.toLowerCase()) {
    return {
      verified: false,
      error: `Challenge was created for @${challenge.handle}, not @${handle}. Please start over.`,
    };
  }

  // Check expiration
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    memoryChallenges.delete(key);
    try {
      await (userClient ?? supabaseAdmin).from("verification_challenges").delete().eq("id", challenge.id);
    } catch {}
    return {
      verified: false,
      attemptsRemaining: 0,
      error: "Verification challenge has expired. Please start a new challenge.",
    };
  }

  // Check attempts
  if (challenge.attempts >= MAX_ATTEMPTS) {
    memoryChallenges.delete(key);
    try {
      await (userClient ?? supabaseAdmin).from("verification_challenges").delete().eq("id", challenge.id);
    } catch {}
    return {
      verified: false,
      attemptsRemaining: 0,
      error: "Too many failed attempts. Please start a new challenge.",
    };
  }

  // Increment attempts count
  const newAttempts = challenge.attempts + 1;
  challenge.attempts = newAttempts;
  memoryChallenges.set(key, challenge);

  try {
    await (userClient ?? supabaseAdmin)
      .from("verification_challenges")
      .update({ attempts: newAttempts })
      .eq("id", challenge.id);
  } catch {}

  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - newAttempts);

  // 2. Re-check cross-account handle uniqueness
  try {
    const { data: claimedProfiles } = await supabaseAdmin
      .from("coding_profiles")
      .select("id, user_id, platform, username, activity")
      .eq("platform", platform)
      .ilike("username", handle)
      .neq("user_id", userId);

    const verifiedOtherUser = (claimedProfiles ?? []).filter(isProfileVerified);
    if (verifiedOtherUser.length > 0) {
      memoryChallenges.delete(key);
      try {
        await (userClient ?? supabaseAdmin).from("verification_challenges").delete().eq("id", challenge.id);
      } catch {}
      return {
        verified: false,
        attemptsRemaining: 0,
        error: `The handle @${handle} on ${meta.name} was claimed by another DevOS account.`,
      };
    }
  } catch {}

  // 3. Execute live platform ownership check
  let isOwnershipProven = false;
  try {
    isOwnershipProven = await verifyPlatformOwnership(
      platform,
      handle,
      challenge.challenge_code,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      verified: false,
      attemptsRemaining,
      error: `Could not connect to ${meta.name}: ${msg}. (${attemptsRemaining} attempts left)`,
    };
  }

  if (!isOwnershipProven) {
    return {
      verified: false,
      attemptsRemaining,
      error: `Verification code "${challenge.challenge_code}" was not found in your ${meta.name} profile. Make sure you saved your changes and try again. (${attemptsRemaining} attempts remaining)`,
    };
  }

  // 4. Verification Successful! Fetch live platform stats
  let initialStats: Awaited<ReturnType<typeof fetchPlatformStats>> | null = null;
  try {
    initialStats = await fetchPlatformStats(platform, handle);
  } catch {
    /* If stats fetch fails, we still create the profile with null stats and sync later */
  }

  const verifiedAt = new Date().toISOString();

  // Find if user has an existing row for this platform (e.g. unverified row)
  const { data: existingRows } = await db
    .from("coding_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("platform", platform);

  const existingId = existingRows?.[0]?.id;

  const activityPayload = {
    version: 2,
    verified_at: verifiedAt,
    verified_handle: handle,
    days: initialStats?.activity ?? [],
  };

  const profilePayload: CodingProfileInsert = {
    user_id: userId,
    platform,
    username: handle,
    verified_at: verifiedAt,
    profile_url: initialStats?.profile_url ?? null,
    rating: initialStats?.rating ?? null,
    max_rating: initialStats?.max_rating ?? null,
    rank_label: initialStats?.rank_label ?? null,
    problems_solved: initialStats?.problems_solved ?? 0,
    contests_attended: initialStats?.contests_attended ?? 0,
    submissions_count: initialStats?.submissions ?? 0,
    current_streak: initialStats?.current_streak ?? 0,
    max_streak: initialStats?.max_streak ?? 0,
    activity: activityPayload,
    last_synced_at: initialStats?.lastSyncedAt ?? verifiedAt,
    sync_status: initialStats ? "success" : "idle",
    sync_error: null,
  };

  let savedProfileId = existingId;

  if (existingId) {
    let { error: updateErr } = await db
      .from("coding_profiles")
      .update(profilePayload)
      .eq("id", existingId);

    // If verified_at column does not exist in DB schema yet, strip and retry
    if (updateErr && (updateErr.code === "42703" || updateErr.message?.includes("verified_at"))) {
      const { verified_at: _, ...payloadWithoutColumn } = profilePayload;
      const retry = await db
        .from("coding_profiles")
        .update(payloadWithoutColumn as CodingProfileUpdate)
        .eq("id", existingId);
      updateErr = retry.error;
    }

    if (updateErr && db !== supabaseAdmin) {
      const adminTry = await supabaseAdmin
        .from("coding_profiles")
        .update(profilePayload)
        .eq("id", existingId);
      if (!adminTry.error) updateErr = null;
    }

    if (updateErr) {
      console.error("[Verification] update error:", updateErr);
      return {
        verified: false,
        attemptsRemaining,
        error: `Could not save verified profile: ${updateErr.message}`,
      };
    }
  } else {
    // Determine position
    const { count } = await db
      .from("coding_profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    let { data: inserted, error: insertErr } = await db
      .from("coding_profiles")
      .insert({
        ...profilePayload,
        position: count ?? 0,
      })
      .select("id")
      .single();

    // If verified_at column does not exist in DB schema yet, strip and retry
    if (insertErr && (insertErr.code === "42703" || insertErr.message?.includes("verified_at"))) {
      const { verified_at: _, ...payloadWithoutColumn } = profilePayload;
      const retry = await db
        .from("coding_profiles")
        .insert({
          ...payloadWithoutColumn,
          position: count ?? 0,
        } as CodingProfileInsert)
        .select("id")
        .single();
      inserted = retry.data;
      insertErr = retry.error;
    }

    if (insertErr && db !== supabaseAdmin) {
      const adminTry = await supabaseAdmin
        .from("coding_profiles")
        .insert({
          ...profilePayload,
          position: count ?? 0,
        })
        .select("id")
        .single();
      if (!adminTry.error) {
        inserted = adminTry.data;
        insertErr = null;
      }
    }

    if (insertErr) {
      console.error("[Verification] insert error:", insertErr);
      return {
        verified: false,
        attemptsRemaining,
        error: `Could not save verified profile: ${insertErr.message}`,
      };
    }
    savedProfileId = inserted?.id;
  }

  // 5. Clean up completed challenge
  memoryChallenges.delete(key);
  try {
    await (userClient ?? supabaseAdmin).from("verification_challenges").delete().eq("id", challenge.id);
  } catch {}

  return {
    verified: true,
    profileId: savedProfileId,
  };
}

export async function cancelVerification(
  userId: string,
  platform: string,
  userClient?: SupabaseClient<Database>,
): Promise<void> {
  memoryChallenges.delete(challengeKey(userId, platform));
  try {
    await (userClient ?? supabaseAdmin)
      .from("verification_challenges")
      .delete()
      .eq("user_id", userId)
      .eq("platform", platform);
  } catch {}
}
