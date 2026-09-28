import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Briefcase, BookOpen, Clock, FileText, FolderKanban, Target } from "lucide-react";

import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  calendarEventsQuery,
  focusSessionsQuery,
  goalsQuery,
  jobApplicationsQuery,
  learningResourcesQuery,
  notesQuery,
  projectsQuery,
} from "@/lib/devos-queries";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — DevOS" },
      {
        name: "description",
        content:
          "Track focus hours, goal progress, job pipeline and learning completion across DevOS.",
      },
      { property: "og:title", content: "Analytics — DevOS" },
      {
        property: "og:description",
        content:
          "Track focus hours, goal progress, job pipeline and learning completion across DevOS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function AnalyticsPage() {
  const [range, setRange] = useState<Range>(30);

  const results = useQueries({
    queries: [
      focusSessionsQuery(90),
      goalsQuery(),
      projectsQuery(),
      jobApplicationsQuery(),
      notesQuery(),
      learningResourcesQuery(),
      calendarEventsQuery(),
    ],
  });

  const [focus, goals, projects, jobs, notes, resources, events] = results;
  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;

  const focusData = focus.data ?? [];

  const { perDay, totalMinutes, completedSessions, streak } = useMemo(() => {
    const days: { date: string; label: string; minutes: number }[] = [];
    const map = new Map<string, number>();
    for (const s of focusData) {
      if (s.mode !== "focus") continue;
      const key = s.started_at.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + Math.round((s.actual_seconds ?? 0) / 60));
    }
    const today = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      days.push({
        date: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        minutes: map.get(key) ?? 0,
      });
    }
    const total = days.reduce((sum, d) => sum + d.minutes, 0);

    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if ((days[i]?.minutes ?? 0) > 0) s++;
      else break;
    }

    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - range);
    const completed = focusData.filter(
      (x) => x.mode === "focus" && x.completed && new Date(x.started_at) >= cutoff,
    ).length;

    return { perDay: days, totalMinutes: total, completedSessions: completed, streak: s };
  }, [focusData, range]);

  if (isLoading) return <LoadingState />;
  if (error)
    return <ErrorState error={error} onRetry={() => results.forEach((r) => void r.refetch())} />;

  const goalList = goals.data ?? [];
  const projectList = projects.data ?? [];
  const jobList = jobs.data ?? [];
  const noteList = notes.data ?? [];
  const resourceList = resources.data ?? [];
  const eventList = events.data ?? [];

  const goalsDone = goalList.filter((g) => g.status === "completed").length;
  const goalAvg = goalList.length
    ? Math.round(
        goalList.reduce(
          (sum, g) =>
            sum + Math.min(100, g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0),
          0,
        ) / goalList.length,
      )
    : 0;

  const resourcesDone = resourceList.filter((r) => r.completed).length;
  const activeProjects = projectList.filter((p) => p.status !== "archived").length;

  const kpis = [
    {
      label: "Focus time",
      value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      hint: `${completedSessions} sessions · ${streak}d streak`,
      icon: Clock,
    },
    {
      label: "Goals",
      value: `${goalsDone}/${goalList.length}`,
      hint: `${goalAvg}% average progress`,
      icon: Target,
    },
    {
      label: "Projects",
      value: activeProjects,
      hint: `${projectList.length} total`,
      icon: FolderKanban,
    },
    {
      label: "Applications",
      value: jobList.length,
      hint: `${jobList.filter((j) => j.status === "offer").length} offers`,
      icon: Briefcase,
    },
    { label: "Notes", value: noteList.length, hint: `${eventList.length} events`, icon: FileText },
    {
      label: "Learning",
      value: `${resourcesDone}/${resourceList.length}`,
      hint: "resources completed",
      icon: BookOpen,
    },
  ];

  const jobStatus = Object.entries(
    jobList.reduce<Record<string, number>>((acc, j) => {
      acc[j.status] = (acc[j.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const goalCategories = Object.entries(
    goalList.reduce<Record<string, number>>((acc, g) => {
      acc[g.category] = (acc[g.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const tooltipStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontSize: 12,
    color: "var(--foreground)",
  } as const;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live activity across focus, goals, projects, jobs and learning.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {RANGES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "secondary" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => setRange(r)}
            >
              {r}d
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {kpi.label}
              </span>
              <kpi.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{kpi.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Focus minutes · last {range} days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perDay} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval={Math.max(0, Math.floor(perDay.length / 12) - 1)}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="minutes" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Job pipeline</h2>
          {jobStatus.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No applications tracked yet.</p>
          ) : (
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={jobStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                    {jobStatus.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {jobStatus.map((s, i) => (
              <li key={s.name} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="capitalize">{s.name.replace(/_/g, " ")}</span>
                <span className="tabular-nums text-foreground">{s.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Goals by category</h2>
          {goalCategories.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No goals yet.</p>
          ) : (
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalCategories} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Completion rates</h2>
        <div className="mt-4 space-y-4">
          {[
            { label: "Learning resources", done: resourcesDone, total: resourceList.length },
            { label: "Goals completed", done: goalsDone, total: goalList.length },
            {
              label: "Calendar items done",
              done: eventList.filter((e) => e.completed).length,
              total: eventList.length,
            },
          ].map((row) => {
            const pct = row.total ? Math.round((row.done / row.total) * 100) : 0;
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="tabular-nums">
                    {row.done}/{row.total} · {pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}