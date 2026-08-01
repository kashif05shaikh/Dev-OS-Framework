import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Braces,
  ExternalLink,
  Flame,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fetchCodingStats } from "@/lib/coding-profiles.functions";
import {
  assertOk,
  codingProfilesQuery,
  describeError,
  requireUserId,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  CODING_PLATFORMS,
  CODING_PLATFORM_COLOR,
  CODING_PLATFORM_LABEL,
  PROFILE_URL_TEMPLATE,
  SYNCABLE_PLATFORMS,
  type CodingProfile,
} from "@/lib/devos-types";

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
  rating: string;
  rank_label: string;
  problems_solved: string;
  contests_attended: string;
  current_streak: string;
  max_streak: string;
  notes: string;
};

function emptyDraft(): ProfileDraft {
  return {
    platform: "leetcode",
    username: "",
    profile_url: "",
    rating: "",
    rank_label: "",
    problems_solved: "0",
    contests_attended: "0",
    current_streak: "0",
    max_streak: "0",
    notes: "",
  };
}

function toDraft(p: CodingProfile): ProfileDraft {
  return {
    id: p.id,
    platform: p.platform,
    username: p.username,
    profile_url: p.profile_url ?? "",
    rating: p.rating === null ? "" : String(p.rating),
    rank_label: p.rank_label ?? "",
    problems_solved: String(p.problems_solved),
    contests_attended: String(p.contests_attended),
    current_streak: String(p.current_streak),
    max_streak: String(p.max_streak),
    notes: p.notes ?? "",
  };
}

function toInt(value: string, fallback = 0): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
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

