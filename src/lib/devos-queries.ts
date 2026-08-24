import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type {
  LearningFolder,
  LearningResource,
  Note,
  NoteFolder,
  Subject,
} from "@/lib/devos-types";
import type { JobApplication, Project, ProjectTask } from "@/lib/devos-types";
import type {
  CodingProfile,
  Resume,
  ResumeEntry,
  ResumeSection,
} from "@/lib/devos-types";
import type { AiPrompt, CalendarEvent } from "@/lib/devos-types";
import type { Goal, GoalMilestone, Habit, HabitLog } from "@/lib/devos-types";
import type { FocusSession, Profile, ResumeFile } from "@/lib/devos-types";

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(describeError(result.error));
  return (result.data ?? []) as T;
}

/** Turn low-level fetch/PostgREST failures into messages a human can act on. */
export function describeError(error: unknown): string {
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : ((error as { message?: string } | null)?.message ?? "");

  const lower = raw.toLowerCase();

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Reconnect and try again — your changes are kept until the save succeeds.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("network request failed")
  ) {
    return "Cannot reach the database. This is usually a network issue or a browser extension / ad-blocker blocking the request — disable it for this site and try again.";
  }
  if (lower.includes("jwt") || lower.includes("401") || lower.includes("not authenticated")) {
    return "Your session expired. Please sign in again.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "You don't have permission to change this item.";
  }
  if (lower.includes("timeout") || lower.includes("aborted")) {
    return "The request timed out. Please try again.";
  }
  return raw || "Something went wrong. Please try again.";
}

function isRetryable(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error ?? "")).toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("cannot reach the database") ||
    msg.includes("timed out") ||
    msg.includes("timeout")
  );
}

/** Retry transient network failures with backoff, then surface a friendly error. */
export async function runWithRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
    }
  }
  throw new Error(describeError(lastError));
}

/** Throws a friendly Error when a Supabase call returned one. */
export function assertOk(error: { message: string } | null): void {
  if (error) throw new Error(describeError(error));
}

function looksLikeNetworkFailure(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed") ||
    m.includes("network request failed")
  );
}

type UpdatableTable =
  | "subjects"
  | "notes"
  | "note_folders"
  | "learning_folders"
  | "learning_resources"
  | "projects"
  | "project_tasks"
  | "job_applications"
  | "coding_profiles"
  | "profiles"
  | "resumes"
  | "resume_sections"
  | "resume_entries"
  | "resume_files"
  | "ai_prompts"
  | "calendar_events"
  | "goals"
  | "goal_milestones"
  | "habits"
  | "habit_logs"
  | "focus_sessions"
  | "social_accounts"
  | "social_profile_cache";

/**
 * Update a row by id.
 *
 * Some browser extensions, privacy tools and corporate proxies block the HTTP
 * PATCH method outright, which surfaces as "Failed to fetch" even though the
 * database is perfectly reachable. When that happens we retry the very same
 * change as a POST upsert (full row + patch), which those tools allow.
 */
