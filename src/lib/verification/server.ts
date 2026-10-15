import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchPlatformStats } from "@/lib/coding-profiles.server";
import {
  getPlatformVerificationMeta,
  verifyPlatformOwnership,
} from "./platforms";
import type { VerificationChallengeData, VerificationResult } from "./types";

const MAX_ATTEMPTS = 5;
const EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

export function generateChallengeCode(): string {
  // devos- + 8 random hex characters
  return `devos-${crypto.randomBytes(4).toString("hex")}`;
}

export async function startVerification(
  userId: string,
  platform: string,
  handleRaw: string,
): Promise<VerificationChallengeData> {
  const handle = handleRaw.trim();
  if (!handle) throw new Error("Handle / username is required.");
  if (handle.length > 100) throw new Error("Handle is too long.");

  const meta = getPlatformVerificationMeta(platform, handle);

  // 1. Check if user already has a VERIFIED profile for this platform
  const { data: existingUserProfiles } = await supabaseAdmin
    .from("coding_profiles")
    .select("id, platform, username, verified_at")
    .eq("user_id", userId)
    .eq("platform", platform);

  const existingProfile = existingUserProfiles?.[0];
  if (existingProfile && existingProfile.verified_at !== null) {
    throw new Error(
      `You already have a verified ${meta.name} profile (@${existingProfile.username}). DevOS permits at most one profile per platform.`,
    );
  }

  // 2. Check cross-account uniqueness:
  // Reject if another user has already verified this handle on this platform
  const { data: claimedProfiles } = await supabaseAdmin
    .from("coding_profiles")
    .select("id, user_id, platform, username")
    .eq("platform", platform)
    .ilike("username", handle)
    .not("verified_at", "is", null)
    .neq("user_id", userId);

  if (claimedProfiles && claimedProfiles.length > 0) {
    throw new Error(
      `The handle @${handle} on ${meta.name} is already claimed by another DevOS account.`,
    );
  }

  // 3. Generate challenge code and expiration
  const challengeCode = generateChallengeCode();
  const expiresAt = new Date(Date.now() + EXPIRATION_MS).toISOString();

  // 4. Store or update challenge in verification_challenges
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

  if (upsertErr) {
    throw new Error(`Failed to create verification challenge: ${upsertErr.message}`);
  }

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
): Promise<VerificationResult> {
  const handle = handleRaw.trim();
  const meta = getPlatformVerificationMeta(platform, handle);

  // 1. Fetch challenge
  const { data: challenges, error: fetchErr } = await supabaseAdmin
    .from("verification_challenges")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform);

  if (fetchErr || !challenges || challenges.length === 0) {
    return {
      verified: false,
      error: "No active verification challenge found. Please start a new verification.",
    };
  }

  const challenge = challenges[0]!;

  // Verify handle matches
  if (challenge.handle.toLowerCase() !== handle.toLowerCase()) {
    return {
      verified: false,
      error: `Challenge was created for @${challenge.handle}, not @${handle}. Please start over.`,
    };
  }

  // Check expiration
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    await supabaseAdmin
      .from("verification_challenges")
      .delete()
      .eq("id", challenge.id);
    return {
      verified: false,
      attemptsRemaining: 0,
      error: "Verification challenge has expired. Please start a new challenge.",
    };
  }

  // Check attempts
  if (challenge.attempts >= MAX_ATTEMPTS) {
    await supabaseAdmin
      .from("verification_challenges")
      .delete()
      .eq("id", challenge.id);
    return {
      verified: false,
      attemptsRemaining: 0,
      error: "Too many failed attempts. Please start a new challenge.",
    };
  }

  // Increment attempts count
  const newAttempts = challenge.attempts + 1;
  await supabaseAdmin
    .from("verification_challenges")
    .update({ attempts: newAttempts })
    .eq("id", challenge.id);

  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - newAttempts);

  // 2. Re-check cross-account handle uniqueness
  const { data: claimedProfiles } = await supabaseAdmin
    .from("coding_profiles")
    .select("id, user_id, platform, username")
    .eq("platform", platform)
    .ilike("username", handle)
    .not("verified_at", "is", null)
    .neq("user_id", userId);

  if (claimedProfiles && claimedProfiles.length > 0) {
    await supabaseAdmin
      .from("verification_challenges")
      .delete()
      .eq("id", challenge.id);
    return {
      verified: false,
      attemptsRemaining: 0,
      error: `The handle @${handle} on ${meta.name} was claimed by another DevOS account.`,
    };
  }

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
  const { data: existingRows } = await supabaseAdmin
    .from("coding_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("platform", platform);

  const existingId = existingRows?.[0]?.id;

  const profilePayload = {
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
    activity: initialStats ? { version: 2, days: initialStats.activity } : {},
    last_synced_at: initialStats?.lastSyncedAt ?? verifiedAt,
    sync_status: initialStats ? "success" : "idle",
    sync_error: null,
  };

  let savedProfileId = existingId;

  if (existingId) {
    const { error: updateErr } = await supabaseAdmin
      .from("coding_profiles")
      .update(profilePayload)
      .eq("id", existingId);

    if (updateErr) {
      throw new Error(`Failed to save verified profile: ${updateErr.message}`);
    }
  } else {
    // Determine position
    const { count } = await supabaseAdmin
      .from("coding_profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("coding_profiles")
      .insert({
        ...profilePayload,
        position: count ?? 0,
      })
      .select("id")
      .single();

    if (insertErr) {
      throw new Error(`Failed to create verified profile: ${insertErr.message}`);
    }
    savedProfileId = inserted?.id;
  }

  // 5. Clean up completed challenge
  await supabaseAdmin
    .from("verification_challenges")
    .delete()
    .eq("id", challenge.id);

  return {
    verified: true,
    profileId: savedProfileId,
  };
}

export async function cancelVerification(userId: string, platform: string): Promise<void> {
  await supabaseAdmin
    .from("verification_challenges")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform);
}

