import { decryptSecret, encryptSecret } from "./connector-crypto.server";

export type ConnectionSummary = {
  platform: string;
  handle: string | null;
  platformUserId: string | null;
  status: string;
  lastError: string | null;
  connectedAt: string | null;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function listConnections(userId: string): Promise<ConnectionSummary[]> {
  const db = await admin();
  const { data, error } = await db
    .from("platform_connections")
    .select("platform, handle, platform_user_id, status, last_error, connected_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    platform: row.platform,
    handle: row.handle,
    platformUserId: row.platform_user_id,
    status: row.status,
    lastError: row.last_error,
    connectedAt: row.connected_at,
  }));
}

export async function saveConnection(
  userId: string,
  platform: string,
  input: { secret: string; handle: string; platformUserId: string },
): Promise<void> {
  const db = await admin();
  const { error } = await db.from("platform_connections").upsert(
    {
      user_id: userId,
      platform,
      handle: input.handle,
      platform_user_id: input.platformUserId,
      secret_ciphertext: await encryptSecret(input.secret),
      status: "connected",
      last_error: null,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id,platform" },
  );
  if (error) throw new Error(error.message);
}

export async function removeConnection(userId: string, platform: string): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("platform_connections")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform);
  if (error) throw new Error(error.message);
}

export async function markConnectionExpired(userId: string, platform: string): Promise<void> {
  const db = await admin();
  await db
    .from("platform_connections")
    .update({ status: "expired", last_error: "Session expired — reconnect to keep syncing." })
    .eq("user_id", userId)
    .eq("platform", platform);
}

/** Returns the decrypted session secret for a platform, or null when not connected. */
export async function getConnectionSecret(
  userId: string,
  platform: string,
): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("platform_connections")
    .select("secret_ciphertext, status")
    .eq("user_id", userId)
    .eq("platform", platform)
    .maybeSingle();
  if (!data?.secret_ciphertext || data.status !== "connected") return null;
  try {
    return await decryptSecret(data.secret_ciphertext);
  } catch {
    return null;
  }
}