export async function updateRow(
  table: UpdatableTable,
  row: { id: string } & Record<string, unknown>,
  patch: Record<string, unknown>,
): Promise<void> {
  await runWithRetry(async () => {
    const attempt = await supabase
      .from(table)
      .update(patch as never)
      .eq("id", row.id)
      .select("id");

    if (!attempt.error) {
      if (!attempt.data || attempt.data.length === 0) {
        throw new Error("This item no longer exists — it may have been deleted.");
      }
      return;
    }

    if (!looksLikeNetworkFailure(attempt.error.message)) {
      throw new Error(describeError(attempt.error));
    }

    const merged = {
      ...(row as Record<string, unknown>),
      ...(patch as Record<string, unknown>),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from(table).upsert(merged as never);
    assertOk(error);
  });
}

export const subjectsQuery = () =>
  queryOptions({
    queryKey: ["subjects"],
    queryFn: async (): Promise<Subject[]> =>
      unwrap(
        await supabase
          .from("subjects")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      assertOk(error);
      if (data) return data as Profile;
      const created = await supabase
        .from("profiles")
        .upsert({ id: userId })
        .select("*")
        .maybeSingle();
      assertOk(created.error);
      return (created.data as Profile | null) ?? null;
    },
  });

export const noteFoldersQuery = () =>
  queryOptions({
    queryKey: ["note_folders"],
    queryFn: async (): Promise<NoteFolder[]> =>
      unwrap(
        await supabase
          .from("note_folders")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const notesQuery = () =>
  queryOptions({
    queryKey: ["notes"],
    queryFn: async (): Promise<Note[]> =>
      unwrap(
        await supabase
          .from("notes")
          .select("*")
          .order("pinned", { ascending: false })
          .order("updated_at", { ascending: false }),
      ),
  });

export const learningFoldersQuery = () =>
  queryOptions({
    queryKey: ["learning_folders"],
    queryFn: async (): Promise<LearningFolder[]> =>
      unwrap(
        await supabase
          .from("learning_folders")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const learningResourcesQuery = () =>
  queryOptions({
    queryKey: ["learning_resources"],
    queryFn: async (): Promise<LearningResource[]> =>
      unwrap(
        await supabase
          .from("learning_resources")
          .select("*")
          .order("created_at", { ascending: false }),
      ),
  });

export async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(describeError(error));
  if (!data.user) throw new Error("Your session expired. Please sign in again.");
  return data.user.id;
}

export const projectsQuery = () =>
  queryOptions({
    queryKey: ["projects"],
    queryFn: async (): Promise<Project[]> =>
      unwrap(
        await supabase
          .from("projects")
          .select("*")
          .order("pinned", { ascending: false })
          .order("updated_at", { ascending: false }),
      ),
  });

export const projectTasksQuery = () =>
  queryOptions({
    queryKey: ["project_tasks"],
    queryFn: async (): Promise<ProjectTask[]> =>
      unwrap(
        await supabase
          .from("project_tasks")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const jobApplicationsQuery = () =>
  queryOptions({
    queryKey: ["job_applications"],
    queryFn: async (): Promise<JobApplication[]> =>
      unwrap(
        await supabase
          .from("job_applications")
          .select("*")
          .order("updated_at", { ascending: false }),
      ),
  });

export const codingProfilesQuery = () =>
  queryOptions({
    queryKey: ["coding_profiles"],
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<CodingProfile[]> =>
      unwrap(
        await supabase
          .from("coding_profiles")
          .select("*")
          // CSES support was removed; legacy rows stay in the DB but are hidden.
          .neq("platform", "cses")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const resumeFilesQuery = () =>
  queryOptions({
    queryKey: ["resume_files"],
    queryFn: async (): Promise<ResumeFile[]> =>
      unwrap(
        await supabase.from("resume_files").select("*").order("created_at", { ascending: false }),
      ),
  });

export const resumesQuery = () =>
  queryOptions({
    queryKey: ["resumes"],
    queryFn: async (): Promise<Resume[]> =>
      unwrap(
        await supabase
          .from("resumes")
          .select("*")
          .order("is_default", { ascending: false })
          .order("updated_at", { ascending: false }),
      ),
  });

export const resumeSectionsQuery = (resumeId: string | null) =>
  queryOptions({
    queryKey: ["resume_sections", resumeId],
    enabled: Boolean(resumeId),
    queryFn: async (): Promise<ResumeSection[]> =>
      unwrap(
        await supabase
          .from("resume_sections")
          .select("*")
          .eq("resume_id", resumeId!)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const resumeEntriesQuery = (sectionIds: string[]) =>
  queryOptions({
    queryKey: ["resume_entries", [...sectionIds].sort().join(",")],
    enabled: sectionIds.length > 0,
    queryFn: async (): Promise<ResumeEntry[]> =>
      unwrap(
        await supabase
          .from("resume_entries")
          .select("*")
          .in("section_id", sectionIds)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const aiPromptsQuery = () =>
  queryOptions({
    queryKey: ["ai_prompts"],
    queryFn: async (): Promise<AiPrompt[]> =>
      unwrap(
        await supabase
          .from("ai_prompts")
          .select("*")
          .order("favorite", { ascending: false })
          .order("updated_at", { ascending: false }),
      ),
  });

export const calendarEventsQuery = () =>
  queryOptions({
    queryKey: ["calendar_events"],
    queryFn: async (): Promise<CalendarEvent[]> =>
      unwrap(
        await supabase
          .from("calendar_events")
          .select("*")
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true, nullsFirst: true }),
      ),
  });
export const goalsQuery = () =>
  queryOptions({
    queryKey: ["goals"],
    queryFn: async (): Promise<Goal[]> =>
      unwrap(
        await supabase
          .from("goals")
          .select("*")
          .order("pinned", { ascending: false })
          .order("position", { ascending: true })
          .order("created_at", { ascending: false }),
      ),
  });

export const goalMilestonesQuery = () =>
  queryOptions({
    queryKey: ["goal_milestones"],
    queryFn: async (): Promise<GoalMilestone[]> =>
      unwrap(
        await supabase
          .from("goal_milestones")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

export const habitsQuery = () =>
  queryOptions({
    queryKey: ["habits"],
    queryFn: async (): Promise<Habit[]> =>
      unwrap(
        await supabase
          .from("habits")
          .select("*")
          .order("archived", { ascending: true })
          .order("position", { ascending: true })
          .order("created_at", { ascending: true }),
      ),
  });

/** Habit logs for the trailing `days` window (default 120 days). */
export const habitLogsQuery = (days = 120) =>
  queryOptions({
    queryKey: ["habit_logs", days],
    queryFn: async (): Promise<HabitLog[]> => {
      const from = new Date();
      from.setDate(from.getDate() - days);
      return unwrap(
        await supabase
          .from("habit_logs")
          .select("*")
          .gte("log_date", from.toISOString().slice(0, 10))
          .order("log_date", { ascending: false }),
      );
    },
  });

/** Focus sessions from the trailing `days` window (default 30 days). */
export const focusSessionsQuery = (days = 30) =>
  queryOptions({
    queryKey: ["focus_sessions", days],
    queryFn: async (): Promise<FocusSession[]> => {
      const from = new Date();
      from.setDate(from.getDate() - days);
      return unwrap(
        await supabase
          .from("focus_sessions")
          .select("*")
          .gte("started_at", from.toISOString())
          .order("started_at", { ascending: false }),
      );
    },
  });
