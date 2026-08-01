import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  FolderKanban,
  Github,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  assertOk,
  describeError,
  projectTasksQuery,
  projectsQuery,
  requireUserId,
  runWithRetry,
  updateRow,
} from "@/lib/devos-queries";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type Project,
  type ProjectTask,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — DevOS" },
      {
        name: "description",
        content:
          "Track side projects end to end: status, tech stack, repo and demo links, task checklists and shipping progress.",
      },
      { property: "og:title", content: "Projects — DevOS" },
      {
        property: "og:description",
        content: "Every side project with status, stack, links, tasks and progress in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectsPage,
});

const STATUS_CLASS: Record<string, string> = {
  idea: "bg-muted text-muted-foreground",
  building: "bg-primary/15 text-primary",
  paused: "bg-amber-500/15 text-amber-400",
  shipped: "bg-emerald-500/15 text-emerald-400",
  archived: "bg-muted text-muted-foreground/70",
};

type ProjectDraft = {
  id?: string;
  name: string;
  description: string;
  status: string;
  tech_stack: string;
  repo_url: string;
  live_url: string;
  notes: string;
  progress_percent: number;
};

function emptyDraft(): ProjectDraft {
  return {
    name: "",
    description: "",
    status: "idea",
    tech_stack: "",
    repo_url: "",
    live_url: "",
    notes: "",
    progress_percent: 0,
  };
}

