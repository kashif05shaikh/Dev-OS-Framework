import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  BookOpen,
  Briefcase,
  CalendarDays,
  Camera,
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  FileText,
  Flame,
  FolderKanban,
  GitBranch,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Trophy,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { toast } from "sonner";

import { AmbientBackground } from "@/components/dashboard/ambient";
import {
  Counter,
  GlassCard,
  ProgressBar,
  Reveal,
  Shimmer,
  riseIn,
  stagger,
} from "@/components/dashboard/ui";
import { ErrorState } from "@/components/states";
import { fetchCodingStats } from "@/lib/coding-profiles.functions";
import {
  calendarEventsQuery,
  codingProfilesQuery,
  describeError,
  focusSessionsQuery,
  goalsQuery,
  jobApplicationsQuery,
  learningResourcesQuery,
  notesQuery,
  profileQuery,
  projectsQuery,
  resumesQuery,
  updateRow,
} from "@/lib/devos-queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { buildActivityPayload, summariseCodingProfiles } from "@/lib/coding-activity";
import { CodingActivityHeatmap } from "@/components/coding-activity-heatmap";
import { atcoderBand, codechefStars, codeforcesBand, leetcodeBand } from "@/lib/coding-titles";
import { CODING_PLATFORM_LABEL, SYNCABLE_PLATFORMS, type CodingProfile } from "@/lib/devos-types";
import { useCodingAutoSync } from "@/lib/use-coding-autosync";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DevOS Developer Workspace" },
      {
        name: "description",
        content:
          "Your DevOS mission control: focus stats, coding profiles, goals, projects, learning and AI insights in one premium dashboard.",
      },
      { property: "og:title", content: "Dashboard — DevOS Developer Workspace" },
      {
        property: "og:description",
        content:
          "Focus stats, coding profiles, goals, projects and AI insights in one premium developer dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function compressAndCropImage(file: File, maxSize = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);
          resolve(canvas.toDataURL("image/jpeg", 0.88));
        } catch {
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ProfilePhotoOption({
  userId,
  userMetadataAvatar,
  displayName,
}: {
  userId?: string | null | undefined;
  userMetadataAvatar?: string | null | undefined;
  displayName: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEnteringUrl, setIsEnteringUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const storageKey = userId ? `devos.profile_avatar_${userId}` : "devos.profile_avatar_default";

  useEffect(() => {
    let cached: string | null = null;
    if (typeof window !== "undefined") {
      try {
        cached = localStorage.getItem(storageKey);
      } catch {
        /* storage unavailable */
      }
    }
    if (cached) {
      setAvatarUrl(cached);
    } else if (userMetadataAvatar) {
      setAvatarUrl(userMetadataAvatar);
    }
  }, [storageKey, userMetadataAvatar]);

  const saveAvatar = async (url: string | null) => {
    setAvatarUrl(url);
    if (typeof window !== "undefined") {
      try {
        if (url) {
          localStorage.setItem(storageKey, url);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        /* storage unavailable */
      }
    }
    try {
      await supabase.auth.updateUser({
        data: { avatar_url: url },
      });
    } catch (err) {
      console.warn("Could not sync avatar to Supabase auth:", err);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    setIsUploading(true);
    try {
      const processed = await compressAndCropImage(file);
      await saveAvatar(processed);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleSaveUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error("Please enter an image URL");
      return;
    }
    setIsUploading(true);
    try {
      await saveAvatar(trimmed);
      setUrlInput("");
      setIsEnteringUrl(false);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    try {
      await saveAvatar(null);
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setIsUploading(false);
    }
  };

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") ||
    displayName.slice(0, 2).toUpperCase() ||
    "ME";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.25 }}
      className="flex w-full flex-col items-center justify-center rounded-[20px] border border-border bg-white/[0.03] p-5 sm:p-6 lg:w-72"
    >
      <div className="flex w-full items-center justify-between pb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Profile Photo
        </span>
        {avatarUrl && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={isUploading}
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
            title="Remove profile photo"
          >
            <Trash2 className="size-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload profile photo"
        title="Click or drop an image to attach profile photo"
        className={cn(
          "group relative size-28 sm:size-32 cursor-pointer select-none rounded-full p-1 ring-2 transition-all duration-300 focus:outline-none focus-visible:ring-primary",
          isDragging
            ? "scale-105 ring-primary ring-offset-2 ring-offset-background"
            : "ring-primary/20 hover:ring-primary/60",
        )}
      >
        <div className="relative size-full overflow-hidden rounded-full border border-border/80 bg-gradient-to-br from-primary/10 via-background to-muted/40 shadow-inner flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName}'s profile photo`}
              className="size-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <span className="text-2xl font-bold tracking-tight text-foreground/80 sm:text-3xl">
                {initials}
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                Attach photo
              </span>
            </div>
          )}

          {/* Hover overlay with camera icon and label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/65 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 text-white">
            <Camera className="size-5" />
            <span className="mt-1 text-[11px] font-medium tracking-tight">
              {avatarUrl ? "Change" : "Upload"}
            </span>
          </div>
        </div>

        {/* Small floating action badge */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition-transform duration-200 hover:scale-110 active:scale-95"
          title="Upload image"
          aria-label="Upload image"
        >
          <Camera className="size-3.5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {isEnteringUrl ? (
        <div className="mt-3.5 flex w-full items-center gap-1.5">
          <input
            type="url"
            placeholder="https://..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="h-8 flex-1 rounded-lg border border-border bg-background/80 px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSaveUrl();
              if (e.key === "Escape") setIsEnteringUrl(false);
            }}
          />
          <button
            type="button"
            onClick={handleSaveUrl}
            disabled={isUploading || !urlInput.trim()}
            className="h-8 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEnteringUrl(false)}
            className="h-8 rounded-lg px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="mt-3.5 flex w-full flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-white/[0.04] text-xs font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          >
            {isUploading ? (
              <RefreshCw className="size-3.5 animate-spin text-primary" />
            ) : (
              <Upload className="size-3.5 text-primary" />
            )}
            <span>
              {isUploading ? "Updating..." : avatarUrl ? "Change Photo" : "Attach Photo"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsEnteringUrl(true)}
            className="text-[11px] text-muted-foreground/80 transition-colors hover:text-primary hover:underline underline-offset-2"
          >
            Or paste image URL
          </button>
        </div>
      )}
    </motion.div>
  );
}

