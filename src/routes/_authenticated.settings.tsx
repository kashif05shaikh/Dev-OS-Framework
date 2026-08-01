import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Check, Download, LogOut, Palette, ShieldCheck, Trash2, User } from "lucide-react";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ACCENTS, applyAccent, cacheAccent, resolveAccent } from "@/lib/accent";
import { describeError, profileQuery, updateRow } from "@/lib/devos-queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DevOS" },
      {
        name: "description",
        content:
          "Manage your DevOS profile, accent theme, notifications, data export and account security.",
      },
      { property: "og:title", content: "Settings — DevOS" },
      {
        property: "og:description",
        content: "Profile, accent theme, notifications, data export and account security in DevOS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const EXPORT_TABLES = [
  "profiles",
  "subjects",
  "note_folders",
  "notes",
  "learning_folders",
  "learning_resources",
  "projects",
  "project_tasks",
  "job_applications",
  "coding_profiles",
  "resumes",
  "resume_sections",
  "resume_entries",
  "ai_prompts",
  "calendar_events",
  "goals",
  "goal_milestones",
  "focus_sessions",
  "social_accounts",
  "social_profile_cache",
] as const;

/** Child rows are removed before their parents so FKs stay satisfied. */
const WIPE_ORDER = [
  "goal_milestones",
  "goals",
  "project_tasks",
  "projects",
  "resume_entries",
  "resume_sections",
  "resumes",
  "notes",
  "note_folders",
  "learning_resources",
  "learning_folders",
  "subjects",
  "job_applications",
  "coding_profiles",
  "ai_prompts",
  "calendar_events",
  "focus_sessions",
  "social_profile_cache",
  "social_accounts",
] as const;

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingsPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery());

  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [exporting, setExporting] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );

  useEffect(() => {
    if (profile.data) setDisplayName(profile.data.display_name ?? "");
  }, [profile.data]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const saveProfile = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!profile.data) throw new Error("Profile not loaded yet.");
      await updateRow("profiles", profile.data as never, patch);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved");
    },
    onError: (error: unknown) => toast.error(describeError(error)),
  });

  const changePassword = useMutation({
    mutationFn: async (next: string) => {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setPassword("");
      toast.success("Password updated");
    },
    onError: (error: unknown) => toast.error(describeError(error)),
  });

  const wipe = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in.");
      for (const table of WIPE_ORDER) {
        const { error } = await supabase.from(table).delete().eq("user_id", user.id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
      toast.success("All workspace data deleted");
    },
    onError: (error: unknown) => toast.error(describeError(error)),
  });

  async function exportData() {
    setExporting(true);
    try {
      const payload: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        account: { id: user?.id ?? null, email: user?.email ?? null },
      };
      for (const table of EXPORT_TABLES) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw new Error(error.message);
        payload[table] = data ?? [];
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `devos-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setExporting(false);
    }
  }

  async function requestNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("This browser does not support notifications.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      new Notification("DevOS", { body: "Reminders are on. You'll get calendar alerts here." });
      toast.success("Notifications enabled");
    } else {
      toast.error("Notifications blocked. Allow them in your browser site settings.");
    }
  }

  if (profile.isLoading) {
    return (
      <div className="p-6">
        <LoadingState label="Loading settings…" />
      </div>
    );
  }
  if (profile.isError) {
    return (
      <div className="p-6">
        <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      </div>
    );
  }

  const currentAccent = resolveAccent(profile.data?.accent_color);
  const nameDirty = displayName.trim() !== (profile.data?.display_name ?? "").trim();

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your profile, appearance, notifications and data — all saved to your account.
        </p>
      </header>

      <Section icon={User} title="Profile" description="How DevOS greets you across the workspace.">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              placeholder="Your name"
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
          <Button
            disabled={!nameDirty || saveProfile.isPending}
            onClick={() => saveProfile.mutate({ display_name: displayName.trim() || null })}
          >
            Save
          </Button>
        </div>
      </Section>

      <Section
        icon={Palette}
        title="Appearance"
        description="Pick the accent used for highlights, charts and active states."
      >
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((accent) => {
            const active = accent.key === currentAccent.key;
            return (
              <button
                key={accent.key}
                type="button"
                onClick={() => {
                  applyAccent(accent.key);
                  cacheAccent(accent.key);
                  saveProfile.mutate({ accent_color: accent.key });
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                  active
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                <span
                  className="size-4 rounded-full ring-1 ring-white/20"
                  style={{ backgroundColor: accent.swatch }}
                />
                {accent.label}
                {active ? <Check className="size-3.5 text-primary" /> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          DevOS uses a permanent dark theme — accents keep the black UI intact.
        </p>
      </Section>

      <Section
        icon={Bell}
        title="Notifications"
        description="Browser reminders for calendar events and focus sessions."
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
            Status: {permission === "unsupported" ? "not supported" : permission}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={permission === "granted" || permission === "unsupported"}
            onClick={() => void requestNotifications()}
          >
            {permission === "granted" ? "Enabled" : "Enable notifications"}
          </Button>
        </div>
      </Section>

      <Section
        icon={ShieldCheck}
        title="Account"
        description="Your sign-in email and password."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} readOnly disabled />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button
              variant="outline"
              disabled={password.length < 8 || changePassword.isPending}
              onClick={() => changePassword.mutate(password)}
            >
              Update password
            </Button>
          </div>
          <Separator />
          <Button variant="ghost" size="sm" onClick={() => void signOut()}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </Section>

      <Section
        icon={Download}
        title="Your data"
        description="Export everything, or wipe your workspace and start clean."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={exporting} onClick={() => void exportData()}>
            <Download className="size-4" />
            {exporting ? "Preparing…" : "Export JSON"}
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={wipe.isPending}
            onClick={() =>
              setConfirm({
                title: "Delete all workspace data?",
                description:
                  "Notes, projects, jobs, goals, resumes, prompts, events, focus sessions and connected profiles will be permanently removed. Your account stays active.",
                confirmLabel: "Delete everything",
                onConfirm: () => {
                  setConfirm(null);
                  wipe.mutate();
                },
              })
            }
          >
            <Trash2 className="size-4" />
            Delete all data
          </Button>
        </div>
      </Section>

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}