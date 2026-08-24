import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { fetchCodingStats } from "@/lib/coding-profiles.functions";
import { describeError, updateRow } from "@/lib/devos-queries";
import { SYNCABLE_PLATFORMS, type CodingProfile } from "@/lib/devos-types";

/** Coding stats are considered fresh for one hour. */
export const CODING_STALE_MS = 60 * 60 * 1000;

function activityPayload(stats: { activity: unknown }) {
  return { version: 2, days: stats.activity } as never;
}

export function isSyncable(platform: string): boolean {
  return (SYNCABLE_PLATFORMS as readonly string[]).includes(platform);
}

/** Rows whose stats have never been fetched or are older than one hour. */
export function staleCodingProfiles(rows: CodingProfile[]): CodingProfile[] {
  const cutoff = Date.now() - CODING_STALE_MS;
  return rows.filter((row) => {
    if (!isSyncable(row.platform)) return false;
    const at = row.last_synced_at ? Date.parse(row.last_synced_at) : NaN;
    return !Number.isFinite(at) || at < cutoff;
  });
}

/**
 * Silently refreshes stale coding profiles (on mount and once an hour) so the
 * Dashboard streak/titles show real numbers without a manual "Sync all".
 */
export function useCodingAutoSync(rows: CodingProfile[] | undefined, enabled = true) {
  const qc = useQueryClient();
  const fetchStats = useServerFn(fetchCodingStats);
  const running = useRef(false);
  const rowsRef = useRef<CodingProfile[]>([]);
  rowsRef.current = rows ?? [];

  useEffect(() => {
    if (!enabled) return;

    const run = async () => {
      if (running.current) return;
      const stale = staleCodingProfiles(rowsRef.current);
      if (stale.length === 0) return;
      running.current = true;
      try {
        await Promise.allSettled(
          stale.map(async (profile) => {
            try {
              const stats = await fetchStats({
                data: { platform: profile.platform, username: profile.username },
              });
              await updateRow("coding_profiles", profile, {
                profile_url: profile.profile_url ?? stats.profile_url,
                rating: stats.rating ?? profile.rating,
                max_rating:
                  Math.max(stats.max_rating ?? 0, stats.rating ?? 0, profile.max_rating ?? 0) ||
                  null,
                rank_label: stats.rank_label ?? profile.rank_label,
                problems_solved: stats.problems_solved ?? profile.problems_solved,
                contests_attended: stats.contests_attended ?? profile.contests_attended,
                submissions_count: stats.submissions,
                current_streak: stats.current_streak,
                max_streak: Math.max(stats.max_streak, profile.max_streak),
                activity: activityPayload(stats),
                last_synced_at: stats.lastSyncedAt,
                sync_status: "success",
                sync_error: null,
              });
            } catch (error) {
              await updateRow("coding_profiles", profile, {
                sync_status: "error",
                sync_error: describeError(error).slice(0, 300),
              });
            }
          }),
        );
        await qc.invalidateQueries({ queryKey: ["coding_profiles"] });
      } finally {
        running.current = false;
      }
    };

    void run();
    const timer = setInterval(() => void run(), CODING_STALE_MS);
    return () => clearInterval(timer);
    // rowsRef keeps the latest rows without restarting the hourly timer.
  }, [enabled, fetchStats, qc]);
}