function greeting(hour: number) {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastDays(n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Shimmer className="h-44 w-full rounded-[22px]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer key={i} className="h-32 rounded-[22px]" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Shimmer className="h-80 rounded-[22px] lg:col-span-2" />
        <Shimmer className="h-80 rounded-[22px]" />
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery(profileQuery());
  const notes = useQuery(notesQuery());
  const resources = useQuery(learningResourcesQuery());
  const projects = useQuery(projectsQuery());
  const jobs = useQuery(jobApplicationsQuery());
  const goals = useQuery(goalsQuery());
  const events = useQuery(calendarEventsQuery());
  const focus = useQuery(focusSessionsQuery(30));
  const coding = useQuery(codingProfilesQuery());
  // Keeps streak/titles live: refreshes stale platforms on load and hourly.
  useCodingAutoSync(coding.data);
  const resumes = useQuery(resumesQuery());

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const toggleEvent = useMutation({
    mutationFn: async (event: { id: string; completed: boolean }) =>
      updateRow("calendar_events", event as never, { completed: !event.completed }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["calendar_events"] }),
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const bumpGoal = useMutation({
    mutationFn: async (goal: { id: string; current_value: number; target_value: number }) =>
      updateRow("goals", goal as never, {
        current_value: Math.min(goal.target_value, Number(goal.current_value) + 1),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Progress updated");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const fetchStats = useServerFn(fetchCodingStats);

  const syncAllCoding = useMutation({
    mutationFn: async () => {
      const rows = (coding.data ?? []).filter((p) =>
        (SYNCABLE_PLATFORMS as readonly string[]).includes(p.platform),
      );
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
      if (failed.length === 0) toast.success(`Synced ${total} coding platforms`);
      else
        toast.warning(
          `Synced ${total - failed.length}/${total} · failed: ${failed
            .map((p) => CODING_PLATFORM_LABEL[p] ?? p)
            .join(", ")}`,
        );
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const queries = [notes, resources, projects, jobs, goals, events, focus, coding, resumes];
  const isLoading = queries.some((q) => q.isLoading);
  const error = queries.find((q) => q.error)?.error;

  const derived = useMemo(() => {
    const days = lastDays(14);
    const focusByDay = new Map(days.map((d) => [d, 0]));
    for (const s of focus.data ?? []) {
      const k = (s.started_at ?? s.created_at).slice(0, 10);
      if (focusByDay.has(k))
        focusByDay.set(k, (focusByDay.get(k) ?? 0) + (s.actual_seconds ?? 0) / 60);
    }
    const focusSeries = days.map((d) => ({
      day: d.slice(5),
      minutes: Math.round(focusByDay.get(d) ?? 0),
    }));

    const profiles = coding.data ?? [];
    // Same aggregation the Coding Profiles heatmap uses — one source of truth.
    const codingSummary = summariseCodingProfiles(profiles);
    const problems = codingSummary.solved;
    const contests = codingSummary.contests;
    const streak = codingSummary.currentStreak;

    const jobList = jobs.data ?? [];
    const pipeline = ["applied", "interview", "offer", "rejected"].map((status) => ({
      name: status[0]!.toUpperCase() + status.slice(1),
      value: jobList.filter((j) => j.status === status).length,
    }));

    const resList = resources.data ?? [];
    const completedRes = resList.filter((r) => r.completed).length;

    const projList = projects.data ?? [];
    const doneProjects = projList.filter((p) => p.status === "shipped").length;

    const resumeScore = (() => {
      const r = resumes.data ?? [];
      if (!r.length) return 0;
      return Math.min(100, 40 + r.length * 10 + Math.min(30, notes.data?.length ?? 0));
    })();

    const activity = [
      ...(notes.data ?? []).map((n) => ({
        id: `n-${n.id}`,
        at: n.updated_at ?? n.created_at,
        icon: FileText,
        label: `Note updated — ${n.title}`,
        to: "/notes" as const,
      })),
      ...(projList ?? []).map((p) => ({
        id: `p-${p.id}`,
        at: p.updated_at ?? p.created_at,
        icon: FolderKanban,
        label: `Project ${p.name} at ${p.progress_percent}%`,
        to: "/projects" as const,
      })),
      ...(jobList ?? []).map((j) => ({
        id: `j-${j.id}`,
        at: j.updated_at ?? j.created_at,
        icon: Briefcase,
        label: `${j.role_title} @ ${j.company} — ${j.status}`,
        to: "/jobs" as const,
      })),
      ...resList.map((r) => ({
        id: `r-${r.id}`,
        at: r.updated_at ?? r.created_at,
        icon: BookOpen,
        label: `Resource ${r.completed ? "completed" : "saved"} — ${r.title}`,
        to: "/learning" as const,
      })),
      ...profiles.map((p) => ({
        id: `c-${p.id}`,
        at: p.last_synced_at ?? p.updated_at,
        icon: GitBranch,
        label: `${p.platform} synced — ${p.problems_solved} solved`,
        to: "/profiles" as const,
      })),
    ]
      .filter((a) => Boolean(a.at))
      .sort((a, b) => (a.at! < b.at! ? 1 : -1))
      .slice(0, 8);

    const skills = [
      { skill: "DSA", value: Math.min(100, problems / 3) },
      { skill: "Projects", value: Math.min(100, projList.length * 12) },
      { skill: "Learning", value: resList.length ? (completedRes / resList.length) * 100 : 0 },
      { skill: "Focus", value: Math.min(100, focusSeries.reduce((s, d) => s + d.minutes, 0) / 6) },
      { skill: "Career", value: Math.min(100, jobList.length * 10) },
      { skill: "Writing", value: Math.min(100, (notes.data?.length ?? 0) * 8) },
    ].map((s) => ({ ...s, value: Math.round(s.value) }));

    return {
      focusSeries,
      problems,
      contests,
      streak,
      activeDays: codingSummary.activeDays,
      codingDays: codingSummary.days,
      submissions: codingSummary.submissions,
      pipeline,
      completedRes,
      totalRes: resList.length,
      doneProjects,
      resumeScore,
      activity,
      skills,
      profiles,
    };
  }, [focus.data, coding.data, jobs.data, resources.data, projects.data, notes.data, resumes.data]);

  if (isLoading) return <DashboardSkeleton />;
  if (error)
    return <ErrorState error={error} onRetry={() => queries.forEach((q) => void q.refetch())} />;

  const name = profile.data?.display_name?.trim() || user?.email?.split("@")[0] || "developer";
  const today = dayKey(new Date());
  const todayEvents = (events.data ?? []).filter((e) => e.event_date === today);
  const upcoming = (events.data ?? [])
    .filter((e) => e.event_date > today && !e.completed)
    .slice(0, 4);
  const activeGoals = (goals.data ?? []).filter((g) => g.status !== "completed").slice(0, 4);
  const activeProjects = (projects.data ?? []).filter((p) => p.status !== "archived").slice(0, 4);
  const pinnedNotes = [...(notes.data ?? [])]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned))
    .slice(0, 5);
  const openJobs = (jobs.data ?? []).filter(
    (j) => j.status !== "rejected" && j.status !== "offer",
  ).length;
  const focus7 = derived.focusSeries.slice(-7);
  const focusMinutes7 = focus7.reduce((s, d) => s + d.minutes, 0);

  type MetricCardItem = {
    label: string;
    value: number;
    icon: typeof Code2;
    to: "/profiles" | "/projects" | "/jobs" | "/calendar";
    accent: string;
    suffix?: string;
    decimals?: number;
  };

  const metrics: MetricCardItem[] = [
    {
      label: "Problems solved",
      value: derived.problems,
      icon: Code2,
      to: "/profiles" as const,
      accent: "var(--chart-1)",
    },
    {
      label: "Active days",
      value: derived.activeDays || derived.streak,
      suffix: "d",
      icon: Flame,
      to: "/profiles" as const,
      accent: "var(--chart-4)",
    },
    {
      label: "Projects done",
      value: derived.doneProjects,
      icon: FolderKanban,
      to: "/projects" as const,
      accent: "var(--chart-5)",
    },
    {
      label: "Contests",
      value: derived.contests,
      icon: Activity,
      to: "/calendar" as const,
      accent: "var(--chart-2)",
    },
  ];

  // Live coding titles straight off the synced Coding Profiles rows.
  const titleRows = (["codeforces", "codechef", "leetcode", "atcoder"] as const).map((platform) => {
    const row = derived.profiles.find((p) => p.platform === platform);
    const rating = row?.rating ?? null;
    if (platform === "codeforces") {
      const band = codeforcesBand(rating);
      return {
        platform,
        label: "Codeforces",
        title: row?.rank_label ?? band?.title ?? null,
        color: band?.color ?? "var(--foreground)",
        rating,
        stars: 0,
      };
    }
    if (platform === "atcoder") {
      const band = atcoderBand(rating);
      return {
        platform,
        label: "AtCoder",
        title: band?.name ?? null,
        color: band?.color ?? "var(--foreground)",
        rating,
        stars: 0,
      };
    }
    if (platform === "leetcode") {
      const band = leetcodeBand(rating);
      return {
        platform,
        label: "LeetCode",
        title: row?.rank_label ?? band?.title ?? null,
        color: band?.color ?? "var(--foreground)",
        rating,
        stars: 0,
      };
    }
    return {
      platform,
      label: "CodeChef",
      title: null,
      color: "#facc15",
      rating,
      stars: codechefStars(rating),
    };
  });

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <Reveal>
          <GlassCard className="p-6 sm:p-8" tilt={false}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-medium tracking-wide text-primary"
                >
                  <Zap className="size-3" />
                  DevOS · Developer Operating System
                </motion.div>

                <h1 className="dash-gradient-text mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
                  {greeting(now.getHours())}, {name} 👋
                </h1>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                  {todayEvents.filter((e) => !e.completed).length
                    ? `${todayEvents.filter((e) => !e.completed).length} item(s) left on today's schedule. Let's clear them.`
                    : "Nothing scheduled today — pick a goal and make measurable progress."}
                </p>

              </div>

              <ProfilePhotoOption
                userId={user?.id}
                userMetadataAvatar={user?.user_metadata?.["avatar_url"] as string | undefined}
                displayName={name}
              />
            </div>
          </GlassCard>
        </Reveal>

        {/* ── Metrics ──────────────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {metrics.map((m) => (
            <motion.div key={m.label} variants={riseIn}>
              <Link to={m.to} className="block">
                <GlassCard className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </span>
                    <motion.span
                      whileHover={{ rotate: 12, scale: 1.15 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12 }}
                      className="grid size-8 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.04] text-primary"
                    >
                      <m.icon className="size-4" />
                    </motion.span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    <Counter value={m.value} decimals={m.decimals ?? 0} suffix={m.suffix ?? ""} />
                  </p>
                </GlassCard>
              </Link>
            </motion.div>
          ))}

          {/* Coding Activity Heatmap */}
          <motion.div variants={riseIn} className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <GlassCard className="p-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Coding activity
                </span>
                <span className="text-[11px] text-muted-foreground/75">
                  · across verified platforms
                </span>
              </div>
              <CodingActivityHeatmap
                days={derived.codingDays}
                submissions={derived.submissions}
                maxStreak={derived.streak}
                currentStreak={derived.streak}
                className="mt-4"
              />
            </GlassCard>
          </motion.div>

          <motion.div variants={riseIn} className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <Link to="/profiles" className="block">
              <GlassCard className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Coding titles
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={syncAllCoding.isPending || (coding.data ?? []).length === 0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        syncAllCoding.mutate();
                      }}
                      className="grid size-8 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.04] text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                      aria-label="Sync coding profiles"
                      title="Sync coding profiles"
                    >
                      <RefreshCw
                        className={cn("size-4", syncAllCoding.isPending && "animate-spin")}
                      />
                    </button>
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.04] text-primary">
                      <Trophy className="size-4" />
                    </span>
                  </div>
                </div>
                {titleRows.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Sync a rated platform in Coding Profiles to see your titles here.
                  </p>
                ) : (
                  <ul className="mt-3 grid w-full grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {titleRows.map((row) => (
                      <li
                        key={row.platform}
                        className="flex min-h-[110px] w-full flex-col items-center justify-center rounded-xl border border-border bg-white/[0.03] px-3 py-4 text-center"
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {row.label}
                        </span>
                        {row.stars > 0 ? (
                          <div className="mt-1 flex items-center justify-center">
                            <span
                              className="text-lg font-semibold leading-tight"
                              style={{ color: row.color }}
                            >
                              {"★".repeat(row.stars)}
                            </span>
                          </div>
                        ) : row.title ? (
                          <div className="mt-1 flex items-center justify-center">
                            <span
                              className="text-base font-semibold leading-tight"
                              style={{ color: row.color }}
                            >
                              {row.title}
                            </span>
                          </div>
                        ) : null}
                        <div className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums text-foreground">
                          {row.rating ?? "—"}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassCard>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Charts + right rail ──────────────────────────────── */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <motion.div variants={riseIn} className="lg:col-span-2">
            <GlassCard className="p-6" tilt={false}>
              <div>
                <h2 className="text-sm font-semibold">Focus trend</h2>
                <p className="text-xs text-muted-foreground">
                  Minutes of deep work, last 14 days
                </p>
              </div>
              <div className="mt-5 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={derived.focusSeries}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      interval="preserveStartEnd"
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }}
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#focusFill)"
                      animationDuration={1200}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={riseIn}>
            <GlassCard className="p-6" tilt={false}>
              <h2 className="text-sm font-semibold">Skills radar</h2>
              <p className="text-xs text-muted-foreground">Derived from your live DevOS data</p>
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={derived.skills} outerRadius="72%">
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <Radar
                      dataKey="value"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.28}
                      animationDuration={1200}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* ── Productivity row ─────────────────────────────────── */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <motion.div variants={riseIn}>
            <GlassCard className="h-full p-6" tilt={false}>
              <h2 className="text-sm font-semibold">Today&apos;s focus</h2>
              {todayEvents.length === 0 ? (
                <EmptyLine to="/calendar" label="Schedule something" text="Nothing today." />
              ) : (
                <ul className="mt-4 space-y-1">
                  <AnimatePresence initial={false}>
                    {todayEvents.map((event) => (
                      <motion.li
                        key={event.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleEvent.mutate(event)}
                          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-white/[0.05]"
                        >
                          {event.completed ? (
                            <CheckCircle2 className="size-4 shrink-0 text-primary" />
                          ) : (
                            <Circle className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span
                            className={cn(
                              "truncate",
                              event.completed && "text-muted-foreground line-through",
                            )}
                          >
                            {event.title}
                          </span>
                          {event.start_time ? (
                            <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
                              {event.start_time.slice(0, 5)}
                            </span>
                          ) : null}
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}

              {upcoming.length ? (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Up next
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {upcoming.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <CalendarDays className="size-3.5 shrink-0" />
                        <span className="truncate">{e.title}</span>
                        <span className="ml-auto shrink-0 tabular-nums">{e.event_date}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </GlassCard>
          </motion.div>

          <motion.div variants={riseIn}>
            <GlassCard className="h-full p-6" tilt={false}>
              <h2 className="text-sm font-semibold">Pinned goals</h2>
              {activeGoals.length === 0 ? (
                <EmptyLine to="/goals" label="Set a goal" text="No active goals." />
              ) : (
                <ul className="mt-4 space-y-4">
                  {activeGoals.map((goal) => {
                    const target = Number(goal.target_value) || 0;
                    const current = Number(goal.current_value) || 0;
                    const pct =
                      target > 0
                        ? Math.max(0, Math.min(100, Math.round((current / target) * 100)))
                        : 0;
                    return (
                      <li key={goal.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm">{goal.title}</span>
                          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {goal.current_value}/{goal.target_value} {goal.unit}
                          </span>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={`Add progress to ${goal.title}`}
                            disabled={bumpGoal.isPending}
                            onClick={() => bumpGoal.mutate(goal)}
                            className="grid size-6 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                          >
                            <Plus className="size-3.5" />
                          </motion.button>
                        </div>
                        <ProgressBar value={pct} className="mt-2" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </GlassCard>
          </motion.div>

          <motion.div variants={riseIn}>
            <GlassCard className="h-full p-6" tilt={false}>
              <h2 className="text-sm font-semibold">Job pipeline</h2>
              {(jobs.data ?? []).length === 0 ? (
                <EmptyLine to="/jobs" label="Track an application" text="No applications yet." />
              ) : (
                <div className="mt-2 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={derived.pipeline}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={3}
                        stroke="none"
                        animationDuration={1100}
                      >
                        {derived.pipeline.map((_, i) => (
                          <Cell key={i} fill={`var(--chart-${i + 1})`} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* ── Notes / projects / learning ──────────────────────── */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <motion.div variants={riseIn}>
            <GlassCard className="h-full p-6" tilt={false}>
              <h2 className="text-sm font-semibold">Quick notes</h2>
              {pinnedNotes.length === 0 ? (
                <EmptyLine to="/notes" label="Create a note" text="No notes yet." />
              ) : (
                <ul className="mt-4 space-y-1">
                  {pinnedNotes.map((note) => (
                    <li key={note.id}>
                      <Link
                        to="/notes"
                        search={{ note: note.id }}
                        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                      >
                        {note.pinned ? (
                          <Star className="size-3.5 shrink-0 fill-primary text-primary" />
                        ) : (
                          <FileText className="size-3.5 shrink-0" />
                        )}
                        <span className="truncate">{note.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </motion.div>

          <motion.div variants={riseIn}>
            <GlassCard className="h-full p-6" tilt={false}>
              <h2 className="text-sm font-semibold">Active projects</h2>
              {activeProjects.length === 0 ? (
                <EmptyLine to="/projects" label="Create a project" text="No projects yet." />
              ) : (
                <ul className="mt-4 space-y-3">
                  {activeProjects.map((p) => (
                    <li key={p.id}>
                      <Link
                        to="/projects"
                        className="block rounded-xl px-2 py-1.5 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-2">
                          <FolderKanban className="size-3.5 shrink-0 text-primary" />
                          <span className="truncate text-sm">{p.name}</span>
                          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {p.progress_percent}%
                          </span>
                        </div>
                        <ProgressBar value={p.progress_percent ?? 0} className="mt-2" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </motion.div>

          <motion.div variants={riseIn}>
            <GlassCard className="h-full p-6" tilt={false}>
              <h2 className="text-sm font-semibold">Learning progress</h2>
              {derived.totalRes === 0 ? (
                <EmptyLine to="/learning" label="Add a resource" text="No resources yet." />
              ) : (
                <>
                  <p className="mt-6 text-3xl font-semibold">
                    <Counter
                      value={Math.round((derived.completedRes / derived.totalRes) * 100)}
                      suffix="%"
                    />
                  </p>
                  <ProgressBar
                    value={(derived.completedRes / derived.totalRes) * 100}
                    className="mt-3 h-2"
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    {derived.completedRes} of {derived.totalRes} resources completed
                  </p>
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                    <Clock className="size-3.5 text-primary" />
                    {focusMinutes7} minutes focused in the last 7 days
                  </div>
                </>
              )}
            </GlassCard>
          </motion.div>
        </div>

        <div className="h-10" />
      </motion.div>
    </div>
  );
}

function EmptyLine({
  text,
  label,
  to,
}: {
  text: string;
  label: string;
  to: "/notes" | "/goals" | "/projects" | "/learning" | "/calendar" | "/jobs";
}) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-4 text-sm text-muted-foreground"
    >
      {text}{" "}
      <Link to={to} className="text-primary underline underline-offset-4">
        {label}
      </Link>
      .
    </motion.p>
  );
}
