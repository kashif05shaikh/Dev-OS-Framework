import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileType2,
  Folder,
  FolderPlus,
  Github,
  GraduationCap,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Download,
  Loader2,
  X,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, type ConfirmState } from "@/components/confirm-dialog";
import { NameDialog, type NameDialogState } from "@/components/name-dialog";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  assertOk,
  describeError,
  learningFoldersQuery,
  learningResourcesQuery,
  requireUserId,
  runWithRetry,
  updateRow,
  subjectsQuery,
} from "@/lib/devos-queries";
import {
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABEL,
  SUBJECT_COLORS,
  type LearningResource,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({
    meta: [
      { title: "Learning Hub — DevOS" },
      {
        name: "description",
        content:
          "Organise YouTube, docs, PDFs, courses and GitHub repos as Subject → Folder → Resource with progress tracking.",
      },
      { property: "og:title", content: "Learning Hub — DevOS" },
      {
        property: "og:description",
        content: "Track study resources by subject and folder with favourites and progress.",
      },
    ],
  }),
  component: LearningPage,
});

const TYPE_ICON: Record<string, typeof BookOpen> = {
  youtube: Youtube,
  docs: BookOpen,
  pdf: FileType2,
  course: GraduationCap,
  github: Github,
  article: BookOpen,
  website: ExternalLink,
  blog: BookOpen,
};

const ALL_SUBJECTS = "__all__";

type ResourceDraft = {
  id?: string;
  title: string;
  type: string;
  url: string;
  description: string;
  folder_id: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
};

