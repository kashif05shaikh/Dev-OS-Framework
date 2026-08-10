import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ExternalLink,
  Link2Off,
  MapPin,
  PencilLine,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { assertOk, describeError, requireUserId, runWithRetry, updateRow } from "@/lib/devos-queries";
import { fetchRedditFromBrowser } from "@/lib/social-client";
import { fetchSocialProfile } from "@/lib/social.functions";
import {
  socialAccountsQuery,
  socialProfileCacheQuery,
  type SocialAccount,
  type SocialProfileCache,
} from "@/lib/social-queries";
import {
  SOCIAL_PLATFORMS,
  socialLogo,
  socialPlatform,
  type SocialPlatformMeta,
  type SocialSnapshot,
} from "@/lib/social-platforms";

export const Route = createFileRoute("/_authenticated/network")({
  head: () => ({
    meta: [
      { title: "Network — DevOS" },
      {
        name: "description",
        content:
          "Aggregate your GitHub, X, Instagram, Reddit, Dev.to, Hashnode, Medium, LinkedIn and portfolio profiles with live follower counts and recent activity.",
      },
      { property: "og:title", content: "Network — DevOS" },
      {
        property: "og:description",
        content: "One dashboard for every developer social profile, synced from live public APIs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NetworkPage,
});

type Draft = { platform: string; handle: string; editing?: SocialAccount };

/** Manual stat entry for platforms that block automated profile reads. */
type StatsDraft = {
  account: SocialAccount;
  display_name: string;
  bio: string;
  avatar_url: string;
  followers: string;
  following: string;
  posts: string;
};

/** Platforms whose public data cannot be read from a server (login-walled). */
const MANUAL_PLATFORMS = new Set(["instagram", "linkedin"]);

function toNumber(value: string): number | null {
  const trimmed = value.trim().replace(/[,\s]/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function compact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}m`;
}

function extraOf(row: SocialProfileCache | undefined): Record<string, unknown> {
  const raw = row?.extra_json;
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function links(extra: Record<string, unknown>, key: string) {
  const value = extra[key];
  return Array.isArray(value)
    ? (value as { title: string; url: string; date?: string | null; meta?: string }[])
    : [];
}

function NetworkPage() {
  const qc = useQueryClient();
  const accounts = useQuery(socialAccountsQuery());
  const cache = useQuery(socialProfileCacheQuery());
  const fetchProfile = useServerFn(fetchSocialProfile);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [stats, setStats] = useState<StatsDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const loadSnapshot = async (platform: string, handle: string): Promise<SocialSnapshot> => {
    try {
      return await fetchProfile({ data: { platform, handle } });
    } catch (error) {
      // Reddit refuses datacenter IPs — retry the public endpoint from the browser.
      if (platform === "reddit") return fetchRedditFromBrowser(handle);
      throw error;
    }
  };

  const byPlatform = useMemo(() => {
    const map = new Map<string, SocialProfileCache>();
    for (const row of cache.data ?? []) map.set(row.platform, row);
    return map;
  }, [cache.data]);

  const connected = accounts.data ?? [];
  const connectedIds = new Set(connected.map((a) => a.platform));
  const available = SOCIAL_PLATFORMS.filter((p) => !connectedIds.has(p.id));

  async function persistSnapshot(userId: string, snapshot: SocialSnapshot) {
    // Never wipe manually entered stats with an empty (blocked) snapshot.
    const existing = byPlatform.get(snapshot.platform);
    const existingExtra = extraOf(existing);
    const keepManual =
      Boolean(existingExtra["manual"]) &&
      snapshot.followers === null &&
      snapshot.following === null &&
      snapshot.posts === null;

    await runWithRetry(async () => {
      const { error } = await supabase.from("social_profile_cache").upsert(
        {
          user_id: userId,
          platform: snapshot.platform,
          handle: snapshot.handle,
          display_name: snapshot.display_name ?? (keepManual ? (existing?.display_name ?? null) : null),
          avatar_url: snapshot.avatar_url ?? (keepManual ? (existing?.avatar_url ?? null) : null),
          bio: snapshot.bio ?? (keepManual ? (existing?.bio ?? null) : null),
          location: snapshot.location,
          website: snapshot.website,
          verified: snapshot.verified,
          followers: keepManual ? (existing?.followers ?? null) : snapshot.followers,
          following: keepManual ? (existing?.following ?? null) : snapshot.following,
          posts: keepManual ? (existing?.posts ?? null) : snapshot.posts,
          joined_at: snapshot.joined_at,
          extra_json: (keepManual
            ? { ...snapshot.extra, manual: true }
            : snapshot.extra) as never,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" },
      );
      assertOk(error);
    });
  }

  const saveStats = useMutation({
    mutationFn: async (value: StatsDraft) => {
      const userId = await requireUserId();
      const meta = socialPlatform(value.account.platform);
      await runWithRetry(async () => {
        const { error } = await supabase.from("social_profile_cache").upsert(
          {
            user_id: userId,
            platform: value.account.platform,
            handle: value.account.username,
            display_name: value.display_name.trim() || null,
            avatar_url: value.avatar_url.trim() || null,
            bio: value.bio.trim() || null,
            followers: toNumber(value.followers),
            following: toNumber(value.following),
            posts: toNumber(value.posts),
            extra_json: {
              manual: true,
              postsLabel: "Posts",
              note: `${meta?.label ?? value.account.platform} blocks automated profile reads, so these numbers are the ones you entered.`,
            } as never,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,platform" },
        );
        assertOk(error);
      });
      await updateRow("social_accounts", value.account, {
        status: "connected",
        last_error: null,
        last_synced: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setStats(null);
      void qc.invalidateQueries({ queryKey: ["social_accounts"] });
      void qc.invalidateQueries({ queryKey: ["social_profile_cache"] });
      toast.success("Stats saved");
    },
    onError: (error: unknown) => toast.error(describeError(error)),
  });

  const connect = useMutation({
    mutationFn: async (value: Draft) => {
      const meta = socialPlatform(value.platform);
      if (!meta) throw new Error("Unknown platform.");
      const handle = value.handle.trim();
      if (!handle) throw new Error(`${meta.inputLabel} is required.`);

      const userId = await requireUserId();
      let snapshot: SocialSnapshot | null = null;
      let lastError: string | null = null;
      try {
        snapshot = await loadSnapshot(value.platform, handle);
      } catch (error) {
        lastError = describeError(error);
      }

      const payload = {
        platform: value.platform,
        username: snapshot?.handle ?? handle,
        profile_url: snapshot?.profile_url ?? meta.profileUrl(handle),
        connected: true,
        status: lastError ? "error" : "connected",
        last_error: lastError,
        last_synced: lastError ? null : new Date().toISOString(),
      };

      if (value.editing) {
        await updateRow("social_accounts", value.editing, payload);
      } else {
        await runWithRetry(async () => {
          const { error } = await supabase
            .from("social_accounts")
            .upsert(
              { ...payload, user_id: userId, position: connected.length },
              { onConflict: "user_id,platform" },
            );
          assertOk(error);
        });
      }

      if (snapshot) await persistSnapshot(userId, snapshot);
      return { lastError, label: meta.label };
    },
    onSuccess: (result) => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ["social_accounts"] });
      void qc.invalidateQueries({ queryKey: ["social_profile_cache"] });
      if (result.lastError) toast.warning(`${result.label} linked, but sync failed: ${result.lastError}`);
      else toast.success(`${result.label} connected`);
    },
    onError: (error: unknown) => toast.error(describeError(error)),
  });

  const sync = useMutation({
    mutationFn: async (account: SocialAccount) => {
      const userId = await requireUserId();
      try {
        const snapshot = await loadSnapshot(account.platform, account.username);
        await persistSnapshot(userId, snapshot);
        await updateRow("social_accounts", account, {
          status: "connected",
          last_error: null,
          last_synced: new Date().toISOString(),
          profile_url: snapshot.profile_url ?? account.profile_url,
        });
        return snapshot;
      } catch (error) {
        const message = describeError(error);
        await updateRow("social_accounts", account, {
          status: "error",
          last_error: message,
        });
        throw new Error(message);
      }
    },
    onMutate: (account) => setSyncing(account.id),
    onSuccess: (snapshot, account) => {
      void qc.invalidateQueries({ queryKey: ["social_accounts"] });
      void qc.invalidateQueries({ queryKey: ["social_profile_cache"] });
      const label = socialPlatform(account.platform)?.label ?? account.platform;
      const blocked =
        Boolean(snapshot?.extra?.["unavailable"]) &&
        snapshot?.followers === null &&
        snapshot?.following === null &&
        snapshot?.posts === null;
      if (blocked) {
        const profile = byPlatform.get(account.platform);
        const hasManual = Boolean(extraOf(profile)["manual"]);
        toast.message(`${label} blocks automated profile reads`, {
          description: hasManual
            ? "Your saved numbers were kept. Use “Edit stats” to update them."
            : "Enter your follower / connection counts manually to show them here.",
          action: hasManual
            ? undefined
            : {
                label: "Enter stats",
                onClick: () =>
                  setStats({
                    account,
                    display_name: profile?.display_name ?? "",
                    bio: profile?.bio ?? "",
                    avatar_url: profile?.avatar_url ?? "",
                    followers: "",
                    following: "",
                    posts: "",
                  }),
              },
        });
        return;
      }
      toast.success(`${label} synced`);
    },
    onError: (error: unknown) => {
      void qc.invalidateQueries({ queryKey: ["social_accounts"] });
      toast.error(describeError(error));
    },
    onSettled: () => setSyncing(null),
  });

  const syncAll = useMutation({
    mutationFn: async () => {
      for (const account of connected) {
        try {
          await sync.mutateAsync(account);
        } catch {
          /* individual failures already surface a toast */
        }
      }
    },
  });

  const toggleAutoSync = useMutation({
    mutationFn: async (account: SocialAccount) =>
      updateRow("social_accounts", account, { auto_sync: !account.auto_sync }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["social_accounts"] }),
    onError: (error: unknown) => toast.error(describeError(error)),
  });

  const disconnect = useMutation({
    mutationFn: async (account: SocialAccount) =>
      runWithRetry(async () => {
        const del = await supabase.from("social_accounts").delete().eq("id", account.id);
        assertOk(del.error);
        const clear = await supabase
          .from("social_profile_cache")
          .delete()
          .eq("platform", account.platform);
        assertOk(clear.error);
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["social_accounts"] });
      void qc.invalidateQueries({ queryKey: ["social_profile_cache"] });
      toast.success("Account disconnected");
    },
    onError: (error: unknown) => toast.error(describeError(error)),
  });

  const totals = useMemo(() => {
    const rows = cache.data ?? [];
    return {
      followers: rows.reduce((sum, r) => sum + (r.followers ?? 0), 0),
      posts: rows.reduce((sum, r) => sum + (r.posts ?? 0), 0),
    };
  }, [cache.data]);

  const isLoading = accounts.isLoading || cache.isLoading;
  const error = accounts.error ?? cache.error;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Network</h1>
          <p className="text-xs text-muted-foreground">
            {connected.length} connected · {compact(totals.followers)} followers ·{" "}
            {compact(totals.posts)} posts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={!connected.length || syncAll.isPending || sync.isPending}
          onClick={() => syncAll.mutate()}
        >
          <RefreshCw className={syncAll.isPending ? "size-3.5 animate-spin" : "size-3.5"} />
          Sync all
        </Button>
        <Button
          size="sm"
          className="h-8"
          onClick={() => setDraft({ platform: available[0]?.id ?? "github", handle: "" })}
        >
          <Plus className="size-3.5" />
          Connect account
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <LoadingState label="Loading your network…" />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              void accounts.refetch();
              void cache.refetch();
            }}
          />
        ) : (
          <div className="space-y-6">
            {connected.length === 0 ? (
              <EmptyState
                icon={<Users className="size-5" />}
                title="No profiles connected yet"
                description="Link GitHub, X, Reddit, Dev.to and more to pull live followers, posts and recent activity."
                action={
                  <Button size="sm" onClick={() => setDraft({ platform: "github", handle: "" })}>
                    <Plus className="size-3.5" />
                    Connect account
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {connected.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    profile={byPlatform.get(account.platform)}
                    syncing={syncing === account.id}
                    onSync={() => sync.mutate(account)}
                    onEdit={() =>
                      setDraft({
                        platform: account.platform,
                        handle: account.username,
                        editing: account,
                      })
                    }
                    onToggleAutoSync={() => toggleAutoSync.mutate(account)}
                    onEditStats={() => {
                      const profile = byPlatform.get(account.platform);
                      setStats({
                        account,
                        display_name: profile?.display_name ?? "",
                        bio: profile?.bio ?? "",
                        avatar_url: profile?.avatar_url ?? "",
                        followers: profile?.followers != null ? String(profile.followers) : "",
                        following: profile?.following != null ? String(profile.following) : "",
                        posts: profile?.posts != null ? String(profile.posts) : "",
                      });
                    }}
                    onDisconnect={() =>
                      setConfirm({
                        title: "Disconnect account?",
                        description: `${socialPlatform(account.platform)?.label ?? account.platform} (@${account.username}) and its cached profile will be removed.`,
                        confirmLabel: "Disconnect",
                        onConfirm: () => disconnect.mutate(account),
                      })
                    }
                  />
                ))}
              </div>
            )}

            {available.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Available platforms
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {available.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setDraft({ platform: platform.id, handle: "" })}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-card"
                    >
                      <img
                        src={socialLogo(platform)}
                        alt={`${platform.label} logo`}
                        loading="lazy"
                        className="size-5"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{platform.label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {platform.limitation ? "Link only" : "Live sync"}
                        </p>
                      </div>
                      <Plus className="ml-auto size-3.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <ConnectDialog
        draft={draft}
        onClose={() => setDraft(null)}
        onChange={setDraft}
        onSubmit={(value) => connect.mutate(value)}
        pending={connect.isPending}
        taken={connectedIds}
      />
      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
      <StatsDialog
        draft={stats}
        onClose={() => setStats(null)}
        onChange={setStats}
        onSubmit={(value) => saveStats.mutate(value)}
        pending={saveStats.isPending}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5 text-center">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function AccountCard({
  account,
  profile,
  syncing,
  onSync,
  onEdit,
  onToggleAutoSync,
  onEditStats,
  onDisconnect,
}: {
  account: SocialAccount;
  profile: SocialProfileCache | undefined;
  syncing: boolean;
  onSync: () => void;
  onEdit: () => void;
  onToggleAutoSync: () => void;
  onEditStats: () => void;
  onDisconnect: () => void;
}) {
  const meta = socialPlatform(account.platform);
  const extra = extraOf(profile);
  const manualCapable = MANUAL_PLATFORMS.has(account.platform);
  const isManual = Boolean(extra["manual"]);
  const activity = [
    ...links(extra, "recentArticles"),
    ...links(extra, "recentPosts"),
    ...links(extra, "recentRepos"),
    ...links(extra, "recentCommits"),
  ].slice(0, 4);
  const techStack = Array.isArray(extra["techStack"]) ? (extra["techStack"] as string[]) : [];
  const postsLabel = typeof extra["postsLabel"] === "string" ? extra["postsLabel"] : "Posts";
  const url = account.profile_url ?? meta?.profileUrl(account.username) ?? null;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="relative">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${account.username} avatar`}
              loading="lazy"
              className="size-11 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-full border border-border bg-background/60 text-xs font-semibold uppercase">
              {account.username.slice(0, 2)}
            </div>
          )}
          {meta ? (
            <img
              src={socialLogo(meta)}
              alt=""
              className="absolute -bottom-1 -right-1 size-4 rounded-full bg-background p-0.5"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">
              {profile?.display_name ?? meta?.label ?? account.platform}
            </p>
            {profile?.verified ? <BadgeCheck className="size-3.5 text-primary" /> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            @{profile?.handle ?? account.username} · {meta?.label ?? account.platform}
          </p>
        </div>
        {url ? (
          <Button asChild variant="ghost" size="icon" className="size-7">
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open profile">
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        ) : null}
      </div>

      {profile?.bio ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">{profile.bio}</p>
      ) : null}

      {profile?.location ? (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3" />
          {profile.location}
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Followers" value={compact(profile?.followers)} />
        <Stat label="Following" value={compact(profile?.following)} />
        <Stat label={postsLabel} value={compact(profile?.posts)} />
      </div>

      {typeof extra["karma"] === "number" || typeof extra["stars"] === "number" ? (
        <div className="flex flex-wrap gap-1.5">
          {typeof extra["stars"] === "number" ? (
            <Badge variant="secondary" className="text-[10px]">
              {compact(extra["stars"] as number)} stars
            </Badge>
          ) : null}
          {typeof extra["karma"] === "number" ? (
            <Badge variant="secondary" className="text-[10px]">
              {compact(extra["karma"] as number)} karma
            </Badge>
          ) : null}
          {typeof extra["reactions"] === "number" ? (
            <Badge variant="secondary" className="text-[10px]">
              {compact(extra["reactions"] as number)} reactions
            </Badge>
          ) : null}
        </div>
      ) : null}

      {techStack.length ? (
        <div className="flex flex-wrap gap-1.5">
          {techStack.slice(0, 6).map((tech) => (
            <Badge key={tech} variant="outline" className="text-[10px]">
              {tech}
            </Badge>
          ))}
        </div>
      ) : null}

      {activity.length ? (
        <ul className="space-y-1 border-t border-border/60 pt-2">
          {activity.map((item) => (
            <li key={`${item.url}-${item.title}`} className="truncate text-[11px]">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      {account.last_error ? (
        <p className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive">
          <AlertTriangle className="mt-0.5 size-3 shrink-0" />
          {account.last_error}
        </p>
      ) : manualCapable ? (
        <p className="text-[11px] text-muted-foreground">
          {isManual
            ? `${meta?.label ?? account.platform} numbers are the ones you entered — tap Stats to update them.`
            : `${meta?.label ?? account.platform} blocks automated profile reads. Add your numbers with Stats to fill this card.`}
        </p>
      ) : meta?.limitation ? (
        <p className="text-[11px] text-muted-foreground">{meta.limitation}</p>
      ) : null}

      <div className="mt-auto flex items-center gap-2 border-t border-border/60 pt-3">
        {manualCapable ? (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onEditStats}>
            <PencilLine className="size-3" />
            Stats
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={syncing}
            onClick={onSync}
          >
            <RefreshCw className={syncing ? "size-3 animate-spin" : "size-3"} />
            Sync
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onEdit}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-destructive hover:text-destructive"
          onClick={onDisconnect}
        >
          <Link2Off className="size-3" />
          Disconnect
        </Button>
        <label className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          Auto
          <Switch checked={account.auto_sync} onCheckedChange={onToggleAutoSync} />
        </label>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {account.last_synced
          ? `Synced ${new Date(account.last_synced).toLocaleString()}`
          : "Never synced"}
      </p>
    </article>
  );
}

function StatsDialog({
  draft,
  onClose,
  onChange,
  onSubmit,
  pending,
}: {
  draft: StatsDraft | null;
  onClose: () => void;
  onChange: (draft: StatsDraft) => void;
  onSubmit: (draft: StatsDraft) => void;
  pending: boolean;
}) {
  const meta = draft ? socialPlatform(draft.account.platform) : undefined;

  return (
    <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{meta?.label ?? "Profile"} stats</DialogTitle>
        </DialogHeader>
        {draft ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(draft);
            }}
          >
            <p className="text-[11px] text-muted-foreground">
              {meta?.label ?? "This platform"} requires a login for profile data, so automated sync
              cannot read it. Enter your numbers here and DevOS will keep them on the card.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="stats-name">
                Display name
              </Label>
              <Input
                id="stats-name"
                value={draft.display_name}
                onChange={(e) => onChange({ ...draft, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="stats-bio">
                Headline / bio
              </Label>
              <Input
                id="stats-bio"
                value={draft.bio}
                onChange={(e) => onChange({ ...draft, bio: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="stats-avatar">
                Avatar image URL
              </Label>
              <Input
                id="stats-avatar"
                placeholder="https://…"
                value={draft.avatar_url}
                onChange={(e) => onChange({ ...draft, avatar_url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="stats-followers">
                  Followers
                </Label>
                <Input
                  id="stats-followers"
                  inputMode="numeric"
                  value={draft.followers}
                  onChange={(e) => onChange({ ...draft, followers: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="stats-following">
                  Following
                </Label>
                <Input
                  id="stats-following"
                  inputMode="numeric"
                  value={draft.following}
                  onChange={(e) => onChange({ ...draft, following: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs" htmlFor="stats-posts">
                  Posts
                </Label>
                <Input
                  id="stats-posts"
                  inputMode="numeric"
                  value={draft.posts}
                  onChange={(e) => onChange({ ...draft, posts: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save stats"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ConnectDialog({
  draft,
  onClose,
  onChange,
  onSubmit,
  pending,
  taken,
}: {
  draft: Draft | null;
  onClose: () => void;
  onChange: (draft: Draft) => void;
  onSubmit: (draft: Draft) => void;
  pending: boolean;
  taken: Set<string>;
}) {
  const meta: SocialPlatformMeta | undefined = draft ? socialPlatform(draft.platform) : undefined;
  const editing = Boolean(draft?.editing);

  return (
    <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit account" : "Connect account"}</DialogTitle>
        </DialogHeader>
        {draft ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(draft);
            }}
          >
            <div className="space-y-2">
              <Label className="text-xs">Platform</Label>
              <div className="grid grid-cols-3 gap-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const disabled = !editing && taken.has(platform.id);
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      disabled={disabled || editing}
                      onClick={() => onChange({ ...draft, platform: platform.id })}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[11px] transition disabled:opacity-40 ${
                        draft.platform === platform.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <img src={socialLogo(platform)} alt="" className="size-4" />
                      <span className="truncate">{platform.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="social-handle">
                {meta?.inputLabel ?? "Username"}
              </Label>
              <Input
                id="social-handle"
                autoFocus
                value={draft.handle}
                placeholder={meta?.placeholder}
                onChange={(event) => onChange({ ...draft, handle: event.target.value })}
              />
              {meta?.limitation ? (
                <p className="text-[11px] text-muted-foreground">{meta.limitation}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  DevOS reads the public profile — no password or token needed.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || !draft.handle.trim()}>
                {pending ? "Connecting…" : editing ? "Save & sync" : "Connect & sync"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