function ProjectsPage() {
  const qc = useQueryClient();
  const projects = useQuery(projectsQuery());
  const tasks = useQuery(projectTasksQuery());

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [openTasksFor, setOpenTasksFor] = useState<string | null>(null);

  const findCachedRow = (key: string, id: string): { id: string } | undefined =>
    (qc.getQueryData<{ id: string }[]>([key]) ?? []).find((row) => row.id === id);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["projects"] });
    void qc.invalidateQueries({ queryKey: ["project_tasks"] });
  };

  const saveProject = useMutation({
    mutationFn: async (value: ProjectDraft) => {
      const payload = {
        name: value.name.trim() || "Untitled project",
        description: value.description.trim() || null,
        status: value.status,
        tech_stack: value.tech_stack
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        repo_url: value.repo_url.trim() || null,
        live_url: value.live_url.trim() || null,
        notes: value.notes.trim() || null,
        progress_percent: value.progress_percent,
      };
      if (value.id) {
        await updateRow("projects", findCachedRow("projects", value.id) ?? { id: value.id }, payload);
        return;
      }
      await runWithRetry(async () => {
        const user_id = await requireUserId();
        const { error } = await supabase.from("projects").insert({ ...payload, user_id });
        assertOk(error);
      });
    },
    onSuccess: (_d, value) => {
      setDraft(null);
      invalidate();
      toast.success(value.id ? "Project updated" : "Project created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchProject = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Project> }) =>
      updateRow("projects", findCachedRow("projects", id) ?? { id }, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const previous = qc.getQueryData<Project[]>(["projects"]);
      qc.setQueryData<Project[]>(["projects"], (old) =>
        (old ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["projects"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("projects").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Project deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const addTask = useMutation({
    mutationFn: async ({ projectId, title }: { projectId: string; title: string }) =>
      runWithRetry(async () => {
        const user_id = await requireUserId();
        const count = (tasks.data ?? []).filter((t) => t.project_id === projectId).length;
        const { error } = await supabase
          .from("project_tasks")
          .insert({ user_id, project_id: projectId, title, position: count });
        assertOk(error);
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["project_tasks"] }),
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchTask = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProjectTask> }) =>
      updateRow("project_tasks", findCachedRow("project_tasks", id) ?? { id }, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["project_tasks"] });
      const previous = qc.getQueryData<ProjectTask[]>(["project_tasks"]);
      qc.setQueryData<ProjectTask[]>(["project_tasks"], (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
      return { previous };
    },
    onError: (e: unknown, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["project_tasks"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["project_tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) =>
      runWithRetry(async () => {
        const { error } = await supabase.from("project_tasks").delete().eq("id", id);
        assertOk(error);
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["project_tasks"] }),
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (projects.data ?? []).filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!term) return true;
      return [p.name, p.description ?? "", p.notes ?? "", p.tech_stack.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [projects.data, search, statusFilter]);

  const openProject = (projects.data ?? []).find((p) => p.id === openTasksFor) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Projects</h1>
          <p className="text-xs text-muted-foreground">
            {(projects.data ?? []).length} total ·{" "}
            {(projects.data ?? []).filter((p) => p.status === "shipped").length} shipped
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects"
            className="h-8 w-48 pl-7 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PROJECT_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8" onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-3.5" />
          New project
        </Button>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          {projects.isLoading ? (
            <LoadingState label="Loading projects…" />
          ) : projects.isError ? (
            <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="size-6" />}
              title={search || statusFilter !== "all" ? "No matching projects" : "No projects yet"}
              description="Add your side projects to track status, stack, links and tasks."
              action={
                <Button size="sm" onClick={() => setDraft(emptyDraft())}>
                  <Plus className="size-3.5" />
                  New project
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((project) => {
                const projectTasks = (tasks.data ?? []).filter((t) => t.project_id === project.id);
                const done = projectTasks.filter((t) => t.done).length;
                return (
                  <article
                    key={project.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-sm font-medium">{project.name}</h2>
                        {project.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {project.description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          STATUS_CLASS[project.status] ?? STATUS_CLASS['idea'],
                        )}
                      >
                        {PROJECT_STATUS_LABEL[project.status] ?? project.status}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setDraft({
                                id: project.id,
                                name: project.name,
                                description: project.description ?? "",
                                status: project.status,
                                tech_stack: project.tech_stack.join(", "),
                                repo_url: project.repo_url ?? "",
                                live_url: project.live_url ?? "",
                                notes: project.notes ?? "",
                                progress_percent: project.progress_percent,
                              })
                            }
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOpenTasksFor(project.id)}>
                            <ListChecks className="size-3.5" />
                            Tasks
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              patchProject.mutate({
                                id: project.id,
                                patch: { pinned: !project.pinned },
                              })
                            }
                          >
                            {project.pinned ? (
                              <PinOff className="size-3.5" />
                            ) : (
                              <Pin className="size-3.5" />
                            )}
                            {project.pinned ? "Unpin" : "Pin"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setConfirm({
                                title: "Delete project?",
                                description: `"${project.name}" and all of its tasks will be permanently deleted.`,
                                confirmLabel: "Delete",
                                onConfirm: () => deleteProject.mutate(project.id),
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {project.tech_stack.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {project.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Progress</span>
                        <span>{project.progress_percent}%</span>
                      </div>
                      <Progress value={project.progress_percent} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {project.repo_url ? (
                        <a
                          href={project.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <Github className="size-3.5" /> Repo
                        </a>
                      ) : null}
                      {project.live_url ? (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" /> Live
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setOpenTasksFor(project.id)}
                        className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <ListChecks className="size-3.5" />
                        {done}/{projectTasks.length} tasks
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <ProjectDialog
        draft={draft}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSubmit={(value) => saveProject.mutate(value)}
        saving={saveProject.isPending}
      />

      <TasksDialog
        project={openProject}
        tasks={(tasks.data ?? []).filter((t) => t.project_id === openProject?.id)}
        onClose={() => setOpenTasksFor(null)}
        onAdd={(title) => openProject && addTask.mutate({ projectId: openProject.id, title })}
        onToggle={(task) => patchTask.mutate({ id: task.id, patch: { done: !task.done } })}
        onDelete={(task) => deleteTask.mutate(task.id)}
        adding={addTask.isPending}
      />

      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
    </div>
  );
}

function ProjectDialog({
  draft,
  onChange,
  onClose,
  onSubmit,
  saving,
}: {
  draft: ProjectDraft | null;
  onChange: (value: ProjectDraft) => void;
  onClose: () => void;
  onSubmit: (value: ProjectDraft) => void;
  saving: boolean;
}) {
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        {draft ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.name.trim()) {
                toast.error("Project name is required");
                return;
              }
              onSubmit(draft);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => onChange({ ...draft, name: e.target.value })}
                placeholder="DevOS"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                rows={2}
                value={draft.description}
                onChange={(e) => onChange({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(status) => onChange({ ...draft, status })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PROJECT_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-stack">Tech stack (comma separated)</Label>
                <Input
                  id="p-stack"
                  value={draft.tech_stack}
                  onChange={(e) => onChange({ ...draft, tech_stack: e.target.value })}
                  placeholder="React, Postgres"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-repo">Repo URL</Label>
                <Input
                  id="p-repo"
                  value={draft.repo_url}
                  onChange={(e) => onChange({ ...draft, repo_url: e.target.value })}
                  placeholder="https://github.com/…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-live">Live URL</Label>
                <Input
                  id="p-live"
                  value={draft.live_url}
                  onChange={(e) => onChange({ ...draft, live_url: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Progress — {draft.progress_percent}%</Label>
              <Slider
                value={[draft.progress_percent]}
                max={100}
                step={5}
                onValueChange={([v]) => onChange({ ...draft, progress_percent: v ?? 0 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-notes">Notes</Label>
              <Textarea
                id="p-notes"
                rows={3}
                value={draft.notes}
                onChange={(e) => onChange({ ...draft, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : draft.id ? "Save changes" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TasksDialog({
  project,
  tasks,
  onClose,
  onAdd,
  onToggle,
  onDelete,
  adding,
}: {
  project: Project | null;
  tasks: ProjectTask[];
  onClose: () => void;
  onAdd: (title: string) => void;
  onToggle: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  adding: boolean;
}) {
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (!project) setTitle("");
  }, [project]);

  return (
    <Dialog open={project !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project?.name} — tasks</DialogTitle>
        </DialogHeader>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = title.trim();
            if (!value) return;
            onAdd(value);
            setTitle("");
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a task…"
          />
          <Button type="submit" size="icon" disabled={adding || !title.trim()}>
            <Plus className="size-4" />
          </Button>
        </form>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
              >
                <Checkbox checked={task.done} onCheckedChange={() => onToggle(task)} />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    task.done && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 group-hover:opacity-100"
                  onClick={() => onDelete(task)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}