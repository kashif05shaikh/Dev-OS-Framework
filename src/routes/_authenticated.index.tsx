import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Braces,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileText,
  FolderKanban,
  Plus,
  Rocket,
  Sparkles,
  Star,
  Target,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  calendarEventsQuery,
  describeError,
  focusSessionsQuery,
  goalsQuery,
  jobApplicationsQuery,
  learningResourcesQuery,
  notesQuery,
  projectsQuery,
  subjectsQuery,
  updateRow,
} from "@/lib/devos-queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — DevOS" },
      {
        name: "description",
        content: "Your DevOS dashboard: subjects, notes and learning progress at a glance.",
      },
      { property: "og:title", content: "Dashboard — DevOS" },
      {
        property: "og:description",
        content: "Your DevOS dashboard: subjects, notes and learning progress at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const subjects = useQuery(subjectsQuery());
  const notes = useQuery(notesQuery());
  const resources = useQuery(learningResourcesQuery());
  const projects = useQuery(projectsQuery());
  const jobs = useQuery(jobApplicationsQuery());
  const goals = useQuery(goalsQuery());
  const events = useQuery(calendarEventsQuery());
  const focus = useQuery(focusSessionsQuery(7));

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

  const isLoading =
    subjects.isLoading ||
    notes.isLoading ||
    resources.isLoading ||
    projects.isLoading ||
    jobs.isLoading ||
    goals.isLoading ||
    events.isLoading ||
    focus.isLoading;
  const error =
    subjects.error ??
    notes.error ??
    resources.error ??
    projects.error ??
    jobs.error ??
    goals.error ??
    events.error ??
    focus.error;

  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          void subjects.refetch();
          void notes.refetch();
          void resources.refetch();
          void projects.refetch();
          void jobs.refetch();
          void goals.refetch();
          void events.refetch();
          void focus.refetch();
        }}
      />
    );

  const completed = (resources.data ?? []).filter((r) => r.completed).length;
  const total = resources.data?.length ?? 0;
  const recent = (notes.data ?? []).slice(0, 5);
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = (events.data ?? []).filter((e) => e.event_date === today);
  const upcoming = (events.data ?? [])
    .filter((e) => e.event_date > today && !e.completed)
    .slice(0, 3);
  const activeGoals = (goals.data ?? []).filter((g) => g.status !== "completed").slice(0, 4);
  const activeProjects = (projects.data ?? []).filter((p) => p.status !== "archived").slice(0, 4);
  const activeJobs = (jobs.data ?? []).filter(
    (j) => j.status !== "rejected" && j.status !== "offer",
  ).length;
  const focusMinutes = Math.round(
    (focus.data ?? []).reduce((sum, s) => sum + (s.actual_seconds ?? 0), 0) / 60,
  );

  const stats = [
    { label: "Focus (7d)", value: `${focusMinutes}m`, icon: Timer, to: "/focus" as const },
    { label: "Active goals", value: activeGoals.length, icon: Target, to: "/goals" as const },
    { label: "Projects", value: projects.data?.length ?? 0, icon: FolderKanban, to: "/projects" as const },
    { label: "Open applications", value: activeJobs, icon: Briefcase, to: "/jobs" as const },
    { label: "Notes", value: notes.data?.length ?? 0, icon: FileText, to: "/notes" as const },
    { label: "Resources", value: `${completed}/${total}`, icon: BookOpen, to: "/learning" as const },
  ];

  const quickActions = [
    { label: "New note", to: "/notes" as const, icon: FileText },
    { label: "Add resource", to: "/learning" as const, icon: BookOpen },
    { label: "Start focus", to: "/focus" as const, icon: Timer },
    { label: "Add event", to: "/calendar" as const, icon: CalendarDays },
    { label: "AI workspace", to: "/ai" as const, icon: Rocket },
    { label: "Prompts", to: "/prompts" as const, icon: Sparkles },
    { label: "Coding profiles", to: "/profiles" as const, icon: Braces },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {todayEvents.length
          ? `${todayEvents.filter((e) => !e.completed).length} thing(s) left on today's schedule.`
          : "Nothing scheduled today — pick a goal and make progress."}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button key={action.label} asChild size="sm" variant="outline" className="h-8 text-xs">
            <Link to={action.to}>
              <action.icon className="size-3.5" />
              {action.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today</h2>
            <Link to="/calendar" className="text-xs text-primary hover:underline">
              Calendar
            </Link>
          </div>
          {todayEvents.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing today.{" "}
              <Link to="/calendar" className="text-primary underline underline-offset-4">
                Schedule something
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-1">
              {todayEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => toggleEvent.mutate(event)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
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
                </li>
              ))}
            </ul>
          )}
          {upcoming.length ? (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Next up</p>
              <ul className="mt-2 space-y-1">
                {upcoming.map((event) => (
                  <li key={event.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0" />
                    <span className="truncate">{event.title}</span>
                    <span className="ml-auto shrink-0 tabular-nums">{event.event_date}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Goals in progress</h2>
            <Link to="/goals" className="text-xs text-primary hover:underline">
              All goals
            </Link>
          </div>
          {activeGoals.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No active goals.{" "}
              <Link to="/goals" className="text-primary underline underline-offset-4">
                Set one
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {activeGoals.map((goal) => {
                const pct = goal.target_value
                  ? Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100))
                  : 0;
                return (
                  <li key={goal.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm">{goal.title}</span>
                      <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {goal.current_value}/{goal.target_value} {goal.unit}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        aria-label={`Add progress to ${goal.title}`}
                        disabled={bumpGoal.isPending}
                        onClick={() => bumpGoal.mutate(goal)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent notes</h2>
            <Link to="/notes" className="text-xs text-primary hover:underline">
              All notes
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No notes yet.{" "}
              <Link to="/notes" className="text-primary underline underline-offset-4">
                Create your first note
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recent.map((note) => (
                <li key={note.id}>
                  <Link
                    to="/notes"
                    search={{ note: note.id }}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Learning progress</h2>
            <Link to="/learning" className="text-xs text-primary hover:underline">
              Learning Hub
            </Link>
          </div>
          {total === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No resources yet.{" "}
              <Link to="/learning" className="text-primary underline underline-offset-4">
                Add one
              </Link>
              .
            </p>
          ) : (
            <>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.round((completed / total) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {completed} of {total} resources completed
              </p>
            </>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Active projects</h2>
          <Link to="/projects" className="text-xs text-primary hover:underline">
            All projects
          </Link>
        </div>
        {activeProjects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No projects yet.{" "}
            <Link to="/projects" className="text-primary underline underline-offset-4">
              Create one
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {activeProjects.map((project) => (
              <Link
                key={project.id}
                to="/projects"
                className="rounded-lg border border-border/60 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-accent/40"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate text-sm">{project.name}</span>
                  <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {project.progress_percent}%
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${project.progress_percent}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}