import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { CodingActivityHeatmap } from "@/components/coding-activity-heatmap";
import { buildActivityPayload, isProfileVerified, summariseCodingProfiles } from "@/lib/coding-activity";
import { PlatformLogo } from "@/components/platform-logo";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { fetchCodingStats } from "@/lib/coding-profiles.functions";
import {
  startVerificationChallenge,
  checkVerificationChallenge,
  cancelVerificationChallenge,
} from "@/lib/coding-verification.functions";
import type { VerificationChallengeData } from "@/lib/verification/types";
import {
  assertOk,
  codingProfilesQuery,
  describeError,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  CODING_PLATFORMS,
  CODING_PLATFORM_LABEL,
  PROFILE_URL_TEMPLATE,
  SOLVED_LABEL,
  SYNCABLE_PLATFORMS,
  type CodingProfile,
} from "@/lib/devos-types";
import { useCodingAutoSync } from "@/lib/use-coding-autosync";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profiles")({
  head: () => ({
    meta: [
      { title: "Coding Profiles — DevOS" },
      {
        name: "description",
        content:
          "Track your LeetCode, Codeforces, CodeChef, HackerRank and GitHub stats — rating, rank, problems solved, contests and streaks in one place.",
      },
      { property: "og:title", content: "Coding Profiles — DevOS" },
      {
        property: "og:description",
        content: "All your competitive programming stats and profile links in a single dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilesPage,
});

type ProfileDraft = {
  id?: string;
  platform: string;
  username: string;
  profile_url: string;
  notes: string;
};

function toDraft(p: CodingProfile): ProfileDraft {
  return {
    id: p.id,
    platform: p.platform,
    username: p.username,
    profile_url: p.profile_url ?? "",
    notes: p.notes ?? "",
  };
}

function resolveUrl(draft: ProfileDraft): string | null {
  const manual = draft.profile_url.trim();
  if (manual) return manual;
  const template = PROFILE_URL_TEMPLATE[draft.platform];
  const username = draft.username.trim();
  return template && username ? template(username) : null;
}

function canSync(platform: string): boolean {
  return (SYNCABLE_PLATFORMS as readonly string[]).includes(platform);
}

/** Platforms that simply don't publish a solved count get N/A instead of a fake 0. */
const SOLVED_UNSUPPORTED = new Set<string>();

function metric(value: number | null, unsupported = false): string {
  if (unsupported) return "N/A";
  return value === null ? "N/A" : String(value);
}

function ProfilesPage() {
  const qc = useQueryClient();
  const profiles = useQuery(codingProfilesQuery());
  useCodingAutoSync(profiles.data);
  const fetchStats = useServerFn(fetchCodingStats);
  const startChallenge = useServerFn(startVerificationChallenge);
  const checkChallenge = useServerFn(checkVerificationChallenge);
  const cancelChallenge = useServerFn(cancelVerificationChallenge);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Verification & Add Profile dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addPlatform, setAddPlatform] = useState<string>("leetcode");
  const [addHandle, setAddHandle] = useState<string>("");
  const [activeChallenge, setActiveChallenge] = useState<VerificationChallengeData | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const findCachedRow = (id: string): { id: string } | undefined =>
    (qc.getQueryData<CodingProfile[]>(["coding_profiles"]) ?? []).find((row) => row.id === id);

  const linkedPlatforms = useMemo(() => {
    const set = new Set<string>();
    for (const p of profiles.data ?? []) {
      set.add(p.platform);
    }
    return set;
  }, [profiles.data]);

  const verifiedProfiles = useMemo(
    () => (profiles.data ?? []).filter(isProfileVerified),
    [profiles.data],
  );

  const unverifiedCount = (profiles.data ?? []).length - verifiedProfiles.length;

  const startVerificationMutation = useMutation({
    mutationFn: async ({ platform, handle }: { platform: string; handle: string }) => {
      setVerifyError(null);
      return startChallenge({ data: { platform, handle } });
    },
    onSuccess: (data) => {
      setActiveChallenge(data);
      setVerifyError(null);
    },
    onError: (e: unknown) => {
      const msg = describeError(e);
      setVerifyError(msg);
      toast.error(msg);
    },
  });

  const checkVerificationMutation = useMutation({
    mutationFn: async ({ platform, handle }: { platform: string; handle: string }) => {
      setVerifyError(null);
      return checkChallenge({ data: { platform, handle } });
    },
    onSuccess: (result) => {
      if (result.verified) {
        toast.success("Profile ownership verified! Added to your dashboard.");
        setActiveChallenge(null);
        setIsAddOpen(false);
        setAddHandle("");
        void qc.invalidateQueries({ queryKey: ["coding_profiles"] });
      } else {
        setVerifyError(
          result.error ?? "Verification code not found. Make sure you saved your profile changes.",
        );
      }
    },
    onError: (e: unknown) => {
      setVerifyError(describeError(e));
    },
  });

  const openAddDialog = () => {
    const available = CODING_PLATFORMS.find((p) => !linkedPlatforms.has(p));
    setAddPlatform(available ?? "leetcode");
    setAddHandle("");
    setActiveChallenge(null);
    setVerifyError(null);
    setIsAddOpen(true);
  };

  const startVerifyExisting = (p: CodingProfile) => {
    setAddPlatform(p.platform);
    setAddHandle(p.username);
    setVerifyError(null);
    setIsAddOpen(true);
    startVerificationMutation.mutate({ platform: p.platform, handle: p.username });
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const closeAddDialog = () => {
    if (activeChallenge) {
      cancelChallenge({ data: { platform: activeChallenge.platform } }).catch(() => {});
    }
    setIsAddOpen(false);
    setActiveChallenge(null);
    setVerifyError(null);
    setCopiedCode(false);
  };

  const syncProfile = useMutation({
    mutationFn: async (profile: CodingProfile) => {
      try {
        const stats = await fetchStats({
          data: { platform: profile.platform, username: profile.username },
        });
        await updateRow("coding_profiles", profile, {
          profile_url: profile.profile_url ?? stats.profile_url,
          rating: stats.rating ?? profile.rating,
          max_rating:
            Math.max(stats.max_rating ?? 0, stats.rating ?? 0, profile.max_rating ?? 0) || null,
          rank_label: stats.rank_label ?? profile.rank_label,
          problems_solved: stats.problems_solved ?? profile.problems_solved,
          contests_attended: stats.contests_attended ?? profile.contests_attended,
          submissions_count: stats.submissions,
          current_streak: stats.current_streak,
          max_streak: Math.max(stats.max_streak, profile.max_streak),
          activity: buildActivityPayload(stats, profile) as Json,
          last_synced_at: stats.lastSyncedAt,
          sync_status: "success",
          sync_error: null,
        });
      } catch (error) {
        await updateRow("coding_profiles", profile, {
          sync_status: "error",
          sync_error: describeError(error).slice(0, 300),
        });
        throw error;
      }
    },
    onMutate: (profile) => setSyncingId(profile.id),
    onSuccess: (_d, profile) => {
      void qc.invalidateQueries({ queryKey: ["coding_profiles"] });
      toast.success(`${CODING_PLATFORM_LABEL[profile.platform] ?? profile.platform} synced`);
    },
    onError: (e: unknown) => toast.error(describeError(e)),
    onSettled: () => setSyncingId(null),
  });

  const updateProfile = useMutation({
    mutationFn: async (value: ProfileDraft) => {
      if (!value.id) return;
      await updateRow("coding_profiles", findCachedRow(value.id) ?? { id: value.id }, {
        profile_url: resolveUrl(value),
        notes: value.notes.trim() || null,
      });
    },
    onSuccess: () => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["coding_profiles"] });
      toast.success("Profile updated");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("coding_profiles").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["coding_profiles"] });
      toast.success("Profile removed");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (profiles.data ?? []).filter((p) => {
      if (platformFilter !== "all" && p.platform !== platformFilter) return false;
      if (!term) return true;
      return [p.username, p.platform, p.rank_label ?? "", p.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [profiles.data, search, platformFilter]);

  // One normalized activity dataset powers the heatmap, active days and streaks.
  // When a platform is selected in the dropdown, filter to that platform so the heatmap
  // and stats display only that platform's activity. When "all", show all platforms together.
  const heatmapProfiles = useMemo(() => {
    const list = profiles.data ?? [];
    if (platformFilter === "all") return list;
    return list.filter((p) => p.platform === platformFilter);
  }, [profiles.data, platformFilter]);

  const combined = useMemo(() => summariseCodingProfiles(heatmapProfiles), [heatmapProfiles]);

  const syncAll = useMutation({
    mutationFn: async () => {
      // Sync only verified platforms that support syncing
      const rows = (profiles.data ?? []).filter((p) => isProfileVerified(p) && canSync(p.platform));
      const results = await Promise.allSettled(
        rows.map(async (profile) => {
          try {
            const stats = await fetchStats({
              data: { platform: profile.platform, username: profile.username },
            });
            await updateRow("coding_profiles", profile, {
              profile_url: profile.profile_url ?? stats.profile_url,
              rating: stats.rating ?? profile.rating,
              max_rating:
                Math.max(stats.max_rating ?? 0, stats.rating ?? 0, profile.max_rating ?? 0) || null,
              rank_label: stats.rank_label ?? profile.rank_label,
              problems_solved: stats.problems_solved ?? profile.problems_solved,
              contests_attended: stats.contests_attended ?? profile.contests_attended,
              submissions_count: stats.submissions,
              current_streak: stats.current_streak,
              max_streak: Math.max(stats.max_streak, profile.max_streak),
              activity: buildActivityPayload(stats, profile) as Json,
              last_synced_at: stats.lastSyncedAt,
              sync_status: "success",
              sync_error: null,
            });
            return profile.platform;
          } catch (error) {
            await updateRow("coding_profiles", profile, {
              sync_status: "error",
              sync_error: describeError(error).slice(0, 300),
            });
            throw error;
          }
        }),
      );
      const failed = results
        .map((r, i) => (r.status === "rejected" ? rows[i]!.platform : null))
        .filter((p): p is string => Boolean(p));
      return { total: rows.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      void qc.invalidateQueries({ queryKey: ["coding_profiles"] });
      if (failed.length === 0) toast.success(`Synced ${total} platforms`);
      else
        toast.warning(
          `Synced ${total - failed.length}/${total} · failed: ${failed
            .map((p) => CODING_PLATFORM_LABEL[p] ?? p)
            .join(", ")}`,
        );
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Coding Profiles</h1>
          <p className="text-xs text-muted-foreground">
            {platformFilter === "all" ? (
              <>
                {verifiedProfiles.length} verified {verifiedProfiles.length === 1 ? "platform" : "platforms"} ·{" "}
                {combined.solved} problems solved · {combined.contests} contests · {combined.currentStreak} day streak
                {unverifiedCount > 0 ? ` · ${unverifiedCount} unverified` : ""}
              </>
            ) : (
              <>
                {CODING_PLATFORM_LABEL[platformFilter] ?? platformFilter} · {combined.solved} problems solved ·{" "}
                {combined.contests} contests · {combined.currentStreak} day streak
              </>
            )}
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search handle or platform"
            className="h-8 w-52 pl-7 text-xs"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {CODING_PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {CODING_PLATFORM_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8"
          disabled={linkedPlatforms.size >= CODING_PLATFORMS.length}
          onClick={openAddDialog}
        >
          <Plus className="size-3.5" />
          Add profile
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={syncAll.isPending || verifiedProfiles.length === 0}
          onClick={() => syncAll.mutate()}
        >
          <RefreshCw className={cn("size-3.5", syncAll.isPending && "animate-spin")} />
          {syncAll.isPending ? "Syncing…" : "Sync all"}
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {profiles.isLoading ? (
            <LoadingState label="Loading profiles…" />
          ) : profiles.isError ? (
            <ErrorState error={profiles.error} onRetry={() => void profiles.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Braces className="size-6" />}
              title={
                search || platformFilter !== "all" ? "No matching profiles" : "No profiles yet"
              }
              description="Link your verified LeetCode, Codeforces, HackerRank and other handles to track your genuine stats."
              action={
                <Button
                  size="sm"
                  disabled={linkedPlatforms.size >= CODING_PLATFORMS.length}
                  onClick={openAddDialog}
                >
                  <Plus className="size-3.5" />
                  Add profile
                </Button>
              }
            />
          ) : (
            <>
              <section className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
                <div className="grid grid-cols-2 grid-rows-2 gap-3">
                  {[
                    { label: "Questions solved", value: combined.solved },
                    { label: "Active days", value: combined.activeDays },
                    { label: "Max streak", value: combined.maxStreak },
                    { label: "Current streak", value: combined.currentStreak },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="group flex flex-col justify-between rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-surface-raised"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-foreground">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="min-w-0 rounded-xl border border-border bg-card p-3">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h2 className="text-xs font-semibold">Coding activity</h2>
                    <span className="text-[11px] text-muted-foreground">
                      {combined.submissions} submissions {platformFilter === "all" ? "across verified platforms" : `on ${CODING_PLATFORM_LABEL[platformFilter] ?? platformFilter}`} · last 12 months
                    </span>
                  </div>
                  <CodingActivityHeatmap days={combined.days} className="mt-3" />
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((p) => {
                  const isVerified = isProfileVerified(p);
                  return (
                    <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <PlatformLogo platform={p.platform} className="mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h2 className="truncate text-sm font-medium">
                              {CODING_PLATFORM_LABEL[p.platform] ?? p.platform}
                            </h2>
                            {p.profile_url ? (
                              <a
                                href={p.profile_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={`Open ${p.username} profile`}
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            ) : null}
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                <CheckCircle2 className="size-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                <AlertCircle className="size-3" />
                                Unverified
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canSync(p.platform) && isVerified ? (
                              <DropdownMenuItem
                                disabled={syncingId === p.id}
                                onClick={() => syncProfile.mutate(p)}
                              >
                                <RefreshCw
                                  className={cn("size-3.5", syncingId === p.id && "animate-spin")}
                                />
                                {syncingId === p.id ? "Syncing…" : "Sync now"}
                              </DropdownMenuItem>
                            ) : null}
                            {!isVerified ? (
                              <DropdownMenuItem onClick={() => startVerifyExisting(p)}>
                                <ShieldCheck className="size-3.5 text-amber-400" />
                                Verify ownership
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={() => setDraft(toDraft(p))}>
                              <Pencil className="size-3.5" />
                              Edit notes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                setConfirm({
                                  title: "Remove profile?",
                                  description: `${CODING_PLATFORM_LABEL[p.platform] ?? p.platform} @${p.username} will be permanently deleted.`,
                                  confirmLabel: "Delete",
                                  onConfirm: () => deleteProfile.mutate(p.id),
                                })
                              }
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {!isVerified ? (
                        <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 text-xs">
                          <div className="flex items-start gap-2">
                            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-amber-300">Ownership not verified</p>
                              <p className="text-[11px] text-muted-foreground">
                                Stats from this handle are excluded from your aggregate totals until verified.
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2.5 h-7 w-full border-amber-500/30 text-xs font-medium text-amber-300 hover:bg-amber-500/10"
                            disabled={startVerificationMutation.isPending}
                            onClick={() => startVerifyExisting(p)}
                          >
                            <ShieldCheck className="mr-1.5 size-3.5" />
                            Verify ownership now
                          </Button>
                        </div>
                      ) : null}

                      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-muted/40 px-2 py-2">
                          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {SOLVED_LABEL[p.platform] ?? "Solved"}
                          </dt>
                          <dd className="text-sm font-semibold">
                            {metric(
                              p.problems_solved,
                              SOLVED_UNSUPPORTED.has(p.platform) && p.problems_solved === 0,
                            )}
                          </dd>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-2 py-2">
                          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Rating
                          </dt>
                          <dd className="text-sm font-semibold">{metric(p.rating)}</dd>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-2 py-2">
                          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Contests
                          </dt>
                          <dd className="text-sm font-semibold">{p.contests_attended}</dd>
                        </div>
                      </dl>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {p.rank_label ? (
                          <span className="inline-flex items-center gap-1">
                            <Trophy className="size-3.5" />
                            {p.rank_label}
                          </span>
                        ) : null}
                        {p.last_synced_at ? (
                          <span className="ml-auto">
                            {syncingId === p.id
                              ? "Syncing…"
                              : `synced ${new Date(p.last_synced_at).toLocaleString()}`}
                          </span>
                        ) : (
                          <span className="ml-auto">not synced yet</span>
                        )}
                      </div>

                      {p.sync_status === "error" && p.sync_error ? (
                        <p className="mt-2 text-[11px] text-destructive">
                          Sync failed: {p.sync_error}
                        </p>
                      ) : null}

                      {p.notes ? (
                        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.notes}</p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Add Profile & Ownership Verification Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && closeAddDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              {activeChallenge ? "Verify Profile Ownership" : "Link Coding Profile"}
            </DialogTitle>
          </DialogHeader>

          {!activeChallenge ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!addHandle.trim()) {
                  toast.error("Username / handle is required");
                  return;
                }
                startVerificationMutation.mutate({
                  platform: addPlatform,
                  handle: addHandle.trim(),
                });
              }}
            >
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={addPlatform} onValueChange={setAddPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODING_PLATFORMS.map((p) => {
                      const isLinked = linkedPlatforms.has(p);
                      return (
                        <SelectItem key={p} value={p} disabled={isLinked}>
                          <span className="flex items-center gap-2">
                            <PlatformLogo platform={p} className="size-4 rounded-sm" />
                            <span>{CODING_PLATFORM_LABEL[p]}</span>
                            {isLinked ? (
                              <span className="text-[10px] text-muted-foreground">(Already added)</span>
                            ) : null}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-username">Handle / Username</Label>
                <Input
                  id="add-username"
                  autoFocus
                  placeholder="e.g. tourist, Kashif05"
                  value={addHandle}
                  onChange={(e) => setAddHandle(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  DevOS permits at most one profile per platform. Handle must belong to you.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Anti-impersonation guarantee</p>
                <p className="text-[11px]">
                  To prevent fake stats, DevOS will generate a temporary 15-minute challenge code to paste into your public {CODING_PLATFORM_LABEL[addPlatform] ?? addPlatform} profile.
                </p>
              </div>

              {verifyError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {verifyError}
                </div>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeAddDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={startVerificationMutation.isPending || !addHandle.trim()}>
                  {startVerificationMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                      Starting challenge…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center gap-2">
                  <PlatformLogo platform={activeChallenge.platform} className="size-5 rounded-md" />
                  <div>
                    <p className="text-xs font-semibold">
                      {CODING_PLATFORM_LABEL[activeChallenge.platform] ?? activeChallenge.platform}
                    </p>
                    <p className="text-[11px] text-muted-foreground">@{activeChallenge.handle}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => {
                    setActiveChallenge(null);
                    setVerifyError(null);
                  }}
                >
                  <ArrowLeft className="mr-1 size-3" />
                  Change handle
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Temporary Verification Code</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 font-mono text-sm font-semibold tracking-wider text-foreground">
                    {activeChallenge.challengeCode}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs"
                    onClick={() => handleCopyCode(activeChallenge.challengeCode)}
                  >
                    {copiedCode ? (
                      <>
                        <Check className="mr-1.5 size-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 size-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-3 space-y-2.5 text-xs">
                <p className="font-semibold text-foreground">Instructions:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-muted-foreground">
                  <li>
                    <a
                      href={activeChallenge.settingsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Open {CODING_PLATFORM_LABEL[activeChallenge.platform] ?? activeChallenge.platform} Settings
                      <ExternalLink className="size-3" />
                    </a>
                  </li>
                  <li>
                    Paste the code into your <strong className="text-foreground">{activeChallenge.fieldName}</strong>.
                  </li>
                  <li>
                    Save your changes on {CODING_PLATFORM_LABEL[activeChallenge.platform] ?? activeChallenge.platform}.
                  </li>
                  <li>
                    Click <strong className="text-foreground">Check / Verify now</strong> below.
                  </li>
                </ol>
                <p className="text-[11px] text-muted-foreground/80 italic">
                  💡 You can remove this code from your profile immediately after verification completes.
                </p>
              </div>

              {verifyError ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                    <p className="leading-relaxed">{verifyError}</p>
                  </div>
                </div>
              ) : null}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={closeAddDialog}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={checkVerificationMutation.isPending}
                  onClick={() =>
                    checkVerificationMutation.mutate({
                      platform: activeChallenge.platform,
                      handle: activeChallenge.handle,
                    })
                  }
                >
                  {checkVerificationMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                      Verifying on {CODING_PLATFORM_LABEL[activeChallenge.platform] ?? activeChallenge.platform}…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-1.5 size-3.5" />
                      Check / Verify now
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Notes Dialog */}
      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Details</DialogTitle>
          </DialogHeader>
          {draft ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate(draft);
              }}
            >
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
                <PlatformLogo platform={draft.platform} className="size-6 rounded-md" />
                <div>
                  <p className="text-sm font-semibold">
                    {CODING_PLATFORM_LABEL[draft.platform] ?? draft.platform}
                  </p>
                  <p className="text-xs text-muted-foreground">@{draft.username}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-url">Custom Profile URL (Optional)</Label>
                <Input
                  id="edit-url"
                  value={draft.profile_url}
                  onChange={(e) => setDraft({ ...draft, profile_url: e.target.value })}
                  placeholder={resolveUrl({ ...draft, profile_url: "" }) ?? "https://…"}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="Add personal notes or contest goals..."
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Platform and handle are locked to your verified account. To change handles, delete this profile and verify the new handle.
              </p>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}