function ProfilesPage() {
  const qc = useQueryClient();
  const profiles = useQuery(codingProfilesQuery());
  const fetchStats = useServerFn(fetchCodingStats);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const findCachedRow = (id: string): { id: string } | undefined =>
    (qc.getQueryData<CodingProfile[]>(["coding_profiles"]) ?? []).find((row) => row.id === id);

  const fillFromPlatform = useMutation({
    mutationFn: async (value: ProfileDraft) =>
      fetchStats({ data: { platform: value.platform, username: value.username.trim() } }),
    onSuccess: (stats) => {
      setDraft((current) =>
        current
          ? {
              ...current,
              profile_url: current.profile_url.trim() || (stats.profile_url ?? ""),
              rating: stats.rating === null ? "" : String(stats.rating),
              rank_label: stats.rank_label ?? current.rank_label,
              problems_solved: String(stats.problems_solved),
              contests_attended: String(stats.contests_attended),
              current_streak: String(stats.current_streak),
              max_streak: String(Math.max(stats.max_streak, Number(current.max_streak) || 0)),
            }
          : current,
      );
      toast.success("Stats fetched");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const syncProfile = useMutation({
    mutationFn: async (profile: CodingProfile) => {
      const stats = await fetchStats({
        data: { platform: profile.platform, username: profile.username },
      });
      await updateRow("coding_profiles", profile, {
        profile_url: profile.profile_url ?? stats.profile_url,
        rating: stats.rating,
        rank_label: stats.rank_label ?? profile.rank_label,
        problems_solved: stats.problems_solved,
        contests_attended: stats.contests_attended,
        current_streak: stats.current_streak,
        max_streak: Math.max(stats.max_streak, profile.max_streak),
        last_synced_at: new Date().toISOString(),
      });
    },
    onMutate: (profile) => setSyncingId(profile.id),
    onSuccess: (_d, profile) => {
      void qc.invalidateQueries({ queryKey: ["coding_profiles"] });
      toast.success(`${CODING_PLATFORM_LABEL[profile.platform] ?? profile.platform} synced`);
    },
    onError: (e: unknown) => toast.error(describeError(e)),
    onSettled: () => setSyncingId(null),
  });

  const saveProfile = useMutation({
    mutationFn: async (value: ProfileDraft) => {
      let payload = {
        platform: value.platform,
        username: value.username.trim(),
        profile_url: resolveUrl(value),
        rating: value.rating.trim() === "" ? null : toInt(value.rating),
        rank_label: value.rank_label.trim() || null,
        problems_solved: toInt(value.problems_solved),
        contests_attended: toInt(value.contests_attended),
        current_streak: toInt(value.current_streak),
        max_streak: toInt(value.max_streak),
        notes: value.notes.trim() || null,
        last_synced_at: new Date().toISOString(),
      };

      // New profile on a supported platform: pull the live stats automatically.
      if (!value.id && canSync(value.platform)) {
        try {
          const stats = await fetchStats({
            data: { platform: value.platform, username: payload.username },
          });
          payload = {
            ...payload,
            profile_url: payload.profile_url ?? stats.profile_url,
            rating: stats.rating,
            rank_label: stats.rank_label ?? payload.rank_label,
            problems_solved: stats.problems_solved,
            contests_attended: stats.contests_attended,
            current_streak: stats.current_streak,
            max_streak: Math.max(stats.max_streak, payload.max_streak),
          };
        } catch (error) {
          toast.warning(
            `Saved, but live stats could not be fetched: ${describeError(error)}`,
          );
        }
      }

      if (value.id) {
        await updateRow("coding_profiles", findCachedRow(value.id) ?? { id: value.id }, payload);
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const position = (qc.getQueryData<CodingProfile[]>(["coding_profiles"]) ?? []).length;
        const { error } = await supabase
          .from("coding_profiles")
          .insert({ ...payload, user_id, position });
        assertOk(error);
      });
    },
    onSuccess: (_d, value) => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["coding_profiles"] });
      toast.success(value.id ? "Profile updated" : "Profile added");
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

  const totals = useMemo(() => {
    const rows = profiles.data ?? [];
    return {
      solved: rows.reduce((sum, r) => sum + r.problems_solved, 0),
      contests: rows.reduce((sum, r) => sum + r.contests_attended, 0),
      streak: rows.reduce((max, r) => Math.max(max, r.current_streak), 0),
    };
  }, [profiles.data]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Coding Profiles</h1>
          <p className="text-xs text-muted-foreground">
            {(profiles.data ?? []).length} platforms · {totals.solved} problems solved ·{" "}
            {totals.contests} contests · {totals.streak} day streak
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
        <Button size="sm" className="h-8" onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-3.5" />
          Add profile
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
              title={search || platformFilter !== "all" ? "No matching profiles" : "No profiles yet"}
              description="Add your LeetCode, Codeforces, GitHub and other handles to keep every stat in one place."
              action={
                <Button size="sm" onClick={() => setDraft(emptyDraft())}>
                  <Plus className="size-3.5" />
                  Add profile
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => {
                const color = CODING_PLATFORM_COLOR[p.platform] ?? CODING_PLATFORM_COLOR['other']!;
                return (
                  <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold uppercase"
                        style={{ backgroundColor: `${color}22`, color }}
                      >
                        {(CODING_PLATFORM_LABEL[p.platform] ?? p.platform).slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
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
                          <DropdownMenuItem onClick={() => setDraft(toDraft(p))}>
                            <Pencil className="size-3.5" />
                            Edit
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

                    <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/40 px-2 py-2">
                        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Solved
                        </dt>
                        <dd className="text-sm font-semibold">{p.problems_solved}</dd>
                      </div>
                      <div className="rounded-lg bg-muted/40 px-2 py-2">
                        <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          Rating
                        </dt>
                        <dd className="text-sm font-semibold">{p.rating ?? "—"}</dd>
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
                      <span className="inline-flex items-center gap-1">
                        <Flame className="size-3.5" />
                        {p.current_streak}d streak · best {p.max_streak}d
                      </span>
                    </div>

                    {p.notes ? (
                      <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.notes}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit profile" : "Add profile"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.username.trim()) {
                  toast.error("Username is required");
                  return;
                }
                saveProfile.mutate(draft);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Select
                    value={draft.platform}
                    onValueChange={(platform) => setDraft({ ...draft, platform })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CODING_PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {CODING_PLATFORM_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-username">Username / handle</Label>
                  <Input
                    id="cp-username"
                    autoFocus
                    value={draft.username}
                    onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cp-url">Profile URL</Label>
                <Input
                  id="cp-url"
                  value={draft.profile_url}
                  onChange={(e) => setDraft({ ...draft, profile_url: e.target.value })}
                  placeholder={resolveUrl({ ...draft, profile_url: "" }) ?? "https://…"}
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to generate it from the platform and handle.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cp-rating">Rating</Label>
                  <Input
                    id="cp-rating"
                    inputMode="numeric"
                    value={draft.rating}
                    onChange={(e) => setDraft({ ...draft, rating: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-rank">Rank / tier</Label>
                  <Input
                    id="cp-rank"
                    value={draft.rank_label}
                    onChange={(e) => setDraft({ ...draft, rank_label: e.target.value })}
                    placeholder="Knight, 4★, Top 5%"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cp-solved">Problems solved</Label>
                  <Input
                    id="cp-solved"
                    inputMode="numeric"
                    value={draft.problems_solved}
                    onChange={(e) => setDraft({ ...draft, problems_solved: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-contests">Contests attended</Label>
                  <Input
                    id="cp-contests"
                    inputMode="numeric"
                    value={draft.contests_attended}
                    onChange={(e) => setDraft({ ...draft, contests_attended: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cp-streak">Current streak (days)</Label>
                  <Input
                    id="cp-streak"
                    inputMode="numeric"
                    value={draft.current_streak}
                    onChange={(e) => setDraft({ ...draft, current_streak: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cp-max">Best streak (days)</Label>
                  <Input
                    id="cp-max"
                    inputMode="numeric"
                    value={draft.max_streak}
                    onChange={(e) => setDraft({ ...draft, max_streak: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cp-notes">Notes</Label>
                <Textarea
                  id="cp-notes"
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? "Saving…" : draft.id ? "Save changes" : "Add profile"}
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