function formatBytes(bytes: number | null | undefined) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Opens a private learning file in a new tab via a short-lived signed URL. */
async function openStoredFile(path: string) {
  const { data, error } = await supabase.storage
    .from("learning-files")
    .createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) {
    toast.error(error?.message ?? "Could not open the file");
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

function LearningPage() {
  const qc = useQueryClient();
  const subjects = useQuery(subjectsQuery());
  const folders = useQuery(learningFoldersQuery());
  const resources = useQuery(learningResourcesQuery());

  const [activeSubject, setActiveSubject] = useState<string | null>(ALL_SUBJECTS);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "favorite" | "completed" | "in-progress">("all");
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [nameDialog, setNameDialog] = useState<NameDialogState>(null);
  const [draft, setDraft] = useState<ResourceDraft | null>(null);

  const subjectId = activeSubject ?? subjects.data?.[0]?.id ?? null;
  const isAll = subjectId === ALL_SUBJECTS;

  /** Full row from the query cache — needed for the POST-upsert save fallback. */
  const findCachedRow = (key: string, id: string): { id: string } | undefined =>
    (qc.getQueryData<{ id: string }[]>([key]) ?? []).find((row) => row.id === id);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["subjects"] });
    void qc.invalidateQueries({ queryKey: ["learning_folders"] });
    void qc.invalidateQueries({ queryKey: ["learning_resources"] });
  };

  const createSubject = useMutation({
    mutationFn: async (name: string) => {
      const user_id = await requireUserId();
      const position = subjects.data?.length ?? 0;
      const color = SUBJECT_COLORS[position % SUBJECT_COLORS.length]!;
      const { data, error } = await supabase
        .from("subjects")
        .insert({ user_id, name, position, color })
        .select()
        .single();
      assertOk(error);
      return data!;
    },
    onSuccess: (data) => {
      invalidate();
      setActiveSubject(data.id);
      toast.success("Subject created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      if (!subjectId) throw new Error("Create a subject first.");
      const user_id = await requireUserId();
      const position = folders.data?.filter((f) => f.subject_id === subjectId).length ?? 0;
      const { error } = await supabase
        .from("learning_folders")
        .insert({ user_id, subject_id: subjectId, name, position });
      assertOk(error);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Folder created");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const renameRow = useMutation({
    mutationFn: async ({
      table,
      id,
      name,
    }: {
      table: "subjects" | "learning_folders";
      id: string;
      name: string;
    }) => {
      await updateRow(table, findCachedRow(table, id) ?? { id }, { name });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Renamed");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const deleteRow = useMutation({
    mutationFn: async ({
      table,
      id,
    }: {
      table: "subjects" | "learning_folders" | "learning_resources";
      id: string;
    }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      assertOk(error);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Deleted");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const saveResource = useMutation({
    mutationFn: async (value: ResourceDraft) => {
      if (!subjectId) throw new Error("Create a subject first.");
      if (!value.title.trim()) throw new Error("Give the resource a title.");
      const payload = {
        title: value.title.trim(),
        type: value.type,
        url: value.url.trim() || null,
        description: value.description.trim() || null,
        folder_id: value.folder_id,
        subject_id: subjectId,
        file_path: value.file_path ?? null,
        file_name: value.file_name ?? null,
        file_size: value.file_size ?? null,
      };
      await runWithRetry(async () => {
        if (value.id) {
          const existing = findCachedRow("learning_resources", value.id) ?? { id: value.id };
          await updateRow("learning_resources", existing, payload);
        } else {
          const user_id = await requireUserId();
          const { error } = await supabase
            .from("learning_resources")
            .insert({ ...payload, user_id });
          assertOk(error);
        }
      });
    },
    onSuccess: (_d, value) => {
      invalidate();
      setDraft(null);
      toast.success(value.id ? "Resource updated" : "Resource added");
    },
    onError: (e: unknown) => toast.error(describeError(e)),
  });

  const patchResource = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<LearningResource> }) => {
      await updateRow("learning_resources", findCachedRow("learning_resources", id) ?? { id }, patch);
    },
    // Optimistic so favourites / progress react instantly, rolled back on failure.
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["learning_resources"] });
      const previous = qc.getQueryData<LearningResource[]>(["learning_resources"]);
      qc.setQueryData<LearningResource[]>(["learning_resources"], (old) =>
        (old ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
      return { previous };
    },
    onError: (e: unknown, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["learning_resources"], ctx.previous);
      toast.error(describeError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["learning_resources"] }),
  });

  const subjectFolders = useMemo(
    () => (isAll ? [] : (folders.data ?? []).filter((f) => f.subject_id === subjectId)),
    [folders.data, subjectId, isAll],
  );

  const subjectName = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const s of subjects.data ?? []) map.set(s.id, { name: s.name, color: s.color });
    return map;
  }, [subjects.data]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (resources.data ?? []).filter((r) => {
      if (!isAll && r.subject_id !== subjectId) return false;
      if (!isAll && activeFolder && r.folder_id !== activeFolder) return false;
      if (filter === "favorite" && !r.favorite) return false;
      if (filter === "completed" && !r.completed) return false;
      if (filter === "in-progress" && (r.completed || r.progress_percent === 0)) return false;
      if (!term) return true;
      return (
        r.title.toLowerCase().includes(term) ||
        (r.description ?? "").toLowerCase().includes(term) ||
        (r.url ?? "").toLowerCase().includes(term)
      );
    });
  }, [resources.data, subjectId, activeFolder, filter, search, isAll]);

  const isLoading = subjects.isLoading || folders.isLoading || resources.isLoading;
  const error = subjects.error ?? folders.error ?? resources.error;

  if (isLoading) return <LoadingState label="Loading learning hub…" />;
  if (error) return <ErrorState error={error} onRetry={() => invalidate()} />;

  return (
    <div className="flex min-h-screen md:h-screen">
      <div className="flex w-64 shrink-0 flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h1 className="text-sm font-semibold">Learning Hub</h1>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setNameDialog({
                title: "New subject",
                label: "Subject name",
                submitLabel: "Create",
                onSubmit: async (name) => {
                  await createSubject.mutateAsync(name);
                  setNameDialog(null);
                },
              })
            }
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          <button
            type="button"
            onClick={() => {
              setActiveSubject(ALL_SUBJECTS);
              setActiveFolder(null);
            }}
            className={cn(
              "mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition-colors",
              isAll ? "bg-accent" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <BookOpen className="size-3.5 shrink-0" />
            <span className="truncate">All resources</span>
            <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
              {resources.data?.length ?? 0}
            </span>
          </button>

          {(subjects.data?.length ?? 0) === 0 ? (
            <EmptyState title="No subjects" description="Create a subject to start collecting resources." />
          ) : (
            subjects.data!.map((subject) => (
              <div key={subject.id} className="mb-1">
                <div
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 transition-colors",
                    subject.id === subjectId ? "bg-accent" : "hover:bg-accent/50",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm font-medium"
                    onClick={() => {
                      setActiveSubject(subject.id);
                      setActiveFolder(null);
                    }}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="truncate">{subject.name}</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Subject actions"
                        className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          setNameDialog({
                            title: "Rename subject",
                            initialValue: subject.name,
                            onSubmit: async (name) => {
                              await renameRow.mutateAsync({ table: "subjects", id: subject.id, name });
                              setNameDialog(null);
                            },
                          })
                        }
                      >
                        <Pencil className="size-4" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() =>
                          setConfirm({
                            title: `Delete "${subject.name}"?`,
                            description:
                              "This deletes the subject with all of its folders, resources and notes.",
                            onConfirm: async () => {
                              await deleteRow.mutateAsync({ table: "subjects", id: subject.id });
                              setConfirm(null);
                              if (subjectId === subject.id) setActiveSubject(ALL_SUBJECTS);
                            },
                          })
                        }
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {subject.id === subjectId ? (
                  <div className="mt-1 space-y-0.5 pl-4">
                    <button
                      type="button"
                      onClick={() => setActiveFolder(null)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
                        activeFolder === null
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Folder className="size-3.5" /> All resources
                    </button>
                    {subjectFolders.map((folder) => (
                      <div key={folder.id} className="group flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setActiveFolder(folder.id)}
                          className={cn(
                            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
                            activeFolder === folder.id
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Folder className="size-3.5 shrink-0" />
                          <span className="truncate">{folder.name}</span>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label="Folder actions"
                              className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                            >
                              <MoreHorizontal className="size-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() =>
                                setNameDialog({
                                  title: "Rename folder",
                                  initialValue: folder.name,
                                  onSubmit: async (name) => {
                                    await renameRow.mutateAsync({
                                      table: "learning_folders",
                                      id: folder.id,
                                      name,
                                    });
                                    setNameDialog(null);
                                  },
                                })
                              }
                            >
                              <Pencil className="size-4" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={() =>
                                setConfirm({
                                  title: `Delete "${folder.name}"?`,
                                  description:
                                    "The folder is removed. Its resources stay in the subject.",
                                  onConfirm: async () => {
                                    await deleteRow.mutateAsync({
                                      table: "learning_folders",
                                      id: folder.id,
                                    });
                                    setConfirm(null);
                                    if (activeFolder === folder.id) setActiveFolder(null);
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setNameDialog({
                          title: "New folder",
                          label: "Folder name",
                          submitLabel: "Create",
                          onSubmit: async (name) => {
                            await createFolder.mutateAsync(name);
                            setNameDialog(null);
                          },
                        })
                      }
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
                    >
                      <FolderPlus className="size-3.5" /> New folder
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="favorite">Favourites</SelectItem>
              <SelectItem value="in-progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!subjectId || isAll}
            title={isAll ? "Pick a subject to add a resource" : undefined}
            onClick={() =>
              setDraft({
                title: "",
                type: "youtube",
                url: "",
                description: "",
                folder_id: activeFolder,
                file_path: null,
                file_name: null,
                file_size: null,
              })
            }
          >
            <Plus className="size-4" /> Resource
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={<BookOpen className="size-6" />}
                  title={subjectId ? "No resources here" : "No subject selected"}
                  description={
                    isAll
                      ? "Pick a subject on the left and add your first resource."
                      : subjectId
                      ? "Add a YouTube video, doc, PDF, course or GitHub repo to this subject."
                      : "Create a subject on the left to start."
                  }
                />
              </div>
            ) : (
              visible.map((resource) => {
                const Icon = TYPE_ICON[resource.type] ?? BookOpen;
                return (
                  <article
                    key={resource.id}
                    className="flex flex-col rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">{resource.title}</h3>
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground">
                            {RESOURCE_TYPE_LABEL[resource.type] ?? resource.type}
                          </p>
                          {isAll && subjectName.get(resource.subject_id) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubject(resource.subject_id);
                                setActiveFolder(resource.folder_id);
                              }}
                              className="flex min-w-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              <span
                                className="size-1.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: subjectName.get(resource.subject_id)!.color,
                                }}
                              />
                              <span className="truncate">
                                {subjectName.get(resource.subject_id)!.name}
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Toggle favourite"
                        onClick={() =>
                          patchResource.mutate({
                            id: resource.id,
                            patch: { favorite: !resource.favorite },
                          })
                        }
                        className="rounded p-1 text-muted-foreground"
                      >
                        <Star
                          className={cn(
                            "size-4",
                            resource.favorite && "fill-primary text-primary",
                          )}
                        />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Resource actions"
                            className="rounded p-1 text-muted-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              setDraft({
                                id: resource.id,
                                title: resource.title,
                                type: resource.type,
                                url: resource.url ?? "",
                                description: resource.description ?? "",
                                folder_id: resource.folder_id,
                                file_path: resource.file_path,
                                file_name: resource.file_name,
                                file_size: resource.file_size,
                              })
                            }
                          >
                            <Pencil className="size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              patchResource.mutate({
                                id: resource.id,
                                patch: {
                                  completed: !resource.completed,
                                  progress_percent: resource.completed ? 0 : 100,
                                },
                              })
                            }
                          >
                            <CheckCircle2 className="size-4" />
                            {resource.completed ? "Mark unfinished" : "Mark completed"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() =>
                              setConfirm({
                                title: `Delete "${resource.title}"?`,
                                description: "This resource will be permanently deleted.",
                                onConfirm: async () => {
                                  await deleteRow.mutateAsync({
                                    table: "learning_resources",
                                    id: resource.id,
                                  });
                                  setConfirm(null);
                                },
                              })
                            }
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {resource.description ? (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {resource.description}
                      </p>
                    ) : null}

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Progress</span>
                        <span className="tabular-nums">{resource.progress_percent}%</span>
                      </div>
                      <Slider
                        value={[resource.progress_percent]}
                        max={100}
                        step={5}
                        onValueCommit={([value]) =>
                          patchResource.mutate({
                            id: resource.id,
                            patch: { progress_percent: value ?? 0, completed: (value ?? 0) === 100 },
                          })
                        }
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {resource.url ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="size-3.5" /> Open
                        </a>
                      ) : null}
                      {resource.file_path ? (
                        <button
                          type="button"
                          onClick={() => void openStoredFile(resource.file_path!)}
                          className="inline-flex max-w-[60%] items-center gap-1.5 text-xs text-primary hover:underline"
                          title={resource.file_name ?? "Attached file"}
                        >
                          <Paperclip className="size-3.5 shrink-0" />
                          <span className="truncate">{resource.file_name ?? "Attachment"}</span>
                        </button>
                      ) : null}
                      {resource.completed ? (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 className="size-3.5" /> Completed
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      <ResourceDialog
        draft={draft}
        folders={subjectFolders}
        onClose={() => setDraft(null)}
        onSave={(value) => saveResource.mutate(value)}
        saving={saveResource.isPending}
      />
      <ConfirmDialog state={confirm} onOpenChange={(open) => !open && setConfirm(null)} />
      <NameDialog state={nameDialog} onOpenChange={(open) => !open && setNameDialog(null)} />
    </div>
  );
}

function ResourceDialog({
  draft,
  folders,
  onClose,
  onSave,
  saving,
}: {
  draft: ResourceDraft | null;
  folders: { id: string; name: string }[];
  onClose: () => void;
  onSave: (value: ResourceDraft) => void;
  saving: boolean;
}) {
  const [value, setValue] = useState<ResourceDraft | null>(draft);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync the local form every time the dialog opens with a new draft
  // (new resources have no id, so identity comparison alone is not enough).
  useEffect(() => {
    setValue(draft);
  }, [draft]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File is larger than 50 MB");
      return;
    }
    setUploading(true);
    try {
      const userId = await requireUserId();
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage
        .from("learning-files")
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (error) throw error;
      setValue((v) =>
        v
          ? {
              ...v,
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              title: v.title.trim() ? v.title : file.name.replace(/\.[^.]+$/, ""),
            }
          : v,
      );
      toast.success("File attached");
    } catch (e: unknown) {
      toast.error(describeError(e));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removeFile() {
    const path = value?.file_path;
    if (!path) return;
    await supabase.storage.from("learning-files").remove([path]);
    setValue((v) => (v ? { ...v, file_path: null, file_name: null, file_size: null } : v));
  }

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (value && value.title.trim()) onSave(value);
          }}
        >
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit resource" : "Add resource"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="res-title">Title</Label>
              <Input
                id="res-title"
                autoFocus
                value={value?.title ?? ""}
                onChange={(e) => setValue((v) => (v ? { ...v, title: e.target.value } : v))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={value?.type ?? "youtube"}
                  onValueChange={(type) => setValue((v) => (v ? { ...v, type } : v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {RESOURCE_TYPE_LABEL[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Folder</Label>
                <Select
                  value={value?.folder_id ?? "none"}
                  onValueChange={(folder) =>
                    setValue((v) => (v ? { ...v, folder_id: folder === "none" ? null : folder } : v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-url">URL</Label>
              <Input
                id="res-url"
                type="url"
                placeholder="https://"
                value={value?.url ?? ""}
                onChange={(e) => setValue((v) => (v ? { ...v, url: e.target.value } : v))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-desc">Description</Label>
              <Textarea
                id="res-desc"
                rows={3}
                value={value?.description ?? ""}
                onChange={(e) => setValue((v) => (v ? { ...v, description: e.target.value } : v))}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachment</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
              {value?.file_path ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => void openStoredFile(value.file_path!)}
                    className="min-w-0 flex-1 truncate text-left text-xs text-primary hover:underline"
                  >
                    {value.file_name}
                  </button>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatBytes(value.file_size)}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    aria-label="Remove attachment"
                    onClick={() => void removeFile()}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Download className="size-4 rotate-180" /> Attach file from your device
                    </>
                  )}
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">
                PDFs, docs, slides, images — up to 50 MB. Stored privately in your workspace.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading || !value?.title.trim()}>
              {saving ? "Saving…" : draft?.id ? "Save changes" : "Add resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}