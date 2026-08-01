import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, FolderTree, GraduationCap, Star } from "lucide-react";

import { ErrorState, LoadingState } from "@/components/states";
import {
  learningResourcesQuery,
  noteFoldersQuery,
  notesQuery,
  subjectsQuery,
} from "@/lib/devos-queries";
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
  const subjects = useQuery(subjectsQuery());
  const folders = useQuery(noteFoldersQuery());
  const notes = useQuery(notesQuery());
  const resources = useQuery(learningResourcesQuery());

  const isLoading =
    subjects.isLoading || folders.isLoading || notes.isLoading || resources.isLoading;
  const error = subjects.error ?? folders.error ?? notes.error ?? resources.error;

  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          void subjects.refetch();
          void folders.refetch();
          void notes.refetch();
          void resources.refetch();
        }}
      />
    );

  const completed = (resources.data ?? []).filter((r) => r.completed).length;
  const total = resources.data?.length ?? 0;
  const recent = (notes.data ?? []).slice(0, 5);

  const stats = [
    { label: "Subjects", value: subjects.data?.length ?? 0, icon: FolderTree },
    { label: "Notes", value: notes.data?.length ?? 0, icon: FileText },
    { label: "Resources", value: total, icon: BookOpen },
    { label: "Completed", value: `${completed}/${total}`, icon: GraduationCap },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Notes and the Learning Hub are live on the new backend. The rest of DevOS is being ported
        module by module.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Recent notes</h2>
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
          <h2 className="text-sm font-semibold">Learning progress</h2>
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
    </div>
  );
}